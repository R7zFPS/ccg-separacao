/**
 * Layout Principal
 * Envolve todas as páginas autenticadas com Header + Sidebar + conteúdo
 */

import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { desbloquearAudio }    from '../../utils/somCorrente';
import { useNetworkStatus }    from '../../hooks/useNetworkStatus';
import { useNetworkError }     from '../../context/NetworkErrorContext';

export function LayoutPrincipal() {
  const [sidebarAberta, setSidebarAberta] = useState(false);
  // key por rota → reanima o pageEnter a cada troca de página
  const { pathname } = useLocation();
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
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-app)',
      paddingTop: bannerVisivel ? 40 : 0,
    }}>
      {/* Header */}
      <Header onToggleSidebar={() => setSidebarAberta(v => !v)} />

      <div style={{ display: 'flex', height: 'calc(100vh - 64px)' }}>
        {/* Sidebar */}
        <Sidebar
          aberta={sidebarAberta}
          onFechar={() => setSidebarAberta(false)}
        />

        {/* Conteúdo principal */}
        <main style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
        }}>
          <div key={pathname} style={{
            padding: '1.5rem',
            maxWidth: 1280,
            margin: '0 auto',
          }} className="page-enter">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
