/**
 * Dashboard do Almoxarife
 * Fila de separação com dados reais — mobile-first
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Package, Clock, CheckCircle, ArrowRight,
  AlertTriangle, RefreshCw, TrendingUp, Award, Activity,
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
  if (pct == null) return null;
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

export default function DashboardAlmoxarife() {
  const { usuario } = useAuth();
  const navigate    = useNavigate();

  const [contadores,  setContadores]  = useState({});
  const [recentes,    setRecentes]    = useState([]);
  const [meusStats,   setMeusStats]   = useState(null);
  const [carregando,  setCarregando]  = useState(true);
  const [erro,       setErro]       = useState('');

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro('');
    try {
      const [{ data: stats }, { data: lista }, { data: meus }] = await Promise.all([
        solicitacoesApi.estatisticas(),
        solicitacoesApi.listar({ limit: 5, status: 'em_separacao' }),
        solicitacoesApi.minhasEstatisticas().catch(() => ({ data: { sucesso: false } })),
      ]);
      if (stats.sucesso) setContadores(stats.dados.contadores || {});
      if (lista.sucesso) setRecentes(lista.dados?.solicitacoes || []);
      if (meus.sucesso)  setMeusStats(meus.dados);
    } catch { setErro('Erro ao carregar dados. Verifique sua conexão.'); }
    finally { setCarregando(false); }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  // Socket: atualiza dashboard instantaneamente quando nova solicitação chega
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    function onNovaSolicitacao() { carregar(); }
    socket.on('nova_solicitacao', onNovaSolicitacao);
    return () => { socket.off('nova_solicitacao', onNovaSolicitacao); };
  }, [carregar]);

  const naFila    = (contadores.aberta || 0) + (contadores.aguardando_atribuicao || 0);
  const emSep     = contadores.em_separacao    || 0;
  const separados = contadores.material_separado || 0;
  const e = meusStats?.como_estoquista;

  return (
    <div className="space-y-5">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Olá, {usuario?.nome?.split(' ')[0]}!
          </h1>
          <p className="text-gray-500 mt-0.5 text-sm">
            Fila de separação — {usuario?.setor !== 'ambos' ? usuario?.setor : 'todos os setores'}
          </p>
        </div>
        <button
          onClick={carregar}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          title="Atualizar"
        >
          <RefreshCw className={`w-4 h-4 ${carregando ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Alerta — pedidos urgentes na fila */}
      {!carregando && naFila > 0 && (
        <button
          onClick={() => navigate('/fila')}
          className="w-full flex items-center gap-3 p-4 bg-amber-50 border border-amber-200
                      rounded-xl text-left hover:bg-amber-100 transition-colors"
        >
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800">
              {naFila} pedido{naFila > 1 ? 's' : ''} aguardando na fila
            </p>
            <p className="text-xs text-amber-600">Clique para ver e iniciar a separação</p>
          </div>
          <ArrowRight className="w-4 h-4 text-amber-600 flex-shrink-0" />
        </button>
      )}

      {/* Cards */}
            {/* Erro de carregamento com retry */}
      {erro && !carregando && (
        <ErroCarregamento mensagem={erro} onTentar={carregar} tentando={carregando} />
      )}

      {!erro && (carregando ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          <div className="card-base p-4 border-l-4 border-yellow-400">
            <Clock className="w-5 h-5 text-yellow-500 mb-1" />
            <p className="text-2xl font-bold text-gray-900">{naFila}</p>
            <p className="text-xs text-gray-500">Na fila</p>
          </div>
          <div className="card-base p-4 border-l-4 border-blue-400">
            <Package className="w-5 h-5 text-blue-500 mb-1" />
            <p className="text-2xl font-bold text-gray-900">{emSep}</p>
            <p className="text-xs text-gray-500">Em separação</p>
          </div>
          <div className="card-base p-4 border-l-4 border-green-400">
            <CheckCircle className="w-5 h-5 text-green-500 mb-1" />
            <p className="text-2xl font-bold text-gray-900">{separados}</p>
            <p className="text-xs text-gray-500">Separados</p>
          </div>
        </div>
      ))}

      {/* Minhas métricas pessoais */}
      {!carregando && e && e.total_atribuidos > 0 && (
        <div className="card-base p-4">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-marinho-600" />
            <h2 className="font-semibold text-gray-900 text-sm">Minha Performance</h2>
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

      {/* Ações rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={() => navigate('/fila')}
          className="card-base p-5 flex items-center justify-between hover:shadow-md
                      transition-shadow group text-left"
        >
          <div>
            <p className="font-semibold text-gray-900">Fila de Separação</p>
            <p className="text-sm text-gray-500 mt-0.5">Puxe um pedido para iniciar</p>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-marinho-600 transition-colors" />
        </button>
        <button
          onClick={() => navigate('/historico')}
          className="card-base p-5 flex items-center justify-between hover:shadow-md
                      transition-shadow group text-left"
        >
          <div>
            <p className="font-semibold text-gray-900">Meu Histórico</p>
            <p className="text-sm text-gray-500 mt-0.5">Separações realizadas</p>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-marinho-600 transition-colors" />
        </button>
      </div>

      {/* Em separação agora */}
      {recentes.length > 0 && (
        <div className="card-base p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Em Separação Agora</h2>
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
                    <span className="font-semibold text-sm text-gray-900">
                      #{sol.numero_proposta}
                    </span>
                    <BadgeStatus status={sol.status} />
                    {sol.prioridade && <BadgePrioridade prioridade={sol.prioridade} />}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{tempoRelativo(sol.created_at)}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-marinho-600
                                        flex-shrink-0 transition-colors" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
