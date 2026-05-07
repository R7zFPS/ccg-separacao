/**
 * Hook: useNetworkStatus
 * Monitora o estado da conexão de rede do navegador.
 *
 * Retorna { online } — true quando o navegador detecta conectividade.
 * Usa os eventos nativos 'online' / 'offline' do window.
 *
 * Nota: o navegador pode reportar "online" mesmo sem acesso à API
 * (ex.: rede local sem internet). Para isso, o OfflineBanner também
 * observa erros de rede no interceptor Axios (api.js).
 */

import { useState, useEffect } from 'react';

export function useNetworkStatus() {
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    function handleOnline()  { setOnline(true);  }
    function handleOffline() { setOnline(false); }

    window.addEventListener('online',  handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online',  handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { online };
}
