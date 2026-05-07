/**
 * Dashboard do Emissor de NF (Alana / Caio)
 * Mostra solicitações aguardando emissão de nota fiscal
 */

import { useState, useEffect, useCallback } from 'react';
import { FileText, CheckCircle, ArrowRight, RefreshCw, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { solicitacoesApi } from '../../services/api';
import { getSocket }       from '../../services/socket';
import { Spinner } from '../../components/ui/Spinner';
import { ErroCarregamento } from '../../components/ui/ErroCarregamento';
import { BadgeStatus } from '../../components/solicitacoes/BadgeStatus';
import { tempoRelativo } from '../../utils/formatters';

export default function DashboardEmissorNF() {
  const { usuario } = useAuth();
  const navigate    = useNavigate();

  const [lista,      setLista]      = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro,       setErro]       = useState('');

  const buscar = useCallback(async () => {
    setCarregando(true);
    setErro('');
    try {
      const { data } = await solicitacoesApi.listar();
      if (data.sucesso) setLista(data.dados.solicitacoes);
    } catch { setErro('Erro ao carregar dados. Verifique sua conexão.'); }
    finally { setCarregando(false); }
  }, []);

  useEffect(() => { buscar(); }, [buscar]);

  // Socket: atualiza fila de NF quando nova solicitação aguarda emissão
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    function onNovaNF() { buscar(); }
    socket.on('nova_nf_pendente', onNovaNF);
    return () => { socket.off('nova_nf_pendente', onNovaNF); };
  }, [buscar]);

  const aguardando = lista.filter(s => s.status === 'aguardando_nf').length;
  const emEmissao  = lista.filter(s => s.status === 'em_emissao_nf').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Olá, {usuario?.nome?.split(' ')[0]}!
          </h1>
          <p className="text-sm text-gray-500 mt-1">Emissão de Notas Fiscais</p>
        </div>
        <button onClick={buscar} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100">
          <RefreshCw className={`w-4 h-4 ${carregando ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Alerta */}
      {!carregando && aguardando > 0 && (
        <button
          onClick={() => navigate('/solicitacoes')}
          className="w-full flex items-center gap-3 p-4 bg-amber-50 border border-amber-200
                      rounded-xl text-left hover:bg-amber-100 transition-colors"
        >
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-amber-800">
              {aguardando} {aguardando === 1 ? 'nota fiscal aguardando' : 'notas fiscais aguardando'} emissão
            </p>
            <p className="text-sm text-amber-600">Clique para ver e emitir</p>
          </div>
          <ArrowRight className="w-4 h-4 text-amber-600" />
        </button>
      )}

      {/* Cards */}
            {/* Erro de carregamento com retry */}
      {erro && !carregando && (
        <ErroCarregamento mensagem={erro} onTentar={buscar} tentando={carregando} />
      )}

      {!erro && (carregando ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div className="card-base p-5 border-l-4 border-amber-400">
            <FileText className="w-5 h-5 text-amber-500 mb-2" />
            <p className="text-2xl font-bold text-gray-900">{aguardando}</p>
            <p className="text-xs text-gray-500">Aguardando emissão</p>
          </div>
          <div className="card-base p-5 border-l-4 border-indigo-400">
            <CheckCircle className="w-5 h-5 text-indigo-500 mb-2" />
            <p className="text-2xl font-bold text-gray-900">{emEmissao}</p>
            <p className="text-xs text-gray-500">Em emissão</p>
          </div>
        </div>
      ))}

      {/* Lista recente */}
      {lista.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-700">Fila de NF</h2>
          {lista.slice(0, 5).map(s => (
            <button
              key={s.id}
              onClick={() => navigate(`/solicitacoes/${s.id}`)}
              className="w-full card-base p-4 flex items-center justify-between text-left
                          hover:shadow-md transition-shadow"
            >
              <div>
                <p className="font-semibold text-gray-900">#{s.numero_proposta}</p>
                <p className="text-xs text-gray-400 mt-0.5">{tempoRelativo(s.updated_at)}</p>
              </div>
              <div className="flex items-center gap-2">
                <BadgeStatus status={s.status} />
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </div>
            </button>
          ))}
          {lista.length > 5 && (
            <button
              onClick={() => navigate('/solicitacoes')}
              className="w-full text-sm text-blue-600 hover:text-blue-800 py-2"
            >
              Ver todas ({lista.length})
            </button>
          )}
        </div>
      )}
    </div>
  );
}
