/**
 * Controller de Entregas
 * Motorista recebe rota e confirma entrega
 */

const path   = require('path');
const { getDb } = require('../database/db');

function urlArquivo(caminho) {
  if (!caminho) return null;
  return `/uploads/${path.basename(path.dirname(caminho))}/${path.basename(caminho)}`;
}

function registrarHistorico(db, solicitacaoId, statusAnterior, statusNovo, usuarioId, obs) {
  db.prepare(`
    INSERT INTO historico_status (solicitacao_id, status_anterior, status_novo, alterado_por, observacao)
    VALUES (?, ?, ?, ?, ?)
  `).run(solicitacaoId, statusAnterior, statusNovo, usuarioId, obs || null);
}

// =====================================================
// POST /api/entregas — Gerente envia rota ao motorista
// =====================================================
async function criar(req, res) {
  try {
    const db = getDb();
    const { agendamento_id, motorista_id, observacoes } = req.body;
    const usuarioId = req.usuario.id;

    const agendamento = db.prepare(`
      SELECT a.*, s.id AS sol_id, s.status AS sol_status,
             s.vendedor_id, s.numero_proposta
      FROM agendamentos a
      JOIN solicitacoes s ON s.id = a.solicitacao_id
      WHERE a.id = ?
    `).get(agendamento_id);

    if (!agendamento) {
      return res.status(404).json({ sucesso: false, mensagem: 'Agendamento não encontrado.' });
    }
    if (agendamento.sol_status !== 'agendamento_realizado') {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'O status da solicitação não permite envio de rota.',
      });
    }

    // Verifica se o motorista existe e está ativo
    const motorista = db.prepare(
      `SELECT id, nome FROM users WHERE id = ? AND role = 'motorista' AND ativo = 1`
    ).get(motorista_id);
    if (!motorista) {
      return res.status(400).json({ sucesso: false, mensagem: 'Motorista inválido.' });
    }

    // Verifica se já existe entrega para este agendamento
    const jaExiste = db.prepare(
      'SELECT id FROM entregas WHERE agendamento_id = ?'
    ).get(agendamento_id);
    if (jaExiste) {
      return res.status(409).json({
        sucesso: false,
        mensagem: 'Esta entrega já foi enviada ao motorista.',
      });
    }

    // ── Transação atômica: INSERT + UPDATE solicitacao + historico ──
    let nova;
    db.transaction(() => {
      const resultado = db.prepare(`
        INSERT INTO entregas (agendamento_id, motorista_id, status, observacoes)
        VALUES (?, ?, 'pendente', ?)
      `).run(agendamento_id, motorista_id, observacoes?.trim() || null);
      const novoId = Number(resultado.lastInsertRowid);
      nova = db.prepare('SELECT * FROM entregas WHERE rowid = ?').get(novoId);
      db.prepare(`
        UPDATE solicitacoes SET status = 'rota_enviada',
          updated_at = datetime('now','localtime')
        WHERE id = ?
      `).run(agendamento.sol_id);
      registrarHistorico(
        db, agendamento.sol_id, 'agendamento_realizado', 'rota_enviada',
        usuarioId, `Rota enviada para motorista: ${motorista.nome}`
      );
    })();

    // Notifica motorista e vendedor via socket
    const io = req.app.get('io');
    if (io) {
      io.to(`usuario:${motorista_id}`).emit('nova_rota', {
        entrega_id: nova.id,
        agendamento_id,
        numero_proposta: agendamento.numero_proposta,
        data_entrega: agendamento.data_entrega,
        endereco: agendamento.endereco_completo,
      });
      io.to(`usuario:${agendamento.vendedor_id}`).emit('status_atualizado', {
        solicitacao_id: agendamento.sol_id,
        status_anterior: 'agendamento_realizado',
        status_novo: 'rota_enviada',
      });
    }

    return res.status(201).json({
      sucesso: true,
      mensagem: `Rota enviada para ${motorista.nome}.`,
      dados: { entrega: nova },
    });
  } catch (erro) {
    console.error('[ENTREGAS] Erro ao criar:', erro);
    return res.status(500).json({ sucesso: false, mensagem: 'Erro interno.' });
  }
}

