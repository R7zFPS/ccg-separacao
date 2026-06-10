/**
 * Dashboard do Coordenador / Super Admin
 * Painel geral: contadores, gráfico de evolução semanal, ranking de estoquistas
 */

import { useEffect, useState, useCallback } from 'react';
import {
  LayoutDashboard, AlertTriangle, Clock, Package,
  CheckCircle, Calendar, Truck, PackageCheck, Users,
  ArrowRight, RefreshCw, TrendingUp, Shield, FileText,
} from 'lucide-react';
import { useNavigate }     from 'react-router-dom';
import { solicitacoesApi } from '../../services/api';
import { getSocket }        from '../../services/socket';
import { Spinner }         from '../../components/ui/Spinner';
import { ErroCarregamento } from '../../components/ui/ErroCarregamento';

// ── Constantes ────────────────────────────────────────────
const CARDS_STATUS = [
  { label: 'Abertas',            cor: 'border-marinho-300    bg-marinho-50',     icone: Package,       status: 'aberta' },
  { label: 'Aguard. Atribuição', cor: 'border-red-400     bg-red-50',      icone: AlertTriangle, status: 'aguardando_atribuicao' },
  { label: 'Em Separação',       cor: 'border-yellow-400  bg-yellow-50',   icone: Clock,         status: 'em_separacao' },
  { label: 'Mat. Separado',      cor: 'border-green-400   bg-green-50',    icone: CheckCircle,   status: 'material_separado' },
  { label: 'Agendado',           cor: 'border-marinho-300    bg-marinho-50',     icone: Calendar,      status: 'agendamento_realizado' },
  { label: 'Rota Enviada',       cor: 'border-purple-400  bg-purple-50',   icone: Truck,         status: 'rota_enviada' },
  { label: 'Entregues',          cor: 'border-emerald-400 bg-emerald-50',  icone: PackageCheck,  status: 'entregue' },
];

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

// ── Helper: formata segundos ──────────────────────────────
function fmtTempo(seg) {
  if (!seg) return '—';
  if (seg >= 3600) return `${Math.floor(seg / 3600)}h ${Math.floor((seg % 3600) / 60)}min`;
  return `${Math.floor(seg / 60)}min`;
}

