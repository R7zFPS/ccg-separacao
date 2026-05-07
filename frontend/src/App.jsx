/**
 * App.jsx — Roteamento principal
 *
 * - Rotas públicas: /login, /primeiro-acesso
 * - Rotas protegidas: requerem autenticação
 * - Roteamento por role: cada perfil vê apenas suas rotas
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { NotificacoesProvider }  from './context/NotificacoesContext';
import { NetworkErrorProvider }  from './context/NetworkErrorContext';
import { ToastContainer }  from './components/ui/Toast';
import { CarregandoTela }  from './components/ui/Spinner';
import { ErrorBoundary }   from './components/ui/ErrorBoundary';
import { OfflineBanner }   from './components/ui/OfflineBanner';
import { LayoutPrincipal } from './components/layout/LayoutPrincipal';
import { useToast } from './hooks/useToast';

// Páginas públicas
import Login          from './pages/login/Login';
import PrimeiroAcesso from './pages/login/PrimeiroAcesso';

// Páginas protegidas
import Dashboard         from './pages/dashboard/Dashboard';
import Usuarios          from './pages/usuarios/Usuarios';

// Sprint 2 — Solicitações
import NovaSolicitacao   from './pages/solicitacoes/NovaSolicitacao';
import ListaSolicitacoes from './pages/solicitacoes/ListaSolicitacoes';
import DetalheSolicitacao from './pages/solicitacoes/DetalheSolicitacao';

// Sprint 3 — Agendamentos e Motorista
import Agendamentos from './pages/agendamentos/Agendamentos';
import Motorista    from './pages/motorista/Motorista';

// Sprint 3 — Fila de separação
import FilaSeparacao from './pages/fila/FilaSeparacao';

// Sprint 6 — Histórico, Relatórios, Perfil
import Historico  from './pages/historico/Historico';
import Relatorios from './pages/relatorios/Relatorios';
import Perfil     from './pages/perfil/Perfil';
import AuditLog      from './pages/audit/AuditLog';
import Notificacoes  from './pages/notificacoes/Notificacoes';

// Roles que podem visualizar/editar usuários
const ROLES_ADMIN = ['super_admin', 'adm', 'gerencia'];

// ─── Rota protegida — exige autenticação ──────────────────
function RotaProtegida({ children }) {
  const { estaAutenticado, carregando, precisaTrocarSenha } = useAuth();

  if (carregando) return <CarregandoTela mensagem="Verificando sessão..." />;
  if (!estaAutenticado) return <Navigate to="/login" replace />;
  // Força troca de senha antes de qualquer rota
  if (precisaTrocarSenha) return <Navigate to="/primeiro-acesso" replace />;

  return children;
}

// ─── Rota de primeiro acesso — só acessível com senha pendente ──
function RotaPrimeiroAcesso({ children }) {
  const { estaAutenticado, carregando, precisaTrocarSenha } = useAuth();

  if (carregando) return <CarregandoTela mensagem="Verificando sessão..." />;
  if (!estaAutenticado) return <Navigate to="/login" replace />;
  if (!precisaTrocarSenha) return <Navigate to="/dashboard" replace />;

  return children;
}

// ─── Rota por role — suporta multi-perfil ──────────────────
function RotaPorRole({ roles, children }) {
  const { usuario } = useAuth();

  // Constrói lista completa de roles do usuário (principal + extras)
  const rolesDoUsuario = [
    usuario?.role,
    ...(Array.isArray(usuario?.roles_extra) ? usuario.roles_extra : []),
  ].filter(Boolean);

  const temAcesso = roles.some((r) => rolesDoUsuario.includes(r));
  if (!temAcesso) return <Navigate to="/dashboard" replace />;

  return children;
}

// ─── App com Toast ──────────────────────────────────────────
export default function App() {
  const { toasts, remover } = useToast();

  return (
    <ErrorBoundary>
      <NetworkErrorProvider>
        <OfflineBanner />
      <BrowserRouter>
        <NotificacoesProvider>
          <Routes>
            {/* Rotas públicas */}
            <Route path="/login" element={<Login />} />

            {/* Primeiro acesso — troca de senha obrigatória */}
            <Route
              path="/primeiro-acesso"
              element={
                <RotaPrimeiroAcesso>
                  <PrimeiroAcesso />
                </RotaPrimeiroAcesso>
              }
            />

            {/* Rota raiz → redireciona */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* Rotas protegidas (dentro do layout) */}
            <Route
              element={
                <RotaProtegida>
                  <LayoutPrincipal />
                </RotaProtegida>
              }
            >
              {/* Dashboard — redireciona por role automaticamente */}
              <Route path="/dashboard" element={<Dashboard />} />

              {/* Gerenciamento de usuários — super_admin, adm */}
              <Route
                path="/usuarios"
                element={
                  <RotaPorRole roles={ROLES_ADMIN}>
                    <Usuarios />
                  </RotaPorRole>
                }
              />

              {/* Solicitações — todos os roles têm acesso à lista/detalhe */}
              <Route path="/solicitacoes"        element={<ListaSolicitacoes />} />
              {/* Nova solicitação — vendedor + admins + gerencia */}
              <Route
                path="/solicitacoes/nova"
                element={
                  <RotaPorRole roles={['vendedor', 'super_admin', 'adm', 'gerencia']}>
                    <NovaSolicitacao />
                  </RotaPorRole>
                }
              />
              <Route path="/solicitacoes/:id"    element={<DetalheSolicitacao />} />

              {/* Sprint 3+ — Fila de separação (almoxarife / estoquista) */}
              <Route path="/fila" element={<FilaSeparacao />} />

              {/* Agendamentos — gerencia + admins */}
              <Route
                path="/agendamentos"
                element={
                  <RotaPorRole roles={['gerencia', 'super_admin', 'adm']}>
                    <Agendamentos />
                  </RotaPorRole>
                }
              />

              {/* Motorista — entregas do dia */}
              <Route
                path="/motorista"
                element={
                  <RotaPorRole roles={['motorista']}>
                    <Motorista />
                  </RotaPorRole>
                }
              />

              {/* Sprint 6+ — Histórico (todos os roles) */}
              <Route path="/historico" element={<Historico />} />

              {/* Relatórios — admin e gerência */}
              <Route
                path="/relatorios"
                element={
                  <RotaPorRole roles={['super_admin', 'adm', 'gerencia']}>
                    <Relatorios />
                  </RotaPorRole>
                }
              />

              {/* Audit Log — super_admin e gerencia */}
              <Route
                path="/audit"
                element={
                  <RotaPorRole roles={['super_admin', 'gerencia']}>
                    <AuditLog />
                  </RotaPorRole>
                }
              />

              {/* Perfil — todos os usuários autenticados */}
              <Route path="/perfil" element={<Perfil />} />

              {/* Notificações — todos os usuários autenticados */}
              <Route path="/notificacoes" element={<Notificacoes />} />

              {/* 404 interno */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>

            {/* 404 externo */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </NotificacoesProvider>
      </BrowserRouter>
      </NetworkErrorProvider>

      {/* Toasts globais */}
      <ToastContainer toasts={toasts} onRemover={remover} />
    </ErrorBoundary>
  );
}
