/**
 * Componente Sidebar
 * Menu lateral azul marinho com navegação adaptada por role
 */

import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  Clock,
  PackageCheck,
  Calendar,
  Truck,
  Users,
  Package,
  FileText,
  BarChart2,
  UserCircle,
  Shield,
  Bell,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { LABELS_ROLE, LABELS_SETOR } from '../../utils/constantes';
import { LogoCasaDasCorrentes } from '../ui/Logo';
import { gerarIniciais } from '../../utils/formatters';
import { resolveFileUrl } from '../../utils/arquivos';

// Define os itens de menu por role
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
    { label: 'Painel Geral',   icon: LayoutDashboard, to: '/dashboard' },
    { label: 'Solicitações',   icon: ClipboardList,   to: '/solicitacoes' },
    { label: 'Fila de Separação', icon: Package,      to: '/fila' },
    { label: 'Agendamentos',   icon: Calendar,        to: '/agendamentos' },
    { label: 'Histórico',      icon: Clock,           to: '/historico' },
    { label: 'Relatórios',     icon: BarChart2,       to: '/relatorios' },
    { label: 'Usuários',       icon: Users,           to: '/usuarios' },
    { label: 'Notificações',   icon: Bell,            to: '/notificacoes' },
    { label: 'Meu Perfil',     icon: UserCircle,      to: '/perfil' },
  ],
  gerencia: [
    { label: 'Painel Geral',       icon: LayoutDashboard, to: '/dashboard' },
    { label: 'Nova Solicitação',   icon: ClipboardList,   to: '/solicitacoes/nova' },
    { label: 'Solicitações',       icon: ClipboardList,   to: '/solicitacoes' },
    { label: 'Agendamentos',       icon: Calendar,        to: '/agendamentos' },
    { label: 'Fila Separação',     icon: Package,         to: '/fila' },
    { label: 'Histórico',          icon: PackageCheck,    to: '/historico' },
    { label: 'Relatórios',         icon: BarChart2,       to: '/relatorios' },
    { label: 'Usuários',           icon: Users,           to: '/usuarios' },
    { label: 'Audit Log',          icon: Shield,          to: '/audit' },
    { label: 'Notificações',       icon: Bell,            to: '/notificacoes' },
    { label: 'Meu Perfil',         icon: UserCircle,      to: '/perfil' },
  ],
  motorista: [
    { label: 'Entregas do Dia', icon: Truck,        to: '/motorista' },
    { label: 'Histórico',       icon: PackageCheck, to: '/historico' },
    { label: 'Notificações',    icon: Bell,         to: '/notificacoes' },
    { label: 'Meu Perfil',      icon: UserCircle,   to: '/perfil' },
  ],
  fiscal: [
    { label: 'Início',        icon: LayoutDashboard, to: '/dashboard' },
    { label: 'Emitir NF',     icon: FileText,        to: '/solicitacoes' },
    { label: 'Histórico',     icon: Clock,           to: '/historico' },
    { label: 'Notificações',  icon: Bell,            to: '/notificacoes' },
    { label: 'Meu Perfil',    icon: UserCircle,      to: '/perfil' },
  ],
};

/** Monta menu unificado para todos os roles do usuário (sem duplicatas de rota) */
function buildItensMenu(usuario) {
  if (!usuario) return [];
  const extras = Array.isArray(usuario.roles_extra) ? usuario.roles_extra : [];
  const todosRoles = [usuario.role, ...extras.filter((r) => r !== usuario.role)];

  const vistos = new Set();
  const itens  = [];
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

export function Sidebar({ aberta, onFechar }) {
  const { usuario } = useAuth();
  const itens = buildItensMenu(usuario);

  return (
    <>
      {/* Overlay mobile */}
      {aberta && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onFechar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-64
          bg-marinho-900
          z-50 flex flex-col transition-transform duration-300 ease-in-out
          ${aberta ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:z-auto
        `}
      >
        {/* Header da sidebar (mobile) — logo + fechar */}
        <div className="flex items-center justify-between h-16 px-4
                         border-b border-marinho-700 lg:hidden">
          <LogoCasaDasCorrentes variante="horizontal" className="h-8" />
          <button
            onClick={onFechar}
            className="p-2 rounded-lg text-marinho-300 hover:bg-marinho-800
                        hover:text-white transition-colors"
            aria-label="Fechar menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Espaço para o header fixo (desktop) */}
        <div className="hidden lg:block h-16 flex-shrink-0" />

        {/* Informações do usuário */}
        <div className="px-4 py-3 border-b border-marinho-700/60 mx-2 mb-1 flex items-center gap-3">
          {/* Avatar: foto ou iniciais */}
          <div className="w-9 h-9 rounded-full flex-shrink-0 overflow-hidden
                           border border-marinho-600 bg-marinho-700">
            {usuario?.foto_perfil ? (
              <img
                src={resolveFileUrl(usuario.foto_perfil)}
                alt={usuario?.nome}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="w-full h-full flex items-center justify-center
                                text-white text-xs font-bold">
                {gerarIniciais(usuario?.nome)}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-marinho-300 uppercase tracking-wider mb-0.5">
              {LABELS_ROLE[usuario?.role] || usuario?.role}
            </p>
            <p className="text-sm font-medium text-white truncate">
              {usuario?.nome}
            </p>
            {usuario?.setor && usuario.setor !== 'ambos' && (
              <span className="inline-flex items-center mt-0.5 px-2 py-0.5 rounded
                                text-xs font-medium bg-marinho-700 text-marinho-200">
                Setor: {LABELS_SETOR[usuario.setor]}
              </span>
            )}
          </div>
        </div>

        {/* Navegação */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          <ul className="space-y-0.5">
            {itens.map(({ label, icon: Icone, to }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  onClick={onFechar}
                  className={({ isActive }) => `
                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
                    font-medium transition-colors
                    ${isActive
                      ? 'bg-marinho-600 text-white shadow-sm'
                      : 'text-marinho-200 hover:bg-marinho-800 hover:text-white'
                    }
                  `}
                >
                  <Icone className="w-4 h-4 flex-shrink-0" />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer da sidebar */}
        <div className="px-4 py-3 border-t border-marinho-700/60">
          <p className="text-xs text-marinho-400 text-center">
            © 2025 Casa das Correntes Guanabara
          </p>
        </div>
      </aside>
    </>
  );
}
