/**
 * Rotas de Agendamentos
 * Base: /api/agendamentos
 */

const express  = require('express');
const { body } = require('express-validator');
const router   = express.Router();

const ctrl           = require('../controllers/agendamentos.controller');
const autenticar     = require('../middleware/autenticar');
const { autorizar }  = require('../middleware/autorizar');
const validar        = require('../middleware/validar');
const { uploadPDF, wrapMulter } = require('../middleware/upload');

const ROLES_AGENDA  = ['gerencia', 'adm', 'super_admin'];
const TODOS_LEITURA = [
  'super_admin','adm','gerencia',
  'vendedor','estoquista','almoxarife','fiscal','motorista',
];

router.use(autenticar);

// GET /api/agendamentos
router.get('/', autorizar(...TODOS_LEITURA), ctrl.listar);

// GET /api/agendamentos/por-solicitacao/:solicitacaoId
router.get('/por-solicitacao/:solicitacaoId', autorizar(...TODOS_LEITURA), ctrl.buscarPorSolicitacao);

// POST /api/agendamentos — cria agendamento + muda status para agendamento_realizado
router.post('/',
  autorizar(...ROLES_AGENDA),
  wrapMulter(uploadPDF.fields([
    { name: 'nota_fiscal',    maxCount: 1 },
    { name: 'boleto',         maxCount: 1 },
    { name: 'certificado',    maxCount: 1 },
    { name: 'proposta',       maxCount: 1 },
    { name: 'ordem_de_compra',maxCount: 1 },
  ])),
  [
    body('solicitacao_id').notEmpty().withMessage('ID da solicitação obrigatório.'),
    body('data_entrega').notEmpty().withMessage('Data de entrega obrigatória.'),
    body('endereco_completo').trim().notEmpty().withMessage('Endereço de entrega obrigatório.'),
  ],
  validar,
  ctrl.criar
);

module.exports = router;
