/**
 * Dashboard do Motorista (Antônio)
 * Exibe contagem real de entregas do dia + acesso rápido à rota
 */

import { useState, useEffect, useCallback } from 'react';
import { Truck, MapPin, CheckCircle, ArrowRight, RefreshCw, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { entregasApi } from '../../services/api';
import { getSocket }    from '../../services/socket';
import { Spinner } from '../../components/ui/Spinner';
import { ErroCarregamento } from '../../components/ui/ErroCarregamento';
import { formatarData } from '../../utils/formatters';

export default function DashboardMotorista() {
  const { usuario } = useAuth();
  const navigate    = useNavigate();
  const hoje        = formatarData(new Date().toISOString());

  const [pendentes,  setPendentes]  = useState(null);
  const [entregues,  setEntregues]  = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro,       setErro]       = useState('');

  const buscar = useCallback(async () => {
    setCarregando(true);
    setErro('');
    try {
      const [{ data: pend }, { data: hist }] = await Promise.all([
        entregasApi.listarMotorista(),
        entregasApi.historico(),
      ]);
      if (pend.sucesso) setPendentes(pend.dados.entregas.length);
      if (hist.sucesso) {
        // Conta apenas as entregues hoje
        const hojeStr = new Date().toISOString().split('T')[0];
        const hojeCount = hist.dados.entregas.filter((e) =>
          e.entregue_em?.startsWith(hojeStr)
        ).length;
        setEntregues(hojeCount);
      }
    } catch { setErro('Erro ao carregar dados. Verifique sua conexão.'); }
    finally { setCarregando(false); }
  }, []);

  useEffect(() => { buscar(); }, [buscar]);

  // Socket: atualiza dashboard quando nova rota é atribuída ao motorista
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    function onNovaRota() { buscar(); }
    socket.on('nova_rota', onNovaRota);
    return () => { socket.off('nova_rota', onNovaRota); };
  }, [buscar]);

  const saudacao = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {saudacao()}, {usuario?.nome?.split(' ')[0]}!
          </h1>
          <p className="text-gray-500 mt-1 text-sm">Entregas de hoje — {hoje}</p>
        </div>
        <button
          onClick={buscar}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${carregando ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Alerta — entregas pendentes */}
      {!carregando && pendentes > 0 && (
        <button
          onClick={() => navigate('/motorista')}
          className="w-full flex items-center gap-3 p-4 bg-blue-50 border border-blue-200
                      rounded-xl text-left hover:bg-blue-100 transition-colors"
        >
          <AlertTriangle className="w-5 h-5 text-blue-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-blue-800">
              {pendentes} {pendentes === 1 ? 'entrega pendente' : 'entregas pendentes'}
            </p>
            <p className="text-sm text-blue-600">Clique para ver sua rota de hoje</p>
          </div>
          <ArrowRight className="w-4 h-4 text-blue-600 flex-shrink-0" />
        </button>
      )}

      {!carregando && pendentes === 0 && (
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <p className="font-semibold text-green-800">Nenhuma entrega pendente hoje!</p>
        </div>
      )}

      {/* Resumo do dia */}
            {/* Erro de carregamento com retry */}
      {erro && !carregando && (
        <ErroCarregamento mensagem={erro} onTentar={buscar} tentando={carregando} />
      )}

      {!erro && (carregando ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => navigate('/motorista')}
            className="card-base p-5 border-l-4 border-blue-400 text-left hover:shadow-md transition-shadow"
          >
            <Truck className="w-6 h-6 text-blue-500 mb-2" />
            <p className="text-3xl font-bold text-gray-900">
              {pendentes ?? '—'}
            </p>
            <p className="text-sm text-gray-500">Pendentes hoje</p>
          </button>

          <div className="card-base p-5 border-l-4 border-green-400">
            <CheckCircle className="w-6 h-6 text-green-500 mb-2" />
            <p className="text-3xl font-bold text-gray-900">
              {entregues ?? '—'}
            </p>
            <p className="text-sm text-gray-500">Entregues hoje</p>
          </div>
        </div>
      ))}

      {/* CTA rota do dia */}
      <div className="card-base p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-blue-100 rounded-lg">
            <MapPin className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Minha Rota</h2>
            <p className="text-sm text-gray-500">
              Endereços, documentos e confirmação de entrega
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate('/motorista')}
          className="btn-primario w-full justify-center"
        >
          Ver rota e entregas <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
