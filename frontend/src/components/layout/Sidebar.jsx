/**
 * Sidebar — Casa das Correntes Guanabara
 * Design: Navy profundo + dourado | Premium dark sidebar
 */

import { NavLink }     from 'react-router-dom';
import { useEffect, useRef } from 'react';
import {
  LayoutDashboard, ClipboardList, Clock, PackageCheck,
  Calendar, Truck, Users, Package, FileText,
  BarChart2, UserCircle, Shield, Bell, X,
} from 'lucide-react';
import { useAuth }             from '../../context/AuthContext';
import { LABELS_ROLE, LABELS_SETOR } from '../../utils/constantes';
import { gerarIniciais }       from '../../utils/formatters';
import { resolveFileUrl }      from '../../utils/arquivos';

/* ── Menus por role ── */
const MENUS_POR_ROLE = {
  super_admin: [
    { label: 'Painel Geral',  icon: LayoutDashboard, to: '/dashboard' },
    { label: 'Solicitações',  icon: ClipboardList,   to: '/solicitacoes' },
    { label: 'Agendamentos',  icon: Calendar,        to: '/agendamentos' },
    { label: 'Histórico',     icon: Clock,           to: '/historico' },
    { label: 'Relatórios',    icon: BarChart2,       to: '/relatorios' },
    { label: 'Usuários',      icon: Users,           to: '/usuarios' },
    { label: 'Audit Log',     icon: Shield,          to: '/audit' },
    { label: 'Notificações',  icon: Bell,            to: '/notificacoes' },
    { label: 'Meu Perfil',    icon: UserCircle,      to: '/perfil' },
  ],
  vendedor: [
    { label: 'Início',              icon: LayoutDashboard, to: '/dashboard' },
    { label: 'Nova Solicitação',    icon: ClipboardList,   to: '/solicitacoes/nova' },
    { label: 'Minhas Solicitações', icon: Clock,           to: '/solicitacoes' },
    { label: 'Histórico',           icon: Clock,           to: '/historico' },
    { label: 'Notificações',        icon: Bell,            to: '/notificacoes' },
    { label: 'Meu Perfil',          icon: UserCircle,      to: '/perfil' },
  ],
  estoquista: [
    { label: 'Início',          icon: LayoutDashboard, to: '/dashboard' },
    { label: 'Fila de Pedidos', icon: ClipboardList,   to: '/solicitacoes' },
    { label: 'Meu Histórico',   icon: Clock,           to: '/historico' },
    { label: 'Notificações',    icon: Bell,            to: '/notificacoes' },
    { label: 'Meu Perfil',      icon: UserCircle,      to: '/perfil' },
  ],
  almoxarife: [
    { label: 'Início',            icon: LayoutDashboard, to: '/dashboard' },
    { label: 'Solicitações',      icon: ClipboardList,   to: '/solicitacoes' },
    { label: 'Fila de Separação', icon: Package,         to: '/fila' },
    { label: 'Histórico',         icon: Clock,           to: '/historico' },
    { label: 'Notificações',      icon: Bell,            to: '/notificacoes' },
    { label: 'Meu Perfil',        icon: UserCircle,      to: '/perfil' },
  ],
  adm: [
    { label: 'Painel Geral',      icon: LayoutDashboard, to: '/dashboard' },
    { label: 'Solicitações',      icon: ClipboardList,   to: '/solicitacoes' },
    { label: 'Fila de Separação', icon: Package,         to: '/fila' },
    { label: 'Agendamentos',      icon: Calendar,        to: '/agendamentos' },
    { label: 'Histórico',         icon: Clock,           to: '/historico' },
    { label: 'Relatórios',        icon: BarChart2,       to: '/relatorios' },
    { label: 'Usuários',          icon: Users,           to: '/usuarios' },
    { label: 'Notificações',      icon: Bell,            to: '/notificacoes' },
    { label: 'Meu Perfil',        icon: UserCircle,      to: '/perfil' },
  ],
  gerencia: [
    { label: 'Painel Geral',     icon: LayoutDashboard, to: '/dashboard' },
    { label: 'Nova Solicitação', icon: ClipboardList,   to: '/solicitacoes/nova' },
    { label: 'Solicitações',     icon: ClipboardList,   to: '/solicitacoes' },
    { label: 'Agendamentos',     icon: Calendar,        to: '/agendamentos' },
    { label: 'Fila Separação',   icon: Package,         to: '/fila' },
    { label: 'Histórico',        icon: PackageCheck,    to: '/historico' },
    { label: 'Relatórios',       icon: BarChart2,       to: '/relatorios' },
    { label: 'Usuários',         icon: Users,           to: '/usuarios' },
    { label: 'Audit Log',        icon: Shield,          to: '/audit' },
    { label: 'Notificações',     icon: Bell,            to: '/notificacoes' },
    { label: 'Meu Perfil',       icon: UserCircle,      to: '/perfil' },
  ],
  motorista: [
    { label: 'Entregas do Dia', icon: Truck,        to: '/motorista' },
    { label: 'Histórico',       icon: PackageCheck, to: '/historico' },
    { label: 'Notificações',    icon: Bell,         to: '/notificacoes' },
    { label: 'Meu Perfil',      icon: UserCircle,   to: '/perfil' },
  ],
  fiscal: [
    { label: 'Início',       icon: LayoutDashboard, to: '/dashboard' },
    { label: 'Emitir NF',    icon: FileText,        to: '/solicitacoes' },
    { label: 'Histórico',    icon: Clock,           to: '/historico' },
    { label: 'Notificações', icon: Bell,            to: '/notificacoes' },
    { label: 'Meu Perfil',   icon: UserCircle,      to: '/perfil' },
  ],
  coordenador: [
    { label: 'Painel',        icon: LayoutDashboard, to: '/dashboard' },
    { label: 'Solicitações',  icon: ClipboardList,   to: '/solicitacoes' },
    { label: 'Agendamentos',  icon: Calendar,        to: '/agendamentos' },
    { label: 'Histórico',     icon: Clock,           to: '/historico' },
    { label: 'Relatórios',    icon: BarChart2,       to: '/relatorios' },
    { label: 'Notificações',  icon: Bell,            to: '/notificacoes' },
    { label: 'Meu Perfil',    icon: UserCircle,      to: '/perfil' },
  ],
  adm_galpao: [
    { label: 'Início',            icon: LayoutDashboard, to: '/dashboard' },
    { label: 'Fila de Separação', icon: Package,         to: '/fila' },
    { label: 'Histórico',         icon: Clock,           to: '/historico' },
    { label: 'Notificações',      icon: Bell,            to: '/notificacoes' },
    { label: 'Meu Perfil',        icon: UserCircle,      to: '/perfil' },
  ],
};

