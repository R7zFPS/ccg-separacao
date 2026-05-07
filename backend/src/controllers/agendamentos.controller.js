/**
 * Controller de Agendamentos
 * Gerente de Vendas agenda a entrega após material separado
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
// POST /api/agendamentos — Cria agendamento
// =====================================================
async function criar(req, res) {
  try {
    const db = getDb();
    const { solicitacao_id, data_entrega, endereco_completo, observacoes } = req.body;
    const usuarioId = req.usuario.id;

    // Verifica solicitação
    const sol = db.prepare('SELECT * FROM solicitacoes WHERE id = ?').get(solicitacao_id);
    if (!sol) {
      return res.status(404).json({ sucesso: false, mensagem: 'Solicitação não encontrada.' });
    }
    if (sol.status !== 'material_separado') {
      return res.status(400).json({
        sucesso: false,
        mensagem: `Só é possível agendar solicitações com status "Material Separado". Status atual: ${sol.status}`,
      });
    }

    // Já existe agendamento?
    const jaExiste = db.prepare(
      'SELECT id FROM agendamentos WHERE solicitacao_id = ?'
    ).get(solicitacao_id);
    if (jaExiste) {
      return res.status(409).json({
        sucesso: false,
        mensagem: 'Esta solicitação já possui um agendamento.',
      });
    }

    // Arquivos
    const arquivos = req.files || {};
    const url_nota_fiscal_pdf  = arquivos.nota_fiscal?.[0]
      ? urlArquivo(arquivos.nota_fiscal[0].path)    : null;
    const url_boleto_pdf       = arquivos.boleto?.[0]
      ? urlArquivo(arquivos.boleto[0].path)         : null;
    const url_certificado_pdf  = arquivos.certificado?.[0]
      ? urlArquivo(arquivos.certificado[0].path)    : null;
    const url_proposta_pdf     = arquivos.proposta?.[0]
      ? urlArquivo(arquivos.proposta[0].path)       : null;
    const url_ordem_compra_pdf = arquivos.ordem_de_compra?.[0]
      ? urlArquivo(arquivos.ordem_de_compra[0].path): null;

    // ── Transação atômica: INSERT + UPDATE solicitacao + historico ──
    let novo;
    db.transaction(() => {
      const resultado = db.prepare(`
        INSERT INTO agendamentos
          (solicitacao_id, data_entrega, endereco_completo,
           url_nota_fiscal_pdf, url_boleto_pdf, url_certificado_pdf,
           url_proposta_pdf, url_ordem_compra_pdf,
           confirmado_matheus, observacoes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
      `).run(
        solicitacao_id,
        data_entrega,
        endereco_completo.trim(),
        url_nota_fiscal_pdf,
        url_boleto_pdf,
        url_certificado_pdf,
        url_proposta_pdf,
        url_ordem_compra_pdf,
        observacoes?.trim() || null,
      );
      const novoId = Number(resultado.lastInsertRowid);
      novo = db.prepare('SELECT * FROM agendamentos WHERE rowid = ?').get(novoId);
      db.prepare(`
        UPDATE solicitacoes SET status = 'agendamento_realizado',
          updated_at = datetime('now','localtime') WHERE id = ?
      `).run(solicitacao_id);
      registrarHistorico(
        db, solicitacao_id, 'material_separado', 'agendamento_realizado',
        usuarioId, `Entrega agendada para ${data_entrega} — ${endereco_completo}`
      );
    })();

    // Notifica vendedor
    const io = req.app.get('io');
    if (io) {
      io.to(`usuario:${sol.vendedor_id}`).emit('status_atualizado', {
        solicitacao_id,
        status_anterior: 'material_separado',
        status_novo: 'agendamento_realizado',
      });
    }

    return res.status(201).json({
      sucesso: true,
      mensagem: 'Agendamento criado com sucesso.',
      dados: { agendamento: novo },
    });
  } catch (erro) {
    console.error('[AGENDAMENTOS] Erro ao criar:', erro);
    return res.status(500).json({ sucesso: false, mensagem: 'Erro interno.' });
  }
}

// =====================================================
// GET /api/agendamentos — Lista agendamentos
// =====================================================
function listar(req, res) {
  try {
    const db = getDb();
    const { status } = req.query;

    let where = '';
    const params = [];

    if (status === 'pendentes') {
      where = `WHERE s.status IN ('agendamento_realizado')`;
    } else if (status === 'em_rota') {
      where = `WHERE s.status IN ('rota_enviada')`;
    }

    const agendamentos = db.prepare(`
      SELECT
        a.*,
        s.numero_proposta,
        s.setor_destino,
        s.status AS status_solicitacao,
        v.nome   AS vendedor_nome,
        e.nome   AS entregador_nome,
        e.id     AS motorista_id
      FROM agendamentos a
      JOIN solicitacoes s ON s.id = a.solicitacao_id
      JOIN users v        ON v.id = s.vendedor_id
      LEFT JOIN entregas  en ON en.agendamento_id = a.id
      LEFT JOIN users e   ON e.id = en.motorista_id
      ${where}
      ORDER BY a.data_entrega ASC, a.created_at DESC
    `).all(...params);

    return res.status(200).json({
      sucesso: true,
      dados: { agendamentos, total: agendamentos.length },
    });
  } catch (erro) {
    console.error('[AGENDAMENTOS] Erro ao listar:', erro);
    return res.status(500).json({ sucesso: false, mensagem: 'Erro interno.' });
  }
}

// =====================================================
// GET /api/agendamentos/por-solicitacao/:solicitacaoId
// =====================================================
function buscarPorSolicitacao(req, res) {
  try {
    const db = getDb();
    const agendamento = db.prepare(`
      SELECT a.*, s.numero_proposta, s.status AS status_solicitacao,
             v.nome AS vendedor_nome
      FROM agendamentos a
      JOIN solicitacoes s ON s.id = a.solicitacao_id
      JOIN users v        ON v.id = s.vendedor_id
      WHERE a.solicitacao_id = ?
    `).get(req.params.solicitacaoId);

    if (!agendamento) {
      return res.status(404).json({ sucesso: false, mensagem: 'Agendamento não encontrado.' });
    }

    return res.status(200).json({ sucesso: true, dados: { agendamento } });
  } catch (erro) {
    console.error('[AGENDAMENTOS] Erro ao buscar:', erro);
    return res.status(500).json({ sucesso: false, mensagem: 'Erro interno.' });
  }
}

module.exports = { criar, listar, buscarPorSolicitacao };
