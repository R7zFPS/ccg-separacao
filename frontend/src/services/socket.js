/**
 * Configuração do Socket.io cliente
 * Gerencia conexão em tempo real para notificações
 */

import { io } from 'socket.io-client';

// Em dev sem VITE_API_URL: conecta à mesma origem (funciona em localhost E na rede via celular)
// Em produção: usa a URL configurada no .env
const SOCKET_URL = import.meta.env.VITE_API_URL || '';

let socket = null;

/**
 * Inicializa e retorna a conexão socket
 * Deve ser chamado após login bem-sucedido
 */
export function conectarSocket(usuarioId) {
  if (socket?.connected) return socket;

  socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
    autoConnect: true,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,  // backoff máximo 10s entre tentativas
    reconnectionAttempts: 20,     // 20 tentativas (~3min de esforço total)
  });

  socket.on('connect', () => {
    console.log('🔌 Socket conectado');
    // Autentica o socket com o ID do usuário logado (inclusive em reconexões)
    socket.emit('autenticar', usuarioId);
  });

  socket.on('disconnect', (reason) => {
    console.log(`🔌 Socket desconectado: ${reason}`);
  });

  socket.on('connect_error', (err) => {
    console.warn('⚠️ Erro de conexão socket:', err.message);
  });

  // Após esgotar as 20 tentativas, loga aviso — o polling de 30s continua como fallback
  socket.on('reconnect_failed', () => {
    console.warn('⚠️ Socket não conseguiu reconectar após 20 tentativas. Usando polling como fallback.');
  });

  return socket;
}

/**
 * Retorna a instância atual do socket (pode ser null se não conectado)
 */
export function getSocket() {
  return socket;
}

/**
 * Desconecta o socket (deve ser chamado no logout)
 */
export function desconectarSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
