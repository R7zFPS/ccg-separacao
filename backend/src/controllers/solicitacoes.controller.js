/**
 * Controller de Solicitações
 * Fluxo: aberta → em_separacao → material_separado → agendamento_realizado → rota_enviada → entregue
 */

const path   = require('path');
const fs     = require('fs');
const { getDb } = require('../database/db');
const notificacaoService = require('../services/notificacao.service');
const { uploadParaNuvem } = require('../middleware/upload');

// ── Quem pode ver o quê ─────────────────────────────────
const ROLES_ADMIN    = ['super_admin', 'adm', 'gerencia'];
const ROLES_SEPARACAO = ['estoquista', 'almoxarife'];
const ROLES_AGENDA   = ['gerencia'];

// ── Transições de status válidas por role ───────────────
const TRANSICOES_PERMITIDAS = {
  // Estoquista/almoxarife inicia conferência do material
  em_conferencia: {
    de: ['aberta', 'aguardando_atribuicao'],
    quem: [...ROLES_SEPARACAO, ...ROLES_ADMIN],
  },
  // Admin/almoxarife devolve para fila de atribuição
  aguardando_atribuicao: {
    de: ['aberta', 'em_conferencia', 'em_separacao'],
    quem: ROLES_ADMIN,
  },
  // Estoquista conclui conferência → aguarda NF (se orçamento)
  aguardando_nf: {
    de: ['em_conferencia'],
    quem: [...ROLES_SEPARACAO, ...ROLES_ADMIN],
  },
  // Vendedor envia para fiscal emitir a NF
  em_emissao_nf: {
    de: ['aguardando_nf'],
    quem: ['vendedor', 'gerencia', ...ROLES_ADMIN],
  },
  // Fiscal/vendedor libera para separação após anexar a NF
  em_separacao: {
    de: ['em_emissao_nf', 'aguardando_nf', 'em_conferencia', 'aguardando_atribuicao'],
    quem: ['fiscal', 'vendedor', ...ROLES_SEPARACAO, ...ROLES_ADMIN],
  },
  // Estoquista conclui separação
  material_separado: {
    de: ['em_separacao'],
    quem: [...ROLES_SEPARACAO, ...ROLES_ADMIN],
  },
  // Vendedor propõe data de entrega
  entrega_solicitada: {
    de: ['material_separado', 'proposta_recusada'],
    quem: ['vendedor', 'gerencia', ...ROLES_ADMIN],
  },
  // Gerência recusa proposta → volta para proposta_recusada
  proposta_recusada: {
    de: ['entrega_solicitada'],
    quem: ['gerencia', ...ROLES_ADMIN],
  },
  // Gerência/admin confirma o agendamento
  agendamento_realizado: {
    de: ['entrega_solicitada', 'material_separado'],
    quem: ['gerencia', ...ROLES_ADMIN],
  },
  // Gerência confirma e envia rota ao motorista
  rota_enviada: {
    de: ['agendamento_realizado'],
    quem: [...ROLES_AGENDA, ...ROLES_ADMIN],
  },
  // Motorista confirma entrega com foto
  entregue: {
    de: ['rota_enviada'],
    quem: ['motorista', ...ROLES_ADMIN],
  },
};

// ── Mensagens de notificação por status ────────────────
// Define quem recebe e o que diz para cada transição
const NOTIFICACOES_STATUS = {
  em_conferencia: {
    paraVendedor: (num) => ({
      titulo: `#${num} — Em Conferência`,
      mensagem: `Sua solicitação #${num} está sendo conferida pelo almoxarife.`,
      tipo: 'info',
    }),
  },
  aguardando_nf: {
    paraVendedor: (num) => ({
      titulo: `#${num} — Aguardando Nota Fiscal`,
      mensagem: `A solicitação #${num} precisa de Nota Fiscal para prosseguir.`,
      tipo: 'alerta',
    }),
  },
  em_separacao: {
    paraVendedor: (num) => ({
      titulo: `#${num} — Em Separação`,
      mensagem: `O material da solicitação #${num} está sendo separado.`,
      tipo: 'info',
    }),
  },
  material_separado: {
    paraVendedor: (num) => ({
      titulo: `#${num} — Material Pronto!`,
      mensagem: `O material da solicitação #${num} foi separado e está pronto para agendamento.`,
      tipo: 'sucesso',
    }),
  },
  entrega_solicitada: {
    // Notifica gerência/admins que uma entrega foi solicitada
    paraAdmin: (num, db) => {
      const admins = db.prepare(
        `SELECT id FROM users WHERE role IN ('gerencia','adm','super_admin') AND ativo = 1`
      ).all();
      return admins.map((u) => ({
        usuarioId: u.id,
        titulo: `#${num} — Entrega Solicitada`,
        mensagem: `A solicitação #${num} precisa de agendamento de entrega.`,
        tipo: 'alerta',
      }));
    },
  },
  proposta_recusada: {
    // Notifica o vendedor que sua proposta foi recusada
    paraVendedor: (num) => ({
      titulo: `#${num} — Proposta Recusada`,
      mensagem: `Sua proposta de entrega para #${num} foi recusada. Por favor, sugira uma nova data.`,
      tipo: 'alerta',
    }),
  },
  agendamento_realizado: {
    paraVendedor: (num) => ({
      titulo: `#${num} — Entrega Agendada`,
      mensagem: `A entrega da solicitação #${num} foi confirmada e agendada.`,
      tipo: 'sucesso',
    }),
  },
  rota_enviada: {
    // Notifica motoristas disponíveis
    paraMotoristas: (num, db) => {
      const motoristas = db.prepare(
        `SELECT id FROM users WHERE role = 'motorista' AND ativo = 1`
      ).all();
      return motoristas.map((u) => ({
        usuarioId: u.id,
        titulo: `#${num} — Nova Entrega na Rota`,
        mensagem: `A solicitação #${num} foi adicionada à sua rota de entregas.`,
        tipo: 'info',
      }));
    },
  },
  entregue: {
    paraVendedor: (num) => ({
      titulo: `#${num} — Entregue ✓`,
      mensagem: `A solicitação #${num} foi entregue com sucesso!`,
      tipo: 'sucesso',
    }),
  },
  aguardando_atribuicao: {
    paraAdmin: (num, db) => {
      const admins = db.prepare(
        `SELECT id FROM users WHERE role IN ('adm','gerencia','super_admin') AND ativo = 1`
      ).all();
      return admins.map((u) => ({
        usuarioId: u.id,
        titulo: `#${num} — Aguardando Atribuição`,
        mensagem: `A solicitação #${num} precisa ser atribuída a um estoquista.`,
        tipo: 'alerta',
      }));
    },
  },
};

