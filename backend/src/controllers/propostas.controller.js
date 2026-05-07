/**
 * Controller de Propostas de Entrega
 * Vendedor propõe uma data → Gerente aprova ou recusa
 */

const { getDb } = require('../database/db');

const ROLES_ADMIN  = ['super_admin', 'adm'];
const ROLES_AGENDA = ['gerencia'];

function registrarHistorico(db, solicitacaoId, statusAnt, statusNovo, userId, obs) {
  db.prepare(`
    INSERT INTO historico_status
      (solicitacao_id, status_anterior, status_novo, alterado_por, observacao)
    VALUES (?, ?, ?, ?, ?)
  `).run(solicitacaoId, statusAnt, statusNovo, userId, obs || null);
}

function registrarAcao(db, { solicitacaoId = null, usuarioId, acao, detalhe = null, ip = null }) {
  try {
    db.prepare(`
      INSERT INTO historico_acoes (solicitacao_id, usuario_id, acao, detalhe, ip)
      VALUES (?, ?, ?, ?, ?)
    `).run(solicitacaoId, usuarioId, acao, detalhe ? JSON.stringify(detalhe) : null, ip);
  } catch (e) {
    console.error('[AUDIT] Erro ao registrar ação:', e.message);
  }
}

// =====================================================
// POST /api/propostas — Vendedor propõe data de entrega
// =====================================================
async function criar(req, res) {
  try {
    const db = getDb();
    const { solicitacao_id, data_sugerida, observacoes } = req.body;
    const { id: userId } = req.usuario;

    if (!solicitacao_id || !data_sugerida) {
      return res.status(400).json({ sucesso: false, mensagem: 'Campos obrigatórios ausentes.' });
    }

    const sol = db.prepare('SELECT * FROM solicitacoes WHERE id = ?').get(solicitacao_id);
    if (!sol) {
      return res.status(404).json({ sucesso: false, mensagem: 'Solicitação não encontrada.' });
    }
    // Permite proposta quando material_separado OU proposta_recusada (reenvio)
    if (!['material_separado', 'proposta_recusada'].includes(sol.status)) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Só é possível propor entrega quando o material está separado ou a proposta anterior foi recusada.',
      });
    }

    // ── Transação atômica: cancelar antiga + criar nova + atualizar sol + historico ──
    let nova;
    db.transaction(() => {
      // Cancela proposta anterior pendente, se houver
      db.prepare(`
        UPDATE propostas_entrega SET status = 'recusada', resposta = 'Substituída por nova proposta'
        WHERE solicitacao_id = ? AND status = 'pendente'
      `).run(solicitacao_id);
      // Cria nova proposta
      const res2 = db.prepare(`
        INSERT INTO propostas_entrega (solicitacao_id, vendedor_id, data_sugerida, observacoes)
        VALUES (?, ?, ?, ?)
      `).run(solicitacao_id, userId, data_sugerida, observacoes?.trim() || null);
      nova = db.prepare('SELECT * FROM propostas_entrega WHERE rowid = ?')
        .get(Number(res2.lastInsertRowid));
      // Muda status da solicitação para entrega_solicitada
      db.prepare(`
        UPDATE solicitacoes SET status = 'entrega_solicitada',
          updated_at = datetime('now','localtime') WHERE id = ?
      `).run(solicitacao_id);
      registrarHistorico(db, solicitacao_id, sol.status, 'entrega_solicitada',
        userId, `Data sugerida: ${data_sugerida}${observacoes ? ' — ' + observacoes : ''}`);
    })();

    registrarAcao(db, {
      solicitacaoId: solicitacao_id,
      usuarioId:     userId,
      acao:          'proposta_criada',
      detalhe:       { proposta_id: nova.id, data_sugerida, obs: observacoes || null },
      ip:            req.ip,
    });

    // Notifica logística via socket
    const io = req.app.get('io');
    if (io) {
      io.emit('nova_proposta_entrega', {
        solicitacao_id,
        numero_proposta: sol.numero_proposta,
        data_sugerida,
        proposta_id: nova.id,
      });
    }

    return res.status(201).json({
      sucesso: true,
      mensagem: 'Proposta de entrega enviada. Aguardando aprovação do gerente.',
      dados: { proposta: nova },
    });
  } catch (erro) {
    console.error('[PROPOSTAS] Erro ao criar:', erro);
    return res.status(500).json({ sucesso: false, mensagem: 'Erro interno.' });
  }
}

// =====================================================
// GET /api/propostas/solicitacao/:solicitacaoId — Busca proposta da solicitação
// =====================================================
async function buscarPorSolicitacao(req, res) {
  try {
    const db = getDb();
    const { solicitacaoId } = req.params;

    const proposta = db.prepare(`
      SELECT p.*, u.nome AS vendedor_nome
      FROM propostas_entrega p
      JOIN users u ON u.id = p.vendedor_id
      WHERE p.solicitacao_id = ?
      ORDER BY p.created_at DESC LIMIT 1
    `).get(solicitacaoId);

    return res.json({ sucesso: true, dados: { proposta: proposta || null } });
  } catch (erro) {
    console.error('[PROPOSTAS] Erro ao buscar:', erro);
    return res.status(500).json({ sucesso: false, mensagem: 'Erro interno.' });
  }
}

