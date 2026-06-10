/**
 * Dashboard da Gerência (Matheus)
 * Visão gerencial completa: fluxo de solicitações + separação + entregas
 * Acesso: role === 'gerencia'
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Calendar, Clock, Truck, CheckCircle, ArrowRight, RefreshCw,
  AlertTriangle, Package, Users, FileText, BarChart2, ClipboardList,
  XCircle, Boxes, TrendingUp, Award, Shield,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth }     from '../../context/AuthContext';
import { solicitacoesApi } from '../../services/api';
import { getSocket }        from '../../services/socket';
import { Spinner }     from '../../components/ui/Spinner';
import { ErroCarregamento } from '../../components/ui/ErroCarregamento';

// ── Gráfico de evolução (SVG puro) ───────────────────────
function GraficoEvolucao({ dados, periodo }) {
  const W = 560, H = 160, PAD = { t: 20, r: 12, b: 48, l: 36 };
  const iW = W - PAD.l - PAD.r;
  const iH = H - PAD.t - PAD.b;

  const max = useMemo(() => {
    const m = Math.max(...dados.map((d) => Math.max(d.criadas, d.entregues)), 1);
    return Math.ceil(m / 5) * 5 || 5;
  }, [dados]);

  const barW   = Math.max(4, Math.floor((iW / dados.length) * 0.38));
  const gap    = Math.floor((iW / dados.length) * 0.12);
  const slotW  = iW / dados.length;
  const hoje   = new Date().toISOString().slice(0, 10);

  const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  function y(v) { return PAD.t + iH - (v / max) * iH; }

  // Ticks Y
  const ticks = [];
  for (let v = 0; v <= max; v += Math.ceil(max / 4)) ticks.push(v);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: H }}>
      {/* Grade horizontal */}
      {ticks.map((v) => (
        <g key={v}>
          <line
            x1={PAD.l} x2={W - PAD.r}
            y1={y(v)}  y2={y(v)}
            stroke="#f0f0f0" strokeWidth="1"
          />
          <text x={PAD.l - 4} y={y(v) + 4} textAnchor="end"
            fontSize="9" fill="#9ca3af">{v}</text>
        </g>
      ))}

      {/* Barras */}
      {dados.map((d, i) => {
        const cx    = PAD.l + i * slotW + slotW / 2;
        const xC    = cx - barW - gap / 2;
        const xE    = cx + gap / 2;
        const ehHoje = d.dia === hoje;

        const hC = Math.max(2, (d.criadas  / max) * iH);
        const hE = Math.max(2, (d.entregues / max) * iH);

        return (
          <g key={d.dia}>
            {/* Bar criadas (azul) */}
            <rect x={xC} y={y(d.criadas)} width={barW} height={hC}
              fill={ehHoje ? '#1d4ed8' : '#3b82f6'} rx="2" />
            {d.criadas > 0 && (
              <text x={xC + barW / 2} y={y(d.criadas) - 3}
                textAnchor="middle" fontSize="8" fill="#3b82f6">{d.criadas}</text>
            )}
            {/* Bar entregues (verde) */}
            <rect x={xE} y={y(d.entregues)} width={barW} height={hE}
              fill={ehHoje ? '#059669' : '#10b981'} rx="2" />
            {d.entregues > 0 && (
              <text x={xE + barW / 2} y={y(d.entregues) - 3}
                textAnchor="middle" fontSize="8" fill="#10b981">{d.entregues}</text>
            )}

            {/* Rótulo do dia */}
            {(periodo <= 14 || i % 2 === 0) && (
              <>
                <text x={cx} y={H - PAD.b + 13} textAnchor="middle"
                  fontSize="8" fill={ehHoje ? '#1d4ed8' : '#9ca3af'} fontWeight={ehHoje ? 'bold' : 'normal'}>
                  {dias[new Date(d.dia + 'T12:00:00').getDay()]}
                </text>
                <text x={cx} y={H - PAD.b + 24} textAnchor="middle"
                  fontSize="8" fill={ehHoje ? '#1d4ed8' : '#d1d5db'}>
                  {d.dia.slice(5)}
                </text>
              </>
            )}
          </g>
        );
      })}

      {/* Legenda */}
      <g transform={`translate(${PAD.l}, ${H - 10})`}>
        <rect width="8" height="8" rx="1" fill="#3b82f6" />
        <text x="11" y="7" fontSize="9" fill="#6b7280">Criadas</text>
        <rect x="60" width="8" height="8" rx="1" fill="#10b981" />
        <text x="71" y="7" fontSize="9" fill="#6b7280">Entregues</text>
      </g>
    </svg>
  );
}

