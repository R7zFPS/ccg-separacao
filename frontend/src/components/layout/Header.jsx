/**
 * Componente Header
 * Barra superior azul marinho com logo Casa das Correntes
 */

import { Menu, LogOut, User, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { SinoNotificacoes } from '../notificacoes/SinoNotificacoes';
import { gerarIniciais } from '../../utils/formatters';
import { resolveFileUrl } from '../../utils/arquivos';
import { LABELS_ROLE } from '../../utils/constantes';
import { LogoCasaDasCorrentes } from '../ui/Logo';

export function Header({ onToggleSidebar }) {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const [menuAberto, setMenuAberto] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handler(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuAberto(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <header className="sticky top-0 z-40 bg-marinho-800 shadow-md h-16
                        flex items-center px-4 gap-3">
      {/* Botão hamburger (mobile) */}
      <button
        onClick={onToggleSidebar}
        className="p-2 rounded-lg text-marinho-200 hover:bg-marinho-700
                   transition-colors lg:hidden"
        aria-label="Abrir menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Logo */}
      <div className="flex items-center gap-3 flex-1">
        <LogoCasaDasCorrentes variante="horizontal" className="h-9" />
      </div>

      {/* Ações do header */}
      <div className="flex items-center gap-2">
        {/* Sino de notificações */}
        <div className="text-marinho-100">
          <SinoNotificacoes />
        </div>

        {/* Menu do usuário */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuAberto(!menuAberto)}
            className="flex items-center gap-2 p-1.5 rounded-lg
                        hover:bg-marinho-700 transition-colors"
          >
            {/* Avatar: foto ou iniciais */}
            <div className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden
                             border border-white/30 bg-white/20">
              {usuario?.foto_perfil ? (
                <img
                  src={resolveFileUrl(usuario.foto_perfil)}
                  alt={usuario.nome}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="w-full h-full flex items-center justify-center
                                  text-white text-xs font-bold">
                  {gerarIniciais(usuario?.nome)}
                </span>
              )}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-white leading-tight max-w-[120px] truncate">
                {usuario?.nome?.split(' ')[0]}
              </p>
              <p className="text-xs text-marinho-200">
                {LABELS_ROLE[usuario?.role] || usuario?.role}
              </p>
            </div>
            <ChevronDown className="w-4 h-4 text-marinho-300 hidden md:block" />
          </button>

          {/* Dropdown do usuário */}
          {menuAberto && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl
                             shadow-xl border border-gray-200 z-50 overflow-hidden py-1">
              <div className="px-3 py-2 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {usuario?.nome}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {LABELS_ROLE[usuario?.role] || usuario?.role}
                </p>
              </div>

              <button
                onClick={() => { navigate('/perfil'); setMenuAberto(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm
                            text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <User className="w-4 h-4 text-gray-400" />
                Meu Perfil
              </button>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm
                            text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
