/**
 * Dashboard do Adm Galpão
 * Painel completo do galpão: fila de separação, estatísticas reais, atalhos
 * + bloco de performance pessoal (caso o adm atue como separador)
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Warehouse, AlertTriangle, Clock, Package,
  CheckCircle, Users, ClipboardList, ArrowRight,
  RefreshCw, BarChart2, Activity, TrendingUp, Award,
} from 'lucide-react';
import { useNavigate }     from 'react-router-dom';
import { useAuth }         from '../../context/AuthContext';
import { solicitacoesApi } from '../../services/api';
import { getSocket }       from '../../services/socket';
import { Spinner }         from '../../components/ui/Spinner';
import { ErroCarregamento } from '../../components/ui/ErroCarregamento';
import { BadgeStatus }     from '../../components/solicitacoes/BadgeStatus';
import { BadgePrioridade } from '../../components/solicitacoes/BadgePrioridade';
import { tempoRelativo }   from '../../utils/formatters';

function formatarTempo(seg) {
  if (!seg) return '—';
  if (seg < 60) return `${Math.round(seg)}s`;
  const m = Math.floor(seg / 60);
  const s = Math.round(seg % 60);
  if (m < 60) return s > 0 ? `${m}min ${s}s` : `${m}min`;
  return `${Math.floor(m / 60)}h ${m % 60}min`;
}

function BarraMeta({ pct }) {
  const cor = pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-yellow-400' : 'bg-red-400';
  return (
    <div className="flex items-center gap-2 flex-1">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${cor}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <span className="text-xs text-gray-400 w-8 text-right">{pct}%</span>
    </div>
  );
}

export default function DashboardAdmGalpao() {
  const { usuario } = useAuth();
  const navigate    = useNavigate();

  const [stats,      setStats]      = useState(null);
  const [recentes,   setRecentes]   = useState([]);
  const [urgentes,   setUrgentes]   = useState([]);
  const [meusStats,  setMeusStats]  = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro,       setErro]       = useState('');

  const buscar = useCallback(async () => {
    setCarregando(true);
    setErro('');
    try {
      const [resEstat, resSols, resMeus] = await Promise.all([
        solicitacoesApi.estatisticas(),
        solicitacoesApi.listar({ limite: 10 }),
        solicitacoesApi.minhasEstatisticas().catch(() => ({ data: { sucesso: false } })),
      ]);
      if (resEstat.data.sucesso) setStats(resEstat.data.dados);
      if (resSols.data.sucesso) {
        const sols = resSols.data.dados?.solicitacoes || [];
        setRecentes(sols.slice(0, 5));
        setUrgentes(sols.filter(
          (s) => s.prioridade === 'prioridade_maxima' || s.prioridade === 'oceanpact'
        ));
      }
      if (resMeus.data.sucesso) setMeusStats(resMeus.data.dados);
    } catch { setErro('Erro ao carregar dados. Verifique sua conexão.'); }
    finally { setCarregando(false); }
  }, []);

  useEffect(() => { buscar(); }, [buscar]);

  // Socket: atualiza dashboard instantaneamente quando nova solicitação chega
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    function onNovaSolicitacao() { buscar(); }
    socket.on('nova_solicitacao', onNovaSolicitacao);
    return () => { socket.off('nova_solicitacao', onNovaSolicitacao); };
  }, [buscar]);

  const aguardando   = stats?.por_status?.aguardando_atribuicao || 0;
  const emSeparacao  = stats?.por_status?.em_separacao          || 0;
  const separados    = stats?.por_status?.material_separado     || 0;
  const totalAbertas = stats?.total_abertas                     || 0;

  const e = meusStats?.como_estoquista;

  const CARDS = [
    { label: 'Aguardando Atribuição', valor: aguardando,  cor: 'border-red-400   bg-red-50',    icone: AlertTriangle, icCor: 'text-red-500' },
    { label: 'Em Separação',          valor: emSeparacao,  cor: 'border-yellow-400 bg-yellow-50', icone: Clock,        icCor: 'text-yellow-600' },
    { label: 'Material Separado',     valor: separados,    cor: 'border-green-400 bg-green-50',  icone: CheckCircle,  icCor: 'text-green-600' },
    { label: 'Total em Aberto',       valor: totalAbertas, cor: 'border-blue-400  bg-blue-50',   icone: Package,      icCor: 'text-blue-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Warehouse className="w-6 h-6 text-blue-600" />
            Painel Galpão
          </h1>
          <p className="text-gray-500 mt-1">
            Olá, {usuario?.nome?.split(' ')[0]}! Gerencie a operação do galpão.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={buscar}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            title="Atualizar"
          >
            <RefreshCw className={`w-4 h-4 ${carregando ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => navigate('/usuarios')} className="btn-primario">
            <Users className="w-4 h-4" />
            Equipe
          </button>
        </div>
      </div>

      {/* Alerta de urgentes */}
      {!carregando && urgentes.length > 0 && (
        <button
          onClick={() => navigate('/fila')}
          className="w-full flex items-center gap-3 p-4 bg-red-50 border border-red-200
                      rounded-xl text-left hover:bg-red-100 transition-colors"
        >
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-800">
              {urgentes.length} {urgentes.length === 1 ? 'pedido urgente' : 'pedidos urgentes'} na fila
            </p>
            <p className="text-xs text-red-600 mt-0.5">Prioridade Máxima / Oceanpact — processe imediatamente</p>
          </div>
          <ArrowRight className="w-4 h-4 text-red-500 flex-shrink-0" />
        </button>
      )}

      {/* Cards de status */}
            {/* Erro de carregamento com retry */}
      {erro && !carregando && (
        <ErroCarregamento mensagem={erro} onTentar={buscar} tentando={carregando} />
      )}

      {!erro && (carregando ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {CARDS.map(({ label, valor, cor, icone: Icone, icCor }) => (
            <div key={label} className={`card-base p-5 border-l-4 ${cor}`}>
              <Icone className={`w-5 h-5 ${icCor} mb-2`} />
              <p className="text-2xl font-bold text-gray-900">{valor}</p>
              <p className="text-xs text-gray-500 leading-tight mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      ))}

      {/* Minha Performance (caso o adm também atue como separador) */}
      {!carregando && e && e.total_atribuidos > 0 && (
        <div className="card-base p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-marinho-600" />
            <h2 className="font-semibold text-gray-900 text-sm">Minha Performance como Separador</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-xl font-bold text-gray-900">{e.total_atribuidos}</p>
              <p className="text-xs text-gray-500">Atribuídos</p>
            </div>
            <div className="bg-emerald-50 rounded-lg p-3 text-center">
              <p className="text-xl font-bold text-emerald-700">{e.concluidos}</p>
              <p className="text-xs text-emerald-600">Concluídos</p>
            </div>
          </div>
          <div className="space-y-2">
            {e.avg_segundos != null && (
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-gray-600 text-xs">
                  <Clock className="w-3.5 h-3.5 text-blue-500" /> Tempo médio
                </span>
                <span className="font-semibold text-gray-900">{formatarTempo(e.avg_segundos)}</span>
              </div>
            )}
            {e.min_segundos != null && (
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-gray-600 text-xs">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> Melhor tempo
                </span>
                <span className="font-semibold text-emerald-700">{formatarTempo(e.min_segundos)}</span>
              </div>
            )}
            {e.pct_dentro_meta != null && (
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span className="flex items-center gap-1">
                    <Award className="w-3 h-3 text-yellow-500" /> Dentro da meta (≤ 30 min)
                  </span>
                </div>
                <BarraMeta pct={e.pct_dentro_meta} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Atalhos rápidos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => navigate('/fila')}
          className="card-base p-5 flex items-center justify-between hover:shadow-md transition-shadow group"
        >
          <div className="text-left">
            <p className="font-semibold text-gray-900">Fila de Separação</p>
            <p className="text-sm text-gray-500 mt-0.5">Atribua tarefas à equipe</p>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-marinho-600 transition-colors" />
        </button>

        <button
          onClick={() => navigate('/solicitacoes')}
          className="card-base p-5 flex items-center justify-between hover:shadow-md transition-shadow group"
        >
          <div className="text-left">
            <p className="font-semibold text-gray-900">Todas as Solicitações</p>
            <p className="text-sm text-gray-500 mt-0.5">Visão completa das demandas</p>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-marinho-600 transition-colors" />
        </button>

        <button
          onClick={() => navigate('/relatorios')}
          className="card-base p-5 flex items-center justify-between hover:shadow-md transition-shadow group"
        >
          <div className="text-left">
            <p className="font-semibold text-gray-900">Relatórios</p>
            <p className="text-sm text-gray-500 mt-0.5">Métricas e desempenho</p>
          </div>
          <BarChart2 className="w-5 h-5 text-gray-400 group-hover:text-marinho-600 transition-colors" />
        </button>
      </div>

      {/* Atividade recente */}
      <div className="card-base p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-blue-600" />
            Atividade Recente
          </h2>
          <button
            onClick={() => navigate('/historico')}
            className="text-xs text-marinho-600 hover:underline"
          >
            Ver histórico
          </button>
        </div>

        {carregando ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : recentes.length === 0 ? (
          <div className="text-center py-10">
            <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Nenhuma solicitação registrada ainda.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentes.map((sol) => (
              <button
                key={sol.id}
                onClick={() => navigate(`/solicitacoes/${sol.id}`)}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50
                            transition-colors text-left group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900 text-sm">
                      #{sol.numero_proposta}
                    </span>
                    <BadgeStatus status={sol.status} />
                    {sol.prioridade && <BadgePrioridade prioridade={sol.prioridade} />}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {sol.vendedor_nome} · {tempoRelativo(sol.created_at)}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-marinho-600 flex-shrink-0 transition-colors" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
