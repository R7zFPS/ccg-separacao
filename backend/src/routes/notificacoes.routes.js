/**
 * Rotas de Notificações
 * Base: /api/notificacoes
 */

const express = require('express');
const router  = express.Router();

const autenticar = require('../middleware/autenticar');
const {
  buscarNotificacoes,
  contarNaoLidas,
  marcarComoLida,
  marcarTodasComoLidas,
} = require('../services/notificacao.service');

router.use(autenticar);

// GET /api/notificacoes — Lista notificações do usuário logado (suporta pagina, lida, limite)
router.get('/', (req, res) => {
  const limite    = Math.min(parseInt(req.query.limite) || 30, 100);
  const pagina    = parseInt(req.query.pagina) || 1;
  const naoLidas  = req.query.nao_lidas === 'true'; // retrocompat
  const lida      = req.query.lida != null ? req.query.lida : null;

  const resultado    = buscarNotificacoes(req.usuario.id, { limite, pagina, apenasNaoLidas: naoLidas, lida });
  const totalNaoLidas = contarNaoLidas(req.usuario.id);

  return res.json({
    sucesso: true,
    dados: {
      notificacoes: resultado.notificacoes,
      total: resultado.total,
      totalNaoLidas,
    },
  });
});

// PATCH /api/notificacoes/:id/lida — Marca uma como lida
router.patch('/:id/lida', (req, res) => {
  marcarComoLida(req.params.id, req.usuario.id);
  return res.json({ sucesso: true, mensagem: 'Notificação marcada como lida.' });
});

// PATCH /api/notificacoes/marcar-todas-lidas — Marca todas como lidas
router.patch('/marcar-todas-lidas', (req, res) => {
  marcarTodasComoLidas(req.usuario.id);
  return res.json({ sucesso: true, mensagem: 'Todas as notificações foram marcadas como lidas.' });
});

module.exports = router;