// ── Gráfico de barras SVG inline ─────────────────────────
function GraficoEvolucao({ dados }) {
  if (!dados || dados.length === 0) {
    return <p className="text-marinho-300 text-sm text-center py-6">Sem dados de evolução.</p>;
  }

  const W = 600; const H = 120; const PAD = 8;
  const maxVal = Math.max(...dados.flatMap((d) => [d.criadas, d.entregues]), 1);
  const barW   = Math.floor((W - PAD * 2) / dados.length);
  const halfW  = Math.floor(barW / 2) - 2;

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${W} ${H + 28}`}
        className="w-full min-w-[280px]"
        aria-label="Evolução semanal de solicitações"
      >
        {/* Grid lines */}
        {[0.25, 0.5, 0.75, 1].map((pct) => (
          <line
            key={pct}
            x1={PAD} y1={H - H * pct}
            x2={W - PAD} y2={H - H * pct}
            stroke="#f3f4f6" strokeWidth="1"
          />
        ))}

        {dados.map((d, i) => {
          const x       = PAD + i * barW;
          const hCriadas  = Math.max(Math.round((d.criadas  / maxVal) * H), d.criadas  > 0 ? 4 : 0);
          const hEntregues = Math.max(Math.round((d.entregues / maxVal) * H), d.entregues > 0 ? 4 : 0);
          const data      = new Date(d.dia + 'T12:00:00');
          const label     = DIAS_SEMANA[data.getDay()];
          const ehHoje    = d.dia === new Date().toISOString().slice(0, 10);

          return (
            <g key={d.dia}>
              {/* Barra criadas (azul) */}
              <rect
                x={x + 2} y={H - hCriadas}
                width={halfW} height={hCriadas}
                rx="3" fill={ehHoje ? '#1e3a5f' : '#3b82f6'}
                opacity="0.85"
              />
              {/* Barra entregues (verde) */}
              <rect
                x={x + halfW + 4} y={H - hEntregues}
                width={halfW} height={hEntregues}
                rx="3" fill={ehHoje ? '#059669' : '#10b981'}
                opacity="0.85"
              />
              {/* Label de valor criadas */}
              {d.criadas > 0 && (
                <text x={x + 2 + halfW / 2} y={H - hCriadas - 3}
                  textAnchor="middle" fontSize="9" fill="#3b82f6" fontWeight="600">
                  {d.criadas}
                </text>
              )}
              {/* Label de valor entregues */}
              {d.entregues > 0 && (
                <text x={x + halfW + 4 + halfW / 2} y={H - hEntregues - 3}
                  textAnchor="middle" fontSize="9" fill="#10b981" fontWeight="600">
                  {d.entregues}
                </text>
              )}
              {/* Dia da semana */}
              <text x={x + barW / 2} y={H + 14}
                textAnchor="middle" fontSize="10"
                fill={ehHoje ? '#1e3a5f' : '#9ca3af'}
                fontWeight={ehHoje ? '700' : '400'}>
                {label}
              </text>
              {/* Data */}
              <text x={x + barW / 2} y={H + 26}
                textAnchor="middle" fontSize="8" fill="#d1d5db">
                {d.dia.slice(5)}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legenda */}
      <div className="flex items-center gap-4 justify-center mt-1">
        <span className="flex items-center gap-1.5 text-xs text-marinho-400">
          <span className="w-3 h-3 rounded bg-marinho-300 inline-block" /> Criadas
        </span>
        <span className="flex items-center gap-1.5 text-xs text-marinho-400">
          <span className="w-3 h-3 rounded bg-emerald-400 inline-block" /> Entregues
        </span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
export default function DashboardCoordenador() {
  const navigate = useNavigate();

  const [contadores,  setContadores] = useState({});
  const [evolucao,    setEvolucao]   = useState([]);
  const [ranking,     setRanking]    = useState([]);
  const [meusStats,   setMeusStats]  = useState(null);
  const [carregando,  setCarregando] = useState(true);
  const [erro,       setErro]       = useState('');
  const [periodoGraf, setPeriodoGraf]= useState(7);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro('');
    try {
      const [resEstat, resEvol, resRank, resMeus] = await Promise.all([
        solicitacoesApi.estatisticas(),
        solicitacoesApi.evolucao(periodoGraf),
        solicitacoesApi.rankingEstoquistas().catch(() => ({ data: { dados: { ranking: [] } } })),
        solicitacoesApi.minhasEstatisticas().catch(() => ({ data: { sucesso: false } })),
      ]);
      if (resEstat.data.sucesso) setContadores(resEstat.data.dados.contadores || {});
      if (resEvol.data.sucesso)  setEvolucao(resEvol.data.dados.evolucao || []);
      setRanking(resRank.data.dados?.ranking || []);
      if (resMeus.data.sucesso)  setMeusStats(resMeus.data.dados);
    } catch { setErro('Erro ao carregar dados. Verifique sua conexão.'); }
    finally { setCarregando(false); }
  }, [periodoGraf]);

  useEffect(() => { carregar(); }, [carregar]);

  // Socket: atualiza dashboard instantaneamente quando nova solicitação chega
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    function onNovaSolicitacao() { carregar(); }
    socket.on('nova_solicitacao', onNovaSolicitacao);
    return () => { socket.off('nova_solicitacao', onNovaSolicitacao); };
  }, [carregar]);

  const semEstoquista = contadores.aguardando_atribuicao || 0;
  const totalAtivos   = Object.entries(contadores)
    .filter(([s]) => !['entregue', 'cancelada'].includes(s))
    .reduce((acc, [, v]) => acc + v, 0);

  return (
    <div className="space-y-5">

      {/* Cabeçalho */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-marinho-900 flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-marinho-600" />
            Painel Geral
          </h1>
          <p className="text-marinho-400 text-sm mt-0.5">
            {totalAtivos} pedido{totalAtivos !== 1 ? 's' : ''} em aberto agora
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={carregar}
            className="btn-secondary flex items-center gap-2 text-sm"
            title="Atualizar">
            <RefreshCw className={`w-4 h-4 ${carregando ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
          <button onClick={() => navigate('/audit')}
            className="btn-secondary flex items-center gap-2 text-sm">
            <Shield className="w-4 h-4" /> Audit Log
          </button>
          <button onClick={() => navigate('/usuarios')} className="btn-primario">
            <Users className="w-4 h-4" /> Usuários
          </button>
        </div>
      </div>

      {/* Alerta crítico */}
      {semEstoquista > 0 && (
        <button
          onClick={() => navigate('/solicitacoes?status=aguardando_atribuicao')}
          className="w-full bg-red-50 border border-red-200 rounded-xl p-4
                      flex items-center gap-3 hover:bg-red-100 transition-colors text-left"
        >
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-800">
              {semEstoquista} solicitaç{semEstoquista > 1 ? 'ões' : 'ão'} aguardando atribuição de estoquista
            </p>
            <p className="text-xs text-red-600 mt-0.5">Clique para atribuir</p>
          </div>
          <ArrowRight className="w-4 h-4 text-red-400" />
        </button>
      )}

      {/* Cards por status */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {CARDS_STATUS.map(({ label, cor, icone: Icone, status }) => (
          <button
            key={status}
            onClick={() => navigate(`/solicitacoes?status=${status}`)}
            className={`card-base p-4 text-left border-l-4 ${cor}
                         hover:shadow-md transition-shadow cursor-pointer`}
          >
            <Icone className="w-5 h-5 text-marinho-600 mb-2" />
            <p className="text-xl font-bold text-marinho-900">
              {carregando ? '—' : (contadores[status] || 0)}
            </p>
            <p className="text-xs text-marinho-400 leading-tight mt-0.5">{label}</p>
          </button>
        ))}
      </div>

      {/* Gráfico de evolução + ranking */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Gráfico — ocupa 2/3 */}
        <div className="lg:col-span-2 card-base p-5">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h2 className="text-base font-semibold text-marinho-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-marinho-600" />
              Evolução de Pedidos
            </h2>
            <div className="flex gap-1">
              {[7, 14, 30].map((d) => (
                <button
                  key={d}
                  onClick={() => setPeriodoGraf(d)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors
                    ${periodoGraf === d
                      ? 'bg-marinho-600 text-white border-marinho-600'
                      : 'border-marinho-100 text-marinho-400 hover:border-marinho-300'}`}
                >
                  {d}d
                </button>
              ))}
            </div>
          </div>
          {carregando
            ? <div className="flex justify-center py-8"><Spinner /></div>
            : <GraficoEvolucao dados={evolucao} />
          }
        </div>

        {/* Ranking de estoquistas — ocupa 1/3 */}
        <div className="card-base p-5">
          <h2 className="text-base font-semibold text-marinho-900 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-600" />
            Top Estoquistas
          </h2>
                {/* Erro de carregamento com retry */}
      {erro && !carregando && (
        <ErroCarregamento mensagem={erro} onTentar={carregar} tentando={carregando} />
      )}

      {!erro && (carregando ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : ranking.length === 0 ? (
            <p className="text-sm text-marinho-300 text-center py-4">
              Nenhuma separação concluída ainda.
            </p>
          ) : (
            <div className="space-y-3">
              {ranking.slice(0, 5).map((r, idx) => {
                const corPos = idx === 0 ? 'bg-purple-600 text-white'
                             : idx === 1 ? 'bg-purple-200 text-purple-800'
                             : idx === 2 ? 'bg-purple-100 text-purple-700'
                             :             'bg-marinho-50 text-marinho-400';
                const dentroMeta = r.media_segundos <= 1800;
                return (
                  <div key={r.id} className="flex items-center gap-3">
                    <span className={`w-6 h-6 flex-shrink-0 flex items-center justify-center
                      rounded-full text-xs font-bold ${corPos}`}>
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-marinho-900 truncate">{r.nome}</p>
                      <p className="text-xs text-marinho-300">{r.total_pedidos} pedido{r.total_pedidos !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${dentroMeta ? 'text-green-700' : 'text-orange-600'}`}>
                        {fmtTempo(r.media_segundos)}
                      </p>
                      <p className="text-xs text-marinho-300">{r.pct_meta}% na meta</p>
                    </div>
                  </div>
                );
              })}
              {ranking.length > 5 && (
                <button
                  onClick={() => navigate('/relatorios')}
                  className="w-full text-xs text-marinho-600 hover:underline pt-1"
                >
                  Ver ranking completo →
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Atalho rápido */}
      <div className="card-base p-5 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-marinho-900">Todas as Solicitações</h2>
          <p className="text-sm text-marinho-400 mt-0.5">
            Gerencie prioridades, atribua estoquistas e acompanhe o fluxo completo
          </p>
        </div>
        <button onClick={() => navigate('/solicitacoes')} className="btn-primario">
          Ver todas <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Minha Performance como Solicitante */}
      {!carregando && meusStats?.como_vendedor && meusStats.como_vendedor.total_criadas > 0 && (() => {
        const v = meusStats.como_vendedor;
        const taxa = v.total_criadas > 0
          ? Math.round((v.entregues / v.total_criadas) * 100)
          : 0;
        const corTaxa = taxa >= 80 ? 'bg-emerald-500'
                      : taxa >= 50 ? 'bg-yellow-400'
                      : 'bg-red-400';
        return (
          <div className="card-base p-5">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-marinho-600" />
              <h2 className="text-sm font-semibold text-marinho-800">
                Minha Performance como Solicitante
              </h2>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center p-3 bg-marinho-50 rounded-xl">
                <p className="text-xl font-bold text-marinho-900">{v.total_criadas}</p>
                <p className="text-xs text-marinho-400 mt-0.5">Criadas</p>
              </div>
              <div className="text-center p-3 bg-emerald-50 rounded-xl">
                <p className="text-xl font-bold text-emerald-700">{v.entregues}</p>
                <p className="text-xs text-emerald-600 mt-0.5">Entregues</p>
              </div>
              <div className="text-center p-3 bg-marinho-50 rounded-xl">
                <p className="text-xl font-bold text-marinho-700">{v.em_andamento}</p>
                <p className="text-xs text-marinho-600 mt-0.5">Em Andamento</p>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-marinho-400">
                <span>Taxa de conclusão</span>
                <span className="font-semibold">{taxa}%</span>
              </div>
              <div className="h-2 bg-marinho-50 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${corTaxa}`}
                  style={{ width: `${Math.min(taxa, 100)}%` }}
                />
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
