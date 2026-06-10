/**
 * Dashboard do Estoquista
 * Fila do setor com contadores reais + métricas pessoais — mobile-first
 */

import { useEffect, useState, useCallback } from 'react';
import {
  Package, Clock, CheckCircle, ArrowRight,
  TrendingUp, Award, Activity,
} from 'lucide-react';
import { useNavigate }       from 'react-router-dom';
import { useAuth }           from '../../context/AuthContext';
import { solicitacoesApi }   from '../../services/api';
import { getSocket }         from '../../services/socket';
import { CardSolicitacao }   from '../../components/solicitacoes/CardSolicitacao';
import { Spinner }           from '../../components/ui/Spinner';
import { ErroCarregamento } from '../../components/ui/ErroCarregamento';
import { LABELS_SETOR }      from '../../utils/constantes';

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
      <div className="flex-1 h-1.5 bg-marinho-50 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${cor}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <span className="text-xs text-marinho-300 w-8 text-right">{pct}%</span>
    </div>
  );
}

export default function DashboardEstoquista() {
  const { usuario } = useAuth();
  const navigate    = useNavigate();

  const [contadores,  setContadores]  = useState({});
  const [proximas,    setProximas]    = useState([]);
  const [meusStats,   setMeusStats]   = useState(null);
  const [carregando,  setCarregando]  = useState(true);
  const [erro,       setErro]       = useState('');

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro('');
    try {
      const [{ data: stats }, { data: lista }, { data: meus }] = await Promise.all([
        solicitacoesApi.estatisticas(),
        solicitacoesApi.listar({ limit: 3 }),
        solicitacoesApi.minhasEstatisticas().catch(() => ({ data: { sucesso: false } })),
      ]);
      if (stats.sucesso) setContadores(stats.dados.contadores || stats.dados.por_status || {});
      if (lista.sucesso) setProximas(lista.dados.solicitacoes);
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
  const emSep     = contadores.em_separacao || 0;
  const separadas = contadores.material_separado || 0;

  const e = meusStats?.como_estoquista;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-marinho-900">
          Olá, {usuario?.nome?.split(' ')[0]}!
        </h1>
        <p className="text-marinho-400 mt-0.5">
          Setor: <span className="font-semibold text-marinho-600">
            {LABELS_SETOR[usuario?.setor] || usuario?.setor}
          </span>
        </p>
      </div>

      {/* Contadores da fila geral */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card-base p-4 border-l-4 border-marinho-300">
          <Package className="w-5 h-5 text-marinho-400 mb-1" />
          <p className="text-xl font-bold text-marinho-900">{carregando ? '·' : naFila}</p>
          <p className="text-xs text-marinho-400">Na fila</p>
        </div>
        <div className="card-base p-4 border-l-4 border-yellow-400">
          <Clock className="w-5 h-5 text-yellow-600 mb-1" />
          <p className="text-xl font-bold text-marinho-900">{carregando ? '·' : emSep}</p>
          <p className="text-xs text-marinho-400">Em separação</p>
        </div>
        <div className="card-base p-4 border-l-4 border-green-400">
          <CheckCircle className="w-5 h-5 text-green-600 mb-1" />
          <p className="text-xl font-bold text-marinho-900">{carregando ? '·' : separadas}</p>
          <p className="text-xs text-marinho-400">Separados</p>
        </div>
      </div>

      {/* Minhas métricas pessoais */}
      {!carregando && e && e.total_atribuidos > 0 && (
        <div className="card-base p-4">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-marinho-600" />
            <h2 className="font-semibold text-marinho-900 text-sm">Minha Performance</h2>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="bg-marinho-50 rounded-lg p-3 text-center">
              <p className="text-xl font-bold text-marinho-900">{e.total_atribuidos}</p>
              <p className="text-xs text-marinho-400">Atribuídos</p>
            </div>
            <div className="bg-emerald-50 rounded-lg p-3 text-center">
              <p className="text-xl font-bold text-emerald-700">{e.concluidos}</p>
              <p className="text-xs text-emerald-600">Concluídos</p>
            </div>
          </div>

          <div className="space-y-2">
            {e.avg_segundos != null && (
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-marinho-600 text-xs">
                  <Clock className="w-3.5 h-3.5 text-marinho-500" />
                  Tempo médio
                </span>
                <span className="font-semibold text-marinho-900 text-sm">
                  {formatarTempo(e.avg_segundos)}
                </span>
              </div>
            )}
            {e.min_segundos != null && (
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-marinho-600 text-xs">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                  Melhor tempo
                </span>
                <span className="font-semibold text-emerald-700 text-sm">
                  {formatarTempo(e.min_segundos)}
                </span>
              </div>
            )}
            {e.pct_dentro_meta != null && (
              <div>
                <div className="flex justify-between text-xs text-marinho-400 mb-1">
                  <span className="flex items-center gap-1">
                    <Award className="w-3 h-3 text-yellow-500" />
                    Dentro da meta (≤ 30 min)
                  </span>
                </div>
                <BarraMeta pct={e.pct_dentro_meta} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Próximos da fila */}
      <div className="card-base p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-marinho-900">Próximos na Fila</h2>
          <button
            onClick={() => navigate('/solicitacoes')}
            className="flex items-center gap-1 text-sm text-marinho-600"
          >
            Ver fila completa <ArrowRight className="w-3 h-3" />
          </button>
        </div>

              {/* Erro de carregamento com retry */}
      {erro && !carregando && (
        <ErroCarregamento mensagem={erro} onTentar={carregar} tentando={carregando} />
      )}

      {!erro && (carregando ? (
          <div className="flex justify-center py-6"><Spinner /></div>
        ) : proximas.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="w-10 h-10 text-green-200 mx-auto mb-2" />
            <p className="text-marinho-300 text-sm">Fila vazia! Tudo em dia.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {proximas.map((s) => <CardSolicitacao key={s.id} solicitacao={s} />)}
          </div>
        ))}
      </div>

      {naFila > 0 && (
        <button
          onClick={() => navigate('/solicitacoes')}
          className="w-full py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold
                      rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          <Package className="w-5 h-5" />
          Puxar próximo pedido ({naFila} aguardando)
        </button>
      )}
    </div>
  );
}
