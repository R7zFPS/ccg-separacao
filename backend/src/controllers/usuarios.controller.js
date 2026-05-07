/**
 * Controller de Usuários
 * CRUD completo — acessível apenas para super_admin
 * Suporte a múltiplos perfis por usuário via campo roles_extra (JSON)
 */

const bcrypt = require('bcryptjs');
const { getDb } = require('../database/db');
const { ROLES_VALIDOS } = require('../config/permissions');
const { uploadParaNuvem } = require('../middleware/upload');

const SALT_ROUNDS  = 10;
const SENHA_PADRAO = 'Correntes2589@';

// Apenas super_admin gerencia usuários (verificação extra de segurança)
const ROLES_ADMIN = ['super_admin'];

/**
 * Normaliza roles_extra: garante array válido, sem duplicatas com role principal
 */
function normalizarRolesExtra(rolesExtra, rolePrincipal) {
  let extras = [];
  if (typeof rolesExtra === 'string') {
    try { extras = JSON.parse(rolesExtra); } catch { extras = []; }
  } else if (Array.isArray(rolesExtra)) {
    extras = rolesExtra;
  }
  // Remove inválidos e o próprio role principal (evita redundância)
  extras = extras.filter((r) => ROLES_VALIDOS.includes(r) && r !== rolePrincipal);
  // Remove duplicatas
  return [...new Set(extras)];
}

// =====================================================
// GET /api/usuarios — Listar todos os usuários
// =====================================================
function listar(req, res) {
  try {
    const db = getDb();
    const { role, setor, ativo } = req.query;

    let query = `
      SELECT id, nome, usuario_login, email, role, roles_extra, setor, ativo,
             primeiro_acesso, created_at, foto_perfil
      FROM users WHERE 1=1
    `;
    const params = [];

    if (role)  { query += ' AND (role = ? OR roles_extra LIKE ?)'; params.push(role, `%"${role}"%`); }
    if (setor) { query += ' AND setor = ?'; params.push(setor); }
    if (ativo !== undefined) {
      query += ' AND ativo = ?';
      params.push(ativo === 'true' ? 1 : 0);
    }

    query += ' ORDER BY nome ASC';

    const usuarios = db.prepare(query).all(...params);

    // Parseia roles_extra JSON para array em cada usuário
    const usuariosFormatados = usuarios.map((u) => ({
      ...u,
      roles_extra: JSON.parse(u.roles_extra || '[]'),
    }));

    return res.status(200).json({
      sucesso: true,
      dados: { usuarios: usuariosFormatados, total: usuariosFormatados.length },
    });
  } catch (erro) {
    console.error('[USUARIOS] Erro ao listar:', erro);
    return res.status(500).json({ sucesso: false, mensagem: 'Erro interno no servidor.' });
  }
}

// =====================================================
// GET /api/usuarios/:id — Buscar por ID
// =====================================================
function buscarPorId(req, res) {
  try {
    const db = getDb();
    const usuario = db.prepare(`
      SELECT id, nome, usuario_login, email, role, roles_extra, setor, ativo,
             primeiro_acesso, created_at, updated_at, foto_perfil
      FROM users WHERE id = ?
    `).get(req.params.id);

    if (!usuario) {
      return res.status(404).json({ sucesso: false, mensagem: 'Usuário não encontrado.' });
    }

    return res.status(200).json({
      sucesso: true,
      dados: {
        usuario: {
          ...usuario,
          roles_extra: JSON.parse(usuario.roles_extra || '[]'),
        },
      },
    });
  } catch (erro) {
    console.error('[USUARIOS] Erro ao buscar por ID:', erro);
    return res.status(500).json({ sucesso: false, mensagem: 'Erro interno no servidor.' });
  }
}

