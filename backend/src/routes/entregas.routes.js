/**
 * Rotas de Entregas
 * Base: /api/entregas
 */

const express  = require('express');
const { body } = require('express-validator');
const router   = express.Router();

const ctrl           = require('../controllers/entregas.controller');
const autenticar     = require('../middleware/autenticar');
const { autorizar }  = require('../middleware/autorizar');
const validar        = require('../middleware/validar');
const { uploadFoto, wrapMulter } = require('../middleware/upload');

const ROLES_DESPACHO = ['gerencia', 'adm', 'super_admin'];

router.use(autenticar);

// GET /api/entregas/motorista — entregas do motorista logado
router.get('/motorista', autorizar('motorista'), ctrl.listarMotorista);

// GET /api/entregas/historico — histórico de entregas do motorista
router.get('/historico', autorizar('motorista'), ctrl.historico);

// POST /api/entregas — gerente cria entrega e envia rota ao motorista
router.post('/',
  autorizar(...ROLES_DESPACHO),
  [
    body('agendamento_id').notEmpty().withMessage('ID do agendamento obrigatório.'),
    body('motorista_id').notEmpty().withMessage('ID do motorista obrigatório.'),
  ],
  validar,
  ctrl.criar
);

// PATCH /api/entregas/:id/confirmar — motorista confirma entrega
router.patch('/:id/confirmar',
  autorizar('motorista'),
  wrapMulter(uploadFoto.single('foto_comprovante')),
  ctrl.confirmar
);

module.exports = router;
