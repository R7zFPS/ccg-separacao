/**
 * Layout Principal
 * Envolve todas as páginas autenticadas com Header + Sidebar + conteúdo
 */

import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { desbloquearAudio }    from '../../utils/somCorrente';
import { useNetworkStatus }    from '../../hooks/useNetworkStatus';
import { useNetworkError }     from '../../context/NetworkErrorContext';

export function LayoutPrincipal() {
  const [sidebarAberta, setSidebarAberta] = useState(false);
  const { online }       = useNetworkStatus();
  const { networkError } = useNetworkError();
  // Quando o OfflineBanner (fixed, ~40px) está visível, empurra o layout para baixo
  const bannerVisivel = !online || networkError;

  // Desbloqueia AudioContext na primeira interação do usuário
  useEffect(() => {
    const handler = () => {
      desbloquearAudio();
      window.removeEventListener('click', handler);
      window.removeEventListener('touchstart', handler);
    };
    window.addEventListener('click', handler, { once: true });
    window.addEventListener('touchstart', handler, { once: true });
    return () => {
      window.removeEventListener('click', handler);
      window.removeEventListener('touchstart', handler);
    };
  }, []);

  return (
    <div className={`min-h-screen bg-gray-50 ${bannerVisivel ? 'pt-10' : ''}`}>
      {/* Header fixo no topo — sobe 40px quando o OfflineBanner está visível */}
      <Header onToggleSidebar={() => setSidebarAberta(!sidebarAberta)} />

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar */}
        <Sidebar
          aberta={sidebarAberta}
          onFechar={() => setSidebarAberta(false)}
        />

        {/* Conteúdo principal */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6 max-w-7xl mx-auto page-enter">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
