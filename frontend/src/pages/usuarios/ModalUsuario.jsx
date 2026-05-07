/**
 * Modal de criação e edição de usuários
 * Suporte a múltiplos perfis por usuário (role principal + roles_extra)
 */

import { useState } from 'react';
import { X, Save, Eye, EyeOff, Info } from 'lucide-react';
import { usuariosApi } from '../../services/api';
import { Spinner } from '../../components/ui/Spinner';
import { LABELS_ROLE, LABELS_SETOR } from '../../utils/constantes';

// Todos os roles disponíveis para seleção
const TODOS_ROLES = Object.keys(LABELS_ROLE);

export default function ModalUsuario({ usuario, onFechar, onSalvo }) {
  const ehEdicao = !!usuario;

  const [form, setForm] = useState({
    nome:          usuario?.nome          || '',
    usuario_login: usuario?.usuario_login || '',
    email:         usuario?.email         || '',
    senha:         '',
    role:          usuario?.role          || 'vendedor',
    roles_extra:   Array.isArray(usuario?.roles_extra) ? usuario.roles_extra : [],
    setor:         usuario?.setor         || 'ambos',
  });
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando]     = useState(false);
  const [erro, setErro]                 = useState('');

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((p) => {
      const novo = { ...p, [name]: value };
      // Se mudou o role principal, remove ele dos extras automaticamente
      if (name === 'role') {
        novo.roles_extra = p.roles_extra.filter((r) => r !== value);
      }
      return novo;
    });
    if (erro) setErro('');
  }

  function toggleRoleExtra(role) {
    setForm((p) => {
      const jatem = p.roles_extra.includes(role);
      return {
        ...p,
        roles_extra: jatem
          ? p.roles_extra.filter((r) => r !== role)
          : [...p.roles_extra, role],
      };
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.usuario_login.trim()) {
      setErro('Informe o nome de usuário para login.');
      return;
    }
    if (!ehEdicao && !form.senha) {
      setErro('Informe a senha do novo usuário.');
      return;
    }

    setCarregando(true);
    setErro('');

    try {
      const dados = { ...form };
      if (!dados.senha) delete dados.senha;

      if (ehEdicao) {
        await usuariosApi.atualizar(usuario.id, dados);
      } else {
        await usuariosApi.criar(dados);
      }
      onSalvo(ehEdicao);
    } catch (err) {
      if (!err?.response) {
        setErro('Não foi possível conectar ao servidor. Verifique se o backend está rodando.');
      } else {
        setErro(err?.response?.data?.mensagem || 'Erro ao salvar usuário.');
      }
    } finally {
      setCarregando(false);
    }
  }

  // Roles disponíveis para perfis adicionais (exclui o role principal)
  const rolesParaExtras = TODOS_ROLES.filter((r) => r !== form.role);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header do modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="text-lg font-semibold text-gray-900">
            {ehEdicao ? 'Editar Usuário' : 'Novo Usuário'}
          </h2>
          <button
            onClick={onFechar}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Fechar"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nome completo
            </label>
            <input
              type="text"
              name="nome"
              value={form.nome}
              onChange={handleChange}
              className="input-base"
              required
              disabled={carregando}
            />
          </div>

          {/* Login */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nome de usuário <span className="text-marinho-600 text-xs">(para login)</span>
            </label>
            <input
              type="text"
              name="usuario_login"
              value={form.usuario_login}
              onChange={handleChange}
              className="input-base font-mono"
              placeholder="ex: joao.silva"
              required
              disabled={carregando}
              autoComplete="off"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Email <span className="text-gray-400 text-xs">(opcional)</span>
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="input-base"
              placeholder="email@empresa.com"
              disabled={carregando}
            />
          </div>

          {/* Senha */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {ehEdicao ? 'Nova senha (deixe em branco para não alterar)' : 'Senha inicial'}
            </label>
            {!ehEdicao && (
              <p className="text-xs text-marinho-600 mb-1.5 bg-marinho-50 rounded px-2 py-1">
                💡 Deixe em branco para usar a senha padrão: <strong>Correntes2589@</strong>
                <br />O usuário será obrigado a trocar no primeiro acesso.
              </p>
            )}
            <div className="relative">
              <input
                type={mostrarSenha ? 'text' : 'password'}
                name="senha"
                value={form.senha}
                onChange={handleChange}
                className="input-base pr-10"
                placeholder={ehEdicao ? '••••••••' : 'Padrão: Correntes2589@'}
                disabled={carregando}
              />
              <button
                type="button"
                onClick={() => setMostrarSenha(!mostrarSenha)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                tabIndex={-1}
              >
                {mostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Perfil Principal + Setor */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Perfil Principal
              </label>
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className="input-base"
                disabled={carregando}
              >
                {Object.entries(LABELS_ROLE).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Setor
              </label>
              <select
                name="setor"
                value={form.setor}
                onChange={handleChange}
                className="input-base"
                disabled={carregando}
              >
                {Object.entries(LABELS_SETOR).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Perfis Adicionais */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Perfis Adicionais
              </label>
              <span className="group relative">
                <Info className="w-3.5 h-3.5 text-gray-400 cursor-help" />
                <span className="hidden group-hover:block absolute left-5 -top-1 z-10 w-56
                                  text-xs bg-gray-800 text-white rounded-lg px-3 py-2 shadow-xl">
                  Permissões extras além do perfil principal. Ex: Matheus pode ser
                  Logística + Vendedor.
                </span>
              </span>
            </div>

            {rolesParaExtras.length === 0 ? (
              <p className="text-xs text-gray-400 italic">
                Nenhum perfil adicional disponível para este tipo.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {rolesParaExtras.map((role) => {
                  const selecionado = form.roles_extra.includes(role);
                  return (
                    <label
                      key={role}
                      className={`
                        flex items-center gap-2.5 px-3 py-2 rounded-lg border cursor-pointer
                        text-sm transition-colors select-none
                        ${selecionado
                          ? 'bg-marinho-50 border-marinho-400 text-marinho-800 font-medium'
                          : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                        }
                        ${carregando ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
                    >
                      <input
                        type="checkbox"
                        checked={selecionado}
                        onChange={() => !carregando && toggleRoleExtra(role)}
                        className="rounded border-gray-300 text-marinho-600
                                    focus:ring-marinho-500 w-4 h-4"
                      />
                      {LABELS_ROLE[role]}
                    </label>
                  );
                })}
              </div>
            )}

            {/* Resumo dos perfis ativos */}
            {(form.roles_extra.length > 0) && (
              <p className="text-xs text-marinho-600 mt-2 bg-marinho-50 rounded px-2 py-1.5">
                ✔ Este usuário terá acesso como: <strong>{LABELS_ROLE[form.role]}</strong>
                {form.roles_extra.map((r) => (
                  <span key={r}> + <strong>{LABELS_ROLE[r]}</strong></span>
                ))}
              </p>
            )}
          </div>

          {/* Erro */}
          {erro && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
              {erro}
            </div>
          )}

          {/* Ações */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onFechar}
              disabled={carregando}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100
                          rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button type="submit" disabled={carregando} className="btn-primario">
              {carregando ? <Spinner tamanho="sm" /> : <Save className="w-4 h-4" />}
              {ehEdicao ? 'Salvar alterações' : 'Criar usuário'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