// ── Helper: registra no histórico de status ──────────────────────
function registrarHistorico(db, solicitacaoId, statusAnterior, statusNovo, usuarioId, obs = null) {
  db.prepare(`
    INSERT INTO historico_status (solicitacao_id, status_anterior, status_novo, alterado_por, observacao)
    VALUES (?, ?, ?, ?, ?)
  `).run(solicitacaoId, statusAnterior, statusNovo, usuarioId, obs);
}

// ── Helper: registra no audit log de ações ──────────────────────
function registrarAcao(db, { solicitacaoId = null, usuarioId, acao, detalhe = null, ip = null }) {
  try {
    db.prepare(`
      INSERT INTO historico_acoes (solicitacao_id, usuario_id, acao, detalhe, ip)
      VALUES (?, ?, ?, ?, ?)
    `).run(solicitacaoId, usuarioId, acao, detalhe ? JSON.stringify(detalhe) : null, ip);
  } catch (e) {
    // audit log nunca deve quebrar o fluxo principal
    console.error('[AUDIT] Erro ao registrar ação:', e.message);
  }
}

// =====================================================
// POST /api/solicitacoes — Vendedor cria solicitação
// =====================================================
async function criar(req, res) {
  try {
    const db = getDb();
    const {
      numero_proposta,
      numero_orcamento,
      tipo_documento,
      setor_destino,
      observacoes,
    } = req.body;

    const vendedor_id = req.usuario.id;

    // Verifica proposta duplicada
    const existente = db.prepare(
      'SELECT id FROM solicitacoes WHERE numero_proposta = ?'
    ).get(numero_proposta.trim());
    if (existente) {
      return res.status(409).json({
        sucesso: false,
        mensagem: 'Já existe uma solicitação com este número de proposta.',
      });
    }

    // Upload do documento para Cloudinary (ou disco local em dev)
    let url_documento  = null;
    let nome_arquivo   = null;
    if (req.file) {
      url_documento = await uploadParaNuvem(req.file, 'documentos');
      nome_arquivo  = req.file.originalname;
    }

    // ── Transação atômica: INSERT + historico juntos ──────────
    let nova;
    db.transaction(() => {
      const resultado = db.prepare(`
        INSERT INTO solicitacoes
          (numero_proposta, numero_orcamento, tipo_documento, url_documento,
           nome_arquivo, setor_destino, vendedor_id, observacoes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        numero_proposta.trim(),
        numero_orcamento?.trim() || null,
        tipo_documento,
        url_documento,
        nome_arquivo,
        setor_destino,
        vendedor_id,
        observacoes?.trim() || null,
      );
      const novaId = Number(resultado.lastInsertRowid);
      nova = db.prepare(`
        SELECT s.*, u.nome AS vendedor_nome
        FROM solicitacoes s
        JOIN users u ON u.id = s.vendedor_id
        WHERE s.rowid = ?
      `).get(novaId);
      registrarHistorico(db, nova.id, null, 'aberta', vendedor_id, 'Solicitação criada');
    })();

    // Notifica admins/gerência/almoxarife sobre nova solicitação
    try {
      const destinatarios = db.prepare(
        `SELECT id FROM users WHERE role IN ('super_admin','adm','gerencia','almoxarife') AND ativo = 1`
      ).all();
      destinatarios.forEach(({ id: uid }) => {
        notificacaoService.criarNotificacao({
          usuarioId:     uid,
          titulo:        `Nova solicitação #${nova.numero_proposta}`,
          mensagem:      `${nova.vendedor_nome} abriu a solicitação #${nova.numero_proposta} (${nova.setor_destino}).`,
          solicitacaoId: nova.id,
          tipo:          'info',
        });
      });
    } catch (e) {
      console.warn('[NOTIF] Nova solicitação:', e.message);
    }

    // Socket: nova solicitação em tempo real
    // Notifica: admins, gerência, almoxarifes e estoquistas (todos que trabalham a fila)
    const io = req.app.get('io');
    if (io) {
      const destinatarios = db.prepare(
        `SELECT id FROM users
         WHERE role IN ('super_admin','adm','gerencia','almoxarife','estoquista')
           AND ativo = 1`
      ).all();
      destinatarios.forEach(({ id: uid }) => {
        io.to(`usuario:${uid}`).emit('nova_solicitacao', {
          id: nova.id,
          numero_proposta: nova.numero_proposta,
          vendedor_nome: nova.vendedor_nome,
          setor_destino: nova.setor_destino,
        });
      });
    }

    return res.status(201).json({
      sucesso: true,
      mensagem: 'Solicitação criada com sucesso.',
      dados: { solicitacao: nova },
    });
  } catch (erro) {
    console.error('[SOLICITACOES] Erro ao criar:', erro);
    return res.status(500).json({ sucesso: false, mensagem: 'Erro interno.' });
  }
}

