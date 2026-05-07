/**
 * Serviço de Tokens JWT
 * Gera, verifica e gerencia access tokens e refresh tokens
 */

const jwt = require('jsonwebtoken');
const { getDb } = require('../database/db');

const JWT_SECRET          = process.env.JWT_SECRET          || 'dev_secret_troque_em_producao';
const JWT_EXPIRES_IN      = process.env.JWT_EXPIRES_IN      || '8h';
const JWT_REFRESH_SECRET  = process.env.JWT_REFRESH_SECRET  || 'dev_refresh_troque_em_producao';
const JWT_REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

/**
 * Gera um Access Token JWT para o usuário autenticado.
 * Inclui `roles` (array com role principal + roles_extra) para multi-perfil.
 */
function gerarAccessToken(usuario) {
  // roles_extra pode ser string JSON ou array já parseado
  let extras = [];
  try {
    extras = typeof usuario.roles_extra === 'string'
      ? JSON.parse(usuario.roles_extra || '[]')
      : (Array.isArray(usuario.roles_extra) ? usuario.roles_extra : []);
  } catch { extras = []; }

  // Array de todos os roles: principal + adicionais (sem duplicatas)
  const roles = [usuario.role, ...extras.filter((r) => r !== usuario.role)];

  const payload = {
    sub:   usuario.id,
    nome:  usuario.nome,
    email: usuario.email,
    role:  usuario.role,   // role principal (display, dashboard)
    roles,                  // todos os roles (usado para autorização)
    setor: usuario.setor,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Gera um Refresh Token e salva no banco
 */
function gerarRefreshToken(usuarioId) {
  const db = getDb();

  const token = require('crypto').randomBytes(64).toString('hex');
  const expiraEm = new Date();
  expiraEm.setDate(expiraEm.getDate() + 7); // 7 dias

  db.prepare(`
    INSERT INTO refresh_tokens (usuario_id, token, expira_em)
    VALUES (?, ?, ?)
  `).run(usuarioId, token, expiraEm.toISOString());

  return token;
}

/**
 * Verifica e decodifica um Access Token
 * Lança erro se inválido ou expirado
 */
function verificarAccessToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

/**
 * Valida um Refresh Token no banco e retorna o usuário associado
 */
function validarRefreshToken(token) {
  const db = getDb();

  const registro = db.prepare(`
    SELECT rt.*, u.id as usuario_id, u.nome, u.email,
           u.role, u.roles_extra, u.setor, u.ativo
    FROM refresh_tokens rt
    JOIN users u ON rt.usuario_id = u.id
    WHERE rt.token = ? AND rt.revogado = 0
  `).get(token);

  if (!registro) return null;

  // Verifica se expirou
  if (new Date(registro.expira_em) < new Date()) {
    revogarRefreshToken(token);
    return null;
  }

  if (!registro.ativo) return null;

  return registro;
}

/**
 * Revoga um Refresh Token específico (logout)
 */
function revogarRefreshToken(token) {
  const db = getDb();
  db.prepare('UPDATE refresh_tokens SET revogado = 1 WHERE token = ?').run(token);
}

/**
 * Revoga todos os Refresh Tokens de um usuário (logout de todos dispositivos)
 */
function revogarTodosTokensDoUsuario(usuarioId) {
  const db = getDb();
  db.prepare('UPDATE refresh_tokens SET revogado = 1 WHERE usuario_id = ?').run(usuarioId);
}

module.exports = {
  gerarAccessToken,
  gerarRefreshToken,
  verificarAccessToken,
  validarRefreshToken,
  revogarRefreshToken,
  revogarTodosTokensDoUsuario,
};
