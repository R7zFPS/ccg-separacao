/**
 * Migrations do banco de dados SQLite
 * Executa: npm run migrate
 */

require('dotenv').config();
const { getDb } = require('./db');

function executarMigrations() {
  const db = getDb();
  console.log('🚀 Iniciando migrations...\n');

  // =====================================================
  // TABELA: users
  // Perfis: super_admin, vendedor, estoquista, almoxarife,
  //         adm, gerencia, motorista, fiscal
  // Login por usuario_login + senha (email opcional)
  // primeiro_acesso=1 força troca de senha no primeiro login
  // roles_extra: JSON array de perfis adicionais
  // =====================================================
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      nome            TEXT NOT NULL,
      usuario_login   TEXT NOT NULL UNIQUE,
      email           TEXT UNIQUE,
      senha_hash      TEXT NOT NULL,
      role            TEXT NOT NULL CHECK(role IN (
                        'super_admin',
                        'vendedor',
                        'estoquista',
                        'almoxarife',
                        'adm',
                        'gerencia',
                        'motorista',
                        'fiscal'
                      )),
      setor           TEXT NOT NULL DEFAULT 'ambos' CHECK(setor IN ('loja','galpao','ambos')),
      roles_extra     TEXT NOT NULL DEFAULT '[]',
      primeiro_acesso INTEGER NOT NULL DEFAULT 1,
      ativo           INTEGER NOT NULL DEFAULT 1,
      created_at      TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      updated_at      TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );
  `);
  console.log('✅ Tabela: users');

  // =====================================================
  // TABELA: solicitacoes
  // Status inclui proposta_recusada (loop de proposta de entrega)
  // Timestamps de separação para controle de desempenho
  // =====================================================
  db.exec(`
    CREATE TABLE IF NOT EXISTS solicitacoes (
      id                          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      numero_proposta             TEXT NOT NULL UNIQUE,
      numero_orcamento            TEXT,
      tipo_documento              TEXT NOT NULL CHECK(tipo_documento IN ('orcamento','nota_fiscal')),
      url_documento               TEXT NOT NULL,
      nome_arquivo                TEXT,
      setor_destino               TEXT NOT NULL CHECK(setor_destino IN ('loja','galpao','ambos')),
      prioridade                  TEXT DEFAULT NULL CHECK(prioridade IS NULL OR prioridade IN (
                                    'material_separado',
                                    'em_separacao',
                                    'aguardando_material',
                                    'prioridade_maxima',
                                    'para_hoje',
                                    'oceanpact'
                                  )),
      vendedor_id                 TEXT NOT NULL REFERENCES users(id),
      estoquista_id               TEXT REFERENCES users(id),
      status                      TEXT NOT NULL DEFAULT 'aberta' CHECK(status IN (
                                    'aberta',
                                    'em_conferencia',
                                    'aguardando_atribuicao',
                                    'aguardando_nf',
                                    'em_emissao_nf',
                                    'em_separacao',
                                    'material_separado',
                                    'entrega_solicitada',
                                    'proposta_recusada',
                                    'agendamento_realizado',
                                    'rota_enviada',
                                    'entregue'
                                  )),
      url_foto_separacao          TEXT,
      timestamp_inicio_separacao  TEXT,
      timestamp_fim_separacao     TEXT,
      tempo_separacao_segundos    INTEGER,
      observacoes                 TEXT,
      alerta_enviado              INTEGER NOT NULL DEFAULT 0,
      created_at                  TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      updated_at                  TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );
  `);
  console.log('✅ Tabela: solicitacoes');

  // =====================================================
  // TABELA: agendamentos
  // =====================================================
  db.exec(`
    CREATE TABLE IF NOT EXISTS agendamentos (
      id                    TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      solicitacao_id        TEXT NOT NULL REFERENCES solicitacoes(id),
      data_entrega          TEXT NOT NULL,
      endereco_completo     TEXT NOT NULL,
      url_nota_fiscal_pdf   TEXT,
      url_boleto_pdf        TEXT,
      url_certificado_pdf   TEXT,
      url_proposta_pdf      TEXT,
      url_ordem_compra_pdf  TEXT,
      confirmado_matheus    INTEGER NOT NULL DEFAULT 0,
      observacoes           TEXT,
      created_at            TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      updated_at            TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );
  `);
  console.log('✅ Tabela: agendamentos');

  // =====================================================
  // TABELA: propostas_entrega
  // Vendedor propõe data → gerência confirma ou recusa
  // recusada → status volta para proposta_recusada
  // =====================================================
  db.exec(`
    CREATE TABLE IF NOT EXISTS propostas_entrega (
      id             TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      solicitacao_id TEXT NOT NULL REFERENCES solicitacoes(id),
      vendedor_id    TEXT NOT NULL REFERENCES users(id),
      data_sugerida  TEXT NOT NULL,
      endereco       TEXT,
      nome_recebedor TEXT,
      telefone       TEXT,
      observacoes    TEXT,
      status         TEXT NOT NULL DEFAULT 'pendente'
                       CHECK(status IN ('pendente','aprovada','recusada')),
      resposta       TEXT,
      respondido_por TEXT REFERENCES users(id),
      respondido_em  TEXT,
      created_at     TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );
  `);
  console.log('✅ Tabela: propostas_entrega');

  // =====================================================
  // TABELA: entregas
  // =====================================================
  db.exec(`
    CREATE TABLE IF NOT EXISTS entregas (
      id                    TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      agendamento_id        TEXT NOT NULL REFERENCES agendamentos(id),
      motorista_id          TEXT NOT NULL REFERENCES users(id),
      status                TEXT NOT NULL DEFAULT 'pendente' CHECK(status IN ('pendente','em_rota','entregue')),
      url_foto_comprovante  TEXT,
      entregue_em           TEXT,
      observacoes           TEXT,
      created_at            TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      updated_at            TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );
  `);
  console.log('✅ Tabela: entregas');

  // =====================================================
  // TABELA: notificacoes
  // =====================================================
  db.exec(`
    CREATE TABLE IF NOT EXISTS notificacoes (
      id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      usuario_id      TEXT NOT NULL REFERENCES users(id),
      solicitacao_id  TEXT REFERENCES solicitacoes(id),
      titulo          TEXT NOT NULL,
      mensagem        TEXT NOT NULL,
      tipo            TEXT NOT NULL DEFAULT 'info' CHECK(tipo IN ('info','sucesso','alerta','erro')),
      lida            INTEGER NOT NULL DEFAULT 0,
      created_at      TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );
  `);
  console.log('✅ Tabela: notificacoes');

  // =====================================================
  // TABELA: historico_status
  // =====================================================
  db.exec(`
    CREATE TABLE IF NOT EXISTS historico_status (
      id               TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      solicitacao_id   TEXT NOT NULL REFERENCES solicitacoes(id),
      status_anterior  TEXT,
      status_novo      TEXT NOT NULL,
      alterado_por     TEXT NOT NULL REFERENCES users(id),
      observacao       TEXT,
      created_at       TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );
  `);
  console.log('✅ Tabela: historico_status');

  // =====================================================
  // TABELA: historico_acoes
  // Audit log completo de ações do sistema
  // =====================================================
  db.exec(`
    CREATE TABLE IF NOT EXISTS historico_acoes (
      id             TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      solicitacao_id TEXT REFERENCES solicitacoes(id),
      usuario_id     TEXT NOT NULL REFERENCES users(id),
      acao           TEXT NOT NULL,
      detalhe        TEXT,
      ip             TEXT,
      created_at     TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );
  `);
  console.log('✅ Tabela: historico_acoes');

  // =====================================================
  // TABELA: refresh_tokens
  // =====================================================
  db.exec(`
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      usuario_id  TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token       TEXT NOT NULL UNIQUE,
      expira_em   TEXT NOT NULL,
      revogado    INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );
  `);
  console.log('✅ Tabela: refresh_tokens');

  // ─────────────────────────────────────────────────────
  // MIGRATIONS INCREMENTAIS
  // Aplicadas em bancos existentes (ALTER TABLE + recriar)
  // SQLite não suporta IF NOT EXISTS em ALTER TABLE →
  // usa try/catch para colunas simples, transactions para
  // mudanças de CHECK constraint (requer recriar tabela)
  // ─────────────────────────────────────────────────────

  // ── 1. Colunas incrementais simples (ALTER TABLE) ─────
  const colunasIncrementais = [
    // agendamentos
    'ALTER TABLE agendamentos ADD COLUMN url_proposta_pdf     TEXT',
    'ALTER TABLE agendamentos ADD COLUMN url_ordem_compra_pdf TEXT',
    // users: suporte a múltiplos perfis (legado sem roles_extra)
    `ALTER TABLE users ADD COLUMN roles_extra TEXT NOT NULL DEFAULT '[]'`,
    // propostas_entrega: dados de entrega
    'ALTER TABLE propostas_entrega ADD COLUMN endereco       TEXT',
    'ALTER TABLE propostas_entrega ADD COLUMN nome_recebedor TEXT',
    'ALTER TABLE propostas_entrega ADD COLUMN telefone       TEXT',
    // solicitacoes: timestamps de separação
    'ALTER TABLE solicitacoes ADD COLUMN timestamp_inicio_separacao TEXT',
    'ALTER TABLE solicitacoes ADD COLUMN timestamp_fim_separacao    TEXT',
    'ALTER TABLE solicitacoes ADD COLUMN tempo_separacao_segundos   INTEGER',
    // users: foto de perfil
    'ALTER TABLE users ADD COLUMN foto_perfil TEXT',
  ];
  colunasIncrementais.forEach((sql) => {
    try { db.exec(sql); } catch { /* coluna já existe */ }
  });
  console.log('✅ Colunas incrementais: roles_extra, timestamps separação, propostas endereço, foto_perfil');

  // ── 2. Migration: users — logistica → gerencia ────────
  // SQLite não permite ALTER TABLE para CHECK constraints.
  // Recria a tabela copiando dados e convertendo role.
  try {
    const info = db.prepare(
      "SELECT sql FROM sqlite_master WHERE type='table' AND name='users'"
    ).get();
    if (info?.sql?.includes("'logistica'")) {
      console.log('🔄 Migration: users.role logistica → gerencia ...');
      const migrar = db.transaction(() => {
        db.exec(`
          CREATE TABLE users_v2 (
            id              TEXT PRIMARY KEY,
            nome            TEXT NOT NULL,
            usuario_login   TEXT NOT NULL UNIQUE,
            email           TEXT UNIQUE,
            senha_hash      TEXT NOT NULL,
            role            TEXT NOT NULL CHECK(role IN (
                              'super_admin','vendedor','estoquista','almoxarife',
                              'adm','gerencia','motorista','fiscal'
                            )),
            setor           TEXT NOT NULL DEFAULT 'ambos' CHECK(setor IN ('loja','galpao','ambos')),
            roles_extra     TEXT NOT NULL DEFAULT '[]',
            primeiro_acesso INTEGER NOT NULL DEFAULT 1,
            ativo           INTEGER NOT NULL DEFAULT 1,
            created_at      TEXT NOT NULL DEFAULT (datetime('now','localtime')),
            updated_at      TEXT NOT NULL DEFAULT (datetime('now','localtime'))
          )
        `);
        db.exec(`
          INSERT INTO users_v2
            (id, nome, usuario_login, email, senha_hash, role, setor,
             roles_extra, primeiro_acesso, ativo, created_at, updated_at)
          SELECT
            id, nome, usuario_login, email, senha_hash,
            CASE WHEN role = 'logistica' THEN 'gerencia' ELSE role END,
            setor,
            COALESCE(roles_extra, '[]'),
            primeiro_acesso, ativo, created_at, updated_at
          FROM users
        `);
        db.exec('DROP TABLE users');
        db.exec('ALTER TABLE users_v2 RENAME TO users');
        // Atualiza referências a 'logistica' dentro de roles_extra (JSON)
        db.prepare(
          `UPDATE users
             SET roles_extra = replace(roles_extra, '"logistica"', '"gerencia"')
           WHERE roles_extra LIKE '%logistica%'`
        ).run();
      });
      migrar();
      db.exec('CREATE INDEX IF NOT EXISTS idx_users_login ON users(usuario_login)');
      console.log('✅ Migration users: logistica → gerencia concluída');
    }
  } catch (e) {
    console.error('❌ Migration users (logistica→gerencia):', e.message);
  }

  // ── 3. Migration: solicitacoes — adiciona proposta_recusada ao CHECK ──
  try {
    const info = db.prepare(
      "SELECT sql FROM sqlite_master WHERE type='table' AND name='solicitacoes'"
    ).get();
    const precisaMigrar = info?.sql && !info.sql.includes("'proposta_recusada'");
    if (precisaMigrar) {
      console.log('🔄 Migration: solicitacoes.status + proposta_recusada ...');
      const migrar = db.transaction(() => {
        db.exec(`
          CREATE TABLE solicitacoes_v2 (
            id                          TEXT PRIMARY KEY,
            numero_proposta             TEXT NOT NULL UNIQUE,
            numero_orcamento            TEXT,
            tipo_documento              TEXT NOT NULL CHECK(tipo_documento IN ('orcamento','nota_fiscal')),
            url_documento               TEXT NOT NULL,
            nome_arquivo                TEXT,
            setor_destino               TEXT NOT NULL CHECK(setor_destino IN ('loja','galpao','ambos')),
            prioridade                  TEXT DEFAULT NULL CHECK(prioridade IS NULL OR prioridade IN (
                                          'material_separado','em_separacao','aguardando_material',
                                          'prioridade_maxima','para_hoje','oceanpact'
                                        )),
            vendedor_id                 TEXT NOT NULL REFERENCES users(id),
            estoquista_id               TEXT REFERENCES users(id),
            status                      TEXT NOT NULL DEFAULT 'aberta' CHECK(status IN (
                                          'aberta','em_conferencia','aguardando_atribuicao',
                                          'aguardando_nf','em_emissao_nf','em_separacao',
                                          'material_separado','entrega_solicitada',
                                          'proposta_recusada','agendamento_realizado',
                                          'rota_enviada','entregue'
                                        )),
            url_foto_separacao          TEXT,
            timestamp_inicio_separacao  TEXT,
            timestamp_fim_separacao     TEXT,
            tempo_separacao_segundos    INTEGER,
            observacoes                 TEXT,
            alerta_enviado              INTEGER NOT NULL DEFAULT 0,
            created_at                  TEXT NOT NULL DEFAULT (datetime('now','localtime')),
            updated_at                  TEXT NOT NULL DEFAULT (datetime('now','localtime'))
          )
        `);
        db.exec(`
          INSERT INTO solicitacoes_v2
            (id, numero_proposta, numero_orcamento, tipo_documento,
             url_documento, nome_arquivo, setor_destino, prioridade,
             vendedor_id, estoquista_id, status,
             url_foto_separacao,
             timestamp_inicio_separacao, timestamp_fim_separacao, tempo_separacao_segundos,
             observacoes, alerta_enviado, created_at, updated_at)
          SELECT
            id, numero_proposta, numero_orcamento, tipo_documento,
            url_documento, nome_arquivo, setor_destino, prioridade,
            vendedor_id, estoquista_id, status,
            url_foto_separacao,
            timestamp_inicio_separacao, timestamp_fim_separacao, tempo_separacao_segundos,
            observacoes, alerta_enviado, created_at, updated_at
          FROM solicitacoes
        `);
        db.exec('DROP TABLE solicitacoes');
        db.exec('ALTER TABLE solicitacoes_v2 RENAME TO solicitacoes');
      });
      migrar();
      // Recria índices de solicitacoes
      db.exec(`
        CREATE INDEX IF NOT EXISTS idx_solicitacoes_status     ON solicitacoes(status);
        CREATE INDEX IF NOT EXISTS idx_solicitacoes_prioridade ON solicitacoes(prioridade);
        CREATE INDEX IF NOT EXISTS idx_solicitacoes_vendedor   ON solicitacoes(vendedor_id);
        CREATE INDEX IF NOT EXISTS idx_solicitacoes_estoquista ON solicitacoes(estoquista_id);
        CREATE INDEX IF NOT EXISTS idx_solicitacoes_setor      ON solicitacoes(setor_destino);
      `);
      console.log('✅ Migration solicitacoes: proposta_recusada + timestamps concluída');
    }
  } catch (e) {
    console.error('❌ Migration solicitacoes (proposta_recusada):', e.message);
  }

  // ── 4. Migration: solicitacoes — adiciona url_nota_fiscal ───────────────
  try {
    const cols = db.prepare("PRAGMA table_info(solicitacoes)").all();
    const temColuna = cols.some((c) => c.name === 'url_nota_fiscal');
    if (!temColuna) {
      console.log('🔄 Migration: solicitacoes + url_nota_fiscal ...');
      db.exec('ALTER TABLE solicitacoes ADD COLUMN url_nota_fiscal TEXT');
      console.log('✅ Migration: url_nota_fiscal adicionada');
    }
  } catch (e) {
    console.error('❌ Migration solicitacoes (url_nota_fiscal):', e.message);
  }

  // =====================================================
  // ÍNDICES
  // =====================================================
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_login              ON users(usuario_login);
    CREATE INDEX IF NOT EXISTS idx_solicitacoes_status      ON solicitacoes(status);
    CREATE INDEX IF NOT EXISTS idx_solicitacoes_prioridade  ON solicitacoes(prioridade);
    CREATE INDEX IF NOT EXISTS idx_solicitacoes_vendedor    ON solicitacoes(vendedor_id);
    CREATE INDEX IF NOT EXISTS idx_solicitacoes_estoquista  ON solicitacoes(estoquista_id);
    CREATE INDEX IF NOT EXISTS idx_solicitacoes_setor       ON solicitacoes(setor_destino);
    CREATE INDEX IF NOT EXISTS idx_notificacoes_usuario     ON notificacoes(usuario_id, lida);
    CREATE INDEX IF NOT EXISTS idx_refresh_tokens_usuario   ON refresh_tokens(usuario_id);
    CREATE INDEX IF NOT EXISTS idx_historico_solicitacao    ON historico_status(solicitacao_id);
    CREATE INDEX IF NOT EXISTS idx_historico_acoes_solic    ON historico_acoes(solicitacao_id);
    CREATE INDEX IF NOT EXISTS idx_historico_acoes_usuario  ON historico_acoes(usuario_id);
  `);
  console.log('✅ Índices criados');

  console.log('\n✅ Migrations concluídas com sucesso!');
}

if (require.main === module) {
  executarMigrations();
  process.exit(0);
}

module.exports = { executarMigrations };