function buildItensMenu(usuario) {
  if (!usuario) return [];
  const extras    = Array.isArray(usuario.roles_extra) ? usuario.roles_extra : [];
  const todosRoles = [usuario.role, ...extras.filter(r => r !== usuario.role)];
  const vistos    = new Set();
  const itens     = [];
  for (const role of todosRoles) {
    for (const item of (MENUS_POR_ROLE[role] || [])) {
      if (!vistos.has(item.to)) {
        vistos.add(item.to);
        itens.push(item);
      }
    }
  }
  return itens;
}

/* ── Logo miniatura inline (sem dep externa) ── */
function LogoMini({ size = 32 }) {
  return (
    <svg viewBox="0 0 220 212" width={size} height={size} style={{ flexShrink: 0 }}>
      <path d="M 110 8 L 208 106 L 110 204 L 12 106 Z"
            stroke="currentColor" strokeWidth="7" fill="none" strokeLinejoin="miter"/>
      <rect x="30"  y="93" width="58" height="26" rx="13"
            stroke="currentColor" strokeWidth="6" fill="none"/>
      <rect x="81"  y="93" width="58" height="26" rx="13"
            stroke="currentColor" strokeWidth="6" fill="none"/>
      <rect x="132" y="93" width="58" height="26" rx="13"
            stroke="currentColor" strokeWidth="6" fill="none"/>
    </svg>
  );
}

