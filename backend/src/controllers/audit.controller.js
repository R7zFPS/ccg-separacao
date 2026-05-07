/**
 * Controller de Audit Log
 * Expõe historico_acoes para super_admin.
 * Base: /api/audit
 */

const { getDb } = require('../database/db');

// Mapa legível para os tipos de ação
const LABELS_ACAO = {
  mudanca_status:         'Mudança de status',
  atribuicao_estoquista:  'Atribuição de estoquista',
  proposta_criada:        'Proposta criada',
  proposta_aprovada:      'Proposta aprovada',
  proposta_recusada:      'Proposta recusada',
};

// =====================================================
// GET /api/audit — lista ações com filtros e paginação
// =====================================================
function listar(req, res) {
  try {
    const db = getDb();

    const {
      acao,
      usuario_id,
      solicitacao_id,
      data_inicio,
      data_fim,
      pagina  = 1,
      limite  = 50,
    } = req.query;

    const conditions = [];
    const params     = [];

    if (acao)           { conditions.push('ha.acao = ?');                    params.push(acao); }
    if (usuario_id)     { conditions.push('ha.usuario_id = ?');              params.push(usuario_id); }
    if (solicitacao_id) { conditions.push('ha.solicitacao_id = ?');          params.push(solicitacao_id); }
    if (data_inicio)    { conditions.push("ha.created_at >= ?");             params.push(data_inicio); }
    if (data_fim)       { conditions.push("ha.created_at <= ?");             params.push(data_fim + ' 23:59:59'); }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Total para paginação
    const total = db.prepare(
      `SELECT COUNT(*) as c FROM historico_acoes ha ${where}`
    ).get(...params).c;

    const offset = (Number(pagina) - 1) * Number(limite);

    const rows = db.prepare(`
      SELECT
        ha.id,
        ha.acao,
        ha.detalhe,
        ha.ip,
        ha.created_at,
        u.nome            AS usuario_nome,
        u.role            AS usuario_role,
        s.numero_proposta AS solicitacao_numero
      FROM historico_acoes ha
      JOIN users u ON u.id = ha.usuario_id
      LEFT JOIN solicitacoes s ON s.id = ha.solicitacao_id
      ${where}
      ORDER BY ha.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, Number(limite), offset);

    const acoes = rows.map((r) => ({
      ...r,
      acao_label: LABELS_ACAO[r.acao] || r.acao,
      detalhe:    r.detalhe ? JSON.parse(r.detalhe) : null,
    }));

    // Lista de ações distintas (para o select de filtro)
    const tipos = db.prepare(
      `SELECT DISTINCT acao FROM historico_acoes ORDER BY acao`
    ).all().map((r) => ({ value: r.acao, label: LABELS_ACAO[r.acao] || r.acao }));

    return res.status(200).json({
      sucesso: true,
      dados: {
        acoes,
        tipos,
        total,
        pagina:       Number(pagina),
        limite:       Number(limite),
        total_paginas: Math.ceil(total / Number(limite)),
      },
    });
  } catch (erro) {
    console.error('[AUDIT] Erro ao listar:', erro);
    return res.status(500).json({ sucesso: false, mensagem: 'Erro interno.' });
  }
}

// =====================================================
// GET /api/audit/resumo — contadores por tipo de ação
// =====================================================
function resumo(req, res) {
  try {
    const db = getDb();

    const rows = db.prepare(`
      SELECT acao, COUNT(*) as total
      FROM historico_acoes
      GROUP BY acao
      ORDER BY total DESC
    `).all();

    const porAcao = {};
    rows.forEach(({ acao, total }) => {
      porAcao[acao] = { total, label: LABELS_ACAO[acao] || acao };
    });

    const totalGeral = rows.reduce((acc, r) => acc + r.total, 0);

    // Atividade nos últimos 7 dias (agrupada por dia)
    const ultimos7 = db.prepare(`
      SELECT
        date(created_at) AS dia,
        COUNT(*)         AS total
      FROM historico_acoes
      WHERE created_at >= date('now', '-6 days', 'localtime')
      GROUP BY dia
      ORDER BY dia ASC
    `).all();

    return res.status(200).json({
      sucesso: true,
      dados: { porAcao, totalGeral, ultimos7 },
    });
  } catch (erro) {
    console.error('[AUDIT] Erro no resumo:', erro);
    return res.status(500).json({ sucesso: false, mensagem: 'Erro interno.' });
  }
}

module.exports = { listar, resumo, LABELS_ACAO };
