/**
 * Contexto de Autenticação
 * Login por usuario_login + senha
 * Suporte a primeiro_acesso (troca de senha obrigatória)
 */

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authApi } from '../services/api';
import { conectarSocket, desconectarSocket } from '../services/socket';

const AuthContext = createContext(null);

/** Monta o array completo de roles do usuário: [role_principal, ...roles_extra] */
function buildRoles(usuario) {
  if (!usuario) return [];
  const extras = Array.isArray(usuario.roles_extra) ? usuario.roles_extra : [];
  return [usuario.role, ...extras.filter((r) => r !== usuario.role)];
}

/** Verifica se o usuário possui determinado role (principal ou extra) */
function temRole(usuario, role) {
  if (!usuario) return false;
  return buildRoles(usuario).includes(role);
}

export function AuthProvider({ children }) {
  const [usuario, setUsuario]       = useState(null);
  const [carregando, setCarregando] = useState(true);

  // Carrega sessão salva
  useEffect(() => {
    const usuarioSalvo    = localStorage.getItem('usuario');
    const accessTokenSalvo = localStorage.getItem('accessToken');

    if (usuarioSalvo && accessTokenSalvo) {
      try {
        const usr = JSON.parse(usuarioSalvo);
        setUsuario(usr);
        conectarSocket(usr.id);
      } catch {
        limparSessao();
      }
    }
    setCarregando(false);
  }, []);

  // Login por usuario_login + senha
  const login = useCallback(async (usuario_login, senha) => {
    const { data } = await authApi.login(usuario_login, senha);
    if (!data.sucesso) throw new Error(data.mensagem);

    const { usuario: usr, accessToken, refreshToken } = data.dados;

    localStorage.setItem('accessToken',  accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('usuario',      JSON.stringify(usr));

    setUsuario(usr);
    conectarSocket(usr.id);
    return usr;
  }, []);

  // Troca de senha no primeiro acesso
  const trocarSenhaPrimeiroAcesso = useCallback(async (novaSenha) => {
    const { data } = await authApi.trocarSenhaPrimeiroAcesso(novaSenha);
    if (!data.sucesso) throw new Error(data.mensagem);

    // Atualiza o flag no estado local
    setUsuario((prev) => {
      const atualizado = { ...prev, primeiro_acesso: false };
      localStorage.setItem('usuario', JSON.stringify(atualizado));
      return atualizado;
    });
  }, []);

  const logout = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) await authApi.logout(refreshToken);
    } catch {
      // Ignora erros de logout
    } finally {
      desconectarSocket();
      limparSessao();
      setUsuario(null);
    }
  }, []);

  const atualizarUsuario = useCallback((novosDados) => {
    setUsuario((prev) => {
      const atualizado = { ...prev, ...novosDados };
      localStorage.setItem('usuario', JSON.stringify(atualizado));
      return atualizado;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        usuario,
        carregando,
        estaAutenticado:   !!usuario,
        precisaTrocarSenha: !!usuario?.primeiro_acesso,
        login,
        logout,
        trocarSenhaPrimeiroAcesso,
        atualizarUsuario,
        // Array com TODOS os roles do usuário (principal + extras)
        // Usado para checar permissões quando há multi-perfil
        roles: buildRoles(usuario),
        // Helpers de role — verificam QUALQUER um dos roles do usuário
        eVendedor:   temRole(usuario, 'vendedor'),
        eEstoquista: temRole(usuario, 'estoquista'),
        eAlmoxarife: temRole(usuario, 'almoxarife'),
        eAdm:        temRole(usuario, 'adm'),
        eGerencia:   temRole(usuario, 'gerencia'),
        eMotorista:  temRole(usuario, 'motorista'),
        eFiscal:     temRole(usuario, 'fiscal'),
        eSuperAdmin: temRole(usuario, 'super_admin'),
        // Admin = pode ver tudo e gerenciar usuários
        eAdmin: temRole(usuario, 'super_admin') || temRole(usuario, 'adm'),
        // Pode editar usuários (super_admin ou gerencia)
        podeEditarUsuarios: temRole(usuario, 'super_admin') || temRole(usuario, 'gerencia'),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>');
  return ctx;
}

function limparSessao() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('usuario');
}

export default AuthContext;
