/**
 * Cliente HTTP — Axios configurado com interceptors
 *
 * - Injeta Authorization header automaticamente em todas as requisições
 * - Renova o access token automaticamente quando expirar (refresh silencioso)
 * - Redireciona para /login se refresh falhar
 */

import axios from 'axios';

// Em dev sem VITE_API_URL: URL relativa '' → proxy do Vite (/api → localhost:3001).
// Funciona tanto em localhost quanto em qualquer IP da rede local (celular, etc.).
// Em produção: usa VITE_API_URL configurado no .env
const API_BASE = import.meta.env.VITE_API_URL || '';

// ─── Instância principal ───────────────────────────────
const api = axios.create({
  baseURL: `${API_BASE}/api`,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request Interceptor — injeta token ───────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Controle de refresh em andamento ─────────────────
let renovandoToken = false;
let filaEspera = [];

function processarFila(error, token = null) {
  filaEspera.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  filaEspera = [];
}

// ─── Response Interceptor — renova token expirado ─────
api.interceptors.response.use(
  (response) => {
    // Requisição bem-sucedida → limpa qualquer flag de erro de rede
    window.dispatchEvent(new CustomEvent('api:network-ok'));
    return response;
  },
  async (error) => {
    // Sem resposta = servidor inacessível (rede ou server down)
    if (!error.response) {
      window.dispatchEvent(new CustomEvent('api:network-error'));
    }
    const original = error.config;

    const tokenExpirado =
      error.response?.status === 401 &&
      error.response?.data?.codigo === 'TOKEN_EXPIRADO' &&
      !original._retry;

    // 401 que não é expiração de token (usuário desativado, token inválido, etc.)
    // → limpa sessão e redireciona para login sem tentar refresh
    if (error.response?.status === 401 && !tokenExpirado) {
      const temToken = localStorage.getItem('accessToken');
      if (temToken) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('usuario');
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    if (!tokenExpirado) return Promise.reject(error);

    if (renovandoToken) {
      // Enfileira a requisição enquanto o refresh está em andamento
      return new Promise((resolve, reject) => {
        filaEspera.push({ resolve, reject });
      }).then((token) => {
        original.headers['Authorization'] = `Bearer ${token}`;
        return api(original);
      });
    }

    original._retry = true;
    renovandoToken = true;

    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) throw new Error('Sem refresh token');

      const { data } = await axios.post(`${API_BASE}/api/auth/refresh`, { refreshToken });

      const { accessToken, refreshToken: novoRefresh } = data.dados;
      localStorage.setItem('accessToken',  accessToken);
      localStorage.setItem('refreshToken', novoRefresh);

      api.defaults.headers['Authorization'] = `Bearer ${accessToken}`;
      original.headers['Authorization']     = `Bearer ${accessToken}`;

      processarFila(null, accessToken);
      return api(original);
    } catch (refreshError) {
      processarFila(refreshError, null);
      // Limpa sessão e redireciona
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('usuario');
      window.location.href = '/login';
      return Promise.reject(refreshError);
    } finally {
      renovandoToken = false;
    }
  }
);

// ─── Helpers de autenticação ──────────────────────────
export const authApi = {
  login: (usuario_login, senha) =>
    api.post('/auth/login', { usuario_login, senha }),

  trocarSenhaPrimeiroAcesso: (novaSenha) =>
    api.post('/auth/trocar-senha-primeiro-acesso', { novaSenha }),

  logout: (refreshToken) =>
    api.post('/auth/logout', { refreshToken }),

  refresh: (refreshToken) =>
    api.post('/auth/refresh', { refreshToken }),

  perfil: () =>
    api.get('/auth/perfil'),
};

// ─── Helpers de usuários ──────────────────────────────
export const usuariosApi = {
  listar:      (params) => api.get('/usuarios', { params }),
  buscar:      (id)     => api.get(`/usuarios/${id}`),
  criar:       (dados)  => api.post('/usuarios', dados),
  atualizar:   (id, dados) => api.put(`/usuarios/${id}`, dados),
  desativar:   (id)     => api.delete(`/usuarios/${id}`),
  alterarSenha:    (dados)    => api.patch('/usuarios/minha-senha', dados),
  uploadFotoPerfil:(formData) => api.put('/usuarios/minha-foto', formData),
};

// ─── Helpers de solicitações ──────────────────────────
export const solicitacoesApi = {
  listar:              (params)  => api.get('/solicitacoes', { params }),
  estatisticas:        ()        => api.get('/solicitacoes/estatisticas'),
  buscar:              (id)      => api.get(`/solicitacoes/${id}`),
  criar:               (formData) => api.post('/solicitacoes', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  atualizarStatus:     (id, formData) => api.patch(`/solicitacoes/${id}/status`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  atualizarPrioridade: (id, prioridade) =>
    api.patch(`/solicitacoes/${id}/prioridade`, { prioridade }),
  atribuir:            (id, estoquista_id) =>
    api.patch(`/solicitacoes/${id}/atribuir`, { estoquista_id }),
  cancelar:            (id) => api.delete(`/solicitacoes/${id}`),
  rankingEstoquistas:  ()          => api.get('/solicitacoes/ranking-estoquistas'),
  evolucao:            (dias = 14) => api.get('/solicitacoes/evolucao', { params: { dias } }),
  minhasEstatisticas:  ()          => api.get('/solicitacoes/minhas-estatisticas'),
};

// ─── Helpers de audit log ─────────────────────────────
export const auditApi = {
  listar:  (params) => api.get('/audit',        { params }),
  resumo:  ()       => api.get('/audit/resumo'),
};

// ─── Helpers de notificações ──────────────────────────
export const notificacoesApi = {
  listar:         (params) => api.get('/notificacoes', { params }),
  marcarLida:     (id)     => api.patch(`/notificacoes/${id}/lida`),
  marcarTodasLidas: ()     => api.patch('/notificacoes/marcar-todas-lidas'),
};

// ─── Helpers de agendamentos ──────────────────────────
export const agendamentosApi = {
  criar: (formData) => api.post('/agendamentos', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  listar:               (params) => api.get('/agendamentos', { params }),
  buscarPorSolicitacao: (solId)  => api.get(`/agendamentos/por-solicitacao/${solId}`),
};

// ─── Helpers de entregas ──────────────────────────────
export const entregasApi = {
  listarMotorista: (params) => api.get('/entregas/motorista', { params }),
  historico:       ()       => api.get('/entregas/historico'),
  criar:           (dados)  => api.post('/entregas', dados),
  confirmar:       (id, fd) => api.patch(`/entregas/${id}/confirmar`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

// ─── Helpers de propostas de entrega ─────────────────
export const propostasApi = {
  criar:              (dados) => api.post('/propostas', dados),
  buscarPorSolicitacao: (solId) => api.get(`/propostas/solicitacao/${solId}`),
  responder:          (id, dados) => api.patch(`/propostas/${id}/responder`, dados),
};

export default api;
