/**
 * Rotas de Autenticação
 * Base: /api/auth
 */

const express  = require('express');
const { body } = require('express-validator');
const router   = express.Router();

const authController = require('../controllers/auth.controller');
const autenticar     = require('../middleware/autenticar');
const validar        = require('../middleware/validar');

// POST /api/auth/login  — login por usuario_login + senha
router.post('/login',
  [
    body('usuario_login')
      .trim()
      .notEmpty().withMessage('Informe o nome de usuário.'),
    body('senha')
      .notEmpty().withMessage('A senha é obrigatória.')
      .isLength({ min: 6 }).withMessage('A senha deve ter pelo menos 6 caracteres.'),
  ],
  validar,
  authController.login
);

// POST /api/auth/trocar-senha-primeiro-acesso
router.post('/trocar-senha-primeiro-acesso',
  autenticar,
  [
    body('novaSenha')
      .isLength({ min: 8 }).withMessage('A senha deve ter pelo menos 8 caracteres.')
      .matches(/[A-Z]/).withMessage('Deve ter ao menos uma letra maiúscula.')
      .matches(/[0-9]/).withMessage('Deve ter ao menos um número.'),
  ],
  validar,
  authController.trocarSenhaPrimeiroAcesso
);

// POST /api/auth/refresh
router.post('/refresh',
  [body('refreshToken').notEmpty().withMessage('O refresh token é obrigatório.')],
  validar,
  authController.refresh
);

// POST /api/auth/logout
router.post('/logout', authController.logout);

// GET /api/auth/perfil
router.get('/perfil', autenticar, authController.perfil);

module.exports = router;
