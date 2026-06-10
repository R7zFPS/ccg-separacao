/**
 * Controller de Autenticação
 * Login por usuario_login + senha (email opcional)
 * Suporte a primeiro_acesso: obriga troca de senha no primeiro login
 */

const bcrypt = require('bcryptjs');
const { getDb } = require('../database/db');
const {
  gerarAccessToken,
  gerarRefreshToken,
  validarRefreshToken,
  revogarRefreshToken,
} = require('../services/token.service');

// =====================================================
// POST /api/auth/login
// =====================================================
async function login(req, res) {
  try {
    const { usuario_login, senha } = req.body;
    const db = getDb();

    // Busca por usuario_login (ou email como fallback)
    const usuario = db.prepare(`
      SELECT id, nome, usuario_login, email, senha_hash,
             role, roles_extra, setor, ativo, primeiro_acesso, foto_perfil
      FROM users
      WHERE usuario_login = ? OR (email IS NOT NULL AND email = ?)
    `).get(usuario_login.trim().toLowerCase(), usuario_login.trim().toLowerCase());

    const erroGenerico = 'Usuário ou senha incorretos.';

    if (!usuario) {
      return res.status(401).json({ sucesso: false, mensagem: erroGenerico });
    }

    if (!usuario.ativo) {
      return res.status(403).json({
        sucesso: false,
        mensagem: 'Sua conta foi desativada. Fale com o administrador.',
      });
    }

    const senhaCorreta = await bcrypt.compare(senha, usuario.senha_hash);
    if (!senhaCorreta) {
      return res.status(401).json({ sucesso: false, mensagem: erroGenerico });
    }

    const accessToken  = gerarAccessToken(usuario);
    const refreshToken = gerarRefreshToken(usuario.id);

    return res.status(200).json({
      sucesso: true,
      mensagem: `Bem-vindo, ${usuario.nome}!`,
      dados: {
        usuario: {
          id:             usuario.id,
          nome:           usuario.nome,
          usuario_login:  usuario.usuario_login,
          email:          usuario.email,
          role:           usuario.role,
          roles_extra:    JSON.parse(usuario.roles_extra || '[]'),
          setor:          usuario.setor,
          primeiro_acesso: !!usuario.primeiro_acesso,
          foto_perfil:    usuario.foto_perfil || null,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (erro) {
    console.error('[AUTH] Erro no login:', erro);
    return res.status(500).json({ sucesso: false, mensagem: 'Erro interno no servidor.' });
  }
}

// =====================================================
// POST /api/auth/trocar-senha-primeiro-acesso
// Obrigatório quando primeiro_acesso = 1
// =====================================================
async function trocarSenhaPrimeiroAcesso(req, res) {
  try {
    const db = getDb();
    const { novaSenha } = req.body;
    const id = req.usuario.id;

    const usuario = db.prepare('SELECT primeiro_acesso FROM users WHERE id = ?').get(id);
    if (!usuario) {
      return res.status(404).json({ sucesso: false, mensagem: 'Usuário não encontrado.' });
    }

    const novaSenhaHash = await bcrypt.hash(novaSenha, 10);

    db.prepare(`
      UPDATE users
      SET senha_hash = ?, primeiro_acesso = 0, updated_at = datetime('now','localtime')
      WHERE id = ?
    `).run(novaSenhaHash, id);

    return res.status(200).json({
      sucesso: true,
      mensagem: 'Senha definida com sucesso! Você já pode usar o sistema.',
    });
  } catch (erro) {
    console.error('[AUTH] Erro ao trocar senha:', erro);
    return res.status(500).json({ sucesso: false, mensagem: 'Erro interno no servidor.' });
  }
}

// =====================================================
// POST /api/auth/refresh
// =====================================================
function refresh(req, res) {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ sucesso: false, mensagem: 'Refresh token não fornecido.' });
    }

    const registro = validarRefreshToken(refreshToken);
    if (!registro) {
      return res.status(401).json({
        sucesso: false,
        mensagem: 'Sessão expirada. Faça login novamente.',
        codigo: 'REFRESH_INVALIDO',
      });
    }

    revogarRefreshToken(refreshToken);

    const usuario = {
      id:             registro.usuario_id,
      nome:           registro.nome,
      usuario_login:  registro.usuario_login,
      email:          registro.email,
      role:           registro.role,
      // CORREÇÃO: roles_extra precisa ir junto, senão o novo access token
      // perde os perfis adicionais (multi-perfil) após o refresh
      roles_extra:    registro.roles_extra,
      setor:          registro.setor,
      primeiro_acesso: registro.primeiro_acesso,
    };

    const novoAccessToken  = gerarAccessToken(usuario);
    const novoRefreshToken = gerarRefreshToken(usuario.id);

    return res.status(200).json({
      sucesso: true,
      dados: { accessToken: novoAccessToken, refreshToken: novoRefreshToken },
    });
  } catch (erro) {
    console.error('[AUTH] Erro no refresh:', erro);
    return res.status(500).json({ sucesso: false, mensagem: 'Erro interno no servidor.' });
  }
}

// =====================================================
// POST /api/auth/logout
// =====================================================
function logout(req, res) {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) revogarRefreshToken(refreshToken);
    return res.status(200).json({ sucesso: true, mensagem: 'Logout realizado com sucesso.' });
  } catch (erro) {
    console.error('[AUTH] Erro no logout:', erro);
    return res.status(500).json({ sucesso: false, mensagem: 'Erro interno no servidor.' });
  }
}

// =====================================================
// GET /api/auth/perfil
// =====================================================
function perfil(req, res) {
  try {
    const db = getDb();
    const usuario = db.prepare(`
      SELECT id, nome, usuario_login, email, role, roles_extra, setor,
             primeiro_acesso, ativo, created_at, foto_perfil
      FROM users WHERE id = ?
    `).get(req.usuario.id);

    if (!usuario) {
      return res.status(404).json({ sucesso: false, mensagem: 'Usuário não encontrado.' });
    }

    return res.status(200).json({ sucesso: true, dados: { usuario } });
  } catch (erro) {
    console.error('[AUTH] Erro ao buscar perfil:', erro);
    return res.status(500).json({ sucesso: false, mensagem: 'Erro interno no servidor.' });
  }
}

module.exports = { login, refresh, logout, perfil, trocarSenhaPrimeiroAcesso };