export function Sidebar({ aberta, onFechar }) {
  const { usuario } = useAuth();
  const itens       = buildItensMenu(usuario);
  const sidebarRef  = useRef(null);

  /* Animação GSAP nos itens ao abrir (mobile) */
  useEffect(() => {
    if (!aberta || typeof window.gsap === 'undefined') return;
    const gsap = window.gsap;
    gsap.from('.sidebar-nav-item', {
      x: -16, opacity: 0, duration: 0.4,
      stagger: 0.05,
      ease: 'cubic-bezier(0.22,1,0.36,1)',
      delay: 0.1,
    });
  }, [aberta]);

  const avatarUrl = usuario?.foto_perfil
    ? resolveFileUrl(usuario.foto_perfil)
    : null;

  return (
    <>
      {/* Overlay mobile */}
      {aberta && (
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(3,14,34,0.65)',
            backdropFilter: 'blur(3px)',
            zIndex: 40,
          }}
          className="lg:hidden"
          onClick={onFechar}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        ref={sidebarRef}
        style={{
          position: 'fixed',
          top: 0, left: 0,
          height: '100%',
          width: 256,
          background: 'linear-gradient(180deg, #010814 0%, #030E22 60%, #051838 100%)',
          borderRight: '1px solid rgba(201,217,238,0.06)',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          transition: 'transform 0.32s cubic-bezier(0.22,1,0.36,1)',
          transform: aberta ? 'translateX(0)' : 'translateX(-100%)',
        }}
        className="lg:translate-x-0 lg:static lg:z-auto"
      >

        {/* ── Header da sidebar ── */}
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 1rem',
          borderBottom: '1px solid rgba(196,144,42,0.15)',
          flexShrink: 0,
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', color: '#FFFFFF' }}>
            <LogoMini size={30} />
            <div style={{ lineHeight: 1.2 }}>
              <p style={{
                fontFamily: 'Fraunces, serif',
                fontSize: '0.78rem', fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: '#FFFFFF',
              }}>
                Casa das Correntes
              </p>
              <p style={{
                fontSize: '0.62rem', fontWeight: 300,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: 'rgba(201,217,238,0.45)',
              }}>
                Separação de Estoque
              </p>
            </div>
          </div>

          {/* Botão fechar (mobile) */}
          <button
            onClick={onFechar}
            className="lg:hidden"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              width: 32, height: 32,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'rgba(201,217,238,0.7)',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
            aria-label="Fechar menu"
          >
            <X size={14} />
          </button>
        </div>

        {/* ── Perfil do usuário ── */}
        <div style={{
          padding: '1rem',
          borderBottom: '1px solid rgba(201,217,238,0.06)',
          flexShrink: 0,
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(201,217,238,0.08)',
            borderRadius: 12,
            padding: '0.75rem',
          }}>
            {/* Avatar */}
            <div style={{
              width: 38, height: 38,
              borderRadius: 999,
              flexShrink: 0,
              overflow: 'hidden',
              border: '2px solid rgba(196,144,42,0.4)',
              background: 'rgba(15,72,128,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {avatarUrl ? (
                <img src={avatarUrl} alt={usuario?.nome}
                     style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{
                  color: '#FFFFFF', fontSize: '0.8rem',
                  fontWeight: 700, letterSpacing: '0.05em',
                }}>
                  {gerarIniciais(usuario?.nome)}
                </span>
              )}
            </div>
            {/* Info */}
            <div style={{ minWidth: 0 }}>
              <p style={{
                fontSize: '0.7rem', fontWeight: 600,
                letterSpacing: '0.1em', textTransform: 'uppercase',
                color: 'var(--gold-300)', marginBottom: '1px',
              }}>
                {LABELS_ROLE[usuario?.role] || usuario?.role}
              </p>
              <p style={{
                fontSize: '0.875rem', fontWeight: 600,
                color: '#FFFFFF',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {usuario?.nome}
              </p>
              {usuario?.setor && usuario.setor !== 'ambos' && (
                <p style={{
                  fontSize: '0.68rem',
                  color: 'rgba(201,217,238,0.45)',
                  marginTop: '1px',
                }}>
                  {LABELS_SETOR[usuario.setor]}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── Navegação ── */}
        <nav style={{
          flex: 1, overflowY: 'auto',
          padding: '0.75rem 0.75rem',
          display: 'flex', flexDirection: 'column', gap: '2px',
        }}>
          {itens.map(({ label, icon: Icone, to }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onFechar}
              className="sidebar-nav-item"
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.625rem 0.875rem',
                borderRadius: 10,
                fontSize: '0.875rem',
                fontWeight: isActive ? 600 : 400,
                textDecoration: 'none',
                borderLeft: `3px solid ${isActive ? 'var(--gold-400)' : 'transparent'}`,
                background: isActive
                  ? 'rgba(196,144,42,0.1)'
                  : 'transparent',
                color: isActive
                  ? 'var(--gold-200)'
                  : 'rgba(201,217,238,0.65)',
                transition: 'all 0.2s cubic-bezier(0.22,1,0.36,1)',
                letterSpacing: '0.01em',
              })}
              onMouseEnter={e => {
                if (!e.currentTarget.getAttribute('data-active')) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                  e.currentTarget.style.color = '#FFFFFF';
                }
              }}
              onMouseLeave={e => {
                // revert será feito pelo style prop via NavLink isActive
              }}
            >
              {({ isActive }) => (
                <>
                  <Icone
                    size={16}
                    style={{
                      flexShrink: 0,
                      color: isActive ? 'var(--gold-300)' : 'rgba(201,217,238,0.5)',
                    }}
                  />
                  <span>{label}</span>
                  {/* Indicador ativo */}
                  {isActive && (
                    <span style={{
                      marginLeft: 'auto',
                      width: 6, height: 6,
                      borderRadius: 999,
                      background: 'var(--gold-400)',
                      flexShrink: 0,
                    }} />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* ── Footer ── */}
        <div style={{
          padding: '0.875rem 1rem',
          borderTop: '1px solid rgba(201,217,238,0.06)',
          flexShrink: 0,
        }}>
          {/* Linha dourada decorativa */}
          <div style={{
            height: 1,
            background: 'linear-gradient(90deg, transparent, rgba(196,144,42,0.3), transparent)',
            marginBottom: '0.75rem',
          }} />
          <p style={{
            textAlign: 'center',
            fontSize: '0.68rem',
            color: 'rgba(201,217,238,0.3)',
            letterSpacing: '0.08em',
            fontWeight: 300,
          }}>
            © {new Date().getFullYear()} Casa das Correntes Guanabara
          </p>
        </div>
      </aside>

      <style>{`
        @media (min-width: 1024px) {
          aside { transform: translateX(0) !important; position: static !important; z-index: auto !important; }
        }
        .sidebar-nav-item:hover {
          background: rgba(255,255,255,0.05) !important;
          color: #FFFFFF !important;
        }
      `}</style>
    </>
  );
}
