/**
 * @deprecated ARQUIVO LEGADO — NÃO USADO
 * Não está importado em nenhum lugar. Pode ser apagado manualmente.
 * Funcionalidade coberta por DashboardGerenteVendas (role: logistica).
 */

import { Calendar, Clock, CheckCircle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function DashboardAgendamento() {
  const { usuario } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Olá, {usuario?.nome?.split(' ')[0]}!
        </h1>
        <p className="text-gray-500 mt-1">
          Gerencie os agendamentos de entrega.
        </p>
      </div>

      {/* Cards resumo */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card-base p-5 border-l-4 border-blue-400">
          <Clock className="w-6 h-6 text-blue-500 mb-2" />
          <p className="text-2xl font-bold text-gray-900">—</p>
          <p className="text-sm text-gray-500">Aguardando confirmação</p>
        </div>
        <div className="card-base p-5 border-l-4 border-green-400">
          <CheckCircle className="w-6 h-6 text-green-500 mb-2" />
          <p className="text-2xl font-bold text-gray-900">—</p>
          <p className="text-sm text-gray-500">Confirmados</p>
        </div>
        <div className="card-base p-5 border-l-4 border-purple-400">
          <Calendar className="w-6 h-6 text-purple-500 mb-2" />
          <p className="text-2xl font-bold text-gray-900">—</p>
          <p className="text-sm text-gray-500">Entregas esta semana</p>
        </div>
      </div>

      <div className="card-base p-6 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-gray-900">Agendamentos Pendentes</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Confirme ou ajuste os agendamentos solicitados
          </p>
        </div>
        <button
          onClick={() => navigate('/agendamentos')}
          className="btn-primario"
        >
          Ver agendamentos <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