// =====================================================
// GET /api/solicitacoes — Lista filtrada por role
// =====================================================
function listar(req, res) {
  try {
    const db = getDb();
    const { role, id: userId, setor } = req.usuario;
    const {
      status, prioridade, setor_destino,
      busca,
      // aceita page/pagina e limit/limite (frontend pode mandar qualquer um)
      page, pagina,
      limit, limite,
      // filtros extras do Histórico
      data_inicio, data_fim, vendedor_id,
    } = req.query;

    const paginaNum = Number(pagina || page || 1);
    const limiteNum = Number(limite  || limit  || 30);
    const offset = (paginaNum - 1) * limiteNum;
    const params = [];

    let where = 'WHERE 1=1';

    // ── Filtragem por role ────────────────────────────
    if (role === 'vendedor') {
      where += ' AND s.vendedor_id = ?';
      params.push(userId);
    } else if (ROLES_SEPARACAO.includes(role)) {
      // Estoquista/Almoxarife vê seu setor + solicitações marcadas como 'ambos'
      if (setor !== 'ambos') {
        where += ' AND (s.setor_destino = ? OR s.setor_destino = \'ambos\')';
        params.push(setor);
      }
      // Vê apenas os status relevantes para separação/conferência
      if (!status) {
        where += ` AND s.status IN ('aberta','em_conferencia','aguardando_atribuicao','em_separacao','material_separado')`;
      }
    } else if (role === 'gerencia') {
      // Gerência vê tudo — sem filtro adicional
      // (visualizar_todos_dados já está na lista de permissões)
    } else if (role === 'fiscal') {
      // Vê apenas solicitações aguardando NF ou em emissão
      where += ` AND s.status IN ('aguardando_nf','em_emissao_nf')`;
    } else if (role === 'motorista') {
      where += ` AND s.status IN ('rota_enviada','entregue')`;
    }
    // ROLES_ADMIN (super_admin, adm): sem filtro extra

    // ── Filtros opcionais da query ─────────────────────
    if (status) {
      where += ' AND s.status = ?';
      params.push(status);
    }
    if (prioridade) {
      where += ' AND s.prioridade = ?';
      params.push(prioridade);
    }
    if (setor_destino) {
      where += ' AND s.setor_destino = ?';
      params.push(setor_destino);
    }
    if (busca) {
      where += ' AND (s.numero_proposta LIKE ? OR s.numero_orcamento LIKE ? OR v.nome LIKE ?)';
      const like = `%${busca}%`;
      params.push(like, like, like);
    }

    // Filtro por vendedor específico via query param
    // Apenas admins podem filtrar por OUTRO vendedor (para relatórios/visão gerencial)
    // Para vendedores, o filtro por role acima já garante que só vêem as próprias
    if (vendedor_id && ROLES_ADMIN.includes(role)) {
      where += ' AND s.vendedor_id = ?';
      params.push(vendedor_id);
    }

    // Filtros de data (intervalo por created_at)
    if (data_inicio) {
      where += " AND date(s.created_at) >= date(?)";
      params.push(data_inicio);
    }
    if (data_fim) {
      where += " AND date(s.created_at) <= date(?)";
      params.push(data_fim);
    }

    const query = `
      SELECT
        s.*,
        v.nome  AS vendedor_nome,
        e.nome  AS estoquista_nome
      FROM solicitacoes s
      JOIN  users v ON v.id = s.vendedor_id
      LEFT JOIN users e ON e.id = s.estoquista_id
      ${where}
      ORDER BY
        CASE s.prioridade
          WHEN 'prioridade_maxima' THEN 1
          WHEN 'oceanpact'         THEN 2
          WHEN 'para_hoje'         THEN 3
          WHEN 'em_separacao'      THEN 4
          WHEN 'aguardando_material' THEN 5
          WHEN 'material_separado' THEN 6
          ELSE 7
        END,
        s.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const total = db.prepare(
      `SELECT COUNT(*) as c FROM solicitacoes s JOIN users v ON v.id = s.vendedor_id LEFT JOIN users e ON e.id = s.estoquista_id ${where}`
    ).get(...params).c;

    const solicitacoes = db.prepare(query).all(...params, limiteNum, offset);

    return res.status(200).json({
      sucesso: true,
      dados: {
        solicitacoes,
        total,
        pagina:       paginaNum,
        totalPaginas: Math.ceil(total / limiteNum),
      },
    });
  } catch (erro) {
    console.error('[SOLICITACOES] Erro ao listar:', erro);
    return res.status(500).json({ sucesso: false, mensagem: 'Erro interno.' });
  }
}

// =====================================================
// GET /api/solicitacoes/:id — Detalhe completo
// =====================================================
function buscarPorId(req, res) {
  try {
    const db = getDb();
    const { id } = req.params;
    const { role, id: userId, setor } = req.usuario;

    const solicitacao = db.prepare(`
      SELECT
        s.*,
        v.nome  AS vendedor_nome,
        v.usuario_login AS vendedor_login,
        e.nome  AS estoquista_nome
      FROM solicitacoes s
      JOIN  users v ON v.id = s.vendedor_id
      LEFT JOIN users e ON e.id = s.estoquista_id
      WHERE s.id = ?
    `).get(id);

    if (!solicitacao) {
      return res.status(404).json({ sucesso: false, mensagem: 'Solicitação não encontrada.' });
    }

    // Verifica acesso por role
    if (role === 'vendedor' && solicitacao.vendedor_id !== userId) {
      return res.status(403).json({ sucesso: false, mensagem: 'Acesso negado.' });
    }
    if (ROLES_SEPARACAO.includes(role) && setor !== 'ambos' && solicitacao.setor_destino !== setor) {
      return res.status(403).json({ sucesso: false, mensagem: 'Esta solicitação é de outro setor.' });
    }

    // Histórico de status
    const historico = db.prepare(`
      SELECT h.*, u.nome AS alterado_por_nome
      FROM historico_status h
      JOIN users u ON u.id = h.alterado_por
      WHERE h.solicitacao_id = ?
      ORDER BY h.created_at ASC
    `).all(id);

    return res.status(200).json({
      sucesso: true,
      dados: { solicitacao, historico },
    });
  } catch (erro) {
    console.error('[SOLICITACOES] Erro ao buscar:', erro);
    return res.status(500).json({ sucesso: false, mensagem: 'Erro interno.' });
  }
}

// =====================================================
// PATCH /api/solicitacoes/:id/status — Transição de status
// =====================================================
async function atualizarStatus(req, res) {
  try {
    const db = getDb();
    const { id } = req.params;
    const { status: novoStatus, observacao } = req.body;
    const { role, id: userId, setor } = req.usuario;

    const solicitacao = db.prepare('SELECT * FROM solicitacoes WHERE id = ?').get(id);
    if (!solicitacao) {
      return res.status(404).json({ sucesso: false, mensagem: 'Solicitação não encontrada.' });
    }

    // Verifica se a transição é válida
    const regra = TRANSICOES_PERMITIDAS[novoStatus];
    if (!regra) {
      return res.status(400).json({ sucesso: false, mensagem: 'Status inválido.' });
    }
    if (!regra.de.includes(solicitacao.status)) {
      return res.status(400).json({
        sucesso: false,
        mensagem: `Não é possível ir de "${solicitacao.status}" para "${novoStatus}".`,
      });
    }
    if (!regra.quem.includes(role)) {
      return res.status(403).json({
        sucesso: false,
        mensagem: 'Seu perfil não pode executar esta transição.',
      });
    }

    // Verifica setor (separadores só pegam seu setor)
    if (ROLES_SEPARACAO.includes(role) && setor !== 'ambos'
        && solicitacao.setor_destino !== setor) {
      return res.status(403).json({ sucesso: false, mensagem: 'Esta solicitação é de outro setor.' });
    }

    // Ao iniciar separação → atribui estoquista
    let estoquista_id = solicitacao.estoquista_id;
    if (novoStatus === 'em_separacao' && ROLES_SEPARACAO.includes(role)) {
      estoquista_id = userId;
    }

    // Arquivos via uploadMisto.fields() → req.files é objeto de arrays
    const fotoFile = req.files?.foto_separacao?.[0];
    const nfFile   = req.files?.nota_fiscal?.[0];

    // ── Validações de upload obrigatório ─────────────────
    // NF obrigatória ao liberar para separação (quando vem de aguardando_nf ou em_emissao_nf)
    if (novoStatus === 'em_separacao' &&
        ['aguardando_nf', 'em_emissao_nf'].includes(solicitacao.status) &&
        !nfFile) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'É obrigatório anexar a Nota Fiscal (PDF) para liberar para separação.',
      });
    }
    // Foto obrigatória ao concluir separação
    if (novoStatus === 'material_separado' && !fotoFile) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'É obrigatório fotografar o material separado para concluir a separação.',
      });
    }

    // Upload para Cloudinary (ou disco local em dev) — fora da transação (async)
    let url_foto_separacao = solicitacao.url_foto_separacao;
    if (fotoFile) url_foto_separacao = await uploadParaNuvem(fotoFile, 'fotos');

    let url_nota_fiscal = solicitacao.url_nota_fiscal;
    if (nfFile) url_nota_fiscal = await uploadParaNuvem(nfFile, 'documentos');

    // ── Timestamps de separação ──────────────────────────
    const agora = new Date().toISOString();
    let timestamp_inicio_separacao = solicitacao.timestamp_inicio_separacao;
    let timestamp_fim_separacao    = solicitacao.timestamp_fim_separacao;
    let tempo_separacao_segundos   = solicitacao.tempo_separacao_segundos;

    if (novoStatus === 'em_separacao' && !timestamp_inicio_separacao) {
      // Registra início apenas na primeira vez (não sobrescreve se retomado)
      timestamp_inicio_separacao = agora;
    }
    if (novoStatus === 'material_separado') {
      timestamp_fim_separacao = agora;
      if (timestamp_inicio_separacao) {
        const inicioMs = new Date(timestamp_inicio_separacao).getTime();
        const fimMs    = new Date(agora).getTime();
        tempo_separacao_segundos = Math.round((fimMs - inicioMs) / 1000);
      }
    }

    // ── Transação atômica: UPDATE + historico juntos ──────────
    db.transaction(() => {
      db.prepare(`
        UPDATE solicitacoes SET
          status                      = ?,
          estoquista_id               = ?,
          url_foto_separacao          = ?,
          url_nota_fiscal             = ?,
          timestamp_inicio_separacao  = ?,
          timestamp_fim_separacao     = ?,
          tempo_separacao_segundos    = ?,
          updated_at                  = datetime('now','localtime')
        WHERE id = ?
      `).run(
        novoStatus, estoquista_id, url_foto_separacao, url_nota_fiscal,
        timestamp_inicio_separacao, timestamp_fim_separacao, tempo_separacao_segundos,
        id
      );
      registrarHistorico(db, id, solicitacao.status, novoStatus, userId, observacao || null);
    })();

    // ── Audit log ──────────────────────────────────────────
    registrarAcao(db, {
      solicitacaoId: id,
      usuarioId:     userId,
      acao:          'mudanca_status',
      detalhe: {
        de:     solicitacao.status,
        para:   novoStatus,
        obs:    observacao || null,
        foto:   url_foto_separacao ? true : undefined,
      },
      ip: req.ip,
    });

    // ── Notificações in-app ────────────────────────────────
    try {
      const regrasNotif = NOTIFICACOES_STATUS[novoStatus];
      if (regrasNotif) {
        // Notifica o vendedor
        if (regrasNotif.paraVendedor) {
          const msg = regrasNotif.paraVendedor(solicitacao.numero_proposta);
          notificacaoService.criarNotificacao({
            usuarioId:     solicitacao.vendedor_id,
            titulo:        msg.titulo,
            mensagem:      msg.mensagem,
            solicitacaoId: id,
            tipo:          msg.tipo,
          });
        }
        // Notifica admins
        if (regrasNotif.paraAdmin) {
          const msgs = regrasNotif.paraAdmin(solicitacao.numero_proposta, db);
          msgs.forEach((m) => notificacaoService.criarNotificacao({
            usuarioId: m.usuarioId, titulo: m.titulo,
            mensagem: m.mensagem, solicitacaoId: id, tipo: m.tipo,
          }));
        }
        // Notifica motoristas
        if (regrasNotif.paraMotoristas) {
          const msgs = regrasNotif.paraMotoristas(solicitacao.numero_proposta, db);
          msgs.forEach((m) => notificacaoService.criarNotificacao({
            usuarioId: m.usuarioId, titulo: m.titulo,
            mensagem: m.mensagem, solicitacaoId: id, tipo: m.tipo,
          }));
        }
      }
    } catch (errNotif) {
      // Notificações são best-effort — não bloqueiam a resposta
      console.warn('[NOTIF] Erro ao criar notificação:', errNotif.message);
    }

    // ── Socket: notifica o vendedor em tempo real ──────────
    const io = req.app.get('io');
    if (io) {
      io.to(`usuario:${solicitacao.vendedor_id}`).emit('status_atualizado', {
        solicitacao_id: id,
        status_anterior: solicitacao.status,
        status_novo: novoStatus,
      });

      // Notifica fiscais quando uma NF entra na fila de emissão
      if (novoStatus === 'aguardando_nf') {
        const fiscais = db.prepare(
          `SELECT id FROM users WHERE role = 'fiscal' AND ativo = 1`
        ).all();
        fiscais.forEach(({ id: uid }) => {
          io.to(`usuario:${uid}`).emit('nova_nf_pendente', {
            solicitacao_id: id,
            numero_proposta: solicitacao.numero_proposta,
          });
        });
      }
    }

    const atualizada = db.prepare(`
      SELECT s.*, v.nome AS vendedor_nome, e.nome AS estoquista_nome
      FROM solicitacoes s
      JOIN users v ON v.id = s.vendedor_id
      LEFT JOIN users e ON e.id = s.estoquista_id
      WHERE s.id = ?
    `).get(id);

    return res.status(200).json({
      sucesso: true,
      mensagem: 'Status atualizado.',
      dados: { solicitacao: atualizada },
    });
  } catch (erro) {
    console.error('[SOLICITACOES] Erro ao atualizar status:', erro);
    return res.status(500).json({ sucesso: false, mensagem: 'Erro interno.' });
  }
}

// =====================================================
// PATCH /api/solicitacoes/:id/prioridade — Define prioridade
// =====================================================
function atualizarPrioridade(req, res) {
  try {
    const db = getDb();
    const { id } = req.params;
    const { prioridade } = req.body;
    const { id: userId } = req.usuario;

    const solicitacao = db.prepare('SELECT id, prioridade FROM solicitacoes WHERE id = ?').get(id);
    if (!solicitacao) {
      return res.status(404).json({ sucesso: false, mensagem: 'Solicitação não encontrada.' });
    }

    // ── Transação atômica: UPDATE + historico juntos ──────────
    const label = prioridade || 'nenhuma';
    db.transaction(() => {
      db.prepare(`
        UPDATE solicitacoes SET prioridade = ?, updated_at = datetime('now','localtime')
        WHERE id = ?
      `).run(prioridade || null, id);
      registrarHistorico(db, id, null, solicitacao.prioridade || 'sem_prioridade',
        userId, `Prioridade definida: ${label}`);
    })();

    return res.status(200).json({
      sucesso: true,
      mensagem: 'Prioridade atualizada.',
      dados: { prioridade: prioridade || null },
    });
  } catch (erro) {
    console.error('[SOLICITACOES] Erro ao atualizar prioridade:', erro);
    return res.status(500).json({ sucesso: false, mensagem: 'Erro interno.' });
  }
}

// =====================================================
// PATCH /api/solicitacoes/:id/atribuir — Atribuição manual
// =====================================================
function atribuirEstoquista(req, res) {
  try {
    const db = getDb();
    const { id } = req.params;
    const { estoquista_id } = req.body;

    const solicitacao = db.prepare('SELECT * FROM solicitacoes WHERE id = ?').get(id);
    if (!solicitacao) {
      return res.status(404).json({ sucesso: false, mensagem: 'Solicitação não encontrada.' });
    }

    const estoquista = db.prepare(
      `SELECT id, nome, role FROM users WHERE id = ? AND ativo = 1`
    ).get(estoquista_id);
    if (!estoquista || !['estoquista','almoxarife'].includes(estoquista.role)) {
      return res.status(400).json({ sucesso: false, mensagem: 'Estoquista inválido.' });
    }

    // ── Transação atômica: UPDATE + historico juntos ──────────
    db.transaction(() => {
      db.prepare(`
        UPDATE solicitacoes SET
          estoquista_id = ?,
          status        = 'em_separacao',
          updated_at    = datetime('now','localtime')
        WHERE id = ?
      `).run(estoquista_id, id);
      registrarHistorico(
        db, id, solicitacao.status, 'em_separacao',
        req.usuario.id,
        `Atribuído manualmente a: ${estoquista.nome}`
      );
    })();

    registrarAcao(db, {
      solicitacaoId: id,
      usuarioId:     req.usuario.id,
      acao:          'atribuicao_estoquista',
      detalhe:       { estoquista_id, estoquista_nome: estoquista.nome },
      ip:            req.ip,
    });

    // Notifica o estoquista atribuído
    try {
      notificacaoService.criarNotificacao({
        usuarioId:     estoquista_id,
        titulo:        `#${solicitacao.numero_proposta} — Atribuído a você`,
        mensagem:      `A solicitação #${solicitacao.numero_proposta} foi atribuída para você separar.`,
        solicitacaoId: id,
        tipo:          'alerta',
      });
      // Notifica também o vendedor
      notificacaoService.criarNotificacao({
        usuarioId:     solicitacao.vendedor_id,
        titulo:        `#${solicitacao.numero_proposta} — Em Separação`,
        mensagem:      `Sua solicitação #${solicitacao.numero_proposta} foi atribuída e está em separação.`,
        solicitacaoId: id,
        tipo:          'info',
      });
    } catch (e) {
      console.warn('[NOTIF] Atribuição:', e.message);
    }

    return res.status(200).json({
      sucesso: true,
      mensagem: `Solicitação atribuída a ${estoquista.nome}.`,
    });
  } catch (erro) {
    console.error('[SOLICITACOES] Erro ao atribuir:', erro);
    return res.status(500).json({ sucesso: false, mensagem: 'Erro interno.' });
  }
}

