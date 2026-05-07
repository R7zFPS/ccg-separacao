/**
 * Dashboard do Gerente de Vendas (Matheus)
 * Exibe contadores reais de agendamentos por status + atalhos
 */

import { useState, useEffect, useCallback } from 'react';
import { Calendar, Clock, Truck, CheckCircle, ArrowRight, RefreshCw, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { solicitacoesApi } from '../../services/api';
import { getSocket }        from '../../services/socket';
import { Spinner } from '../../components/ui/Spinner';
import { ErroCarregamento } from '../../components/ui/ErroCarregamento';

export default function DashboardGerenteVendas() {
  const { usuario } = useAuth();
  const navigate    = useNavigate();

  const [stats,      setStats]      = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro,       setErro]       = useState('');

  const buscar = useCallback(async () => {
    setCarregando(true);
    setErro('');
    try {
      const { data } = await solicitacoesApi.estatisticas();
      if (data.sucesso) setStats(data.dados);
    } catch { setErro('Erro ao carregar dados. Verifique sua conexão.'); }
    finally { setCarregando(false); }
  }, []);

  useEffect(() => { buscar(); }, [buscar]);

  // Socket: atualiza quando material fica pronto (nova_proposta_entrega = broadcast global)
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    function onUpdate() { buscar(); }
    socket.on('nova_proposta_entrega', onUpdate);
    socket.on('status_atualizado',    onUpdate);
    return () => {
      socket.off('nova_proposta_entrega', onUpdate);
      socket.off('status_atualizado',    onUpdate);
    };
  }, [buscar]);

  // backend retorna tanto por_status quanto contadores (retrocompat)
  const ps           = stats?.por_status || stats?.contadores || {};
  const prontos      = ps.material_separado     || 0;
  const confirmados  = ps.agendamento_realizado  || 0;
  const emRota       = ps.rota_enviada           || 0;
  const entregues    = ps.entregue               || 0;
  const totalAbertos = stats?.total_abertas || 0;

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Olá, {usuario?.nome?.split(' ')[0]}!
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Gerencie agendamentos e acompanhe as entregas.
          </p>
        </div>
        <button
          onClick={buscar}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${carregando ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Alerta — prontos para agendar */}
      {!carregando && prontos > 0 && (
        <button
          onClick={() => navigate('/agendamentos')}
          className="w-full flex items-center gap-3 p-4 bg-blue-50 border border-blue-200
                      rounded-xl text-left hover:bg-blue-100 transition-colors"
        >
          <AlertTriangle className="w-5 h-5 text-blue-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-blue-800">
              {prontos} {prontos === 1 ? 'pedido pronto' : 'pedidos prontos'} para agendar
            </p>
            <p className="text-sm text-blue-600">Clique para confirmar os agendamentos</p>
          </div>
          <ArrowRight className="w-4 h-4 text-blue-600 flex-shrink-0" />
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <button
            onClick={() => navigate('/agendamentos')}
            className="card-base p-5 border-l-4 border-blue-400 text-left hover:shadow-md transition-shadow"
          >
            <Clock className="w-5 h-5 text-blue-500 mb-2" />
            <p className="text-2xl font-bold text-gray-900">{prontos}</p>
            <p className="text-xs text-gray-500 mt-0.5">Para Agendar</p>
          </button>

          <button
            onClick={() => navigate('/agendamentos')}
            className="card-base p-5 border-l-4 border-green-400 text-left hover:shadow-md transition-shadow"
          >
            <Calendar className="w-5 h-5 text-green-500 mb-2" />
            <p className="text-2xl font-bold text-gray-900">{confirmados}</p>
            <p className="text-xs text-gray-500 mt-0.5">Agendados</p>
          </button>

          <button
            onClick={() => navigate('/agendamentos')}
            className="card-base p-5 border-l-4 border-purple-400 text-left hover:shadow-md transition-shadow"
          >
            <Truck className="w-5 h-5 text-purple-500 mb-2" />
            <p className="text-2xl font-bold text-gray-900">{emRota}</p>
            <p className="text-xs text-gray-500 mt-0.5">Em Rota</p>
          </button>

          <div className="card-base p-5 border-l-4 border-emerald-400">
            <CheckCircle className="w-5 h-5 text-emerald-500 mb-2" />
            <p className="text-2xl font-bold text-gray-900">{entregues}</p>
            <p className="text-xs text-gray-500 mt-0.5">Entregues</p>
          </div>
        </div>
      ))}

      {/* Ações rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={() => navigate('/agendamentos')}
          className="card-base p-5 flex items-center justify-between hover:shadow-md transition-shadow group"
        >
          <div className="text-left">
            <p className="font-semibold text-gray-900">Gerenciar Agendamentos</p>
            <p className="text-sm text-gray-500 mt-0.5">
              Confirmar datas e enviar rotas
            </p>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
        </button>

        <button
          onClick={() => navigate('/solicitacoes')}
          className="card-base p-5 flex items-center justify-between hover:shadow-md transition-shadow group"
        >
          <div className="text-left">
            <p className="font-semibold text-gray-900">Ver Todas as Solicitações</p>
            <p className="text-sm text-gray-500 mt-0.5">
              {totalAbertos} solicitação{totalAbertos !== 1 ? 'ões' : ''} em andamento
            </p>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
        </button>
      </div>
    </div>
  );
}
