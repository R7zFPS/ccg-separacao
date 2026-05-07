/**
 * Middleware de Autorização — RBAC
 *
 * Uso por role:       autorizar('adm', 'logistica')
 * Uso por permissão:  checkPermission('emitir_nota_fiscal')
 *
 * super_admin bypassa TODAS as verificações.
 * Deve ser usado APÓS o middleware autenticar()
 */

const { temPermissao } = require('../config/permissions');

/**
 * Autoriza por role — suporta múltiplos perfis por usuário.
 * Verifica se QUALQUER um dos roles do usuário está na lista permitida.
 * super_admin bypassa tudo.
 */
function autorizar(...rolesPermitidas) {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({
        sucesso: false,
        mensagem: 'Usuário não autenticado.',
      });
    }

    // super_admin bypassa tudo
    const rolesDoUsuario = req.usuario.roles || [req.usuario.role];
    if (rolesDoUsuario.includes('super_admin')) {
      return next();
    }

    // Verifica se ao menos um dos roles do usuário é permitido
    const temAcesso = rolesPermitidas.some((r) => rolesDoUsuario.includes(r));
    if (!temAcesso) {
      return res.status(403).json({
        sucesso: false,
        mensagem: `Acesso negado. Nenhum dos seus perfis está autorizado para esta ação.`,
      });
    }

    next();
  };
}

/**
 * Autoriza por permissão granular.
 * Verifica no mapa ROLE_PERMISSIONS se QUALQUER role do usuário possui a permissão.
 * Suporta multi-perfil: verifica role principal + roles extras.
 */
function checkPermission(permissao) {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({ sucesso: false, mensagem: 'Não autenticado.' });
    }
    const rolesDoUsuario = req.usuario.roles || [req.usuario.role];
    const temAcesso = rolesDoUsuario.some((r) => temPermissao(r, permissao));
    if (temAcesso) return next();
    return res.status(403).json({
      sucesso: false,
      mensagem: `Permissão insuficiente. Requer: "${permissao}".`,
    });
  };
}

/**
 * Garante que o usuário gerencia só pode editar campos básicos (não role/roles_extra).
 * super_admin pode alterar tudo.
 * Deve ser usado JUNTO com autorizar('super_admin','gerencia').
 */
function restringirEdicaoGerencia(req, res, next) {
  if (!req.usuario) {
    return res.status(401).json({ sucesso: false, mensagem: 'Não autenticado.' });
  }
  // super_admin pode alterar qualquer campo
  if (req.usuario.role === 'super_admin') return next();

  // gerencia: remove campos que não pode alterar
  const camposProibidos = ['role', 'roles_extra', 'ativo'];
  camposProibidos.forEach((campo) => {
    if (req.body[campo] !== undefined) {
      delete req.body[campo];
    }
  });
  next();
}

/**
 * Garante que apenas super_admin acessa a rota.
 */
function apenasAdmin(req, res, next) {
  if (!req.usuario) {
    return res.status(401).json({ sucesso: false, mensagem: 'Não autenticado.' });
  }
  if (req.usuario.role !== 'super_admin') {
    return res.status(403).json({
      sucesso: false,
      mensagem: 'Apenas o administrador total pode executar esta ação.',
    });
  }
  next();
}

/**
 * Verifica setor — estoquistas só veem seu setor.
 * super_admin e almoxarife têm acesso irrestrito.
 */
function verificarSetor(setorRequerido) {
  return (req, res, next) => {
    const { role, setor } = req.usuario;

    if (role === 'super_admin' || role === 'almoxarife' || role === 'adm' || setor === 'ambos') {
      return next();
    }

    if (setor !== setorRequerido) {
      return res.status(403).json({
        sucesso: false,
        mensagem: `Você só tem acesso ao setor: ${setor}.`,
      });
    }

    next();
  };
}

module.exports = { autorizar, checkPermission, apenasAdmin, verificarSetor, restringirEdicaoGerencia };