// =====================================================
// DELETE /api/solicitacoes/:id — Cancelar (apenas aberta)
// =====================================================
function cancelar(req, res) {
  try {
    const db = getDb();
    const { id } = req.params;
    const { role, id: userId } = req.usuario;

    const solicitacao = db.prepare('SELECT * FROM solicitacoes WHERE id = ?').get(id);
    if (!solicitacao) {
      return res.status(404).json({ sucesso: false, mensagem: 'Solicitação não encontrada.' });
    }

    // Vendedor só pode cancelar a própria e apenas se aberta
    if (role === 'vendedor') {
      if (solicitacao.vendedor_id !== userId) {
        return res.status(403).json({ sucesso: false, mensagem: 'Acesso negado.' });
      }
      if (solicitacao.status !== 'aberta') {
        return res.status(400).json({
          sucesso: false,
          mensagem: 'Só é possível cancelar solicitações ainda abertas.',
        });
      }
    }

    // Nota: arquivos no Cloudinary são gerenciados via painel Cloudinary.
    // Arquivos legados em disco local são removidos se existirem.
    if (solicitacao.url_documento && solicitacao.url_documento.startsWith('/uploads/')) {
      const caminhoAbsoluto = path.join(
        process.env.UPLOAD_DIR || './src/uploads',
        solicitacao.url_documento.replace('/uploads/', '')
      );
      if (fs.existsSync(caminhoAbsoluto)) {
        fs.unlinkSync(caminhoAbsoluto);
      }
    }

    db.prepare('DELETE FROM solicitacoes WHERE id = ?').run(id);

    return res.status(200).json({
      sucesso: true,
      mensagem: 'Solicitação cancelada.',
    });
  } catch (erro) {
    console.error('[SOLICITACOES] Erro ao cancelar:', erro);
    return res.status(500).json({ sucesso: false, mensagem: 'Erro interno.' });
  }
}

