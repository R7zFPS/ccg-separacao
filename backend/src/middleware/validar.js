/**
 * Middleware de Validação de Inputs
 * Usa express-validator para validar e sanitizar entradas
 */

const { validationResult } = require('express-validator');

/**
 * Centraliza a verificação dos resultados de validação
 * Deve ser usado após os validators do express-validator
 */
function validar(req, res, next) {
  const erros = validationResult(req);

  if (!erros.isEmpty()) {
    return res.status(422).json({
      sucesso: false,
      mensagem: 'Dados inválidos na requisição.',
      erros: erros.array().map((e) => ({
        campo: e.path,
        mensagem: e.msg,
      })),
    });
  }

  next();
}

module.exports = validar;