// =====================================================
// GET /api/entregas/motorista — Entregas do motorista logado
// =====================================================
function listarMotorista(req, res) {
  try {
    const db = getDb();
    const motoristaId = req.usuario.id;
    const { status } = req.query;

    let where = 'WHERE en.motorista_id = ?';
    const params = [motoristaId];

    if (status) {
      where += ' AND en.status = ?';
      params.push(status);
    } else {
      // Por padrão, mostra pendentes e em_rota
      where += ` AND en.status IN ('pendente','em_rota')`;
    }

    const entregas = db.prepare(`
      SELECT
        en.*,
        a.data_entrega,
        a.endereco_completo,
        a.url_nota_fiscal_pdf,
        a.url_boleto_pdf,
        a.url_certificado_pdf,
        a.url_proposta_pdf,
        a.url_ordem_compra_pdf,
        a.observacoes        AS obs_agendamento,
        s.numero_proposta,
        s.numero_orcamento,
        s.setor_destino,
        s.id                 AS solicitacao_id,
        v.nome               AS vendedor_nome
      FROM entregas en
      JOIN agendamentos a ON a.id = en.agendamento_id
      JOIN solicitacoes s ON s.id = a.solicitacao_id
      JOIN users v        ON v.id = s.vendedor_id
      ${where}
      ORDER BY a.data_entrega ASC
    `).all(...params);

    return res.status(200).json({
      sucesso: true,
      dados: { entregas, total: entregas.length },
    });
  } catch (erro) {
    console.error('[ENTREGAS] Erro ao listar motorista:', erro);
    return res.status(500).json({ sucesso: false, mensagem: 'Erro interno.' });
  }
}

// =====================================================
// PATCH /api/entregas/:id/confirmar — Motorista confirma entrega
// =====================================================
async function confirmar(req, res) {
  try {
    const db = getDb();
    const { id } = req.params;
    const { observacoes } = req.body;
    const usuarioId = req.usuario.id;

    const entrega = db.prepare(`
      SELECT en.*, a.solicitacao_id, s.vendedor_id, s.numero_proposta, s.status AS sol_status
      FROM entregas en
      JOIN agendamentos a ON a.id = en.agendamento_id
      JOIN solicitacoes s ON s.id = a.solicitacao_id
      WHERE en.id = ?
    `).get(id);

    if (!entrega) {
      return res.status(404).json({ sucesso: false, mensagem: 'Entrega não encontrada.' });
    }
    if (entrega.motorista_id !== usuarioId) {
      return res.status(403).json({
        sucesso: false,
        mensagem: 'Esta entrega não está atribuída a você.',
      });
    }
    if (entrega.status === 'entregue') {
      return res.status(400).json({ sucesso: false, mensagem: 'Entrega já confirmada.' });
    }

    // Foto do comprovante é obrigatória
    if (!req.file) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'A foto do comprovante de entrega é obrigatória.',
      });
    }

    const url_foto_comprovante = `/uploads/fotos/${req.file.filename}`;

    // ── Transação atômica: UPDATE entrega + UPDATE solicitacao + historico ──
    db.transaction(() => {
      db.prepare(`
        UPDATE entregas SET
          status                = 'entregue',
          url_foto_comprovante  = ?,
          entregue_em           = datetime('now','localtime'),
          observacoes           = ?,
          updated_at            = datetime('now','localtime')
        WHERE id = ?
      `).run(url_foto_comprovante, observacoes?.trim() || entrega.observacoes, id);
      db.prepare(`
        UPDATE solicitacoes SET status = 'entregue',
          updated_at = datetime('now','localtime')
        WHERE id = ?
      `).run(entrega.solicitacao_id);
      registrarHistorico(
        db, entrega.solicitacao_id, 'rota_enviada', 'entregue',
        usuarioId, observacoes || 'Entrega confirmada pelo motorista'
      );
    })();

    // Notifica vendedor
    const io = req.app.get('io');
    if (io) {
      io.to(`usuario:${entrega.vendedor_id}`).emit('status_atualizado', {
        solicitacao_id: entrega.solicitacao_id,
        status_anterior: 'rota_enviada',
        status_novo: 'entregue',
      });
    }

    return res.status(200).json({
      sucesso: true,
      mensagem: 'Entrega confirmada com sucesso!',
    });
  } catch (erro) {
    console.error('[ENTREGAS] Erro ao confirmar:', erro);
    return res.status(500).json({ sucesso: false, mensagem: 'Erro interno.' });
  }
}

// =====================================================
// GET /api/entregas/historico — Histórico do motorista
// =====================================================
function historico(req, res) {
  try {
    const db = getDb();
    const motoristaId = req.usuario.id;

    const entregas = db.prepare(`
      SELECT
        en.*,
        a.data_entrega,
        a.endereco_completo,
        s.numero_proposta,
        v.nome AS vendedor_nome
      FROM entregas en
      JOIN agendamentos a ON a.id = en.agendamento_id
      JOIN solicitacoes s ON s.id = a.solicitacao_id
      JOIN users v        ON v.id = s.vendedor_id
      WHERE en.motorista_id = ? AND en.status = 'entregue'
      ORDER BY en.entregue_em DESC
      LIMIT 30
    `).all(motoristaId);

    return res.status(200).json({
      sucesso: true,
      dados: { entregas, total: entregas.length },
    });
  } catch (erro) {
    console.error('[ENTREGAS] Erro no histórico:', erro);
    return res.status(500).json({ sucesso: false, mensagem: 'Erro interno.' });
  }
}

module.exports = { criar, listarMotorista, confirmar, historico };