// ── Meta de separação (30 min = 1800s) ───────────────────
const META_SEG = 1800;
function barraProgresso(pct) {
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

// ─────────────────────────────────────────────────────────
export default function DashboardGerencia() {
  const { usuario } = useAuth();
  const navigate    = useNavigate();

  const [stats,      setStats]      = useState(null);
  const [evolucao,   setEvolucao]   = useState([]);
  const [ranking,    setRanking]    = useState([]);
  const [meusStats,  setMeusStats]  = useState(null);
  const [periodoGraf, setPeriodo]   = useState(14);
  const [carregando, setCarregando] = useState(true);
  const [erro,       setErro]       = useState('');

  const buscar = useCallback(async () => {
    setCarregando(true);
    setErro('');
    try {
      const [r1, r2, r3, r4] = await Promise.all([
        solicitacoesApi.estatisticas(),
        solicitacoesApi.evolucao(periodoGraf),
        solicitacoesApi.rankingEstoquistas(),
        solicitacoesApi.minhasEstatisticas().catch(() => ({ data: { sucesso: false } })),
      ]);
      if (r1.data.sucesso) setStats(r1.data.dados);
      if (r2.data.sucesso) setEvolucao(r2.data.dados || []);
      if (r3.data.sucesso) setRanking((r3.data.dados || []).slice(0, 5));
      if (r4.data.sucesso) setMeusStats(r4.data.dados);
    } catch { setErro('Erro ao carregar dados. Verifique sua conexão.'); }
    finally { setCarregando(false); }
  }, [periodoGraf]);

  useEffect(() => { buscar(); }, [buscar]);

  // Socket: atualiza dashboard instantaneamente quando nova solicitação chega
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    function onNovaSolicitacao() { buscar(); }
    socket.on('nova_solicitacao', onNovaSolicitacao);
    return () => { socket.off('nova_solicitacao', onNovaSolicitacao); };
  }, [buscar]);

  const ps = stats?.por_status || stats?.contadores || {};

  const abertas          = ps.aberta                || 0;
  const emConferencia    = ps.em_conferencia        || 0;
  const emSeparacao      = ps.em_separacao          || 0;
  const materialSeparado = ps.material_separado     || 0;
  const entregaSolicitada   = ps.entrega_solicitada    || 0;
  const propostaRecusada    = ps.proposta_recusada     || 0;
  const agendConfirmado     = ps.agendamento_realizado || 0;
  const emRota              = ps.rota_enviada          || 0;
  const entregues           = ps.entregue              || 0;
  const totalAbertos = stats?.total_abertas || 0;

  const alertas = [];
  if (propostaRecusada > 0)
    alertas.push({ msg: `${propostaRecusada} proposta${propostaRecusada > 1 ? 's' : ''} de entrega recusada${propostaRecusada > 1 ? 's' : ''} — aguardando nova data do vendedor`, cor: 'orange', rota: '/solicitacoes' });
  if (entregaSolicitada > 0)
    alertas.push({ msg: `${entregaSolicitada} pedido${entregaSolicitada > 1 ? 's' : ''} aguardando aprovação de data de entrega`, cor: 'blue', rota: '/agendamentos' });
  if (materialSeparado > 0)
    alertas.push({ msg: `${materialSeparado} pedido${materialSeparado > 1 ? 's' : ''} com material pronto para agendar entrega`, cor: 'green', rota: '/agendamentos' });

  const corAlerta = {
    orange: 'bg-orange-50 border-orange-200 text-orange-800',
    blue:   'bg-marinho-50   border-marinho-100   text-marinho-800',
    green:  'bg-emerald-50 border-emerald-200 text-emerald-800',
  };
  const corIcone = {
    orange: 'text-orange-500',
    blue:   'text-marinho-500',
    green:  'text-emerald-500',
  };

  function formatarTempo(seg) {
    if (!seg) return '—';
    if (seg < 60) return `${Math.round(seg)}s`;
    const m = Math.floor(seg / 60);
    const s = Math.round(seg % 60);
    if (m < 60) return s > 0 ? `${m}min ${s}s` : `${m}min`;
    return `${Math.floor(m / 60)}h ${m % 60}min`;
  }

  return (
    <div className="space-y-6">

      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-marinho-900">
            Olá, {usuario?.nome?.split(' ')[0]}!
          </h1>
          <p className="text-marinho-400 mt-1 text-sm">
            Painel de Gerência — visão completa do fluxo operacional.
          </p>
        </div>
        <button
          onClick={buscar}
          className="p-2 rounded-lg text-marinho-400 hover:bg-marinho-50 transition-colors"
          title="Atualizar"
        >
          <RefreshCw className={`w-4 h-4 ${carregando ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Alertas de ação */}
      {!carregando && alertas.length > 0 && (
        <div className="space-y-2">
          {alertas.map(({ msg, cor, rota }, i) => (
            <button
              key={i}
              onClick={() => navigate(rota)}
              className={`w-full flex items-center gap-3 p-4 border rounded-xl text-left
                          hover:opacity-90 transition-opacity ${corAlerta[cor]}`}
            >
              <AlertTriangle className={`w-5 h-5 flex-shrink-0 ${corIcone[cor]}`} />
              <p className="flex-1 font-medium text-sm">{msg}</p>
              <ArrowRight className="w-4 h-4 flex-shrink-0 opacity-60" />
            </button>
          ))}
        </div>
      )}

            {/* Erro de carregamento com retry */}
      {erro && !carregando && (
        <ErroCarregamento mensagem={erro} onTentar={buscar} tentando={carregando} />
      )}

      {!erro && (carregando ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : (
        <>
          {/* Seção: Separação */}
          <div>
            <h2 className="text-xs font-semibold text-marinho-300 uppercase tracking-wider mb-3">
              Separação
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="card-base p-5 border-l-4 border-marinho-200">
                <ClipboardList className="w-5 h-5 text-marinho-300 mb-2" />
                <p className="text-2xl font-bold text-marinho-900">{abertas}</p>
                <p className="text-xs text-marinho-400 mt-0.5">Abertas</p>
              </div>
              <div className="card-base p-5 border-l-4 border-yellow-400">
                <Clock className="w-5 h-5 text-yellow-500 mb-2" />
                <p className="text-2xl font-bold text-marinho-900">{emConferencia}</p>
                <p className="text-xs text-marinho-400 mt-0.5">Em Conferência</p>
              </div>
              <div className="card-base p-5 border-l-4 border-marinho-300">
                <Boxes className="w-5 h-5 text-marinho-500 mb-2" />
                <p className="text-2xl font-bold text-marinho-900">{emSeparacao}</p>
                <p className="text-xs text-marinho-400 mt-0.5">Em Separação</p>
              </div>
              <button
                onClick={() => navigate('/agendamentos')}
                className="card-base p-5 border-l-4 border-emerald-400 text-left
                            hover:shadow-md transition-shadow"
              >
                <Package className="w-5 h-5 text-emerald-500 mb-2" />
                <p className="text-2xl font-bold text-marinho-900">{materialSeparado}</p>
                <p className="text-xs text-marinho-400 mt-0.5">Prontos p/ Agendar</p>
              </button>
            </div>
          </div>

          {/* Seção: Entregas */}
          <div>
            <h2 className="text-xs font-semibold text-marinho-300 uppercase tracking-wider mb-3">
              Entregas
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <button
                onClick={() => navigate('/agendamentos')}
                className="card-base p-5 border-l-4 border-orange-400 text-left
                            hover:shadow-md transition-shadow"
              >
                <XCircle className="w-5 h-5 text-orange-500 mb-2" />
                <p className="text-2xl font-bold text-marinho-900">{propostaRecusada}</p>
                <p className="text-xs text-marinho-400 mt-0.5">Proposta Recusada</p>
              </button>
              <button
                onClick={() => navigate('/agendamentos')}
                className="card-base p-5 border-l-4 border-marinho-300 text-left
                            hover:shadow-md transition-shadow"
              >
                <Calendar className="w-5 h-5 text-marinho-500 mb-2" />
                <p className="text-2xl font-bold text-marinho-900">{entregaSolicitada}</p>
                <p className="text-xs text-marinho-400 mt-0.5">Entrega Solicitada</p>
              </button>
              <div className="card-base p-5 border-l-4 border-indigo-400">
                <Calendar className="w-5 h-5 text-indigo-500 mb-2" />
                <p className="text-2xl font-bold text-marinho-900">{agendConfirmado}</p>
                <p className="text-xs text-marinho-400 mt-0.5">Agendados</p>
              </div>
              <div className="card-base p-5 border-l-4 border-purple-400">
                <Truck className="w-5 h-5 text-purple-500 mb-2" />
                <p className="text-2xl font-bold text-marinho-900">{emRota}</p>
                <p className="text-xs text-marinho-400 mt-0.5">Em Rota</p>
              </div>
            </div>

            {/* Entregues — destaque separado */}
            <div className="mt-4 card-base p-4 flex items-center gap-4 bg-emerald-50 border border-emerald-200">
              <CheckCircle className="w-6 h-6 text-emerald-600 flex-shrink-0" />
              <div>
                <p className="text-2xl font-bold text-emerald-700">{entregues}</p>
                <p className="text-sm text-emerald-600">Pedidos entregues no total</p>
              </div>
            </div>
          </div>

          {/* Evolução + Ranking (duas colunas em telas grandes) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

            {/* Gráfico de evolução */}
            <div className="lg:col-span-2 card-base p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-marinho-600" />
                  <h2 className="text-sm font-semibold text-marinho-800">Evolução de Solicitações</h2>
                </div>
                <div className="flex gap-1">
                  {[7, 14, 30].map((d) => (
                    <button
                      key={d}
                      onClick={() => setPeriodo(d)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors
                        ${periodoGraf === d
                          ? 'bg-marinho-600 text-white'
                          : 'text-marinho-400 hover:bg-marinho-50'}`}
                    >
                      {d}d
                    </button>
                  ))}
                </div>
              </div>
              {evolucao.length > 0
                ? <GraficoEvolucao dados={evolucao} periodo={periodoGraf} />
                : <p className="text-sm text-marinho-300 text-center py-8">Sem dados no período.</p>
              }
            </div>

            {/* Ranking top-5 estoquistas */}
            <div className="card-base p-5">
              <div className="flex items-center gap-2 mb-4">
                <Award className="w-5 h-5 text-yellow-500" />
                <h2 className="text-sm font-semibold text-marinho-800">Top Estoquistas</h2>
              </div>

              {ranking.length === 0 ? (
                <p className="text-sm text-marinho-300 text-center py-8">Sem dados.</p>
              ) : (
                <div className="space-y-3">
                  {ranking.map((e, i) => {
                    const pctMeta = e.pct_dentro_meta ?? 0;
                    return (
                      <div key={e.estoquista_id} className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold w-5 text-center
                            ${i === 0 ? 'text-yellow-500'
                            : i === 1 ? 'text-marinho-300'
                            : i === 2 ? 'text-amber-600'
                            : 'text-marinho-200'}`}>
                            {i + 1}º
                          </span>
                          <span className="text-sm font-medium text-marinho-800 flex-1 truncate">
                            {e.nome?.split(' ')[0]}
                          </span>
                          <span className="text-xs text-marinho-400">
                            {formatarTempo(e.avg_segundos)}
                          </span>
                        </div>
                        <div className="pl-7 flex items-center gap-2">
                          {barraProgresso(pctMeta)}
                          <span className="text-xs text-marinho-300 whitespace-nowrap">
                            {e.total} sep.
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <p className="text-xs text-marinho-200 mt-4 pt-3 border-t border-gray-50">
                Meta: ≤ 30 min por separação
              </p>
            </div>
          </div>

          {/* Minha Performance como Solicitante */}
          {meusStats?.como_vendedor && meusStats.como_vendedor.total_criadas > 0 && (() => {
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

          {/* Ações rápidas */}
          <div>
            <h2 className="text-xs font-semibold text-marinho-300 uppercase tracking-wider mb-3">
              Ações Rápidas
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                {
                  label: 'Nova Solicitação',
                  desc:  'Abrir nova solicitação de separação',
                  icon:  ClipboardList, rota: '/solicitacoes/nova', cor: 'green',
                },
                {
                  label: 'Gerenciar Agendamentos',
                  desc:  'Aprovar, recusar e agendar entregas',
                  icon:  Calendar, rota: '/agendamentos', cor: 'blue',
                },
                {
                  label: 'Fila de Separação',
                  desc:  'Acompanhar progresso das separações',
                  icon:  Package, rota: '/fila', cor: 'yellow',
                },
                {
                  label: 'Todas as Solicitações',
                  desc:  `${totalAbertos} em andamento`,
                  icon:  ClipboardList, rota: '/solicitacoes', cor: 'gray',
                },
                {
                  label: 'Relatórios',
                  desc:  'Performance e histórico',
                  icon:  BarChart2, rota: '/relatorios', cor: 'purple',
                },
                {
                  label: 'Usuários',
                  desc:  'Editar dados da equipe',
                  icon:  Users, rota: '/usuarios', cor: 'indigo',
                },
                {
                  label: 'Histórico',
                  desc:  'Todas as solicitações concluídas',
                  icon:  FileText, rota: '/historico', cor: 'gray',
                },
                {
                  label: 'Audit Log',
                  desc:  'Rastreabilidade de ações',
                  icon:  Shield, rota: '/audit', cor: 'red',
                },
              ].map(({ label, desc, icon: Icone, rota, cor }) => (
                <button
                  key={rota}
                  onClick={() => navigate(rota)}
                  className="card-base p-4 flex items-center justify-between
                              hover:shadow-md transition-shadow group text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-${cor}-100`}>
                      <Icone className={`w-4 h-4 text-${cor}-600`} />
                    </div>
                    <div>
                      <p className="font-semibold text-marinho-900 text-sm">{label}</p>
                      <p className="text-xs text-marinho-400">{desc}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-marinho-200 group-hover:text-marinho-400
                                          transition-colors flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </>
      ))}
    </div>
  );
}
