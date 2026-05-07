/**
 * Contexto de Notificações
 *
 * Mantém a lista de notificações e o contador de não lidas.
 * Escuta eventos do Socket.io para receber notificações em tempo real.
 * Faz polling a cada 30s como fallback (quando socket não disponível).
 */

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { notificacoesApi } from '../services/api';
import { getSocket } from '../services/socket';
import { useAuth } from './AuthContext';
import { tocarCorrente, desbloquearAudio } from '../utils/somCorrente';

// Roles que recebem som de corrente ao chegar nova solicitação
const ROLES_COM_SOM = ['estoquista', 'almoxarife'];

const NotificacoesContext = createContext(null);

export function NotificacoesProvider({ children }) {
  const { usuario, estaAutenticado } = useAuth();
  const [notificacoes, setNotificacoes] = useState([]);
  const [totalNaoLidas, setTotalNaoLidas] = useState(0);
  const [carregando, setCarregando] = useState(false);
  const pollingRef = useRef(null);

  // ─── Busca notificações do servidor ─────────────────
  const buscarNotificacoes = useCallback(async () => {
    if (!estaAutenticado) return;
    try {
      setCarregando(true);
      const { data } = await notificacoesApi.listar({ limite: 30 });
      if (data.sucesso) {
        setNotificacoes(data.dados.notificacoes);
        setTotalNaoLidas(data.dados.totalNaoLidas);
      }
    } catch {
      // Silencioso — não interrompe o usuário
    } finally {
      setCarregando(false);
    }
  }, [estaAutenticado]);

  // ─── Escuta socket para notificações em tempo real ──
  useEffect(() => {
    if (!estaAutenticado) return;

    buscarNotificacoes();

    // Socket em tempo real
    const socket = getSocket();
    if (socket) {
      // Notificação genérica do sistema
      socket.on('nova_notificacao', (notificacao) => {
        setNotificacoes((prev) => [notificacao, ...prev]);
        setTotalNaoLidas((prev) => prev + 1);
      });

      // Nova solicitação — toca som de corrente para estoquistas/almoxarifes
      if (usuario?.role && ROLES_COM_SOM.includes(usuario.role)) {
        socket.on('nova_solicitacao', () => {
          tocarCorrente();
        });
      }
    }

    // Polling como fallback (a cada 30s)
    pollingRef.current = setInterval(buscarNotificacoes, 30_000);

    return () => {
      if (socket) {
        socket.off('nova_notificacao');
        socket.off('nova_solicitacao');
      }
      clearInterval(pollingRef.current);
    };
  }, [estaAutenticado, buscarNotificacoes]);

  // ─── Marca uma notificação como lida ────────────────
  const marcarLida = useCallback(async (id) => {
    try {
      await notificacoesApi.marcarLida(id);
      setNotificacoes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, lida: 1 } : n))
      );
      setTotalNaoLidas((prev) => Math.max(0, prev - 1));
    } catch {
      // Silencioso
    }
  }, []);

  // ─── Marca todas como lidas ──────────────────────────
  const marcarTodasLidas = useCallback(async () => {
    try {
      await notificacoesApi.marcarTodasLidas();
      setNotificacoes((prev) => prev.map((n) => ({ ...n, lida: 1 })));
      setTotalNaoLidas(0);
    } catch {
      // Silencioso
    }
  }, []);

  // ── Badge dinâmico no título da aba ──────────────────
  // Preserva o nome da página atual (definido por usePageTitle) e apenas
  // adiciona/atualiza/remove o prefixo "(N)" sem sobrescrever o título inteiro.
  useEffect(() => {
    const semBadge = document.title.replace(/^\(\d+\)\s*/, '');
    document.title = totalNaoLidas > 0 ? `(${totalNaoLidas}) ${semBadge}` : semBadge;
  }, [totalNaoLidas]);

  return (
    <NotificacoesContext.Provider
      value={{
        notificacoes,
        totalNaoLidas,
        carregando,
        buscarNotificacoes,
        marcarLida,
        marcarTodasLidas,
      }}
    >
      {children}
    </NotificacoesContext.Provider>
  );
}

export function useNotificacoes() {
  const ctx = useContext(NotificacoesContext);
  if (!ctx) throw new Error('useNotificacoes deve ser usado dentro de <NotificacoesProvider>');
  return ctx;
}

export default NotificacoesContext;
