/**
 * Ponto de entrada do servidor — Casa das Correntes Guanabara
 * App de Demanda de Separação de Estoque
 *
 * Inicia: npm run dev (desenvolvimento)
 *         npm start  (produção)
 */

require('dotenv').config();

const express     = require('express');
const http        = require('http');
const { Server }  = require('socket.io');
const cors        = require('cors');
const morgan      = require('morgan');
const path        = require('path');
const rateLimit   = require('express-rate-limit');
const helmet      = require('helmet');
const compression = require('compression');

// ─── Banco de dados ─────────────────────────────────
const { executarMigrations } = require('./database/migrations');
const { executarSeeds }      = require('./database/seeds');

// ─── Serviços ────────────────────────────────────────
const notificacaoService = require('./services/notificacao.service');

// ─── Rotas ───────────────────────────────────────────
const authRoutes         = require('./routes/auth.routes');
const usuariosRoutes     = require('./routes/usuarios.routes');
const notificacoesRoutes  = require('./routes/notificacoes.routes');
const solicitacoesRoutes  = require('./routes/solicitacoes.routes');
const agendamentosRoutes  = require('./routes/agendamentos.routes');
const entregasRoutes      = require('./routes/entregas.routes');
const propostasRoutes     = require('./routes/propostas.routes');
const auditRoutes         = require('./routes/audit.routes');

// ─── Configuração ────────────────────────────────────
const PORT         = process.env.PORT         || 3001;
const NODE_ENV     = process.env.NODE_ENV     || 'development';

// FRONTEND_URL: URL do frontend Vercel em produção, ou localhost em dev
// Aceita múltiplas origens separadas por vírgula (ex: "https://app.vercel.app,https://app-preview.vercel.app")
const FRONTEND_URL_RAW = process.env.FRONTEND_URL || (NODE_ENV === 'production' ? '*' : 'http://localhost:5173');
const FRONTEND_URLS    = FRONTEND_URL_RAW === '*'
  ? true
  : FRONTEND_URL_RAW.split(',').map((u) => u.trim());
const FRONTEND_URL     = FRONTEND_URL_RAW; // mantido para compatibilidade

// Caminho do dist do frontend (não usado quando frontend está no Vercel)
const FRONTEND_DIST = path.resolve(__dirname, '../../frontend/dist');

// ─── App + HTTP Server ───────────────────────────────
const app    = express();
const server = http.createServer(app);

// ─── Socket.io ──────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: FRONTEND_URLS,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Injeta o io no serviço de notificações
notificacaoService.setSocketIO(io);

// Mapa de usuários conectados: userId → socketId
const usuariosConectados = new Map();

io.on('connection', (socket) => {
  console.log(`🔌 Socket conectado: ${socket.id}`);

  // Cliente envia seu userId após conectar (após login)
  socket.on('autenticar', (usuarioId) => {
    socket.join(`usuario:${usuarioId}`);
    usuariosConectados.set(usuarioId, socket.id);
    console.log(`   👤 Usuário ${usuarioId} autenticado no socket`);
  });

  socket.on('disconnect', () => {
    // Remove da lista de conectados
    for (const [userId, sid] of usuariosConectados.entries()) {
      if (sid === socket.id) {
        usuariosConectados.delete(userId);
        break;
      }
    }
    console.log(`🔌 Socket desconectado: ${socket.id}`);
  });
});

// Torna io disponível nos controllers via req.app.get('io')
app.set('io', io);

// ─── Rate Limiting ───────────────────────────────────
// Protege rotas de autenticação contra brute-force
const limiterAuth = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 minutos
  max: 20,                      // máx. 20 tentativas por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    sucesso: false,
    mensagem: 'Muitas tentativas. Tente novamente em 15 minutos.',
  },
  skip: () => process.env.NODE_ENV === 'development',
});

// Limiter geral para toda a API (proteção básica)
const limiterGeral = rateLimit({
  windowMs: 60 * 1000,         // 1 minuto
  max: 200,                     // máx. 200 req/min por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    sucesso: false,
    mensagem: 'Muitas requisições. Tente novamente em breve.',
  },
  skip: () => process.env.NODE_ENV === 'development',
});

