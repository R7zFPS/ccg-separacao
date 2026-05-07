/**
 * Histórico de Solicitações
 * Visível para: todos os perfis (filtragem por role no backend)
 * Mostra o histórico completo com filtros de status, datas e busca livre
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock, Search, ChevronRight, RefreshCw,
  CheckCircle, XCircle, Download,
} from 'lucide-react';
import { solicitacoesApi } from '../../services/api';
import { usePageTitle }     from '../../hooks/usePageTitle';
import { useAuth }          from '../../context/AuthContext';
import { Spinner }          from '../../components/ui/Spinner';
import { BadgeStatus }      from '../../components/solicitacoes/BadgeStatus';
import { BadgePrioridade }  from '../../components/solicitacoes/BadgePrioridade';
import { ErroCarregamento } from '../../components/ui/ErroCarregamento';
import { LABELS_STATUS, LABELS_LOCAL_MATERIAL } from '../../utils/constantes';
import { formatarDataHora, tempoRelativo } from '../../utils/formatters';

// Todos os status para o filtro
const OPCOES_STATUS = [
  { value: '', label: 'Todos os status' },
  ...Object.entries(LABELS_STATUS).map(([value, label]) => ({ value, label })),
];

export default function Historico() {
  usePageTitle('Histórico');
  const { usuario, eAdmin } = useAuth();
  const roleEhVendedor = usuario?.role === 'vendedor';
  const navigate = useNavigate();

  const [solicitacoes, setSolicitacoes] = useState([]);
  const [carregando, setCarregando]     = useState(false);
  const [erro,        setErro]          = useState('');

  // ── Inputs do formulário de filtro ──────────────────────
  const [busca,        setBusca]        = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [dataInicio,   setDataInicio]   = useState('');
  const [dataFim,      setDataFim]      = useState('');

  // ── Estado do que foi efetivamente buscado ───────────────
  const [paginaAtual,  setPaginaAtual]  = useState(1);
  const [total,        setTotal]        = useState(0);
  const [gatilho,      setGatilho]      = useState(0); // incrementa ao clicar "Buscar"

  const POR_PAGINA = 20;
  const totalPaginas = Math.ceil(total / POR_PAGINA);

  // Refs para acessar valores de filtro dentro do useEffect sem stale closure
  const filtrosRef = useRef({ busca, filtroStatus, dataInicio, dataFim });
  useEffect(() => {
    filtrosRef.current = { busca, filtroStatus, dataInicio, dataFim };
  });

  // ── Busca real (acionada por gatilho ou mudança de página) ──
  useEffect(() => {
    let cancelado = false;
    const { busca: b, filtroStatus: fs, dataInicio: di, dataFim: df } = filtrosRef.current;

    setCarregando(true);
    setErro('');

    const params = { pagina: paginaAtual, limite: POR_PAGINA };
    if (fs)       params.status      = fs;
    if (di)       params.data_inicio = di;
    if (df)       params.data_fim    = df;
    if (b.trim()) params.busca       = b.trim();
    if (roleEhVendedor) params.vendedor_id = usuario?.id;

    solicitacoesApi.listar(params)
      .then(({ data }) => {
        if (!cancelado && data.sucesso) {
          setSolicitacoes(data.dados?.solicitacoes || []);
          setTotal(data.dados?.total ?? 0);
        }
      })
      .catch(() => {
        if (!cancelado) setErro('Erro ao carregar histórico. Verifique sua conexão.');
      })
      .finally(() => { if (!cancelado) setCarregando(false); });

    return () => { cancelado = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paginaAtual, gatilho, roleEhVendedor, usuario?.id]);

  // ── Executa busca (reseta página se necessário) ──────────
  function executarBusca() {
    if (paginaAtual !== 1) {
      setPaginaAtual(1);         // useEffect dispara via mudança de pagina
    } else {
      setGatilho((g) => g + 1); // mesma pagina, força novo fetch
    }
  }

  // ── Suporte a Enter no campo de texto ───────────────────
  function handleKeyDown(e) {
    if (e.key === 'Enter') executarBusca();
  }

  // ── Limpar todos os filtros ──────────────────────────────
  function resetarFiltros() {
    setBusca('');
    setFiltroStatus('');
    setDataInicio('');
    setDataFim('');
    setPaginaAtual(1);
    setGatilho((g) => g + 1);
  }

  const temFiltros = busca || filtroStatus || dataInicio || dataFim;

  // ── Exportar CSV ─────────────────────────────────────────
  async function exportarCSV() {
    try {
      const params = { limite: 5000 };
      if (filtroStatus) params.status      = filtroStatus;
      if (dataInicio)   params.data_inicio = dataInicio;
      if (dataFim)      params.data_fim    = dataFim;
      if (busca.trim()) params.busca       = busca.trim();
      if (roleEhVendedor) params.vendedor_id = usuario?.id;

      const { data } = await solicitacoesApi.listar(params);
      const lista = data.dados?.solicitacoes || [];

      const linhas = [
        ['Nº Proposta', 'Nº Orçamento', 'Status', 'Prioridade', 'Setor', 'Vendedor',
         'Estoquista', 'Criado em', 'Atualizado em', 'Tempo Separação (min)'],
        ...lista.map((s) => [
          s.numero_proposta || '',
          s.numero_orcamento || '',
          s.status,
          s.prioridade || '',
          s.setor_destino || '',
          s.vendedor_nome || '',
          s.estoquista_nome || '',
          s.created_at || '',
          s.updated_at || '',
          s.tempo_separacao_segundos ? Math.round(s.tempo_separacao_segundos / 60) : '',
        ]),
      ];

      const csv  = linhas.map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `historico_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { /* silencioso */ }
  }

  return (
    <div className="space-y-5">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Clock className="w-6 h-6 text-marinho-600" />
            Histórico
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {total > 0
              ? `${total} solicitaç${total === 1 ? 'ão' : 'ões'} encontrada${total === 1 ? '' : 's'}`
              : 'Consulte o histórico de solicitações'}
          </p>
        </div>
        <div className="flex items-center gap-1">
          {solicitacoes.length > 0 && (
            <button
              onClick={exportarCSV}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
              title="Exportar CSV"
            >
              <Download className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={executarBusca}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            title="Atualizar"
          >
            <RefreshCw className={`w-4 h-4 ${carregando ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="card-base p-4 space-y-3">
        {/* Linha 1: busca + status */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nº proposta, vendedor..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              onKeyDown={handleKeyDown}
              className="input-base pl-9"
            />
          </div>
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="input-base w-full sm:w-56"
          >
            {OPCOES_STATUS.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        {/* Linha 2: intervalo de datas + botão buscar + limpar */}
        <div className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex items-center gap-2 flex-1">
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">De</label>
              <input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="input-base"
              />
            </div>
            <span className="text-gray-400 pt-5">—</span>
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">Até</label>
              <input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className="input-base"
              />
            </div>
          </div>

          {/* Botão buscar */}
          <button
            onClick={executarBusca}
            disabled={carregando}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-marinho-600 text-white
                        text-sm font-medium hover:bg-marinho-700 transition-colors
                        disabled:opacity-60 disabled:cursor-not-allowed flex-shrink-0"
          >
            {carregando
              ? <RefreshCw className="w-4 h-4 animate-spin" />
              : <Search className="w-4 h-4" />
            }
            Buscar
          </button>

          {temFiltros && (
            <button
              onClick={resetarFiltros}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700
                          px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
            >
              <XCircle className="w-4 h-4" />
              Limpar
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

      {/* Lista */}
      {carregando ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : !erro && solicitacoes.length === 0 ? (
        <div className="card-base p-14 text-center">
          <CheckCircle className="w-14 h-14 text-gray-200 mx-auto mb-3" />
          <p className="font-medium text-gray-600">Nenhuma solicitação encontrada.</p>
          {temFiltros && (
            <p className="text-sm text-gray-400 mt-1">
              Tente ajustar os filtros ou{' '}
              <button onClick={resetarFiltros} className="text-marinho-600 hover:underline">
                limpar a busca
              </button>.
            </p>
          )}
          {!temFiltros && (
            <p className="text-sm text-gray-400 mt-1">
              Clique em <strong>Buscar</strong> para carregar os resultados.
            </p>
          )}
        </div>
      ) : (
        <>
          <div className="card-base overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-4 py-3 text-gray-500 font-medium">Proposta</th>
                    <th className="text-left px-4 py-3 text-gray-500 font-medium">Status</th>
                    <th className="text-left px-4 py-3 text-gray-500 font-medium hidden md:table-cell">Prioridade</th>
                    <th className="text-left px-4 py-3 text-gray-500 font-medium hidden sm:table-cell">Destino</th>
                    <th className="text-left px-4 py-3 text-gray-500 font-medium hidden lg:table-cell">Vendedor</th>
                    <th className="text-left px-4 py-3 text-gray-500 font-medium hidden lg:table-cell">Criado</th>
                    <th className="text-right px-4 py-3 text-gray-500 font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {solicitacoes.map((sol) => (
                    <tr
                      key={sol.id}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/solicitacoes/${sol.id}`)}
                    >
                      <td className="px-4 py-3">
                        <span className="font-bold text-gray-900">#{sol.numero_proposta}</span>
                      </td>
                      <td className="px-4 py-3">
                        <BadgeStatus status={sol.status} />
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        {sol.prioridade
                          ? <BadgePrioridade prioridade={sol.prioridade} />
                          : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">
                        {LABELS_LOCAL_MATERIAL[sol.setor_destino] || sol.setor_destino || '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-600 hidden lg:table-cell">
                        {sol.vendedor_nome || '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-500 hidden lg:table-cell text-xs">
                        <span title={formatarDataHora(sol.created_at)}>
                          {tempoRelativo(sol.created_at)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <ChevronRight className="w-4 h-4 text-gray-400 inline-block" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Paginação */}
          {totalPaginas > 1 && (
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>
                Página {paginaAtual} de {totalPaginas}
                {' '}({total} registros)
              </span>
              <div className="flex gap-2">
                <button
                  disabled={paginaAtual <= 1}
                  onClick={() => setPaginaAtual((p) => p - 1)}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40
                              hover:bg-gray-50 transition-colors disabled:cursor-not-allowed"
                >
                  ← Anterior
                </button>
                <button
                  disabled={paginaAtual >= totalPaginas}
                  onClick={() => setPaginaAtual((p) => p + 1)}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40
                              hover:bg-gray-50 transition-colors disabled:cursor-not-allowed"
                >
                  Próxima →
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
