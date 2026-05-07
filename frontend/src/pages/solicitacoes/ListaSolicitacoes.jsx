/**
 * Página — Lista de Solicitações
 * Vista adaptada por role:
 *  - Vendedor: próprias solicitações
 *  - Estoquista/Almoxarife: fila do seu setor (cards mobile-first)
 *  - Coordenador/Adm/Diretor: todas com filtros completos
 *  - Gerente de Vendas: material_separado → agendamento
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Plus, Search, Filter, RefreshCw, Package,
  ChevronDown, Calendar, X,
} from 'lucide-react';
import { solicitacoesApi }  from '../../services/api';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useAuth }           from '../../context/AuthContext';
import { Spinner }           from '../../components/ui/Spinner';
import { BadgeStatus }       from '../../components/solicitacoes/BadgeStatus';
import { BadgePrioridade }   from '../../components/solicitacoes/BadgePrioridade';
import { CardSolicitacao }   from '../../components/solicitacoes/CardSolicitacao';
import { LABELS_SETOR, LABELS_STATUS, LABELS_PRIORIDADE } from '../../utils/constantes';
import { formatarDataHora }  from '../../utils/formatters';
import { ErroCarregamento } from '../../components/ui/ErroCarregamento';

const ROLES_ADMIN    = ['super_admin', 'adm'];
const ROLES_SEPARACAO = ['estoquista', 'almoxarife'];

const PERIODOS_RAPIDOS = [
  { label: 'Hoje',    dias: 0 },
  { label: '7 dias',  dias: 7 },
  { label: '30 dias', dias: 30 },
];

export default function ListaSolicitacoes() {
  usePageTitle('Solicitações');
  const { usuario } = useAuth();
  const navigate    = useNavigate();
  const [searchParams] = useSearchParams();

  const [solicitacoes, setSolicitacoes] = useState([]);
  const [total,        setTotal]        = useState(0);
  const [carregando,   setCarregando]   = useState(true);
  const [erro,         setErro]         = useState('');

  // ── Inputs do formulário (não disparam busca automaticamente) ──
  const [filtros, setFiltros] = useState({
    status:        searchParams.get('status') || '',
    prioridade:    '',
    setor_destino: '',
    busca:         '',
    data_inicio:   '',
    data_fim:      '',
  });

  // ── Paginação ─────────────────────────────────────────────────
  const POR_PAGINA = 20;
  const [paginaAtual, setPaginaAtual] = useState(1);
  const totalPaginas = Math.ceil(total / POR_PAGINA);

  // ── Contador que dispara a busca explicitamente ───────────────
  const [gatilho, setGatilho] = useState(0);

  // Ref para ler valores de filtro sem stale closure
  const filtrosRef = useRef(filtros);
  useEffect(() => { filtrosRef.current = filtros; });

  const role        = usuario?.role;
  const ehSeparador = ROLES_SEPARACAO.includes(role);
  const ehAdmin     = ROLES_ADMIN.includes(role);

  // ── Busca efetiva — acionada por gatilho ou mudança de página ─
  useEffect(() => {
    let cancelado = false;
    const f = filtrosRef.current;

    setCarregando(true);
    setErro('');

    const params = { pagina: paginaAtual, limite: POR_PAGINA };
    if (f.status)        params.status        = f.status;
    if (f.prioridade)    params.prioridade    = f.prioridade;
    if (f.setor_destino) params.setor_destino = f.setor_destino;
    if (f.busca)         params.busca         = f.busca;
    if (f.data_inicio)   params.data_inicio   = f.data_inicio;
    if (f.data_fim)      params.data_fim      = f.data_fim;

    solicitacoesApi.listar(params)
      .then(({ data }) => {
        if (!cancelado && data.sucesso) {
          setSolicitacoes(data.dados.solicitacoes);
          setTotal(data.dados.total ?? data.dados.solicitacoes?.length ?? 0);
        }
      })
      .catch(() => { if (!cancelado) setErro('Erro ao carregar solicitações.'); })
      .finally(() => { if (!cancelado) setCarregando(false); });

    return () => { cancelado = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gatilho, paginaAtual]);

  function handleFiltro(campo, valor) {
    setFiltros((p) => ({ ...p, [campo]: valor }));
  }

  function executarBusca() {
    if (paginaAtual !== 1) {
      setPaginaAtual(1); // dispara via dep paginaAtual
    } else {
      setGatilho((g) => g + 1);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') executarBusca();
  }

  // ── Atalhos de período ────────────────────────────────────────
  function aplicarPeriodo(dias) {
    const hoje   = new Date();
    const inicio = new Date(hoje);
    if (dias > 0) inicio.setDate(hoje.getDate() - dias);
    const fmt = (d) => d.toISOString().slice(0, 10);
    setFiltros((p) => ({ ...p, data_inicio: fmt(inicio), data_fim: fmt(hoje) }));
  }
  function limparPeriodo() {
    setFiltros((p) => ({ ...p, data_inicio: '', data_fim: '' }));
  }

  // ── Título e ação principal por role ─────────────────────────
  const config = {
    vendedor:    { titulo: 'Minhas Solicitações',    botaoNovo: true },
    estoquista:  { titulo: 'Fila de Pedidos',        botaoNovo: false },
    almoxarife:  { titulo: 'Fila de Separação',      botaoNovo: false },
    super_admin: { titulo: 'Todas as Solicitações',  botaoNovo: true },
    adm:         { titulo: 'Solicitações',           botaoNovo: true },
    gerencia:    { titulo: 'Todas as Solicitações',  botaoNovo: true },
    fiscal:      { titulo: 'Emissão de Nota Fiscal', botaoNovo: false },
    motorista:   { titulo: 'Minhas Entregas',        botaoNovo: false },
  }[role] || { titulo: 'Solicitações', botaoNovo: false };

  const temFiltros = filtros.status || filtros.prioridade || filtros.setor_destino
    || filtros.busca || filtros.data_inicio || filtros.data_fim;

  return (
    <div className="space-y-5">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{config.titulo}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {total} solicitaç{total === 1 ? 'ão' : 'ões'} encontrada{total === 1 ? '' : 's'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={executarBusca}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            title="Atualizar"
          >
            <RefreshCw className={`w-4 h-4 ${carregando ? 'animate-spin' : ''}`} />
          </button>
          {config.botaoNovo && (
            <button
              onClick={() => navigate('/solicitacoes/nova')}
              className="btn-primario"
            >
              <Plus className="w-4 h-4" />
              Nova Solicitação
            </button>
          )}
        </div>
      </div>

      {/* Filtros */}
      <div className="card-base p-4 space-y-3">
        {/* Linha principal: busca + status + prioridade + setor */}
        <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
          {/* Busca */}
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por proposta ou vendedor..."
              value={filtros.busca}
              onChange={(e) => handleFiltro('busca', e.target.value)}
              onKeyDown={handleKeyDown}
              className="input-base pl-9"
            />
          </div>

          {/* Status */}
          <div className="relative">
            <select
              value={filtros.status}
              onChange={(e) => handleFiltro('status', e.target.value)}
              className="input-base appearance-none pr-8 w-full sm:w-44"
            >
              <option value="">Todos os status</option>
              {Object.entries(LABELS_STATUS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4
                                     text-gray-400 pointer-events-none" />
          </div>

          {/* Prioridade */}
          <div className="relative">
            <select
              value={filtros.prioridade}
              onChange={(e) => handleFiltro('prioridade', e.target.value)}
              className="input-base appearance-none pr-8 w-full sm:w-44"
            >
              <option value="">Todas as prioridades</option>
              {Object.entries(LABELS_PRIORIDADE).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4
                                     text-gray-400 pointer-events-none" />
          </div>

          {/* Setor — só admins */}
          {ehAdmin && (
            <div className="relative">
              <select
                value={filtros.setor_destino}
                onChange={(e) => handleFiltro('setor_destino', e.target.value)}
                className="input-base appearance-none pr-8 w-full sm:w-36"
              >
                <option value="">Todos setores</option>
                {Object.entries(LABELS_SETOR).filter(([v]) => v !== 'ambos').map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4
                                       text-gray-400 pointer-events-none" />
            </div>
          )}
        </div>

        {/* Linha de período + botão buscar */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100">
          <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
          {PERIODOS_RAPIDOS.map(({ label, dias }) => (
            <button
              key={label}
              onClick={() => aplicarPeriodo(dias)}
              className="text-xs px-2.5 py-1 rounded-full border border-gray-200
                         text-gray-600 hover:border-marinho-400 hover:text-marinho-700
                         hover:bg-marinho-50 transition-colors"
            >
              {label}
            </button>
          ))}
          <span className="text-gray-300 text-xs">|</span>
          <input
            type="date"
            value={filtros.data_inicio}
            onChange={(e) => handleFiltro('data_inicio', e.target.value)}
            className="input-base text-xs py-1.5 w-36"
          />
          <span className="text-gray-400 text-xs">até</span>
          <input
            type="date"
            value={filtros.data_fim}
            onChange={(e) => handleFiltro('data_fim', e.target.value)}
            className="input-base text-xs py-1.5 w-36"
          />
          {(filtros.data_inicio || filtros.data_fim) && (
            <button
              onClick={limparPeriodo}
              className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700"
            >
              <X className="w-3 h-3" /> limpar datas
            </button>
          )}

          {/* Botão buscar — destacado */}
          <button
            onClick={executarBusca}
            disabled={carregando}
            className="ml-auto flex items-center gap-2 px-4 py-2 rounded-lg bg-marinho-600
                        text-white text-sm font-medium hover:bg-marinho-700 transition-colors
                        disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {carregando
              ? <RefreshCw className="w-4 h-4 animate-spin" />
              : <Search className="w-4 h-4" />
            }
            Buscar
          </button>

          {temFiltros && (
            <button
              onClick={() => {
                setFiltros({ status: '', prioridade: '', setor_destino: '', busca: '', data_inicio: '', data_fim: '' });
                setGatilho((g) => g + 1);
              }}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700
                          px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-4 h-4" /> Limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* Erro de carregamento com retry */}
      {erro && !carregando && (
        <ErroCarregamento
          mensagem={erro}
          onTentar={() => setGatilho((g) => g + 1)}
          tentando={carregando}
        />
      )}

      {/* Conteúdo */}
      {carregando ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : solicitacoes.length === 0 ? (
        <div className="card-base p-12 text-center">
          <Package className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Nenhuma solicitação encontrada</p>
          <p className="text-sm text-gray-400 mt-1">
            Ajuste os filtros e clique em <strong>Buscar</strong>.
          </p>
          {role === 'vendedor' && (
            <button
              onClick={() => navigate('/solicitacoes/nova')}
              className="btn-primario mt-4 mx-auto"
            >
              <Plus className="w-4 h-4" />
              Criar primeira solicitação
            </button>
          )}
        </div>
      ) : ehSeparador ? (
        /* ── Cards mobile para estoquistas ─────────────── */
        <div className="space-y-3">
          {solicitacoes.map((s) => (
            <CardSolicitacao key={s.id} solicitacao={s} />
          ))}
        </div>
      ) : (
        /* ── Tabela desktop ─────────────────────────────── */
        <div className="card-base overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left">
                  <th className="px-4 py-3 text-gray-500 font-medium">Proposta</th>
                  {ehAdmin && (
                    <th className="px-4 py-3 text-gray-500 font-medium">Vendedor</th>
                  )}
                  <th className="px-4 py-3 text-gray-500 font-medium">Setor</th>
                  <th className="px-4 py-3 text-gray-500 font-medium">Prioridade</th>
                  <th className="px-4 py-3 text-gray-500 font-medium">Status</th>
                  <th className="px-4 py-3 text-gray-500 font-medium">Estoquista</th>
                  <th className="px-4 py-3 text-gray-500 font-medium">Criado em</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {solicitacoes.map((s) => (
                  <tr
                    key={s.id}
                    onClick={() => navigate(`/solicitacoes/${s.id}`)}
                    className="hover:bg-blue-50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900">#{s.numero_proposta}</p>
                      {s.numero_orcamento && (
                        <p className="text-xs text-gray-400">Orç: {s.numero_orcamento}</p>
                      )}
                    </td>
                    {ehAdmin && (
                      <td className="px-4 py-3 text-gray-600">{s.vendedor_nome}</td>
                    )}
                    <td className="px-4 py-3 text-gray-600 capitalize">
                      {LABELS_SETOR[s.setor_destino]}
                    </td>
                    <td className="px-4 py-3">
                      <BadgePrioridade prioridade={s.prioridade} />
                      {!s.prioridade && <span className="text-xs text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <BadgeStatus status={s.status} />
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {s.estoquista_nome || <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {formatarDataHora(s.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Paginação */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            Página {paginaAtual} de {totalPaginas}
            {' '}({total} registros)
          </span>
          <div className="flex gap-2">
            <button
              disabled={paginaAtual <= 1 || carregando}
              onClick={() => setPaginaAtual((p) => p - 1)}
              className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40
                          hover:bg-gray-50 transition-colors disabled:cursor-not-allowed"
            >
              ← Anterior
            </button>
            <button
              disabled={paginaAtual >= totalPaginas || carregando}
              onClick={() => setPaginaAtual((p) => p + 1)}
              className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40
                          hover:bg-gray-50 transition-colors disabled:cursor-not-allowed"
            >
              Próxima →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
