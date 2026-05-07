/**
 * Rotas de Audit Log
 * Base: /api/audit
 * Acesso: super_admin e gerencia
 */

const express = require('express');
const router  = express.Router();

const ctrl          = require('../controllers/audit.controller');
const autenticar    = require('../middleware/autenticar');
const { autorizar } = require('../middleware/autorizar');

// Acesso para super_admin e gerência
router.use(autenticar, autorizar('super_admin', 'gerencia'));

// GET /api/audit — lista paginada com filtros
router.get('/', ctrl.listar);

// GET /api/audit/resumo — contadores e atividade dos últimos 7 dias
router.get('/resumo', ctrl.resumo);

module.exports = router;