// ─── Middlewares globais ─────────────────────────────
// Helmet: headers de segurança HTTP (XSS, clickjacking, sniffing, etc.)
// Desativa contentSecurityPolicy em dev pois o Vite usa scripts inline
app.use(helmet({
  contentSecurityPolicy: NODE_ENV === 'production' ? {
    directives: {
      defaultSrc:     ["'self'"],
      scriptSrc:      ["'self'"],
      styleSrc:       ["'self'", "'unsafe-inline'"],
      imgSrc:         ["'self'", 'data:', 'blob:', 'https://res.cloudinary.com'],
      connectSrc:     ["'self'", 'wss:', 'ws:'],
      fontSrc:        ["'self'"],
      objectSrc:      ["'none'"],
      upgradeInsecureRequests: [],
    },
  } : false,
  crossOriginEmbedderPolicy: false,
}));

// Compression: gzip/brotli para todas as respostas >= 1kb
app.use(compression());

app.use(cors({
  origin: FRONTEND_URLS,
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log de requisições em desenvolvimento
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Serve arquivos de upload localmente (MVP)
// Em produção: usar CDN (Supabase Storage / Cloudinary)
app.use('/uploads', express.static(path.resolve(process.env.UPLOAD_DIR || './src/uploads')));

// ─── Rota de health check ────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    ambiente: process.env.NODE_ENV || 'development',
  });
});

// ─── Rotas da API ────────────────────────────────────
app.use('/api',              limiterGeral);
app.use('/api/auth',         limiterAuth, authRoutes);
app.use('/api/usuarios',     usuariosRoutes);
app.use('/api/notificacoes',  notificacoesRoutes);
app.use('/api/solicitacoes',  solicitacoesRoutes);
app.use('/api/agendamentos',  agendamentosRoutes);
app.use('/api/entregas',      entregasRoutes);
app.use('/api/propostas',     propostasRoutes);
app.use('/api/audit',        auditRoutes);

// ─── Frontend SPA (produção) ─────────────────────────
// Em produção, servimos o build do React pelo mesmo processo.
// Qualquer rota não-API retorna o index.html (SPA routing).
if (NODE_ENV === 'production') {
  const fs = require('fs');
  if (fs.existsSync(FRONTEND_DIST)) {
    app.use(express.static(FRONTEND_DIST));
    // Fallback: qualquer rota não-API retorna o index.html do SPA
    app.get(/^(?!\/api|\/uploads).*$/, (req, res) => {
      res.sendFile(path.join(FRONTEND_DIST, 'index.html'));
    });
    console.log(`  📦 Frontend servido de: ${FRONTEND_DIST}`);
  } else {
    console.warn(`  ⚠️  Frontend dist não encontrado em: ${FRONTEND_DIST}`);
    console.warn('     Execute: cd ../frontend && npm run build');
  }
}

// ─── Handler de rotas não encontradas ───────────────
app.use((req, res) => {
  res.status(404).json({
    sucesso: false,
    mensagem: `Rota não encontrada: ${req.method} ${req.originalUrl}`,
  });
});

// ─── Handler de erros globais ────────────────────────
app.use((err, req, res, _next) => {
  console.error('❌ Erro não tratado:', err);
  res.status(500).json({
    sucesso: false,
    mensagem: process.env.NODE_ENV === 'production'
      ? 'Erro interno no servidor.'
      : err.message,
  });
});

// ─── Inicialização ───────────────────────────────────
async function iniciar() {
  try {
    // Garante que as tabelas existem e dados iniciais estão presentes
    executarMigrations();
    await executarSeeds();

    server.listen(PORT, '0.0.0.0', () => {
      console.log('\n═══════════════════════════════════════════════════');
      console.log('  🏪 Casa das Correntes Guanabara — Separação API');
      console.log('═══════════════════════════════════════════════════');
      console.log(`  🚀 Servidor rodando na porta: ${PORT}`);
      if (NODE_ENV === 'production') {
        console.log(`  🌐 Acesse no navegador:       http://SEU_IP:${PORT}`);
        console.log('     (veja seu IP em: ipconfig [Windows] ou ifconfig [Mac/Linux])');
      } else {
        console.log(`  🌐 Frontend dev:              ${FRONTEND_URL}`);
      }
      console.log(`  📁 Ambiente:                  ${NODE_ENV}`);
      console.log('  📖 Health check: GET /api/health');
      console.log('═══════════════════════════════════════════════════\n');
    });
  } catch (erro) {
    console.error('❌ Falha ao iniciar o servidor:', erro);
    process.exit(1);
  }
}

iniciar();

module.exports = { app, server, io };
