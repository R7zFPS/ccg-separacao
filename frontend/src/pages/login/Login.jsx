/**
 * Página de Login — Casa das Correntes
 * Autenticação por nome de usuário + senha
 */

import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn, AlertCircle, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Spinner } from '../../components/ui/Spinner';
import { LogoCasaDasCorrentes } from '../../components/ui/Logo';

export default function Login() {
  const { login, estaAutenticado, precisaTrocarSenha } = useAuth();
  const navigate = useNavigate();

  const [form, setForm]                 = useState({ usuario_login: '', senha: '' });
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando]     = useState(false);
  const [erro, setErro]                 = useState('');

  if (estaAutenticado && !precisaTrocarSenha) return <Navigate to="/dashboard" replace />;
  if (estaAutenticado && precisaTrocarSenha)  return <Navigate to="/primeiro-acesso" replace />;

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (erro) setErro('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.usuario_login || !form.senha) {
      setErro('Preencha o usuário e a senha.');
      return;
    }
    setCarregando(true);
    setErro('');
    try {
      const usr = await login(form.usuario_login, form.senha);
      navigate(usr.primeiro_acesso ? '/primeiro-acesso' : '/dashboard', { replace: true });
    } catch (err) {
      setErro(
        err?.response?.data?.mensagem ||
        err?.message ||
        'Usuário ou senha incorretos.'
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="min-h-screen bg-marinho-900 flex">
      {/* Painel esquerdo — branding (apenas desktop) */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center
                       bg-gradient-to-br from-marinho-950 to-marinho-800 p-12">
        <LogoCasaDasCorrentes variante="vertical" className="mb-12" />

        <div className="max-w-xs text-center">
          <p className="text-marinho-200 text-sm leading-relaxed">
            Sistema de Separação de Estoque — gerencie solicitações, rastreie
            entregas e mantenha sua equipe sincronizada em tempo real.
          </p>
        </div>

        {/* Decoração — correntes */}
        <div className="mt-16 flex gap-3 opacity-20">
          {[...Array(6)].map((_, i) => (
            <div key={i}
              className="w-8 h-5 rounded-full border-4 border-marinho-300"
              style={{ marginTop: i % 2 === 0 ? 0 : 8 }}
            />
          ))}
        </div>
      </div>

      {/* Painel direito — formulário */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gray-50">
        <div className="w-full max-w-sm">
          {/* Logo mobile */}
          <div className="lg:hidden flex justify-center mb-8">
            <LogoCasaDasCorrentes
              variante="vertical"
              corIcone="text-marinho-700"
              corTexto="text-marinho-800"
            />
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="mb-7">
              <h2 className="text-xl font-bold text-gray-900">Entrar no sistema</h2>
              <p className="text-sm text-gray-500 mt-1">Use seu usuário e senha de acesso</p>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              <div className="space-y-4">
                {/* Usuário */}
                <div>
                  <label htmlFor="usuario_login"
                         className="block text-sm font-medium text-gray-700 mb-1.5">
                    Usuário
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      id="usuario_login"
                      type="text"
                      name="usuario_login"
                      autoComplete="username"
                      autoFocus
                      value={form.usuario_login}
                      onChange={handleChange}
                      placeholder="seu.usuario"
                      className="input-base pl-9"
                      disabled={carregando}
                      required
                    />
                  </div>
                </div>

                {/* Senha */}
                <div>
                  <label htmlFor="senha"
                         className="block text-sm font-medium text-gray-700 mb-1.5">
                    Senha
                  </label>
                  <div className="relative">
                    <input
                      id="senha"
                      type={mostrarSenha ? 'text' : 'password'}
                      name="senha"
                      autoComplete="current-password"
                      value={form.senha}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="input-base pr-10"
                      disabled={carregando}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarSenha(!mostrarSenha)}
                      className="absolute right-3 top-1/2 -translate-y-1/2
                                  text-gray-400 hover:text-gray-600 transition-colors"
                      tabIndex={-1}
                      aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                    >
                      {mostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Erro */}
                {erro && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border
                                   border-red-200 rounded-lg text-red-700 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{erro}</span>
                  </div>
                )}

                {/* Botão */}
                <button
                  type="submit"
                  disabled={carregando}
                  className="btn-primario w-full justify-center py-2.5 text-base mt-2"
                >
                  {carregando
                    ? <><Spinner tamanho="sm" /><span>Entrando...</span></>
                    : <><LogIn className="w-4 h-4" /><span>Entrar</span></>
                  }
                </button>
              </div>
            </form>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            © 2025 Casa das Correntes Guanabara Ltda
          </p>
        </div>
      </div>
    </div>
  );
}
