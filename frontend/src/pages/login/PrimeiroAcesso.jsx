/**
 * Página de Troca de Senha — Primeiro Acesso
 * Exibida obrigatoriamente quando primeiro_acesso = 1
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, KeyRound, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Spinner } from '../../components/ui/Spinner';

export default function PrimeiroAcesso() {
  const { usuario, trocarSenhaPrimeiroAcesso, logout } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ novaSenha: '', confirmar: '' });
  const [mostrar, setMostrar]       = useState({ nova: false, confirmar: false });
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro]             = useState('');
  const [sucesso, setSucesso]       = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (erro) setErro('');
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (form.novaSenha.length < 8) {
      setErro('A senha deve ter pelo menos 8 caracteres.');
      return;
    }
    if (!/[A-Z]/.test(form.novaSenha)) {
      setErro('A senha deve ter ao menos uma letra maiúscula.');
      return;
    }
    if (!/[0-9]/.test(form.novaSenha)) {
      setErro('A senha deve ter ao menos um número.');
      return;
    }
    if (form.novaSenha !== form.confirmar) {
      setErro('As senhas não coincidem.');
      return;
    }

    setCarregando(true);
    setErro('');
    try {
      await trocarSenhaPrimeiroAcesso(form.novaSenha);
      setSucesso(true);
      // Redireciona após 2 segundos
      setTimeout(() => navigate('/dashboard', { replace: true }), 2000);
    } catch (err) {
      setErro(err?.response?.data?.mensagem || err?.message || 'Erro ao definir senha.');
    } finally {
      setCarregando(false);
    }
  }

  if (sucesso) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100
                      flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-sm w-full">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center
                           justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-marinho-900 mb-2">Senha definida!</h2>
          <p className="text-marinho-400 text-sm">Redirecionando para o sistema...</p>
          <Spinner tamanho="sm" className="mx-auto mt-4" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-marinho-50 to-indigo-100
                    flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Ícone */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-yellow-100 rounded-2xl flex items-center
                             justify-center mx-auto mb-3">
              <KeyRound className="w-7 h-7 text-yellow-600" />
            </div>
            <h1 className="text-xl font-bold text-marinho-900">Defina sua senha</h1>
            <p className="text-sm text-marinho-400 mt-1">
              Olá, <strong>{usuario?.nome}</strong>! Este é seu primeiro acesso.
              <br />Crie uma senha pessoal para continuar.
            </p>
          </div>

          {/* Requisitos */}
          <div className="bg-marinho-50 rounded-lg p-3 text-xs text-marinho-400 mb-5 space-y-1">
            <p className="font-medium text-marinho-600 mb-1">Requisitos da senha:</p>
            <p className={form.novaSenha.length >= 8 ? 'text-green-600' : ''}>
              {form.novaSenha.length >= 8 ? '✓' : '·'} Mínimo 8 caracteres
            </p>
            <p className={/[A-Z]/.test(form.novaSenha) ? 'text-green-600' : ''}>
              {/[A-Z]/.test(form.novaSenha) ? '✓' : '·'} Ao menos uma letra maiúscula
            </p>
            <p className={/[0-9]/.test(form.novaSenha) ? 'text-green-600' : ''}>
              {/[0-9]/.test(form.novaSenha) ? '✓' : '·'} Ao menos um número
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Nova senha */}
            <div>
              <label className="block text-sm font-medium text-marinho-700 mb-1.5">
                Nova senha
              </label>
              <div className="relative">
                <input
                  type={mostrar.nova ? 'text' : 'password'}
                  name="novaSenha"
                  value={form.novaSenha}
                  onChange={handleChange}
                  placeholder="Crie uma senha segura"
                  className="input-base pr-10"
                  disabled={carregando}
                  required
                />
                <button type="button" tabIndex={-1}
                  onClick={() => setMostrar((p) => ({ ...p, nova: !p.nova }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-marinho-300">
                  {mostrar.nova ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirmar */}
            <div>
              <label className="block text-sm font-medium text-marinho-700 mb-1.5">
                Confirmar senha
              </label>
              <div className="relative">
                <input
                  type={mostrar.confirmar ? 'text' : 'password'}
                  name="confirmar"
                  value={form.confirmar}
                  onChange={handleChange}
                  placeholder="Repita a senha"
                  className="input-base pr-10"
                  disabled={carregando}
                  required
                />
                <button type="button" tabIndex={-1}
                  onClick={() => setMostrar((p) => ({ ...p, confirmar: !p.confirmar }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-marinho-300">
                  {mostrar.confirmar ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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

            <button type="submit" disabled={carregando}
                    className="btn-primario w-full justify-center py-2.5">
              {carregando
                ? <><Spinner tamanho="sm" /><span>Salvando...</span></>
                : <><KeyRound className="w-4 h-4" /><span>Definir minha senha</span></>
              }
            </button>
          </form>

          <button onClick={logout}
                  className="w-full mt-3 text-xs text-marinho-300 hover:text-marinho-600
                              text-center transition-colors">
            Sair e entrar com outra conta
          </button>
        </div>
      </div>
    </div>
  );
}
