/**
 * Rotas de Propostas de Entrega
 * Base: /api/propostas
 */

const express  = require('express');
const { body } = require('express-validator');
const router   = express.Router();

const ctrl          = require('../controllers/propostas.controller');
const autenticar    = require('../middleware/autenticar');
const { autorizar } = require('../middleware/autorizar');
const validar       = require('../middleware/validar');

const ROLES_VENDEDOR = ['vendedor', 'gerencia', 'adm', 'super_admin'];
const ROLES_GERENTE  = ['gerencia', 'adm', 'super_admin'];
const TODOS_LEITURA  = [
  'super_admin','adm','gerencia',
  'vendedor','estoquista','almoxarife','fiscal','motorista',
];

router.use(autenticar);

// POST /api/propostas — vendedor propõe data
router.post('/',
  autorizar(...ROLES_VENDEDOR),
  [
    body('solicitacao_id').notEmpty().withMessage('ID da solicitação obrigatório.'),
    body('data_sugerida').notEmpty().withMessage('Data sugerida é obrigatória.'),
  ],
  validar,
  ctrl.criar
);

// GET /api/propostas/solicitacao/:solicitacaoId
router.get('/solicitacao/:solicitacaoId',
  autorizar(...TODOS_LEITURA),
  ctrl.buscarPorSolicitacao
);

// PATCH /api/propostas/:id/responder — gerente aprova ou recusa
router.patch('/:id/responder',
  autorizar(...ROLES_GERENTE),
  [
    body('decisao').isIn(['aprovada','recusada']).withMessage('Decisão inválida.'),
  ],
  validar,
  ctrl.responder
);

module.exports = router;