// =====================================================
// PATCH /api/propostas/:id/responder — Gerente aprova ou recusa
// =====================================================
async function responder(req, res) {
  try {
    const db = getDb();
    const { id } = req.params;
    const { decisao, resposta, endereco_completo } = req.body; // decisao: 'aprovada' | 'recusada'
    const { id: userId, role } = req.usuario;

    if (!['aprovada', 'recusada'].includes(decisao)) {
      return res.status(400).json({ sucesso: false, mensagem: 'Decisão inválida.' });
    }

    const proposta = db.prepare(`
      SELECT p.*, s.status AS sol_status, s.vendedor_id
      FROM propostas_entrega p
      JOIN solicitacoes s ON s.id = p.solicitacao_id
      WHERE p.id = ?
    `).get(id);

    if (!proposta) {
      return res.status(404).json({ sucesso: false, mensagem: 'Proposta não encontrada.' });
    }
    if (proposta.status !== 'pendente') {
      return res.status(409).json({ sucesso: false, mensagem: 'Esta proposta já foi respondida.' });
    }

    if (decisao === 'aprovada' && !endereco_completo) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Endereço de entrega é obrigatório para aprovar.',
      });
    }

    if (decisao === 'aprovada') {
      // ── Transação: UPDATE proposta + INSERT agendamento + UPDATE sol + historico ──
      db.transaction(() => {
        db.prepare(`
          UPDATE propostas_entrega SET
            status = 'aprovada', resposta = ?, respondido_por = ?,
            respondido_em = datetime('now','localtime')
          WHERE id = ?
        `).run(resposta?.trim() || null, userId, id);
        db.prepare(`
          INSERT INTO agendamentos
            (solicitacao_id, data_entrega, endereco_completo, confirmado_matheus)
          VALUES (?, ?, ?, 1)
        `).run(proposta.solicitacao_id, proposta.data_sugerida, endereco_completo.trim());
        db.prepare(`
          UPDATE solicitacoes SET status = 'agendamento_realizado',
            updated_at = datetime('now','localtime') WHERE id = ?
        `).run(proposta.solicitacao_id);
        registrarHistorico(db, proposta.solicitacao_id,
          'entrega_solicitada', 'agendamento_realizado', userId,
          `Agendado para ${proposta.data_sugerida} — ${endereco_completo}`);
      })();
      registrarAcao(db, {
        solicitacaoId: proposta.solicitacao_id,
        usuarioId:     userId,
        acao:          'proposta_aprovada',
        detalhe:       { proposta_id: id, data_entrega: proposta.data_sugerida, endereco: endereco_completo },
        ip:            req.ip,
      });
    } else {
      // ── Transação: UPDATE proposta + UPDATE sol + historico ────────────────────
      db.transaction(() => {
        db.prepare(`
          UPDATE propostas_entrega SET
            status = 'recusada', resposta = ?, respondido_por = ?,
            respondido_em = datetime('now','localtime')
          WHERE id = ?
        `).run(resposta?.trim() || null, userId, id);
        db.prepare(`
          UPDATE solicitacoes SET status = 'proposta_recusada',
            updated_at = datetime('now','localtime') WHERE id = ?
        `).run(proposta.solicitacao_id);
        registrarHistorico(db, proposta.solicitacao_id,
          'entrega_solicitada', 'proposta_recusada', userId,
          `Proposta recusada${resposta ? ': ' + resposta : ''}`);
      })();
      registrarAcao(db, {
        solicitacaoId: proposta.solicitacao_id,
        usuarioId:     userId,
        acao:          'proposta_recusada',
        detalhe:       { proposta_id: id, motivo: resposta || null },
        ip:            req.ip,
      });
    }

    // Notifica o vendedor
    const io = req.app.get('io');
    if (io) {
      io.to(`usuario:${proposta.vendedor_id}`).emit('proposta_respondida', {
        solicitacao_id: proposta.solicitacao_id,
        decisao,
        resposta: resposta || null,
        data_sugerida: proposta.data_sugerida,
      });
    }

    return res.json({
      sucesso: true,
      mensagem: decisao === 'aprovada'
        ? 'Agendamento confirmado com sucesso!'
        : 'Proposta recusada. Vendedor será notificado.',
    });
  } catch (erro) {
    console.error('[PROPOSTAS] Erro ao responder:', erro);
    return res.status(500).json({ sucesso: false, mensagem: 'Erro interno.' });
  }
}

module.exports = { criar, buscarPorSolicitacao, responder };
