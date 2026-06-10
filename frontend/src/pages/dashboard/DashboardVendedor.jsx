/**
 * Dashboard do Vendedor
 * Resumo das próprias solicitações com contadores reais + estatísticas pessoais
 */

import { useEffect, useState, useCallback } from 'react';
import {
  ClipboardList, Clock, PackageCheck, CalendarCheck,
  Plus, ArrowRight, TrendingUp, Activity, RefreshCw,
} from 'lucide-react';
import { useNavigate }       from 'react-router-dom';
import { useAuth }           from '../../context/AuthContext';
import { solicitacoesApi }   from '../../services/api';
import { getSocket }         from '../../services/socket';
import { CardSolicitacao }   from '../../components/solicitacoes/CardSolicitacao';
import { Spinner }           from '../../components/ui/Spinner';
import { ErroCarregamento } from '../../components/ui/ErroCarregamento';

const CARDS_RESUMO = [
  { label: 'Abertas',         status: 'aberta',                cor: 'bg-marinho-50   text-marinho-700',   icone: ClipboardList },
  { label: 'Em Separação',    status: 'em_separacao',          cor: 'bg-yellow-100 text-yellow-700', icone: Clock },
  { label: 'Material Pronto', status: 'material_separado',     cor: 'bg-green-100  text-green-700',  icone: PackageCheck },
  { label: 'Agendadas',       status: 'agendamento_realizado', cor: 'bg-marinho-100   text-marinho-700',   icone: CalendarCheck },
];

export default function DashboardVendedor() {
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
        solicitacoesApi.listar({ limit: 5 }),
        solicitacoesApi.minhasEstatisticas().catch(() => ({ data: { sucesso: false } })),
      ]);
      if (stats.sucesso) setContadores(stats.dados.contadores || {});
      if (lista.sucesso) setRecentes(lista.dados.solicitacoes || []);
      if (meus.sucesso)  setMeusStats(meus.dados);
    } catch { setErro('Erro ao carregar dados. Verifique sua conexão.'); }
    finally { setCarregando(false); }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  // Socket: atualiza contadores quando o status de uma solicitação muda
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    function onStatusAtualizado() { carregar(); }
    socket.on('status_atualizado', onStatusAtualizado);
    return () => { socket.off('status_atualizado', onStatusAtualizado); };
  }, [carregar]);

  const v = meusStats?.como_vendedor;
  const taxaConclusao = v && v.total_criadas > 0
    ? Math.round((v.entregues / v.total_criadas) * 100)
    : null;

  return (
    <div className="space-y-6">
      {/* Saudação */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-marinho-900">
            Olá, {usuario?.nome?.split(' ')[0]}!
          </h1>
          <p className="text-marinho-400 mt-1">Gerencie suas solicitações de separação.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={carregar}
            className="p-2 rounded-lg text-marinho-400 hover:bg-marinho-50 transition-colors"
            title="Atualizar"
          >
            <RefreshCw className={`w-4 h-4 ${carregando ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => navigate('/solicitacoes/nova')} className="btn-primario">
            <Plus className="w-4 h-4" />
            Nova Solicitação
          </button>
        </div>
      </div>

      {/* Cards de contadores */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {CARDS_RESUMO.map(({ label, status, cor, icone: Icone }) => (
          <button
            key={status}
            onClick={() => navigate(`/solicitacoes?status=${status}`)}
            className="card-base p-5 text-left hover:shadow-md transition-shadow"
          >
            <div className={`inline-flex p-2.5 rounded-lg ${cor} mb-3`}>
              <Icone className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-marinho-900">
              {carregando ? '·' : (contadores[status] || 0)}
            </p>
            <p className="text-sm text-marinho-400 mt-0.5">{label}</p>
          </button>
        ))}
      </div>

      {/* Minhas Estatísticas pessoais */}
      {!carregando && v && v.total_criadas > 0 && (
        <div className="card-base p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-marinho-600" />
            <h2 className="font-semibold text-marinho-900">Minha Performance</h2>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-marinho-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-marinho-900">{v.total_criadas}</p>
              <p className="text-xs text-marinho-400 mt-0.5">Criadas</p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-emerald-700">{v.entregues}</p>
              <p className="text-xs text-emerald-600 mt-0.5">Entregues</p>
            </div>
            <div className="bg-marinho-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-marinho-700">{v.em_andamento}</p>
              <p className="text-xs text-marinho-600 mt-0.5">Em andamento</p>
            </div>
          </div>

          {taxaConclusao !== null && (
            <div>
              <div className="flex justify-between text-xs text-marinho-400 mb-1.5">
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-emerald-500" />
                  Taxa de conclusão
                </span>
                <span className="font-semibold text-marinho-700">{taxaConclusao}%</span>
              </div>
              <div className="h-2 bg-marinho-50 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    taxaConclusao >= 80 ? 'bg-emerald-500' :
                    taxaConclusao >= 50 ? 'bg-yellow-400' : 'bg-red-400'
                  }`}
                  style={{ width: `${taxaConclusao}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Últimas solicitações */}
      <div className="card-base p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-marinho-900">Últimas Solicitações</h2>
          <button
            onClick={() => navigate('/solicitacoes')}
            className="flex items-center gap-1 text-sm text-marinho-600 hover:text-marinho-800"
          >
            Ver todas <ArrowRight className="w-3 h-3" />
          </button>
        </div>

              {/* Erro de carregamento com retry */}
      {erro && !carregando && (
        <ErroCarregamento mensagem={erro} onTentar={carregar} tentando={carregando} />
      )}

      {!erro && (carregando ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : recentes.length === 0 ? (
          <div className="text-center py-8">
            <ClipboardList className="w-10 h-10 text-marinho-100 mx-auto mb-3" />
            <p className="text-marinho-300 text-sm">Nenhuma solicitação ainda.</p>
            <button
              onClick={() => navigate('/solicitacoes/nova')}
              className="mt-3 text-sm text-marinho-600 hover:text-marinho-800 font-medium"
            >
              Criar primeira solicitação →
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {recentes.map((s) => <CardSolicitacao key={s.id} solicitacao={s} compacto />)}
          </div>
        ))}
      </div>
    </div>
  );
}
