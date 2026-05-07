/**
 * Página de Gerenciamento de Usuários
 * Acessível apenas para super_admin
 */

import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, UserX, UserCheck, Shield, AlertTriangle } from 'lucide-react';
import { usuariosApi } from '../../services/api';
import { Spinner } from '../../components/ui/Spinner';
import { LABELS_ROLE, LABELS_SETOR } from '../../utils/constantes';
import { formatarData, gerarIniciais } from '../../utils/formatters';
import ModalUsuario from './ModalUsuario';
import { useToast }       from '../../hooks/useToast';
import { ToastContainer } from '../../components/ui/Toast';
import { usePageTitle }     from '../../hooks/usePageTitle';
import { ModalConfirmacao } from '../../components/ui/ModalConfirmacao';
import { resolveFileUrl } from '../../utils/arquivos';

export default function Usuarios() {
  usePageTitle('Usuários');
  const toast = useToast();

  const [usuarios, setUsuarios]       = useState([]);
  const [carregando, setCarregando]   = useState(true);
  const [busca, setBusca]             = useState('');
  const [filtroRole, setFiltroRole]   = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [erro, setErro]               = useState('');

  // Modal de confirmação — desativar usuário
  const [modalDesativar,   setModalDesativar]   = useState(false);
  const [usuarioAlvo,      setUsuarioAlvo]      = useState(null);
  const [desativando,      setDesativando]      = useState(false);

  async function buscarUsuarios() {
    setCarregando(true);
    setErro('');
    try {
      const params = {};
      if (filtroRole) params.role = filtroRole;
      const { data } = await usuariosApi.listar(params);
      if (data.sucesso) setUsuarios(data.dados.usuarios);
    } catch (err) {
      if (!err?.response) {
        setErro('Não foi possível conectar ao servidor. Verifique se o backend está rodando.');
      } else if (err.response?.status === 401) {
        setErro('Sessão expirada. Faça login novamente.');
      } else if (err.response?.status === 403) {
        setErro('Você não tem permissão para visualizar usuários.');
      } else {
        setErro(err?.response?.data?.mensagem || 'Erro ao carregar usuários.');
      }
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => { buscarUsuarios(); }, [filtroRole]);

  // Desativar exige confirmação; reativar é direto
  function pedirConfirmacaoDesativar(usuario) {
    if (usuario.ativo) {
      setUsuarioAlvo(usuario);
      setModalDesativar(true);
    } else {
      // Reativar não precisa de confirmação
      toggleAtivo(usuario);
    }
  }

  async function toggleAtivo(usuario) {
    setDesativando(true);
    try {
      if (usuario.ativo) {
        await usuariosApi.desativar(usuario.id);
        toast.alerta('Usuário desativado', `${usuario.nome} foi desativado com sucesso.`);
      } else {
        await usuariosApi.atualizar(usuario.id, { ativo: true });
        toast.sucesso('Usuário ativado', `${usuario.nome} foi ativado com sucesso.`);
      }
      buscarUsuarios();
    } catch {
      setErro('Erro ao alterar status do usuário.');
      toast.erro('Erro', 'Não foi possível alterar o status do usuário.');
    } finally {
      setDesativando(false);
      setModalDesativar(false);
      setUsuarioAlvo(null);
    }
  }

  const usuariosFiltrados = usuarios.filter((u) =>
    u.nome.toLowerCase().includes(busca.toLowerCase()) ||
    (u.usuario_login || '').toLowerCase().includes(busca.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(busca.toLowerCase())
  );

  function abrirEdicao(usuario) {
    setUsuarioEditando(usuario);
    setModalAberto(true);
  }

  function abrirCriacao() {
    setUsuarioEditando(null);
    setModalAberto(true);
  }

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toast.toasts} onRemover={toast.remover} />
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-600" />
            Usuários
          </h1>
          <p className="text-gray-500 mt-1">
            Gerencie os usuários e seus perfis de acesso
          </p>
        </div>
        <button onClick={abrirCriacao} className="btn-primario">
          <Plus className="w-4 h-4" />
          Novo Usuário
        </button>
      </div>

      {/* Filtros */}
      <div className="card-base p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome ou usuário..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="input-base pl-9"
          />
        </div>
        <select
          value={filtroRole}
          onChange={(e) => setFiltroRole(e.target.value)}
          className="input-base w-full sm:w-48"
        >
          <option value="">Todos os perfis</option>
          {Object.entries(LABELS_ROLE).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {/* Erro */}
      {erro && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
          {erro}
        </div>
      )}

      {/* Tabela */}
      <div className="card-base overflow-hidden">
        {carregando ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : usuariosFiltrados.length === 0 ? (
          <div className="text-center py-12">
            <Shield className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Nenhum usuário encontrado.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Nome</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Usuário / Login</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Perfil</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Setor</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Status</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Criado em</th>
                  <th className="text-right px-4 py-3 text-gray-500 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {usuariosFiltrados.map((usuario) => (
                  <tr key={usuario.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {/* Mini avatar */}
                        <div className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden
                                         bg-marinho-600 border border-marinho-200">
                          {usuario.foto_perfil ? (
                            <img
                              src={resolveFileUrl(usuario.foto_perfil)}
                              alt={usuario.nome}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="w-full h-full flex items-center justify-center
                                              text-white text-xs font-bold">
                              {gerarIniciais(usuario.nome)}
                            </span>
                          )}
                        </div>
                        <span className="font-medium text-gray-900">{usuario.nome}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      <span className="font-mono text-sm">{usuario.usuario_login}</span>
                      {usuario.email && (
                        <span className="block text-xs text-gray-400">{usuario.email}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {/* Role principal */}
                        <span className="badge-status bg-marinho-100 text-marinho-800 font-semibold">
                          {LABELS_ROLE[usuario.role] || usuario.role}
                        </span>
                        {/* Roles extras */}
                        {Array.isArray(usuario.roles_extra) &&
                          usuario.roles_extra.map((r) => (
                            <span key={r} className="badge-status bg-gray-100 text-gray-600 text-xs">
                              +{LABELS_ROLE[r] || r}
                            </span>
                          ))
                        }
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {LABELS_SETOR[usuario.setor] || usuario.setor}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        <span className={`badge-status ${
                          usuario.ativo
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}>
                          {usuario.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                        {usuario.primeiro_acesso ? (
                          <span
                            className="badge-status bg-amber-100 text-amber-700
                                        flex items-center gap-1"
                            title="Usuário ainda não definiu a senha"
                          >
                            <AlertTriangle className="w-3 h-3" />
                            Aguard. senha
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {formatarData(usuario.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => abrirEdicao(usuario)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600
                                      hover:bg-blue-50 transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => pedirConfirmacaoDesativar(usuario)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            usuario.ativo
                              ? 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                              : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                          }`}
                          title={usuario.ativo ? 'Desativar' : 'Ativar'}
                        >
                          {usuario.ativo
                            ? <UserX      className="w-4 h-4" />
                            : <UserCheck  className="w-4 h-4" />
                          }
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de criação/edição */}
      {modalAberto && (
        <ModalUsuario
          usuario={usuarioEditando}
          onFechar={() => setModalAberto(false)}
          onSalvo={(ehEdicao) => {
            setModalAberto(false);
            buscarUsuarios();
            toast.sucesso(
              ehEdicao ? 'Usuário atualizado' : 'Usuário criado',
              ehEdicao
                ? 'As alterações foram salvas com sucesso.'
                : 'Novo usuário criado. A senha provisória é Correntes2589@'
            );
          }}
        />
      )}

      {/* Modal de confirmação — Desativar usuário */}
      <ModalConfirmacao
        aberto={modalDesativar}
        titulo="Desativar usuário"
        mensagem={`Tem certeza que deseja desativar ${usuarioAlvo?.nome}? O usuário não conseguirá mais fazer login enquanto estiver desativado.`}
        textoBotao="Sim, desativar"
        variante="aviso"
        carregando={desativando}
        onConfirmar={() => usuarioAlvo && toggleAtivo(usuarioAlvo)}
        onCancelar={() => { setModalDesativar(false); setUsuarioAlvo(null); }}
      />
    </div>
  );
}
