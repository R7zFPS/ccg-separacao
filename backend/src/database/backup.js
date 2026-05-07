/**
 * Script de Backup do Banco de Dados SQLite
 * Copia o separacao.db para separacao.db.bak.YYYY-MM-DD
 *
 * Uso:
 *   npm run backup
 *
 * Para agendar diariamente (Linux/Mac):
 *   crontab -e
 *   0 2 * * * cd /caminho/do/projeto/backend && npm run backup >> logs/backup.log 2>&1
 *
 * Para agendar diariamente (Windows — Task Scheduler):
 *   Crie uma tarefa que execute: node src/database/backup.js
 */

require('dotenv').config();
const fs   = require('fs');
const path = require('path');

const DB_PATH  = process.env.DATABASE_PATH || './src/database/separacao.db';
const dbAbsoluto = path.resolve(DB_PATH);

if (!fs.existsSync(dbAbsoluto)) {
  console.error(`❌ Banco não encontrado: ${dbAbsoluto}`);
  process.exit(1);
}

// Cria pasta de backups se não existir
const backupDir = path.join(path.dirname(dbAbsoluto), 'backups');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

// Nome do arquivo de backup: separacao.db.bak.2025-01-30
const hoje     = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
const destino  = path.join(backupDir, `separacao.db.bak.${hoje}`);

try {
  fs.copyFileSync(dbAbsoluto, destino);
  const tamanho = (fs.statSync(destino).size / 1024).toFixed(1);
  console.log(`✅ Backup criado: ${destino} (${tamanho} KB)`);

  // Manter apenas os últimos 30 backups
  const arquivos = fs.readdirSync(backupDir)
    .filter(f => f.startsWith('separacao.db.bak.'))
    .sort()
    .reverse();

  if (arquivos.length > 30) {
    const paraRemover = arquivos.slice(30);
    paraRemover.forEach(f => {
      fs.unlinkSync(path.join(backupDir, f));
      console.log(`🗑️  Backup antigo removido: ${f}`);
    });
  }
} catch (err) {
  console.error(`❌ Falha no backup: ${err.message}`);
  process.exit(1);
}
