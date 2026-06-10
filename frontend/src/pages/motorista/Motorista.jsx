/**
 * Página do Motorista — Entregas do Dia
 * Lista as rotas atribuídas, links de navegação (Waze + Google Maps)
 * e permite confirmar entrega com FOTO OBRIGATÓRIA (na instalação do cliente)
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Truck, MapPin, FileText, CheckCircle,
  Camera, Clock, Package, RefreshCw, AlertTriangle,
  ExternalLink, History, Navigation,
} from 'lucide-react';
import api from '../../services/api';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useAuth }          from '../../context/AuthContext';
import { getSocket }        from '../../services/socket';
import { Spinner }          from '../../components/ui/Spinner';
import { ErroCarregamento } from '../../components/ui/ErroCarregamento';
import { useToast }         from '../../hooks/useToast';
import { ToastContainer }   from '../../components/ui/Toast';
import { formatarData, tempoRelativo } from '../../utils/formatters';
import { resolveFileUrl } from '../../utils/arquivos';

const entregasApi = {
  minhas:    (params) => api.get('/entregas/motorista', { params }),
  historico: ()       => api.get('/entregas/historico'),
  confirmar: (id, fd) => api.patch(`/entregas/${id}/confirmar`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

// ── Links de navegação ────────────────────────────────
function linksNavegacao(endereco) {
  const enc = encodeURIComponent(endereco);
  return {
    waze:   `https://waze.com/ul?q=${enc}&navigate=yes`,
    google: `https://maps.google.com/?q=${enc}`,
  };
}

// ── Chip de documento ─────────────────────────────────
function DocLink({ url, label }) {
  if (!url) return null;
  return (
    <a
      href={resolveFileUrl(url)}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-1 text-xs text-marinho-600
                  hover:text-marinho-800 bg-marinho-50 px-2 py-1 rounded"
    >
      <FileText className="w-3 h-3" />
      {label}
      <ExternalLink className="w-3 h-3" />
    </a>
  );
}

export default function Motorista() {
  usePageTitle('Minhas Entregas');
  const { usuario } = useAuth();
  const toast = useToast();
  const [aba,         setAba]         = useState('pendentes');
  const [entregas,    setEntregas]    = useState([]);
  const [historico,   setHistorico]   = useState([]);
  const [carregando,  setCarregando]  = useState(true);

  // Confirmação
  const [erroLoad,    setErroLoad]    = useState('');

  // Confirmação
  const [confirmando, setConfirmando] = useState(null);
  const [foto,        setFoto]        = useState(null);
  const [obs,         setObs]         = useState('');
  const [salvando,    setSalvando]    = useState(false);
  const [erroAcao,    setErroAcao]    = useState('');

  const buscar = useCallback(async () => {
    setCarregando(true);
    setErroLoad('');
    try {
      const { data } = await entregasApi.minhas();
      if (data.sucesso) setEntregas(data.dados.entregas);
      const { data: h } = await entregasApi.historico();
      if (h.sucesso) setHistorico(h.dados.entregas);
    } catch { setErroLoad('Erro ao carregar entregas. Verifique sua conexão.'); }
    finally { setCarregando(false); }
  }, []);

  useEffect(() => { buscar(); }, [buscar]);

  // Escuta evento socket 'nova_rota' — atualiza lista sem precisar recarregar manualmente
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    function onNovaRota() {
      buscar();
    }

    socket.on('nova_rota', onNovaRota);
    return () => { socket.off('nova_rota', onNovaRota); };
  }, [buscar]);

  function abrirConfirmacao(id) {
    setConfirmando(id);
    setFoto(null);
    setObs('');
    setErroAcao('');
  }

  async function confirmarEntrega(id) {
    if (!foto) {
      setErroAcao('A foto do comprovante de entrega é obrigatória.');
      return;
    }
    setSalvando(true);
    setErroAcao('');
    try {
      const fd = new FormData();
      if (obs) fd.append('observacoes', obs);
      fd.append('foto_comprovante', foto);

      const { data } = await entregasApi.confirmar(id, fd);
      if (!data.sucesso) throw new Error(data.mensagem);

      setConfirmando(null);
      setFoto(null);
      setObs('');
      toast.sucesso('Entrega confirmada!', 'Comprovante registrado com sucesso.');
      await buscar();
    } catch (err) {
      setErroAcao(err?.response?.data?.mensagem || err?.message || 'Erro.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-marinho-900 flex items-center gap-2">
            <Truck className="w-6 h-6 text-marinho-600" />
            Minhas Entregas
          </h1>
          <p className="text-sm text-marinho-400">
            Olá, {usuario?.nome?.split(' ')[0]}! — {new Date().toLocaleDateString('pt-BR', {
              weekday: 'long', day: 'numeric', month: 'long'
            })}
          </p>
        </div>
        <button onClick={buscar}
          className="p-2 rounded-lg text-marinho-400 hover:bg-marinho-50 transition-colors">
          <RefreshCw className={`w-4 h-4 ${carregando ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Abas */}
      <div className="flex border-b border-marinho-100">
        <button
          onClick={() => setAba('pendentes')}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium
                       border-b-2 transition-colors -mb-px
                       ${aba === 'pendentes'
                         ? 'border-marinho-600 text-marinho-600'
                         : 'border-transparent text-marinho-400'}`}
        >
          <Truck className="w-4 h-4" />
          Para Entregar
          {entregas.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 bg-marinho-600 text-white text-xs rounded-full">
              {entregas.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setAba('historico')}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium
                       border-b-2 transition-colors -mb-px
                       ${aba === 'historico'
                         ? 'border-marinho-600 text-marinho-600'
                         : 'border-transparent text-marinho-400'}`}
        >
          <History className="w-4 h-4" />
          Histórico
        </button>
      </div>

      {/* Erro de carregamento com retry */}
      {erroLoad && !carregando && (
        <ErroCarregamento
          mensagem={erroLoad}
          onTentar={buscar}
          tentando={carregando}
        />
      )}

      {/* Erro de ação */}
      {erroAcao && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200
                         rounded-lg text-red-700 text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {erroAcao}
        </div>
      )}

      {!erroLoad && carregando ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : !erroLoad && aba === 'pendentes' ? (
        /* ── Entregas pendentes ──────────────────────── */
        entregas.length === 0 ? (
          <div className="card-base p-12 text-center">
            <CheckCircle className="w-14 h-14 text-green-200 mx-auto mb-3" />
            <p className="text-marinho-400 font-medium">Nenhuma entrega pendente!</p>
            <p className="text-marinho-300 text-sm mt-1">Todas as rotas do dia foram concluídas.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {entregas.map((e) => {
              const navLinks = linksNavegacao(e.endereco_completo);
              return (
                <div key={e.id} className="card-base overflow-hidden">
                  {/* Header do card */}
                  <div className="p-4 bg-marinho-50 border-b border-marinho-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-marinho-900">#{e.numero_proposta}</p>
                        {e.numero_orcamento && (
                          <p className="text-xs text-marinho-400">Orç: {e.numero_orcamento}</p>
                        )}
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold
                        ${e.status === 'entregue'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'}`}>
                        {e.status === 'entregue' ? 'Entregue' : 'Pendente'}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    {/* Data */}
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-marinho-500 flex-shrink-0" />
                      <p className="text-sm font-medium text-marinho-900">
                        {formatarData(e.data_entrega)}
                      </p>
                    </div>

                    {/* Endereço + botões de navegação */}
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-marinho-700 mb-2">{e.endereco_completo}</p>
                        {/* Links de navegação — Antônio escolhe o app */}
                        <div className="flex gap-2 flex-wrap">
                          <a
                            href={navLinks.waze}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs
                                        font-semibold bg-sky-500 hover:bg-sky-600 text-white
                                        transition-colors"
                          >
                            <Navigation className="w-3.5 h-3.5" />
                            Waze
                          </a>
                          <a
                            href={navLinks.google}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs
                                        font-semibold bg-green-600 hover:bg-green-700 text-white
                                        transition-colors"
                          >
                            <MapPin className="w-3.5 h-3.5" />
                            Google Maps
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Documentos */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      <DocLink url={e.url_nota_fiscal_pdf}   label="Nota Fiscal" />
                      <DocLink url={e.url_boleto_pdf}        label="Boleto" />
                      <DocLink url={e.url_certificado_pdf}   label="Certificado" />
                      <DocLink url={e.url_proposta_pdf}      label="Proposta" />
                      <DocLink url={e.url_ordem_compra_pdf}  label="Ordem de Compra" />
                    </div>

                    {e.obs_agendamento && (
                      <p className="text-xs text-marinho-400 italic bg-marinho-50 rounded px-2 py-1">
                        Obs: {e.obs_agendamento}
                      </p>
                    )}

                    {/* Formulário de confirmação */}
                    {confirmando === e.id ? (
                      <div className="space-y-3 pt-2 border-t border-marinho-100/60">
                        <p className="text-sm font-medium text-marinho-700">Confirmar entrega</p>

                        {/* Foto OBRIGATÓRIA */}
                        <div>
                          <label className={`flex items-start gap-2 cursor-pointer text-sm
                                              rounded-xl border-2 border-dashed px-3 py-3
                                              transition-colors
                                              ${foto
                                                ? 'border-green-400 bg-green-50'
                                                : 'border-orange-300 bg-orange-50 hover:border-orange-400'
                                              }`}>
                            <Camera className={`w-5 h-5 mt-0.5 flex-shrink-0 ${foto ? 'text-green-600' : 'text-orange-500'}`} />
                            <div>
                              {foto ? (
                                <span className="font-medium text-green-700">{foto.name}</span>
                              ) : (
                                <>
                                  <span className="font-semibold text-orange-700">
                                    Foto na instalação do cliente *
                                  </span>
                                  <span className="block text-xs text-orange-600 mt-0.5">
                                    Tire a foto no local da entrega — obrigatório
                                  </span>
                                </>
                              )}
                            </div>
                            <input
                              type="file"
                              accept="image/*"
                              capture="environment"
                              className="hidden"
                              onChange={(ev) => {
                                setFoto(ev.target.files?.[0] || null);
                                setErroAcao('');
                              }}
                            />
                          </label>
                        </div>

                        <textarea
                          rows={2}
                          placeholder="Observação (opcional)..."
                          value={obs}
                          onChange={(ev) => setObs(ev.target.value)}
                          className="input-base resize-none text-sm"
                        />

                        <div className="flex gap-2">
                          <button
                            onClick={() => confirmarEntrega(e.id)}
                            disabled={salvando || !foto}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5
                                        bg-green-600 hover:bg-green-700 disabled:bg-marinho-100
                                        disabled:cursor-not-allowed text-white rounded-lg
                                        text-sm font-semibold transition-colors"
                          >
                            {salvando ? <Spinner tamanho="sm" /> : <CheckCircle className="w-4 h-4" />}
                            {foto ? 'Confirmar Entrega' : 'Adicione a foto primeiro'}
                          </button>
                          <button
                            onClick={() => { setConfirmando(null); setFoto(null); setObs(''); setErroAcao(''); }}
                            className="px-4 py-2 text-sm text-marinho-600 bg-marinho-50
                                        rounded-lg hover:bg-marinho-100 transition-colors"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => abrirConfirmacao(e.id)}
                        className="w-full py-3 bg-green-600 hover:bg-green-700 text-white
                                    rounded-xl font-semibold text-sm transition-colors
                                    flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="w-5 h-5" />
                        Confirmar Entrega
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : !erroLoad ? (
        /* ── Histórico ───────────────────────────────── */
        historico.length === 0 ? (
          <div className="card-base p-12 text-center">
            <Package className="w-12 h-12 text-marinho-100 mx-auto mb-3" />
            <p className="text-marinho-400">Nenhuma entrega realizada ainda.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {historico.map((e) => (
              <div key={e.id} className="card-base p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-marinho-900">#{e.numero_proposta}</p>
                  <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-700
                                    rounded-full text-xs font-medium">
                    Entregue
                  </span>
                </div>
                <div className="flex items-start gap-2 text-sm text-marinho-600">
                  <MapPin className="w-4 h-4 text-marinho-300 mt-0.5 flex-shrink-0" />
                  <p>{e.endereco_completo}</p>
                </div>
                <p className="text-xs text-marinho-300 mt-1">
                  {e.entregue_em
                    ? `Entregue ${tempoRelativo(e.entregue_em)}`
                    : formatarData(e.data_entrega)}
                </p>
              </div>
            ))}
          </div>
        )
      ) : null}

      {/* Toast de sucesso */}
      <ToastContainer toasts={toast.toasts} onRemover={toast.remover} />
    </div>
  );
}