// =====================================================
// GET /api/solicitacoes/estatisticas — Contadores por status
// =====================================================
function estatisticas(req, res) {
  try {
    const db = getDb();
    const { role, id: userId, setor } = req.usuario;

    let where = '';
    const params = [];

    if (role === 'vendedor') {
      where = 'WHERE vendedor_id = ?';
      params.push(userId);
    } else if (ROLES_SEPARACAO.includes(role) && setor !== 'ambos') {
      where = 'WHERE setor_destino = ?';
      params.push(setor);
    }

    const rows = db.prepare(
      `SELECT status, COUNT(*) as total FROM solicitacoes ${where} GROUP BY status`
    ).all(...params);

    // por_status: mapa status → contagem (usado por Dashboard e Relatórios)
    const por_status = {};
    rows.forEach(({ status, total }) => { por_status[status] = total; });

    // contadores: alias retrocompatível (usado pelos dashboards antigos)
    const contadores = { ...por_status };

    // Totais agregados úteis para os dashboards
    const STATUS_ABERTOS = [
      'aberta','em_conferencia','aguardando_atribuicao','aguardando_nf',
      'em_emissao_nf','em_separacao','material_separado',
      'entrega_solicitada','agendamento_realizado','rota_enviada',
    ];
    const total_geral  = rows.reduce((acc, r) => acc + r.total, 0);
    const total_abertas = STATUS_ABERTOS.reduce((acc, s) => acc + (por_status[s] || 0), 0);
    const total_entregues = por_status['entregue'] || 0;

    return res.status(200).json({
      sucesso: true,
      dados: {
        contadores,   // retrocompatível
        por_status,   // nome semântico
        total_geral,
        total_abertas,
        total_entregues,
        // Atalhos diretos para os dashboards de separação
        aguardando_atribuicao: por_status['aguardando_atribuicao'] || 0,
        em_separacao:          por_status['em_separacao']          || 0,
        material_separado:     por_status['material_separado']     || 0,
      },
    });
  } catch (erro) {
    console.error('[SOLICITACOES] Erro nas estatísticas:', erro);
    return res.status(500).json({ sucesso: false, mensagem: 'Erro interno.' });
  }
}

