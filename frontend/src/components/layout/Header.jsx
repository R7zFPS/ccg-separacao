/**
 * Header — Casa das Correntes Guanabara
 * Design: Branco puro + Navy | Limpo e premium
 */

import { Menu, LogOut, User, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect }     from 'react';
import { useNavigate, useLocation }        from 'react-router-dom';
import { useAuth }                         from '../../context/AuthContext';
import { SinoNotificacoes }               from '../notificacoes/SinoNotificacoes';
import { gerarIniciais }                   from '../../utils/formatters';
import { resolveFileUrl }                  from '../../utils/arquivos';
import { LABELS_ROLE }                     from '../../utils/constantes';

/* ── Títulos por rota ── */
const TITULOS_ROTA = {
  '/dashboard':        'Painel Geral',
  '/solicitacoes':     'Solicitações',
  '/solicitacoes/nova':'Nova Solicitação',
  '/agendamentos':     'Agendamentos',
  '/historico':        'Histórico',
  '/relatorios':       'Relatórios',
  '/usuarios':         'Usuários',
  '/audit':            'Audit Log',
  '/notificacoes':     'Notificações',
  '/perfil':           'Meu Perfil',
  '/fila':             'Fila de Separação',
  '/motorista':        'Entregas do Dia',
};

export function Header({ onToggleSidebar }) {
  const { usuario, logout } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const menuRef   = useRef(null);
  const [menuAberto, setMenuAberto] = useState(false);

  const tituloPagina = TITULOS_ROTA[location.pathname]
    || TITULOS_ROTA[location.pathname.replace(/\/\d+$/, '')] || '';

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

  const avatarUrl = usuario?.foto_perfil ? resolveFileUrl(usuario.foto_perfil) : null;

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 40,
      height: 64,
      background: '#FFFFFF',
      borderBottom: '1px solid rgba(15,72,128,0.08)',
      boxShadow: '0 1px 8px rgba(5,24,56,0.06)',
      display: 'flex', alignItems: 'center',
      padding: '0 1.25rem', gap: '0.875rem',
    }}>

      {/* Botão hamburguer mobile */}
      <button
        onClick={onToggleSidebar}
        style={{
          width: 36, height: 36,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderRadius: 8,
          border: '1px solid rgba(15,72,128,0.12)',
          background: 'transparent',
          color: 'var(--navy-600)',
          cursor: 'pointer',
          flexShrink: 0,
          transition: 'all 0.2s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--navy-50)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
        aria-label="Abrir menu"
        className="lg:hidden"
      >
        <Menu size={18} />
      </button>

      {/* Título da página */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {tituloPagina && (
          <h1 style={{
            fontSize: '1rem', fontWeight: 700,
            color: 'var(--navy-900)',
            letterSpacing: '-0.02em', margin: 0,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {tituloPagina}
          </h1>
        )}
      </div>

      {/* Ações */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>

        {/* Sino */}
        <div style={{ color: 'var(--navy-500)' }}>
          <SinoNotificacoes />
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 22, background: 'rgba(15,72,128,0.1)', margin: '0 0.125rem' }} />

        {/* Usuário */}
        <div style={{ position: 'relative' }} ref={menuRef}>
          <button
            onClick={() => setMenuAberto(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.375rem 0.75rem 0.375rem 0.375rem',
              borderRadius: 10,
              border: '1px solid rgba(15,72,128,0.1)',
              background: menuAberto ? 'var(--navy-50)' : 'transparent',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { if (!menuAberto) e.currentTarget.style.background = 'var(--navy-50)'; }}
            onMouseLeave={e => { if (!menuAberto) e.currentTarget.style.background = 'transparent'; }}
          >
            {/* Avatar */}
            <div style={{
              width: 32, height: 32, borderRadius: 999, overflow: 'hidden', flexShrink: 0,
              border: '2px solid rgba(196,144,42,0.35)',
              background: 'var(--navy-700)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {avatarUrl
                ? <img src={avatarUrl} alt={usuario?.nome} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                : <span style={{ color:'#FFF', fontSize:'0.72rem', fontWeight:700 }}>{gerarIniciais(usuario?.nome)}</span>
              }
            </div>
            <div className="hidden md:block" style={{ textAlign: 'left', lineHeight: 1.2 }}>
              <p style={{ fontSize:'0.875rem', fontWeight:600, color:'var(--navy-900)', maxWidth:120, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {usuario?.nome?.split(' ')[0]}
              </p>
              <p style={{ fontSize:'0.72rem', color:'var(--navy-400)', fontWeight:400 }}>
                {LABELS_ROLE[usuario?.role] || usuario?.role}
              </p>
            </div>
            <ChevronDown size={13} className="hidden md:block" style={{ color:'var(--navy-400)', transform: menuAberto ? 'rotate(180deg)' : 'none', transition:'transform 0.2s' }}/>
          </button>

          {/* Dropdown */}
          {menuAberto && (
            <div style={{
              position: 'absolute', right: 0, top: 'calc(100% + 8px)',
              width: 220, background: '#FFF',
              borderRadius: 14,
              boxShadow: '0 8px 32px rgba(5,24,56,0.14), 0 2px 8px rgba(5,24,56,0.08)',
              border: '1px solid rgba(15,72,128,0.1)',
              zIndex: 50, overflow: 'hidden',
            }}>
              <div style={{ padding:'0.875rem 1rem', borderBottom:'1px solid rgba(15,72,128,0.08)', background:'var(--navy-50)' }}>
                <p style={{ fontSize:'0.875rem', fontWeight:700, color:'var(--navy-900)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{usuario?.nome}</p>
                <p style={{ fontSize:'0.78rem', color:'var(--navy-400)', marginTop:1, fontWeight:400 }}>{LABELS_ROLE[usuario?.role] || usuario?.role}</p>
              </div>
              <div style={{ padding: '0.375rem' }}>
                <button onClick={() => { navigate('/perfil'); setMenuAberto(false); }}
                  style={{ width:'100%', display:'flex', alignItems:'center', gap:'0.625rem', padding:'0.625rem 0.75rem', borderRadius:8, background:'transparent', border:'none', fontSize:'0.875rem', color:'var(--navy-700)', cursor:'pointer', fontFamily:'Outfit,sans-serif', fontWeight:500, textAlign:'left', transition:'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background='var(--navy-50)'}
                  onMouseLeave={e => e.currentTarget.style.background='transparent'}
                >
                  <User size={15} style={{ color:'var(--navy-400)', flexShrink:0 }}/> Meu Perfil
                </button>
                <div style={{ height:1, background:'rgba(15,72,128,0.06)', margin:'0.25rem 0' }}/>
                <button onClick={handleLogout}
                  style={{ width:'100%', display:'flex', alignItems:'center', gap:'0.625rem', padding:'0.625rem 0.75rem', borderRadius:8, background:'transparent', border:'none', fontSize:'0.875rem', color:'#DC2626', cursor:'pointer', fontFamily:'Outfit,sans-serif', fontWeight:500, textAlign:'left', transition:'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background='#FEF2F2'}
                  onMouseLeave={e => e.currentTarget.style.background='transparent'}
                >
                  <LogOut size={15} style={{ flexShrink:0 }}/> Sair do sistema
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
