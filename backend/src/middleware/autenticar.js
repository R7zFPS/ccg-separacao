/**
 * Middleware de Autenticação
 * Verifica o Bearer Token JWT em todas as rotas protegidas
 */

const { verificarAccessToken } = require('../services/token.service');

function autenticar(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      sucesso: false,
      mensagem: 'Token de autenticação não fornecido.',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = verificarAccessToken(token);
    // `roles` = array com TODOS os perfis do usuário (principal + extras)
    // Tokens antigos (sem `roles`) fazem fallback para [role]
    const roles = Array.isArray(payload.roles) ? payload.roles : [payload.role];
    req.usuario = {
      id:    payload.sub,
      nome:  payload.nome,
      email: payload.email,
      role:  payload.role,   // perfil principal
      roles,                  // todos os perfis (para autorização)
      setor: payload.setor,
    };
    next();
  } catch (erro) {
    if (erro.name === 'TokenExpiredError') {
      return res.status(401).json({
        sucesso: false,
        mensagem: 'Token expirado. Faça login novamente.',
        codigo: 'TOKEN_EXPIRADO',
      });
    }
    return res.status(401).json({
      sucesso: false,
      mensagem: 'Token inválido.',
    });
  }
}

module.exports = autenticar;
