/**
 * Página de Relatórios
 * Disponível para: super_admin, adm, logistica
 * KPIs de volume, status, prioridades e estoquistas
 * + filtro por período + exportação CSV
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  BarChart2, RefreshCw, TrendingUp, Package,
  CheckCircle, Clock, AlertTriangle, Users,
  ArrowUp, ArrowDown, Minus, Download, Calendar,
} from 'lucide-react';
import { solicitacoesApi } from '../../services/api';
import { Spinner }         from '../../components/ui/Spinner';
import { LABELS_STATUS, LABELS_PRIORIDADE, LABELS_LOCAL_MATERIAL } from '../../utils/constantes';
import { formatarDataHora } from '../../utils/formatters';
import { usePageTitle }     from '../../hooks/usePageTitle';
import { ErroCarregamento } from '../../components/ui/ErroCarregamento';

// ── Períodos disponíveis ──────────────────────────────────────
const PERIODOS = [
  { value: 'tudo',       label: 'Todo o período' },
  { value: 'hoje',       label: 'Hoje' },
  { value: 'semana',     label: 'Esta semana' },
  { value: 'mes',        label: 'Este mês' },
  { value: 'mes_ant',    label: 'Mês anterior' },
];

function calcularIntervalo(periodo) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  if (periodo === 'hoje') {
    return { inicio: hoje, fim: new Date() };
  }
  if (periodo === 'semana') {
    const inicio = new Date(hoje);
    inicio.setDate(hoje.getDate() - hoje.getDay()); // domingo
    return { inicio, fim: new Date() };
  }
  if (periodo === 'mes') {
    const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    return { inicio, fim: new Date() };
  }
  if (periodo === 'mes_ant') {
    const inicio = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
    const fim    = new Date(hoje.getFullYear(), hoje.getMonth(), 0, 23, 59, 59);
    return { inicio, fim };
  }
  return null; // 'tudo'
}

// ── Helper: formata segundos → "Xh Ymin" / "Xmin" ──────────────
function formatarDur(seg) {
  if (!seg || isNaN(seg)) return '—';
  if (seg >= 3600) {
    return `${Math.floor(seg / 3600)}h ${Math.floor((seg % 3600) / 60)}min`;
  }
  return `${Math.floor(seg / 60)}min`;
}

// ── Componente de KPI Card ────────────────────────────────────
function KpiCard({ label, valor, icone: Icone, cor, sub }) {
  const corMap = {
    azul:    'bg-marinho-50  border-marinho-200',
    verde:   'bg-green-50    border-green-200',
    amarelo: 'bg-yellow-50   border-yellow-200',
    vermelho:'bg-red-50      border-red-200',
    cinza:   'bg-gray-50     border-gray-200',
  };
  const iconCor = {
    azul:    'text-marinho-600',
    verde:   'text-green-600',
    amarelo: 'text-yellow-600',
    vermelho:'text-red-600',
    cinza:   'text-gray-500',
  };
  return (
    <div className={`rounded-2xl border p-5 ${corMap[cor] || corMap.cinza}`}>
      <Icone className={`w-6 h-6 ${iconCor[cor] || iconCor.cinza} mb-3`} />
      <p className="text-3xl font-bold text-gray-900 mb-1">{valor ?? '—'}</p>
      <p className="text-sm font-medium text-gray-700">{label}</p>
      {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
    </div>
  );
}

// ── Barra de progresso horizontal ─────────────────────────────
function BarraProgresso({ label, valor, total, cor }) {
  const pct = total > 0 ? Math.round((valor / total) * 100) : 0;
  const corBarra = {
    azul:    'bg-marinho-500',
    verde:   'bg-green-500',
    amarelo: 'bg-yellow-400',
    vermelho:'bg-red-500',
    rosa:    'bg-pink-500',
    cinza:   'bg-gray-300',
  };
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="text-gray-700 font-medium truncate pr-2">{label}</span>
        <span className="text-gray-500 flex-shrink-0">{valor} ({pct}%)</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${corBarra[cor] || corBarra.cinza}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

const COR_STATUS = {
  aberta:                'azul',
  em_conferencia:        'amarelo',
  aguardando_atribuicao: 'amarelo',
  aguardando_nf:         'amarelo',
  em_emissao_nf:         'amarelo',
  em_separacao:          'azul',
  material_separado:     'verde',
  entrega_solicitada:    'azul',
  agendamento_realizado: 'verde',
  rota_enviada:          'verde',
  entregue:              'verde',
};

const COR_PRIORIDADE = {
  prioridade_maxima:   'vermelho',
  oceanpact:           'vermelho',
  para_hoje:           'rosa',
  em_separacao:        'amarelo',
  aguardando_material: 'cinza',
  material_separado:   'verde',
};

// ── Helper: exportar CSV ──────────────────────────────────────
function exportarCSV(solicitacoes, periodo) {
  const cabecalho = [
    'Nº Proposta','Status','Prioridade','Destino',
    'Vendedor','Estoquista','Criado em',
  ];

  const linhas = solicitacoes.map((s) => [
    `#${s.numero_proposta}`,
    LABELS_STATUS[s.status] || s.status,
    s.prioridade ? (LABELS_PRIORIDADE[s.prioridade] || s.prioridade) : '',
    LABELS_LOCAL_MATERIAL[s.setor_destino] || s.setor_destino || '',
    s.vendedor_nome || '',
    s.estoquista_nome || '',
    formatarDataHora(s.created_at),
  ]);

  const csv = [cabecalho, ...linhas]
    .map((row) => row.map((cel) => `"${String(cel).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href     = url;
  link.download = `relatorio_${periodo}_${new Date().toISOString().slice(0,10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

// ─────────────────────────────────────────────────────────────
export default function Relatorios() {
  usePageTitle('Relatórios');
  const [estat,        setEstat]      = useState(null);
  const [solicitacoes, setSolicita]   = useState([]);
  const [ranking,      setRanking]    = useState([]);
  const [carregando,   setCarregando] = useState(true);
  const [erro,         setErro]       = useState('');
  const [periodo,      setPeriodo]    = useState('tudo');

  const buscar = useCallback(async () => {
    setCarregando(true);
    setErro('');
    try {
      const [resEstat, resSols, resRank] = await Promise.all([
        solicitacoesApi.estatisticas(),
        solicitacoesApi.listar({ limite: 1000 }),
        solicitacoesApi.rankingEstoquistas().catch(() => ({ data: { dados: { ranking: [] } } })),
      ]);
      if (resEstat.data.sucesso) setEstat(resEstat.data.dados);
      if (resSols.data.sucesso)  setSolicita(resSols.data.dados?.solicitacoes || []);
      setRanking(resRank.data.dados?.ranking || []);
    } catch {
      setErro('Erro ao carregar relatórios. Verifique sua conexão.');
    }
    finally  { setCarregando(false); }
  }, []);

  useEffect(() => { buscar(); }, [buscar]);

  // ── Filtragem por período ─────────────────────────────────
  const solsFiltradas = useMemo(() => {
    const intervalo = calcularIntervalo(periodo);
    if (!intervalo) return solicitacoes;
    return solicitacoes.filter((s) => {
      const d = new Date(s.created_at);
      return d >= intervalo.inicio && d <= intervalo.fim;
    });
  }, [solicitacoes, periodo]);

  // ── Cálculos derivados (sobre lista filtrada) ─────────────
  const totalSols = solsFiltradas.length;

  // Para "tudo", usa dados do backend (mais preciso); para período usa lista local
  const entregues = periodo === 'tudo'
    ? (estat?.total_entregues ?? solsFiltradas.filter((s) => s.status === 'entregue').length)
    : solsFiltradas.filter((s) => s.status === 'entregue').length;

  const abertas = periodo === 'tudo'
    ? ((estat?.por_status?.aberta ?? estat?.contadores?.aberta) ?? solsFiltradas.filter((s) => s.status === 'aberta').length)
    : solsFiltradas.filter((s) => s.status === 'aberta').length;

  const urgentes = solsFiltradas.filter(
    (s) => s.prioridade === 'prioridade_maxima' || s.prioridade === 'oceanpact'
  ).length;

  const taxaEntrega = totalSols > 0 ? Math.round((entregues / totalSols) * 100) : 0;

  // Distribuições
  const porStatus = {};
  solsFiltradas.forEach((s) => { porStatus[s.status] = (porStatus[s.status] || 0) + 1; });

  const porPrioridade = {};
  solsFiltradas.forEach((s) => {
    if (s.prioridade) porPrioridade[s.prioridade] = (porPrioridade[s.prioridade] || 0) + 1;
  });

  const porDestino = {};
  solsFiltradas.forEach((s) => {
    if (s.setor_destino) porDestino[s.setor_destino] = (porDestino[s.setor_destino] || 0) + 1;
  });

  const porEstoquista = {};
  solsFiltradas.forEach((s) => {
    if (s.estoquista_nome) porEstoquista[s.estoquista_nome] = (porEstoquista[s.estoquista_nome] || 0) + 1;
  });
  const topEstoquistas = Object.entries(porEstoquista).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const porVendedor = {};
  solsFiltradas.forEach((s) => {
    if (s.vendedor_nome) porVendedor[s.vendedor_nome] = (porVendedor[s.vendedor_nome] || 0) + 1;
  });
  const topVendedores = Object.entries(porVendedor).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart2 className="w-6 h-6 text-marinho-600" />
            Relatórios
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Visão geral do desempenho operacional
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportarCSV(solsFiltradas, periodo)}
            disabled={carregando || solsFiltradas.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700
                        bg-white border border-gray-200 rounded-lg hover:bg-gray-50
                        transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title="Exportar como CSV"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
          <button
            onClick={buscar}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            title="Atualizar dados"
          >
            <RefreshCw className={`w-4 h-4 ${carregando ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filtro de período */}
      <div className="card-base p-3 flex items-center gap-2 flex-wrap">
        <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
        <span className="text-sm text-gray-500 font-medium mr-1">Período:</span>
        {PERIODOS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setPeriodo(value)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors font-medium
              ${periodo === value
                ? 'bg-marinho-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
              }`}
          >
            {label}
          </button>
        ))}
        {periodo !== 'tudo' && (
          <span className="ml-auto text-xs text-gray-400">
            {solsFiltradas.length} solicitaç{solsFiltradas.length !== 1 ? 'ões' : 'ão'}
          </span>
        )}
      </div>

      {/* Erro de carregamento com retry */}
      {erro && !carregando && (
        <ErroCarregamento
          mensagem={erro}
          onTentar={buscar}
          tentando={carregando}
        />
      )}

      {carregando ? (
        <div className="flex justify-center py-24"><Spinner /></div>
      ) : !erro && (
        <>
          {/* KPIs principais */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              label="Total de Solicitações"
              valor={totalSols}
              icone={Package}
              cor="azul"
              sub={periodo === 'tudo' ? 'Acumulado geral' : PERIODOS.find((p) => p.value === periodo)?.label}
            />
            <KpiCard
              label="Entregues"
              valor={entregues}
              icone={CheckCircle}
              cor="verde"
              sub={`${taxaEntrega}% de conclusão`}
            />
            <KpiCard
              label="Em Aberto"
              valor={abertas}
              icone={Clock}
              cor="amarelo"
              sub="Status: aberta"
            />
            <KpiCard
              label="Urgentes"
              valor={urgentes}
              icone={AlertTriangle}
              cor="vermelho"
              sub="Prioridade máxima / Oceanpact"
            />
          </div>

          {/* KPIs do backend (apenas quando período = tudo) */}
          {estat && periodo === 'tudo' && (estat.em_separacao > 0 || estat.aguardando_atribuicao > 0 || estat.material_separado > 0) && (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {estat.em_separacao > 0 && (
                <KpiCard label="Em Separação"        valor={estat.em_separacao}          icone={TrendingUp}    cor="azul"    />
              )}
              {estat.aguardando_atribuicao > 0 && (
                <KpiCard label="Aguardando Atribuição" valor={estat.aguardando_atribuicao} icone={Users}         cor="amarelo" />
              )}
              {estat.material_separado > 0 && (
                <KpiCard label="Material Separado"   valor={estat.material_separado}      icone={CheckCircle}   cor="verde"   />
              )}
            </div>
          )}

          {totalSols === 0 ? (
            <div className="card-base p-14 text-center">
              <BarChart2 className="w-14 h-14 text-gray-200 mx-auto mb-3" />
              <p className="font-medium text-gray-500">Nenhuma solicitação no período selecionado.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Distribuição por status */}
                <div className="card-base p-6">
                  <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-marinho-600" />
                    Distribuição por Status
                  </h2>
                  <div className="space-y-3">
                    {Object.entries(LABELS_STATUS)
                      .filter(([s]) => porStatus[s])
                      .sort(([, a], [, b]) => (porStatus[b] || 0) - (porStatus[a] || 0))
                      .map(([status, label]) => (
                        <BarraProgresso key={status} label={label}
                          valor={porStatus[status] || 0} total={totalSols}
                          cor={COR_STATUS[status] || 'cinza'} />
                      ))}
                  </div>
                </div>

                {/* Distribuição por prioridade */}
                <div className="card-base p-6">
                  <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-marinho-600" />
                    Distribuição por Prioridade
                  </h2>
                  {Object.keys(porPrioridade).length === 0 ? (
                    <p className="text-gray-400 text-sm">Sem prioridades atribuídas no período.</p>
                  ) : (
                    <div className="space-y-3">
                      {Object.entries(LABELS_PRIORIDADE)
                        .filter(([p]) => porPrioridade[p])
                        .sort(([, a], [, b]) => (porPrioridade[b] || 0) - (porPrioridade[a] || 0))
                        .map(([prio, label]) => (
                          <BarraProgresso key={prio} label={label}
                            valor={porPrioridade[prio] || 0}
                            total={Object.values(porPrioridade).reduce((a, b) => a + b, 0)}
                            cor={COR_PRIORIDADE[prio] || 'cinza'} />
                        ))}
                    </div>
                  )}
                </div>

                {/* Top estoquistas */}
                <div className="card-base p-6">
                  <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Users className="w-4 h-4 text-marinho-600" />
                    Top Estoquistas
                  </h2>
                  {topEstoquistas.length === 0 ? (
                    <p className="text-gray-400 text-sm">Nenhuma atribuição no período.</p>
                  ) : (
                    <div className="space-y-3">
                      {topEstoquistas.map(([nome, qtd], idx) => (
                        <div key={nome} className="flex items-center gap-3">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center
                            text-xs font-bold flex-shrink-0
                            ${idx === 0 ? 'bg-marinho-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                            {idx + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <BarraProgresso label={nome} valor={qtd}
                              total={Math.max(...topEstoquistas.map(([, q]) => q))}
                              cor={idx === 0 ? 'azul' : 'cinza'} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Top vendedores */}
                <div className="card-base p-6">
                  <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-marinho-600" />
                    Top Vendedores
                  </h2>
                  {topVendedores.length === 0 ? (
                    <p className="text-gray-400 text-sm">Sem dados de vendedores no período.</p>
                  ) : (
                    <div className="space-y-3">
                      {topVendedores.map(([nome, qtd], idx) => (
                        <div key={nome} className="flex items-center gap-3">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center
                            text-xs font-bold flex-shrink-0
                            ${idx === 0 ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                            {idx + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <BarraProgresso label={nome} valor={qtd}
                              total={Math.max(...topVendedores.map(([, q]) => q))}
                              cor={idx === 0 ? 'verde' : 'cinza'} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Ranking de separação por estoquista */}
              {ranking.length > 0 && (
                <div className="card-base p-6">
                  <h2 className="text-base font-semibold text-gray-900 mb-1 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-purple-600" />
                    Ranking de Separação — Tempo Médio
                  </h2>
                  <p className="text-xs text-gray-400 mb-4">
                    Meta: ≤ 30min por pedido · ordenado do mais rápido ao mais lento
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="text-left py-2 pr-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">#</th>
                          <th className="text-left py-2 pr-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Colaborador</th>
                          <th className="text-left py-2 pr-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Setor</th>
                          <th className="text-right py-2 pr-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Pedidos</th>
                          <th className="text-right py-2 pr-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Média</th>
                          <th className="text-right py-2 pr-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Mínimo</th>
                          <th className="text-right py-2     text-xs font-semibold text-gray-500 uppercase tracking-wide">% Meta</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ranking.map((r, idx) => {
                          const dentroMeta = r.media_segundos <= 1800;
                          return (
                            <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                              <td className="py-3 pr-4">
                                <span className={`w-6 h-6 inline-flex items-center justify-center
                                  rounded-full text-xs font-bold
                                  ${idx === 0 ? 'bg-purple-600 text-white'
                                  : idx === 1 ? 'bg-purple-200 text-purple-800'
                                  : idx === 2 ? 'bg-purple-100 text-purple-700'
                                  : 'bg-gray-100 text-gray-500'}`}>
                                  {idx + 1}
                                </span>
                              </td>
                              <td className="py-3 pr-4 font-medium text-gray-900">{r.nome}</td>
                              <td className="py-3 pr-4">
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                                  ${r.setor === 'galpao'  ? 'bg-blue-50 text-blue-600'
                                  : r.setor === 'loja'    ? 'bg-purple-50 text-purple-600'
                                  :                          'bg-gray-50 text-gray-500'}`}>
                                  {r.setor}
                                </span>
                              </td>
                              <td className="py-3 pr-4 text-right text-gray-700">{r.total_pedidos}</td>
                              <td className="py-3 pr-4 text-right">
                                <span className={`font-semibold ${dentroMeta ? 'text-green-700' : 'text-orange-600'}`}>
                                  {formatarDur(r.media_segundos)}
                                </span>
                              </td>
                              <td className="py-3 pr-4 text-right text-gray-500 text-xs">{formatarDur(r.min_segundos)}</td>
                              <td className="py-3 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${r.pct_meta >= 80 ? 'bg-green-500' : r.pct_meta >= 50 ? 'bg-yellow-400' : 'bg-red-400'}`}
                                      style={{ width: `${r.pct_meta}%` }}
                                    />
                                  </div>
                                  <span className={`text-xs font-medium w-8 text-right
                                    ${r.pct_meta >= 80 ? 'text-green-700' : r.pct_meta >= 50 ? 'text-yellow-700' : 'text-red-600'}`}>
                                    {r.pct_meta}%
                                  </span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Distribuição por destino */}
              {Object.keys(porDestino).length > 0 && (
                <div className="card-base p-6">
                  <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Package className="w-4 h-4 text-marinho-600" />
                    Solicitações por Destino
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {Object.entries(porDestino).map(([destino, qtd]) => (
                      <div key={destino} className="bg-gray-50 rounded-xl p-4 text-center">
                        <p className="text-3xl font-bold text-gray-900 mb-1">{qtd}</p>
                        <p className="text-sm text-gray-600 font-medium">
                          {LABELS_LOCAL_MATERIAL[destino] || destino}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {totalSols > 0 ? Math.round((qtd / totalSols) * 100) : 0}% do total
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
