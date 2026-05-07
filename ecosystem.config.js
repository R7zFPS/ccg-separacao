/**
 * PM2 Ecosystem — Sistema de Separação de Estoque
 * Casa das Correntes Guanabara
 *
 * Uso:
 *   pm2 start ecosystem.config.js
 *   pm2 save             ← persiste entre reinicializações
 *   pm2 startup          ← inicia automaticamente no boot
 *   pm2 logs separacao   ← ver logs ao vivo
 *   pm2 restart separacao
 *   pm2 stop separacao
 */

module.exports = {
  apps: [
    {
      name: 'separacao-ccg',
      script: './backend/src/index.js',
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',

      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
        // ⚠️  Edite as variáveis abaixo para produção:
        JWT_SECRET: 'TROQUE_ESTE_VALOR_EM_PRODUCAO',
        JWT_REFRESH_SECRET: 'TROQUE_ESTE_VALOR_REFRESH_EM_PRODUCAO',
        JWT_EXPIRES_IN: '8h',
        JWT_REFRESH_EXPIRES_IN: '7d',
        DATABASE_PATH: './backend/src/database/separacao.db',
        UPLOAD_DIR: './backend/src/uploads',
        FRONTEND_URL: '*',  // mesmo servidor = aceita qualquer origem local
      },
    },
  ],
};
