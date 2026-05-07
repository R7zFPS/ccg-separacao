/**
 * @deprecated ARQUIVO LEGADO — NÃO USADO
 * Não está importado em nenhum lugar. Pode ser apagado manualmente.
 * Role 'diretor_operacoes' não existe no sistema atual.
 * Funcionalidade coberta por DashboardCoordenador (super_admin).
 */

import {
  BarChart2, AlertTriangle, Package, CheckCircle,
  Clock, Truck, PackageCheck, Calendar, ArrowRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const CARDS_KPI = [
  { label: 'Solicitações Abertas',  cor: 'border-blue-400   bg-blue-50',    icone: Package },
  { label: 'Em Separação',          cor: 'border-yellow-400 bg-yellow-50',  icone: Clock },
  { label: 'Material Separado',     cor: 'border-green-400  bg-green-50',   icone: CheckCircle },
  { label: 'Entregas Realizadas',   cor: 'border-emerald-400 bg-emerald-50', icone: PackageCheck },
  { label: 'Agendamentos',          cor: 'border-purple-400 bg-purple-50',  icone: Calendar },
  { label: 'Rotas em Trânsito',     cor: 'border-orange-400 bg-orange-50',  icone: Truck },
];

export default function DashboardDiretorOperacoes() {
  const { usuario } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart2 className="w-6 h-6 text-blue-600" />
            Painel Executivo
          </h1>
          <p className="text-gray-500 mt-1">
            Olá, {usuario?.nome?.split(' ')[0]}! Visão completa das operações.
          </p>
        </div>
        <button
          onClick={() => navigate('/relatorios')}
          className="btn-primario"
        >
          <BarChart2 className="w-4 h-4" />
          Ver Relatórios
        </button>
      </div>

      {/* Alerta de prioridade máxima */}
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-red-800">
            Solicitações com Prioridade Máxima
          </p>
          <p className="text-xs text-red-600 mt-0.5">
            Aprovação e acompanhamento disponíveis no Sprint 2.
          </p>
        </div>
      </div>

      {/* KPIs operacionais */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {CARDS_KPI.map(({ label, cor, icone: Icone }) => (
          <div key={label} className={`card-base p-4 border-l-4 ${cor}`}>
            <Icone className="w-5 h-5 text-gray-600 mb-2" />
            <p className="text-xl font-bold text-gray-900">—</p>
            <p className="text-xs text-gray-500 leading-tight mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Atalhos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card-base p-6 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">Todas as Solicitações</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Acompanhe o fluxo completo de demandas
            </p>
          </div>
          <button onClick={() => navigate('/solicitacoes')} className="btn-primario">
            Abrir <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <div className="card-base p-6 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">Histórico Geral</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Consulte todo o histórico de operações
            </p>
          </div>
          <button onClick={() => navigate('/historico')} className="btn-primario">
            Abrir <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Gráfico placeholder */}
      <div className="card-base p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">
          Volume de Solicitações — Últimos 30 dias
        </h2>
        <div className="text-center py-10">
          <BarChart2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">
            Gráficos e análises disponíveis no Sprint 6.
          </p>
        </div>
      </div>
    </div>
  );
}
