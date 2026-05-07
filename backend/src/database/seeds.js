/**
 * Seeds — Usuários do sistema Casa das Correntes Guanabara
 * Executa: npm run seed  (ou automático via npm run setup)
 *
 * Senha padrão de primeiro acesso: Correntes2589@
 * primeiro_acesso = 1 → sistema obriga troca de senha no login
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { getDb } = require('./db');

const SENHA_PADRAO = 'Correntes2589@';
const SALT_ROUNDS  = 10;

async function executarSeeds() {
  const db = getDb();
  console.log('🌱 Iniciando seeds...\n');

  const totalUsuarios = db.prepare('SELECT COUNT(*) as total FROM users').get();
  if (totalUsuarios.total > 0) {
    console.log('⚠️  Seeds já foram executados. Pulando...');
    console.log('   (Para resetar: delete separacao.db e rode npm run setup)\n');
    return;
  }

  // =====================================================
  // USUÁRIOS DO SISTEMA
  // =====================================================
  const usuarios = [

    // ── SUPER ADMIN ──────────────────────────────────────
    {
      id: 'usr-super-rodrigo',
      nome: 'Rodrigo',
      usuario_login: 'rodrigo',
      email: 'digo.mar7@gmail.com',
      role: 'super_admin',
      setor: 'ambos',
      primeiro_acesso: 0,   // já configurado
    },

    // ── ALMOXARIFE ───────────────────────────────────────
    {
      id: 'usr-almox-vinicius',
      nome: 'Vinícius',
      usuario_login: 'vinicius',
      email: null,
      role: 'almoxarife',
      setor: 'ambos',
      primeiro_acesso: 0,
    },

    // ── ADM (Administração) ──────────────────────────────
    {
      id: 'usr-adm-juliana',
      nome: 'Juliana',
      usuario_login: 'juliana',
      email: null,
      role: 'adm',
      setor: 'ambos',
      primeiro_acesso: 1,
    },
    {
      id: 'usr-adm-julio',
      nome: 'Julio',
      usuario_login: 'julio',
      email: null,
      role: 'adm',
      setor: 'ambos',
      primeiro_acesso: 0,
    },
    {
      id: 'usr-adm-caio',
      nome: 'Caio',
      usuario_login: 'caio',
      email: null,
      role: 'adm',
      setor: 'ambos',
      primeiro_acesso: 0,
    },

    // ── GERÊNCIA ─────────────────────────────────────────
    // Matheus: gerência completa (logística + fiscal + vendedor + adm)
    // NÃO tem acesso de super_admin — apenas editar usuários
    {
      id: 'usr-gerencia-matheus',
      nome: 'Matheus',
      usuario_login: 'matheus',
      email: 'matheus@casadascorrentes.com.br',
      role: 'gerencia',
      roles_extra: [],
      setor: 'ambos',
      primeiro_acesso: 0,
    },

    // ── FISCAL (Emissão de NF) ────────────────────────────
    {
      id: 'usr-fiscal-alana',
      nome: 'Alana',
      usuario_login: 'alana',
      email: null,
      role: 'fiscal',
      setor: 'ambos',
      primeiro_acesso: 0,
    },

    // ── MOTORISTA ────────────────────────────────────────
    {
      id: 'usr-motorista-antonio',
      nome: 'Antônio',
      usuario_login: 'antonio',
      email: null,
      role: 'motorista',
      setor: 'ambos',
      primeiro_acesso: 0,
    },

    // ── VENDEDORES ───────────────────────────────────────
    {
      id: 'usr-vendedor-alex',
      nome: 'Alex',
      usuario_login: 'alex',
      email: null,
      role: 'vendedor',
      setor: 'ambos',
      primeiro_acesso: 1,
    },
    {
      id: 'usr-vendedor-kleison',
      nome: 'Kleison',
      usuario_login: 'kleison',
      email: null,
      role: 'vendedor',
      setor: 'ambos',
      primeiro_acesso: 1,
    },
    {
      id: 'usr-vendedor-gavina',
      nome: 'Gavina',
      usuario_login: 'gavina',
      email: null,
      role: 'vendedor',
      setor: 'ambos',
      primeiro_acesso: 1,
    },

    // ── ESTOQUISTAS ──────────────────────────────────────
    {
      id: 'usr-estoquista-thiago',
      nome: 'Thiago',
      usuario_login: 'thiago',
      email: null,
      role: 'estoquista',
      setor: 'galpao',
      primeiro_acesso: 1,
    },
    {
      id: 'usr-estoquista-gabriel',
      nome: 'Gabriel',
      usuario_login: 'gabriel',
      email: null,
      role: 'estoquista',
      setor: 'galpao',
      primeiro_acesso: 1,
    },
    {
      id: 'usr-estoquista-wanderson',
      nome: 'Wanderson',
      usuario_login: 'wanderson',
      email: null,
      role: 'estoquista',
      setor: 'galpao',
      primeiro_acesso: 1,
    },
    {
      id: 'usr-estoquista-lucas',
      nome: 'Lucas',
      usuario_login: 'lucas',
      email: null,
      role: 'estoquista',
      setor: 'loja',
      primeiro_acesso: 1,
    },
    {
      id: 'usr-estoquista-mgentile',
      nome: 'M. Gentile',
      usuario_login: 'mgentile',
      email: null,
      role: 'estoquista',
      setor: 'loja',
      primeiro_acesso: 1,
    },
    {
      id: 'usr-estoquista-joao',
      nome: 'João',
      usuario_login: 'joao',
      email: null,
      role: 'estoquista',
      setor: 'loja',
      primeiro_acesso: 1,
    },
  ];

  db.exec('BEGIN');
  try {
    const stmt = db.prepare(`
      INSERT INTO users (id, nome, usuario_login, email, senha_hash, role, roles_extra, setor, primeiro_acesso)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const u of usuarios) {
      const senha_hash  = await bcrypt.hash(SENHA_PADRAO, SALT_ROUNDS);
      const roles_extra = JSON.stringify(Array.isArray(u.roles_extra) ? u.roles_extra : []);
      stmt.run(u.id, u.nome, u.usuario_login, u.email, senha_hash, u.role, roles_extra, u.setor, u.primeiro_acesso);
      console.log(`✅ ${u.role.padEnd(14)} → login: ${u.usuario_login.padEnd(14)} (${u.nome})`);
    }

    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }

  console.log('\n📋 Logins e Senha Padrão:');
  console.log('─'.repeat(50));
  console.log(`  Senha padrão: ${SENHA_PADRAO}`);
  console.log('  * primeiro_acesso=1 → troca obrigatória no 1º login');
  console.log('─'.repeat(50));
  console.log('\n✅ Seeds concluídos com sucesso!');
}

if (require.main === module) {
  executarSeeds()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Erro nos seeds:', err);
      process.exit(1);
    });
}

module.exports = { executarSeeds };
