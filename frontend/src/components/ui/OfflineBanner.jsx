/**
 * OfflineBanner — exibe faixa vermelha fixa no topo quando sem conexão.
 *
 * Combina dois sinais:
 *   1. navigator.onLine via useNetworkStatus (evento do browser)
 *   2. networkError via contexto global (erros de rede do Axios)
 *
 * O banner some automaticamente quando a conexão é restaurada.
 */

import { WifiOff } from 'lucide-react';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useNetworkError }  from '../../context/NetworkErrorContext';

export function OfflineBanner() {
  const { online }       = useNetworkStatus();
  const { networkError } = useNetworkError();

  const offline = !online || networkError;

  if (!offline) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed top-0 left-0 right-0 z-[9999] flex items-center
                 justify-center gap-2 bg-red-600 text-white text-sm
                 font-semibold py-2 px-4 shadow-lg"
    >
      <WifiOff className="w-4 h-4 flex-shrink-0" />
      <span>
        {online
          ? 'Servidor indisponível — tentando reconectar…'
          : 'Sem conexão com a internet — verifique a rede WiFi'}
      </span>
    </div>
  );
}
