/**
 * Rotas de Usuários
 * Base: /api/usuarios
 *
 * RBAC:
 * - GET  → super_admin, adm, gerencia, almoxarife
 * - POST → apenas super_admin
 * - PUT  → super_admin OU gerencia (pode editar, não criar/excluir)
 * - DELETE → apenas super_admin
 */

const express  = require('express');
const { body } = require('express-validator');
const router   = express.Router();

const usuariosController = require('../controllers/usuarios.controller');
const autenticar         = require('../middleware/autenticar');
const { autorizar, apenasAdmin, restringirEdicaoGerencia } = require('../middleware/autorizar');
const validar            = require('../middleware/validar');
const { ROLES_VALIDOS }  = require('../config/permissions');
const { uploadFoto, wrapMulter } = require('../middleware/upload');

const ROLES_LEITURA = ['super_admin', 'adm', 'gerencia', 'almoxarife'];
const ROLES_EDICAO  = ['super_admin', 'gerencia'];

router.use(autenticar);

// ─── Rotas com paths literais (devem vir ANTES de /:id) ──────
// PUT /api/usuarios/minha-foto
router.put('/minha-foto',
  wrapMulter(uploadFoto.single('foto')),
  usuariosController.uploadFotoPerfil
);

// PATCH /api/usuarios/minha-senha — qualquer autenticado pode trocar a própria senha
router.patch('/minha-senha',
  [
    body('senhaAtual').notEmpty().withMessage('Senha atual obrigatória.'),
    body('novaSenha')
      .isLength({ min: 8 }).withMessage('Mínimo 8 caracteres.')
      .matches(/[A-Z]/).withMessage('Deve conter ao menos uma maiúscula.')
      .matches(/[0-9]/).withMessage('Deve conter ao menos um número.'),
  ],
  validar,
  usuariosController.alterarSenha
);

// GET /api/usuarios
router.get('/', autorizar(...ROLES_LEITURA), usuariosController.listar);

// GET /api/usuarios/:id
router.get('/:id', autorizar(...ROLES_LEITURA), usuariosController.buscarPorId);

// POST /api/usuarios — somente super_admin
router.post('/',
  apenasAdmin,
  [
    body('nome').trim().notEmpty().withMessage('Nome obrigatório.'),
    body('usuario_login').trim().notEmpty()
      .matches(/^[a-zA-Z0-9._-]+$/).withMessage('Login inválido.'),
    body('email').optional({ checkFalsy: true }).isEmail().normalizeEmail(),
    body('senha').optional({ checkFalsy: true })
      .isLength({ min: 8 }).matches(/[A-Z]/).matches(/[0-9]/),
    body('role').isIn(ROLES_VALIDOS).withMessage('Perfil inválido.'),
    body('setor').optional().isIn(['loja','galpao','ambos']),
    // Perfis extras (multi-perfil): array de roles válidos, sem o role principal
    body('roles_extra')
      .optional()
      .isArray().withMessage('roles_extra deve ser um array.')
      .custom((arr) => {
        if (!Array.isArray(arr)) return true;
        const invalidos = arr.filter((r) => !ROLES_VALIDOS.includes(r));
        if (invalidos.length > 0) throw new Error(`Perfis inválidos: ${invalidos.join(', ')}`);
        return true;
      }),
  ],
  validar,
  usuariosController.criar
);

// PUT /api/usuarios/:id — super_admin ou gerencia
// gerencia pode editar dados básicos (nome, email, setor, senha), mas NÃO alterar roles
router.put('/:id',
  autorizar(...ROLES_EDICAO),
  restringirEdicaoGerencia,
  [
    body('usuario_login').optional({ checkFalsy: true }).matches(/^[a-zA-Z0-9._-]+$/),
    body('email').optional({ checkFalsy: true }).isEmail().normalizeEmail(),
    body('senha').optional({ checkFalsy: true })
      .isLength({ min: 8 }).matches(/[A-Z]/).matches(/[0-9]/),
    body('role').optional().isIn(ROLES_VALIDOS),
    body('setor').optional().isIn(['loja','galpao','ambos']),
    // Perfis extras (multi-perfil)
    body('roles_extra')
      .optional()
      .isArray().withMessage('roles_extra deve ser um array.')
      .custom((arr) => {
        if (!Array.isArray(arr)) return true;
        const invalidos = arr.filter((r) => !ROLES_VALIDOS.includes(r));
        if (invalidos.length > 0) throw new Error(`Perfis inválidos: ${invalidos.join(', ')}`);
        return true;
      }),
  ],
  validar,
  usuariosController.atualizar
);

// DELETE /api/usuarios/:id — somente super_admin
router.delete('/:id', apenasAdmin, usuariosController.desativar);

module.exports = router;
