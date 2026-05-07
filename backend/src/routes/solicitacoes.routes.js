/**
 * Rotas de Solicitações
 * Base: /api/solicitacoes
 */

const express  = require('express');
const { body } = require('express-validator');
const router   = express.Router();

const ctrl           = require('../controllers/solicitacoes.controller');
const autenticar     = require('../middleware/autenticar');
const { autorizar }  = require('../middleware/autorizar');
const validar        = require('../middleware/validar');
const { uploadPDF, uploadMisto, wrapMulter } = require('../middleware/upload');

const TODOS_ROLES = [
  'super_admin','gerencia','vendedor','estoquista','almoxarife',
  'adm','motorista','fiscal',
];
const ROLES_ADMIN    = ['super_admin', 'adm', 'gerencia'];
const ROLES_SEPARACAO = ['estoquista', 'almoxarife'];
const STATUS_VALIDOS = [
  'aberta','em_conferencia','aguardando_atribuicao','aguardando_nf','em_emissao_nf',
  'em_separacao','material_separado','entrega_solicitada','proposta_recusada',
  'agendamento_realizado','rota_enviada','entregue',
];
const PRIORIDADES_VALIDAS = [
  'material_separado','em_separacao','aguardando_material',
  'prioridade_maxima','para_hoje','oceanpact',
];

router.use(autenticar);

// GET /api/solicitacoes/estatisticas — contadores (antes do /:id)
router.get('/estatisticas',
  autorizar(...TODOS_ROLES),
  ctrl.estatisticas
);

// GET /api/solicitacoes/ranking-estoquistas — ranking por tempo médio de separação
router.get('/ranking-estoquistas',
  autorizar('super_admin', 'gerencia', 'adm'),
  ctrl.rankingEstoquistas
);

// GET /api/solicitacoes/evolucao — criações e entregas por dia
router.get('/evolucao',
  autorizar('super_admin', 'gerencia', 'adm'),
  ctrl.evolucao
);

// GET /api/solicitacoes/minhas-estatisticas — stats pessoais do usuário autenticado
router.get('/minhas-estatisticas',
  autorizar(...TODOS_ROLES),
  ctrl.minhasEstatisticas
);

// GET /api/solicitacoes
router.get('/',
  autorizar(...TODOS_ROLES),
  ctrl.listar
);

// GET /api/solicitacoes/:id
router.get('/:id',
  autorizar(...TODOS_ROLES),
  ctrl.buscarPorId
);

// POST /api/solicitacoes — vendedor e admins criam
router.post('/',
  autorizar('vendedor', ...ROLES_ADMIN),
  wrapMulter(uploadPDF.single('documento')),
  [
    body('numero_proposta').trim().notEmpty().withMessage('Número da proposta obrigatório.'),
    body('tipo_documento')
      .isIn(['orcamento','nota_fiscal']).withMessage('Tipo de documento inválido.'),
    body('setor_destino')
      .isIn(['loja','galpao','ambos']).withMessage('Local do material inválido.'),
  ],
  validar,
  ctrl.criar
);

// PATCH /api/solicitacoes/:id/status
// Aceita dois campos opcionais: foto_separacao (imagem) e nota_fiscal (PDF)
router.patch('/:id/status',
  autorizar(...TODOS_ROLES),
  wrapMulter(uploadMisto.fields([
    { name: 'foto_separacao', maxCount: 1 },
    { name: 'nota_fiscal',    maxCount: 1 },
  ])),
  [
    body('status').isIn(STATUS_VALIDOS).withMessage('Status inválido.'),
  ],
  validar,
  ctrl.atualizarStatus
);

// PATCH /api/solicitacoes/:id/prioridade — admins
router.patch('/:id/prioridade',
  autorizar(...ROLES_ADMIN),
  [
    body('prioridade')
      .optional({ checkFalsy: true })
      .isIn(PRIORIDADES_VALIDAS).withMessage('Prioridade inválida.'),
  ],
  validar,
  ctrl.atualizarPrioridade
);

// PATCH /api/solicitacoes/:id/atribuir — admins
router.patch('/:id/atribuir',
  autorizar(...ROLES_ADMIN),
  [
    body('estoquista_id').notEmpty().withMessage('ID do estoquista obrigatório.'),
  ],
  validar,
  ctrl.atribuirEstoquista
);

// DELETE /api/solicitacoes/:id — vendedor cancela a própria (se aberta); super_admin pode sempre
router.delete('/:id',
  autorizar('vendedor', 'super_admin'),
  ctrl.cancelar
);

module.exports = router;