// GET /api/solicitacoes/ranking-estoquistas — Ranking por tempo médio de separação
// =====================================================
function rankingEstoquistas(req, res) {
  try {
    const db = getDb();

    // Pega só solicitações com dados completos de separação
    const rows = db.prepare(`
      SELECT
        u.id,
        u.nome,
        u.setor,
        COUNT(s.id)                                    AS total_pedidos,
        AVG(s.tempo_separacao_segundos)                AS media_segundos,
        MIN(s.tempo_separacao_segundos)                AS min_segundos,
        MAX(s.tempo_separacao_segundos)                AS max_segundos,
        SUM(CASE WHEN s.tempo_separacao_segundos <= 1800 THEN 1 ELSE 0 END) AS dentro_meta
      FROM solicitacoes s
      JOIN users u ON u.id = s.estoquista_id
      WHERE s.tempo_separacao_segundos IS NOT NULL
        AND s.tempo_separacao_segundos > 0
      GROUP BY s.estoquista_id
      ORDER BY media_segundos ASC
    `).all();

    return res.status(200).json({
      sucesso: true,
      dados: {
        ranking: rows.map((r) => ({
          ...r,
          media_segundos: Math.round(r.media_segundos),
          min_segundos:   Math.round(r.min_segundos),
          max_segundos:   Math.round(r.max_segundos),
          // % de pedidos dentro da meta de 30 min
          pct_meta: r.total_pedidos > 0
            ? Math.round((r.dentro_meta / r.total_pedidos) * 100)
            : 0,
        })),
      },
    });
  } catch (erro) {
    console.error('[RANKING] Erro:', erro);
    return res.status(500).json({ sucesso: false, mensagem: 'Erro interno.' });
  }
}

