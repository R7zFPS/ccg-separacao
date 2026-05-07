/**
 * Hook simples de Toast (notificação visual temporária)
 * Usa estado local — funciona sem biblioteca externa
 */

import { useState, useCallback } from 'react';

let idContador = 0;

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const adicionar = useCallback(({ titulo, descricao, tipo = 'info', duracao = 4000 }) => {
    const id = ++idContador;
    setToasts((prev) => [...prev, { id, titulo, descricao, tipo }]);

    if (duracao > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duracao);
    }

    return id;
  }, []);

  const remover = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const sucesso = useCallback((titulo, descricao) =>
    adicionar({ titulo, descricao, tipo: 'sucesso' }), [adicionar]);

  const erro = useCallback((titulo, descricao) =>
    adicionar({ titulo, descricao, tipo: 'erro' }), [adicionar]);

  const alerta = useCallback((titulo, descricao) =>
    adicionar({ titulo, descricao, tipo: 'alerta' }), [adicionar]);

  const info = useCallback((titulo, descricao) =>
    adicionar({ titulo, descricao, tipo: 'info' }), [adicionar]);

  return { toasts, adicionar, remover, sucesso, erro, alerta, info };
}