// =====================================================
// POST /api/usuarios — Criar novo usuário
// =====================================================
async function criar(req, res) {
  try {
    const db = getDb();
    const { nome, usuario_login, email, senha, role, roles_extra, setor } = req.body;

    if (!usuario_login || !usuario_login.trim()) {
      return res.status(400).json({ sucesso: false, mensagem: 'O campo usuario_login é obrigatório.' });
    }

    const loginNormalizado = usuario_login.trim().toLowerCase();
    const roleFinal = role || 'vendedor';

    // Valida role principal
    if (!ROLES_VALIDOS.includes(roleFinal)) {
      return res.status(400).json({ sucesso: false, mensagem: `Role inválido: "${roleFinal}".` });
    }

    // Verifica login duplicado
    const loginExistente = db.prepare('SELECT id FROM users WHERE usuario_login = ?').get(loginNormalizado);
    if (loginExistente) {
      return res.status(409).json({ sucesso: false, mensagem: 'Já existe um usuário com este nome de login.' });
    }

    // Verifica email duplicado (se informado)
    const emailFinal = email && email.trim() ? email.toLowerCase().trim() : null;
    if (emailFinal) {
      const emailExistente = db.prepare('SELECT id FROM users WHERE email = ?').get(emailFinal);
      if (emailExistente) {
        return res.status(409).json({ sucesso: false, mensagem: 'Já existe um usuário com este email.' });
      }
    }

    const extras = normalizarRolesExtra(roles_extra, roleFinal);
    const senhaFinal = senha && senha.trim() ? senha : SENHA_PADRAO;
    const senha_hash = await bcrypt.hash(senhaFinal, SALT_ROUNDS);

    const resultado = db.prepare(`
      INSERT INTO users (nome, usuario_login, email, senha_hash, role, roles_extra, setor, primeiro_acesso)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `).run(
      nome.trim(),
      loginNormalizado,
      emailFinal,
      senha_hash,
      roleFinal,
      JSON.stringify(extras),
      setor || 'ambos'
    );

    const novoUsuario = db.prepare(`
      SELECT id, nome, usuario_login, email, role, roles_extra, setor, ativo, primeiro_acesso, created_at, foto_perfil
      FROM users WHERE rowid = ?
    `).get(Number(resultado.lastInsertRowid));

    return res.status(201).json({
      sucesso: true,
      mensagem: 'Usuário criado com sucesso.',
      dados: {
        usuario: { ...novoUsuario, roles_extra: JSON.parse(novoUsuario.roles_extra || '[]') },
      },
    });
  } catch (erro) {
    console.error('[USUARIOS] Erro ao criar:', erro);
    return res.status(500).json({ sucesso: false, mensagem: 'Erro interno no servidor.' });
  }
}

// =====================================================
// PUT /api/usuarios/:id — Atualizar usuário
// =====================================================
async function atualizar(req, res) {
  try {
    const db = getDb();
    const { id } = req.params;
    const { nome, usuario_login, email, senha, role, roles_extra, setor, ativo } = req.body;

    const usuarioAtual = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    if (!usuarioAtual) {
      return res.status(404).json({ sucesso: false, mensagem: 'Usuário não encontrado.' });
    }

    const roleFinal = role || usuarioAtual.role;

    // Impede que o admin remova o próprio perfil de super_admin
    if (id === req.usuario.id && role && role !== 'super_admin') {
      return res.status(403).json({
        sucesso: false,
        mensagem: 'Você não pode remover o seu próprio perfil de administrador total.',
      });
    }

    // Valida role principal
    if (role && !ROLES_VALIDOS.includes(role)) {
      return res.status(400).json({ sucesso: false, mensagem: `Role inválido: "${role}".` });
    }

    // Verifica login duplicado (se alterado)
    if (usuario_login && usuario_login.trim()) {
      const loginNorm = usuario_login.trim().toLowerCase();
      const loginExistente = db.prepare('SELECT id FROM users WHERE usuario_login = ? AND id != ?').get(loginNorm, id);
      if (loginExistente) {
        return res.status(409).json({ sucesso: false, mensagem: 'Já existe um usuário com este nome de login.' });
      }
    }

    // Verifica email duplicado (se alterado)
    const emailFinal = email !== undefined
      ? (email && email.trim() ? email.toLowerCase().trim() : null)
      : usuarioAtual.email;
    if (emailFinal && email !== undefined) {
      const emailExistente = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(emailFinal, id);
      if (emailExistente) {
        return res.status(409).json({ sucesso: false, mensagem: 'Já existe um usuário com este email.' });
      }
    }

    let senha_hash = usuarioAtual.senha_hash;
    if (senha && senha.trim()) {
      senha_hash = await bcrypt.hash(senha, SALT_ROUNDS);
    }

    // roles_extra: usa o novo valor se enviado, caso contrário mantém o atual
    const extrasFinais = roles_extra !== undefined
      ? normalizarRolesExtra(roles_extra, roleFinal)
      : JSON.parse(usuarioAtual.roles_extra || '[]').filter((r) => r !== roleFinal);

    db.prepare(`
      UPDATE users SET
        nome          = ?,
        usuario_login = ?,
        email         = ?,
        senha_hash    = ?,
        role          = ?,
        roles_extra   = ?,
        setor         = ?,
        ativo         = ?,
        updated_at    = datetime('now','localtime')
      WHERE id = ?
    `).run(
      nome          || usuarioAtual.nome,
      usuario_login ? usuario_login.trim().toLowerCase() : usuarioAtual.usuario_login,
      emailFinal,
      senha_hash,
      roleFinal,
      JSON.stringify(extrasFinais),
      setor         || usuarioAtual.setor,
      ativo !== undefined ? (ativo ? 1 : 0) : usuarioAtual.ativo,
      id
    );

    const atualizado = db.prepare(`
      SELECT id, nome, usuario_login, email, role, roles_extra, setor, ativo, updated_at, foto_perfil
      FROM users WHERE id = ?
    `).get(id);

    return res.status(200).json({
      sucesso: true,
      mensagem: 'Usuário atualizado com sucesso.',
      dados: {
        usuario: { ...atualizado, roles_extra: JSON.parse(atualizado.roles_extra || '[]') },
      },
    });
  } catch (erro) {
    console.error('[USUARIOS] Erro ao atualizar:', erro);
    return res.status(500).json({ sucesso: false, mensagem: 'Erro interno no servidor.' });
  }
}

