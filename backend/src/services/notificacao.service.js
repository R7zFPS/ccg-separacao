/**
 * Serviço de Notificações In-App
 * Cria notificações no banco e emite eventos via Socket.io
 */

const { getDb } = require('../database/db');

let io; // Instância do Socket.io injetada pelo index.js

function setSocketIO(socketIO) {
  io = socketIO;
}

/**
 * Cria uma notificação para um usuário e emite via socket se conectado
 * @param {Object} dados
 * @param {string} dados.usuarioId      - ID do destinatário
 * @param {string} dados.titulo         - Título curto
 * @param {string} dados.mensagem       - Mensagem completa
 * @param {string} [dados.solicitacaoId] - ID da solicitação relacionada (opcional)
 * @param {string} [dados.tipo]         - 'info' | 'sucesso' | 'alerta' | 'erro'
 */
function criarNotificacao({ usuarioId, titulo, mensagem, solicitacaoId = null, tipo = 'info' }) {
  const db = getDb();

  const resultado = db.prepare(`
    INSERT INTO notificacoes (usuario_id, solicitacao_id, titulo, mensagem, tipo)
    VALUES (?, ?, ?, ?, ?)
  `).run(usuarioId, solicitacaoId, titulo, mensagem, tipo);

  const notificacao = db.prepare(`
    SELECT * FROM notificacoes WHERE rowid = ?
  `).get(Number(resultado.lastInsertRowid));

  // Emite para o socket do usuário destinatário (se conectado)
  if (io) {
    io.to(`usuario:${usuarioId}`).emit('nova_notificacao', notificacao);
  }

  return notificacao;
}

/**
 * Busca notificações de um usuário (com paginação e filtro de lida)
 * @param {string|number} usuarioId
 * @param {Object} opts
 * @param {number} [opts.limite=20]
 * @param {number} [opts.pagina=1]
 * @param {boolean} [opts.apenasNaoLidas=false]
 * @param {0|1|null} [opts.lida=null] — null=todas, 0=nao_lidas, 1=lidas
 */
function buscarNotificacoes(usuarioId, { limite = 20, pagina = 1, apenasNaoLidas = false, lida = null } = {}) {
  const db = getDb();
  const offset = (pagina - 1) * limite;
  const params = [usuarioId];
  let where = 'WHERE usuario_id = ?';

  // Compatibilidade retroativa
  if (apenasNaoLidas) { where += ' AND lida = 0'; }
  else if (lida === 0 || lida === '0') { where += ' AND lida = 0'; }
  else if (lida === 1 || lida === '1') { where += ' AND lida = 1'; }

  const total = db.prepare(`SELECT COUNT(*) as n FROM notificacoes ${where}`).get(...params).n;

  const notificacoes = db.prepare(
    `SELECT * FROM notificacoes ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`
  ).all(...params, limite, offset);

  return { notificacoes, total };
}

/**
 * Conta notificações não lidas de um usuário
 */
function contarNaoLidas(usuarioId) {
  const db = getDb();
  const resultado = db.prepare(
    'SELECT COUNT(*) as total FROM notificacoes WHERE usuario_id = ? AND lida = 0'
  ).get(usuarioId);
  return resultado.total;
}

/**
 * Marca uma notificação como lida
 */
function marcarComoLida(notificacaoId, usuarioId) {
  const db = getDb();
  db.prepare(
    'UPDATE notificacoes SET lida = 1 WHERE id = ? AND usuario_id = ?'
  ).run(notificacaoId, usuarioId);
}

/**
 * Marca todas as notificações do usuário como lidas
 */
function marcarTodasComoLidas(usuarioId) {
  const db = getDb();
  db.prepare('UPDATE notificacoes SET lida = 1 WHERE usuario_id = ?').run(usuarioId);
}

module.exports = {
  setSocketIO,
  criarNotificacao,
  buscarNotificacoes,
  contarNaoLidas,
  marcarComoLida,
  marcarTodasComoLidas,
};