// GET /api/solicitacoes/evolucao — Criações e entregas por dia (últimos N dias)
// =====================================================
function evolucao(req, res) {
  try {
    const db   = getDb();
    const dias  = Math.min(Number(req.query.dias || 14), 90);

    // Criações por dia
    const criadas = db.prepare(`
      SELECT date(created_at) AS dia, COUNT(*) AS total
      FROM solicitacoes
      WHERE created_at >= date('now', ? || ' days', 'localtime')
      GROUP BY dia
      ORDER BY dia ASC
    `).all(`-${dias}`);

    // Entregas concluídas por dia (updated_at quando status=entregue)
    const entregues = db.prepare(`
      SELECT date(h.created_at) AS dia, COUNT(*) AS total
      FROM historico_status h
      WHERE h.status_novo = 'entregue'
        AND h.created_at >= date('now', ? || ' days', 'localtime')
      GROUP BY dia
      ORDER BY dia ASC
    `).all(`-${dias}`);

    // Gera grade completa dos últimos N dias (preenche dias sem dados com 0)
    const hoje   = new Date();
    const grade  = [];
    for (let i = dias - 1; i >= 0; i--) {
      const d = new Date(hoje);
      d.setDate(hoje.getDate() - i);
      const dia = d.toISOString().slice(0, 10);
      grade.push({
        dia,
        criadas:   criadas.find((r)  => r.dia === dia)?.total   || 0,
        entregues: entregues.find((r) => r.dia === dia)?.total  || 0,
      });
    }

    return res.status(200).json({ sucesso: true, dados: { evolucao: grade } });
  } catch (erro) {
    console.error('[EVOLUCAO] Erro:', erro);
    return res.status(500).json({ sucesso: false, mensagem: 'Erro interno.' });
  }
}

