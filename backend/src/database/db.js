/**
 * Conexão com banco de dados SQLite
 * Usa o módulo nativo node:sqlite (disponível no Node.js v22+)
 * Sem necessidade de compilação — funciona em qualquer plataforma
 */

const { DatabaseSync } = require('node:sqlite');
const path = require('path');
require('dotenv').config();

const DATABASE_PATH = process.env.DATABASE_PATH || './src/database/separacao.db';
const dbPath = path.resolve(DATABASE_PATH);

let db;

function getDb() {
  if (!db) {
    db = new DatabaseSync(dbPath);

    // WAL mode: melhor performance em leituras concorrentes
    db.exec('PRAGMA journal_mode = WAL');
    // Ativa checagem de chaves estrangeiras
    db.exec('PRAGMA foreign_keys = ON');

    // Shim de compatibilidade com better-sqlite3:
    // node:sqlite não tem .transaction() — adicionamos aqui para não precisar
    // alterar todos os controllers que usam db.transaction(() => {...})()
    db.transaction = function (fn) {
      return function (...args) {
        db.exec('BEGIN');
        try {
          const result = fn(...args);
          db.exec('COMMIT');
          return result;
        } catch (e) {
          db.exec('ROLLBACK');
          throw e;
        }
      };
    };

    console.log(`✅ Banco de dados conectado: ${dbPath}`);
  }
  return db;
}

module.exports = { getDb };
