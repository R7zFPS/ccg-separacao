/**
 * Hook: usePageTitle
 * Define o título da aba do navegador de forma dinâmica por página.
 *
 * Colabora com NotificacoesContext: preserva o badge "(N)" se já estiver
 * no título, apenas substituindo o nome da página.
 *
 * Uso: usePageTitle('Fila de Separação')
 * Resultado na aba: "Fila de Separação — CCG"
 * Com notificações: "(3) Fila de Separação — CCG"
 */

import { useEffect } from 'react';

const BASE_SUFFIX = '— CCG';
const BASE_TITLE  = `Sistema Separação ${BASE_SUFFIX}`;

export function usePageTitle(titulo) {
  useEffect(() => {
    if (!titulo) return;

    // Extrai badge "(N)" atual para não perder a contagem de notificações
    const badge = document.title.match(/^\(\d+\)/)?.[0] || '';
    document.title = badge
      ? `${badge} ${titulo} ${BASE_SUFFIX}`
      : `${titulo} ${BASE_SUFFIX}`;

    return () => {
      // Na saída da página, volta para o título base (badge preservado)
      const badgeAtual = document.title.match(/^\(\d+\)/)?.[0] || '';
      document.title = badgeAtual ? `${badgeAtual} ${BASE_TITLE}` : BASE_TITLE;
    };
  }, [titulo]);
}