// =====================================================
// DELETE /api/usuarios/:id — Desativar usuário (soft delete)
// =====================================================
function desativar(req, res) {
  try {
    const db = getDb();
    const { id } = req.params;

    if (id === req.usuario.id) {
      return res.status(403).json({ sucesso: false, mensagem: 'Você não pode desativar sua própria conta.' });
    }

    const usuario = db.prepare('SELECT id, ativo FROM users WHERE id = ?').get(id);
    if (!usuario) {
      return res.status(404).json({ sucesso: false, mensagem: 'Usuário não encontrado.' });
    }

    db.prepare(`UPDATE users SET ativo = 0, updated_at = datetime('now','localtime') WHERE id = ?`).run(id);

    return res.status(200).json({ sucesso: true, mensagem: 'Usuário desativado com sucesso.' });
  } catch (erro) {
    console.error('[USUARIOS] Erro ao desativar:', erro);
    return res.status(500).json({ sucesso: false, mensagem: 'Erro interno no servidor.' });
  }
}

// =====================================================
// PATCH /api/usuarios/minha-senha — Troca de senha pelo próprio usuário
// =====================================================
async function alterarSenha(req, res) {
  try {
    const db = getDb();
    const { senhaAtual, novaSenha } = req.body;
    const id = req.usuario.id;

    const usuario = db.prepare('SELECT senha_hash FROM users WHERE id = ?').get(id);
    const senhaCorreta = await bcrypt.compare(senhaAtual, usuario.senha_hash);
    if (!senhaCorreta) {
      return res.status(401).json({ sucesso: false, mensagem: 'Senha atual incorreta.' });
    }

    const novaSenhaHash = await bcrypt.hash(novaSenha, SALT_ROUNDS);
    db.prepare(`UPDATE users SET senha_hash = ?, updated_at = datetime('now','localtime') WHERE id = ?`).run(novaSenhaHash, id);

    return res.status(200).json({ sucesso: true, mensagem: 'Senha alterada com sucesso.' });
  } catch (erro) {
    console.error('[USUARIOS] Erro ao alterar senha:', erro);
    return res.status(500).json({ sucesso: false, mensagem: 'Erro interno no servidor.' });
  }
}

// =====================================================
// PUT /api/usuarios/minha-foto — Upload de foto de perfil pelo próprio usuário
// =====================================================
async function uploadFotoPerfil(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ sucesso: false, mensagem: 'Nenhuma imagem enviada.' });
    }

    const db = getDb();
    const id = req.usuario.id;

    // Faz upload para Cloudinary (ou disco local em dev)
    const urlFoto = await uploadParaNuvem(req.file, 'perfil');

    db.prepare(`UPDATE users SET foto_perfil = ?, updated_at = datetime('now','localtime') WHERE id = ?`)
      .run(urlFoto, id);

    return res.status(200).json({
      sucesso: true,
      mensagem: 'Foto de perfil atualizada.',
      dados: { foto_perfil: urlFoto },
    });
  } catch (erro) {
    console.error('[USUARIOS] Erro ao salvar foto de perfil:', erro);
    return res.status(500).json({ sucesso: false, mensagem: 'Erro interno no servidor.' });
  }
}

module.exports = { listar, buscarPorId, criar, atualizar, desativar, alterarSenha, uploadFotoPerfil };