// ── Estatísticas pessoais do usuário autenticado ─────────
async function minhasEstatisticas(req, res) {
  try {
    const db   = getDb();
    const { id: userId, role } = req.usuario;
    const dados = {};

    // Vendedor: pedidos criados e seus status
    if (['vendedor', 'gerencia', 'adm', 'super_admin'].includes(role)) {
      const rows = db.prepare(`
        SELECT status, COUNT(*) as qtd
        FROM solicitacoes
        WHERE vendedor_id = ?
        GROUP BY status
      `).all(userId);

      const porStatus = {};
      let total = 0;
      rows.forEach((r) => { porStatus[r.status] = r.qtd; total += r.qtd; });

      dados.como_vendedor = {
        total_criadas: total,
        entregues:     porStatus['entregue'] || 0,
        em_andamento:  total - (porStatus['entregue'] || 0),
        por_status:    porStatus,
      };
    }

    // Estoquista / almoxarife: pedidos separados
    if (['estoquista', 'almoxarife', 'adm', 'super_admin'].includes(role)) {
      const row = db.prepare(`
        SELECT
          COUNT(*) as total_atribuidos,
          SUM(CASE WHEN status IN ('material_separado','entrega_solicitada',
            'proposta_recusada','agendamento_realizado','rota_enviada','entregue') THEN 1 ELSE 0 END) as concluidos,
          AVG(CASE WHEN tempo_separacao_segundos > 0 THEN tempo_separacao_segundos ELSE NULL END) as avg_seg,
          SUM(CASE WHEN tempo_separacao_segundos > 0 AND tempo_separacao_segundos <= 1800 THEN 1 ELSE 0 END) as dentro_meta,
          MIN(CASE WHEN tempo_separacao_segundos > 0 THEN tempo_separacao_segundos ELSE NULL END) as min_seg,
          MAX(CASE WHEN tempo_separacao_segundos > 0 THEN tempo_separacao_segundos ELSE NULL END) as max_seg
        FROM solicitacoes
        WHERE estoquista_id = ?
      `).get(userId);

      const totalComTempo = db.prepare(`
        SELECT COUNT(*) as n FROM solicitacoes
        WHERE estoquista_id = ? AND tempo_separacao_segundos > 0
      `).get(userId);

      const pctMeta = totalComTempo?.n > 0
        ? Math.round(((row?.dentro_meta || 0) / totalComTempo.n) * 100)
        : null;

      dados.como_estoquista = {
        total_atribuidos:    row?.total_atribuidos || 0,
        concluidos:          row?.concluidos       || 0,
        avg_segundos:        row?.avg_seg ? Math.round(row.avg_seg) : null,
        min_segundos:        row?.min_seg || null,
        max_segundos:        row?.max_seg || null,
        pct_dentro_meta:     pctMeta,
      };
    }

    // Ações no audit log
    const acoes = db.prepare(`
      SELECT acao, COUNT(*) as qtd
      FROM historico_acoes
      WHERE usuario_id = ?
      GROUP BY acao
      ORDER BY qtd DESC
      LIMIT 10
    `).all(userId);
    dados.acoes = acoes;

    // Última atividade
    const ultima = db.prepare(`
      SELECT created_at FROM historico_acoes
      WHERE usuario_id = ?
      ORDER BY created_at DESC LIMIT 1
    `).get(userId);
    dados.ultima_atividade = ultima?.created_at || null;

    return res.json({ sucesso: true, dados });
  } catch (erro) {
    console.error('[MINHAS-STATS] Erro:', erro);
    return res.status(500).json({ sucesso: false, mensagem: 'Erro interno.' });
  }
}

module.exports = {
  criar,
  listar,
  buscarPorId,
  atualizarStatus,
  atualizarPrioridade,
  atribuirEstoquista,
  cancelar,
  estatisticas,
  rankingEstoquistas,
  evolucao,
  minhasEstatisticas,
};
