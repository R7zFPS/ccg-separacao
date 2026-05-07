/**
 * NetworkErrorContext
 * Detecta quando a API está inacessível (servidor down ou rede cortada).
 *
 * O interceptor do Axios (api.js) dispara eventos DOM customizados:
 *   'api:network-error' → servidor não respondeu
 *   'api:network-ok'    → requisição respondeu normalmente
 *
 * O OfflineBanner consome esse contexto via useNetworkError().
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const NetworkErrorContext = createContext({
  networkError:    false,
  setNetworkError: () => {},
});

export function NetworkErrorProvider({ children }) {
  const [networkError, setNetworkErrorState] = useState(false);

  const setNetworkError = useCallback((valor) => {
    setNetworkErrorState(valor);
  }, []);

  // Escuta os eventos disparados pelo interceptor do Axios
  useEffect(() => {
    function onNetworkError() { setNetworkErrorState(true);  }
    function onNetworkOk()    { setNetworkErrorState(false); }

    window.addEventListener('api:network-error', onNetworkError);
    window.addEventListener('api:network-ok',    onNetworkOk);

    return () => {
      window.removeEventListener('api:network-error', onNetworkError);
      window.removeEventListener('api:network-ok',    onNetworkOk);
    };
  }, []);

  return (
    <NetworkErrorContext.Provider value={{ networkError, setNetworkError }}>
      {children}
    </NetworkErrorContext.Provider>
  );
}

export function useNetworkError() {
  return useContext(NetworkErrorContext);
}
