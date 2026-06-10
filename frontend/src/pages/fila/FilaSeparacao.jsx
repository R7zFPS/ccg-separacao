/**
 * Fila de Separação — Sprint 4
 * Ações inline: pegar pedido, iniciar conferência, iniciar separação, concluir com foto
 * Cronômetro ao vivo para pedidos em separação
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package, AlertTriangle, Clock, CheckCircle, RefreshCw,
  ChevronRight, User, Zap, Play, Camera, X, Loader2,
  Search, Timer,
} from 'lucide-react';
import { solicitacoesApi } from '../../services/api';
import { usePageTitle }     from '../../hooks/usePageTitle';
import { getSocket }        from '../../services/socket';
import { ErroCarregamento } from '../../components/ui/ErroCarregamento';
import { useToast }         from '../../hooks/useToast';
import { ToastContainer }   from '../../components/ui/Toast';
import { useAuth }         from '../../context/AuthContext';
import { Spinner }         from '../../components/ui/Spinner';
import { BadgePrioridade } from '../../components/solicitacoes/BadgePrioridade';
import { LABELS_LOCAL_MATERIAL } from '../../utils/constantes';
import { tempoRelativo, formatarDataHora } from '../../utils/formatters';

// ── Peso de prioridade para ordenação visual ───────────
const PESO = {
  prioridade_maxima: 0, oceanpact: 1, para_hoje: 2,
  em_separacao: 3, aguardando_material: 4, material_separado: 5,
};
function ordenar(lista) {
  return [...lista].sort((a, b) => {
    const pa = PESO[a.prioridade] ?? 99;
    const pb = PESO[b.prioridade] ?? 99;
    if (pa !== pb) return pa - pb;
    return new Date(a.created_at) - new Date(b.created_at);
  });
}

// ── Formata duração em segundos → "Xmin Ys" ──────────
function formatarDuracao(segundos) {
  if (!segundos || segundos < 0) return '0s';
  const h = Math.floor(segundos / 3600);
  const m = Math.floor((segundos % 3600) / 60);
  const s = segundos % 60;
  if (h > 0) return `${h}h ${m}min`;
  if (m > 0) return `${m}min ${s}s`;
  return `${s}s`;
}

// ── Cronômetro ao vivo desde o início da separação ────
function Cronometro({ inicio }) {
  const [segundos, setSegundos] = useState(0);

  useEffect(() => {
    if (!inicio) return;
    const calcular = () => {
      const diff = Math.floor((Date.now() - new Date(inicio).getTime()) / 1000);
      setSegundos(diff > 0 ? diff : 0);
    };
    calcular();
    const id = setInterval(calcular, 1000);
    return () => clearInterval(id);
  }, [inicio]);

  const cor = segundos > 3600 ? 'text-red-600' : segundos > 1800 ? 'text-orange-500' : 'text-emerald-600';

  return (
    <span className={`flex items-center gap-1 text-xs font-mono font-semibold ${cor}`}>
      <Timer className="w-3 h-3" />
      {formatarDuracao(segundos)}
    </span>
  );
}

// ─── Abas ─────────────────────────────────────────────
const ABA_MINHA   = 'minha';
const ABA_FILA    = 'fila';

export default function FilaSeparacao() {
  usePageTitle('Fila de Separação');
  const { usuario } = useAuth();
  const toast = useToast();
  const navigate    = useNavigate();

  const [aba,          setAba]        = useState(ABA_MINHA);
  const [minha,        setMinha]      = useState([]);
  const [fila,         setFila]       = useState([]);
  const [carregando,   setCarregando] = useState(true);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState(null);
  const INTERVALO_REFRESH = 30_000; // 30 segundos

  // Modal de conclusão com foto
  const [modalConcluir, setModalConcluir] = useState(null); // { id, numero }
  const [fotoFile,      setFotoFile]      = useState(null);
  const [fotoPreview,   setFotoPreview]   = useState(null);
  const [salvando,      setSalvando]      = useState(false);
  const [erroLoad,      setErroLoad]      = useState('');
  const [erroAcao,      setErroAcao]      = useState('');
  const inputFotoRef = useRef(null);

  // ── Carrega dados ──────────────────────────────────
  const buscar = useCallback(async () => {
    setCarregando(true);
    setErroLoad('');
    try {
      const [r1, r2, r3] = await Promise.all([
        solicitacoesApi.listar({ status: 'em_separacao',      limite: 50 }),
        solicitacoesApi.listar({ status: 'em_conferencia',    limite: 50 }),
        solicitacoesApi.listar({ status: 'aguardando_atribuicao', limite: 50 }),
      ]);

      const emSep   = r1.data.dados?.solicitacoes || [];
      const emConf  = r2.data.dados?.solicitacoes || [];
      const aguard  = r3.data.dados?.solicitacoes || [];

      // Minha fila: pedidos que estou executando OU que estão no meu setor
      const meusIds = new Set([usuario?.id]);
      const minhaFila = ordenar([
        ...emSep.filter(s  => s.estoquista_id === usuario?.id),
        ...emConf.filter(s => s.estoquista_id === usuario?.id),
      ]);

      // Fila geral: sem estoquista atribuído
      const filaGeral = ordenar(
        aguard.filter(s => !s.estoquista_id)
      );

      setMinha(minhaFila);
      setFila(filaGeral);
    } catch { setErroLoad('Erro ao carregar a fila. Verifique sua conexão.'); }
    finally {
      setCarregando(false);
      setUltimaAtualizacao(new Date());
    }
  }, [usuario?.id]);

  useEffect(() => { buscar(); }, [buscar]);

  // ── Auto-refresh a cada 30s (pausa quando modal aberto) ──
  useEffect(() => {
    if (modalConcluir) return; // não atualiza com modal aberto
    const id = setInterval(buscar, INTERVALO_REFRESH);
    return () => clearInterval(id);
  }, [buscar, modalConcluir, INTERVALO_REFRESH]);

  // ── Socket: atualiza fila instantaneamente em nova_solicitacao ──
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    function onNovaSolicitacao() { buscar(); }
    socket.on('nova_solicitacao', onNovaSolicitacao);
    return () => { socket.off('nova_solicitacao', onNovaSolicitacao); };
  }, [buscar]);

  // ── Ação genérica de status (sem foto) ─────────────
  async function mudarStatus(solId, novoStatus, obs = '') {
    const fd = new FormData();
    fd.append('status', novoStatus);
    if (obs) fd.append('observacao', obs);
    await solicitacoesApi.atualizarStatus(solId, fd);
    buscar();
  }

  // ── Pegar pedido da fila (self-assign + iniciar conferência) ─
  async function handlePegar(sol) {
    setErroAcao('');
    try {
      await mudarStatus(sol.id, 'em_conferencia');
      setAba(ABA_MINHA); // muda para "Minha Fila" após pegar
    } catch (e) {
      setErroAcao(e?.response?.data?.mensagem || 'Erro ao pegar pedido.');
    }
  }

  // ── Iniciar separação ──────────────────────────────
  async function handleIniciarSeparacao(sol) {
    setErroAcao('');
    try {
      await mudarStatus(sol.id, 'em_separacao');
    } catch (e) {
      setErroAcao(e?.response?.data?.mensagem || 'Erro ao iniciar separação.');
    }
  }

  // ── Abrir modal de conclusão ───────────────────────
  function abrirModalConcluir(sol) {
    setModalConcluir({ id: sol.id, numero: sol.numero_proposta });
    setFotoFile(null);
    setFotoPreview(null);
    setErroAcao('');
  }

  // ── Selecionar foto ────────────────────────────────
  function handleFoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFotoFile(file);
    const url = URL.createObjectURL(file);
    setFotoPreview(url);
  }

  // ── Submeter conclusão com foto ────────────────────
  async function handleConcluir() {
    if (!fotoFile) {
      setErroAcao('A foto do material separado é obrigatória.');
      return;
    }
    setSalvando(true);
    setErroAcao('');
    try {
      const fd = new FormData();
      fd.append('status', 'material_separado');
      fd.append('foto_separacao', fotoFile);
      await solicitacoesApi.atualizarStatus(modalConcluir.id, fd);
      setModalConcluir(null);
      toast.sucesso('Separação concluída!', 'Material separado registrado com sucesso.');
      buscar();
    } catch (e) {
      setErroAcao(e?.response?.data?.mensagem || 'Erro ao concluir separação.');
    } finally {
      setSalvando(false);
    }
  }

  const lista = aba === ABA_MINHA ? minha : fila;

  return (
    <div className="space-y-5">

      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-marinho-900 flex items-center gap-2">
            <Package className="w-6 h-6 text-marinho-600" />
            Fila de Separação
          </h1>
          <p className="text-sm text-marinho-400 mt-0.5">
            Olá, {usuario?.nome?.split(' ')[0]}! — pedidos em ordem de prioridade
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <button
            onClick={buscar}
            className="p-2 rounded-lg text-marinho-400 hover:bg-marinho-50 transition-colors"
            title="Atualizar agora"
          >
            <RefreshCw className={`w-4 h-4 ${carregando ? 'animate-spin' : ''}`} />
          </button>
          {ultimaAtualizacao && (
            <p className="text-xs text-marinho-300">
              Atualizado {ultimaAtualizacao.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              {' · '}auto em 30s
            </p>
          )}
        </div>
      </div>

      {/* Erro global */}
      {erroAcao && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {erroAcao}
          <button className="ml-auto" aria-label="Fechar erro" onClick={() => setErroAcao('')}><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* Abas */}
      <div className="flex border-b border-marinho-100">
        {[
          { key: ABA_MINHA, label: 'Minha Fila',   icone: User,  count: minha.length },
          { key: ABA_FILA,  label: 'Aguardando',   icone: Clock, count: fila.length  },
        ].map(({ key, label, icone: Icone, count }) => (
          <button key={key} onClick={() => setAba(key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium
                         border-b-2 transition-colors -mb-px
                         ${aba === key
                           ? 'border-marinho-600 text-marinho-700'
                           : 'border-transparent text-marinho-400 hover:text-marinho-700'}`}
          >
            <Icone className="w-4 h-4" />
            {label}
            {count > 0 && (
              <span className={`ml-1 px-1.5 py-0.5 text-xs rounded-full font-bold
                ${aba === key ? 'bg-marinho-600 text-white' : 'bg-marinho-100 text-marinho-600'}`}>
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Erro de carregamento com retry */}
      {erroLoad && !carregando && (
        <ErroCarregamento
          mensagem={erroLoad}
          onTentar={buscar}
          tentando={carregando}
        />
      )}

      {/* Lista */}
      {carregando ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : !erroLoad && lista.length === 0 ? (
        <div className="card-base p-14 text-center">
          <CheckCircle className="w-14 h-14 text-green-200 mx-auto mb-3" />
          <p className="font-medium text-marinho-600">
            {aba === ABA_MINHA
              ? 'Nenhum pedido atribuído a você no momento.'
              : 'Nenhum pedido aguardando na fila.'}
          </p>
          <p className="text-sm text-marinho-300 mt-1">
            {aba === ABA_MINHA
              ? 'Pegue um pedido na aba "Aguardando".'
              : 'Todos os pedidos foram atribuídos. ✓'}
          </p>
        </div>
      ) : !erroLoad ? (
        <div className="space-y-3">
          {lista.map((sol, idx) => (
            <CardSeparacao
              key={sol.id}
              sol={sol}
              idx={idx}
              aba={aba}
              onVerDetalhes={() => navigate(`/solicitacoes/${sol.id}`)}
              onPegar={() => handlePegar(sol)}
              onIniciar={() => handleIniciarSeparacao(sol)}
              onConcluir={() => abrirModalConcluir(sol)}
            />
          ))}
        </div>
      ) : null}

      {/* Modal de conclusão com foto */}
      {modalConcluir && (
        <ModalConcluir
          numero={modalConcluir.numero}
          fotoPreview={fotoPreview}
          salvando={salvando}
          erro={erroAcao}
          inputRef={inputFotoRef}
          onFoto={handleFoto}
          onConfirmar={handleConcluir}
          onFechar={() => { setModalConcluir(null); setErroAcao(''); }}
        />
      )}
    </div>
  );
}

// ─── Card de cada pedido ───────────────────────────────
function CardSeparacao({ sol, idx, aba, onVerDetalhes, onPegar, onIniciar, onConcluir }) {
  const urgente = sol.prioridade === 'prioridade_maxima' || sol.prioridade === 'oceanpact';
  const emSeparacao = sol.status === 'em_separacao';
  const emConferencia = sol.status === 'em_conferencia';
  const aguardando = sol.status === 'aguardando_atribuicao' || sol.status === 'aberta';

  return (
    <div className={`card-base p-4 ${urgente ? 'border-l-4 border-red-400' : ''}`}>
      <div className="flex items-start gap-3">
        {/* Posição na fila */}
        <div className={`w-8 h-8 rounded-full flex items-center justify-center
                          text-sm font-bold flex-shrink-0 mt-0.5
                          ${idx === 0 && urgente
                            ? 'bg-red-100 text-red-700'
                            : 'bg-marinho-50 text-marinho-400'}`}>
          {idx + 1}
        </div>

        <div className="flex-1 min-w-0">
          {/* Linha 1: número + badges */}
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-bold text-marinho-900 text-base">#{sol.numero_proposta}</span>
            {sol.prioridade && <BadgePrioridade prioridade={sol.prioridade} />}
            {urgente && <Zap className="w-3.5 h-3.5 text-red-500" />}
          </div>

          {/* Linha 2: metadados */}
          <div className="flex items-center gap-3 text-xs text-marinho-400 flex-wrap">
            <span>📦 {LABELS_LOCAL_MATERIAL[sol.setor_destino] || sol.setor_destino}</span>
            <span>👤 {sol.vendedor_nome}</span>
            <span>{tempoRelativo(sol.created_at)}</span>
            {/* Cronômetro ao vivo (apenas quando em_separacao) */}
            {emSeparacao && sol.timestamp_inicio_separacao && (
              <Cronometro inicio={sol.timestamp_inicio_separacao} />
            )}
          </div>

          {/* Alerta urgência */}
          {urgente && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-red-600 font-semibold">
              <AlertTriangle className="w-3.5 h-3.5" />
              URGENTE — processar imediatamente
            </div>
          )}
        </div>

        {/* Botões de ação */}
        <div className="flex flex-col gap-1.5 flex-shrink-0 items-end">
          {/* ABA MINHA FILA */}
          {aba === 'minha' && (
            <>
              {emSeparacao && (
                <button
                  onClick={onConcluir}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                              bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                >
                  <Camera className="w-3.5 h-3.5" />
                  Concluir
                </button>
              )}
              {emConferencia && (
                <button
                  onClick={onIniciar}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                              bg-marinho-600 hover:bg-marinho-700 text-white transition-colors"
                >
                  <Play className="w-3.5 h-3.5" />
                  Iniciar Separação
                </button>
              )}
              {aguardando && (
                <button
                  onClick={onIniciar}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                              bg-orange-500 hover:bg-orange-600 text-white transition-colors"
                >
                  <Search className="w-3.5 h-3.5" />
                  Iniciar Conferência
                </button>
              )}
            </>
          )}

          {/* ABA AGUARDANDO */}
          {aba === 'fila' && (
            <button
              onClick={onPegar}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                          bg-marinho-600 hover:bg-marinho-700 text-white transition-colors"
            >
              <User className="w-3.5 h-3.5" />
              Pegar Pedido
            </button>
          )}

          {/* Ver detalhes (sempre disponível) */}
          <button
            onClick={onVerDetalhes}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs
                        text-marinho-300 hover:text-marinho-600 transition-colors"
          >
            Ver detalhes
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Status visual da separação em andamento */}
      {emSeparacao && (
        <div className="mt-3 pt-3 border-t border-emerald-100 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-emerald-700 font-medium">Separação em andamento</span>
          {sol.timestamp_inicio_separacao && (
            <span className="text-xs text-marinho-300">
              · iniciado às {formatarDataHora(sol.timestamp_inicio_separacao).split(' ')[1] || ''}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Modal de conclusão com foto ───────────────────────
function ModalConcluir({ numero, fotoPreview, salvando, erro, inputRef, onFoto, onConfirmar, onFechar }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div>
            <h2 className="font-bold text-marinho-900">Concluir Separação</h2>
            <p className="text-xs text-marinho-400 mt-0.5">Pedido #{numero}</p>
          </div>
          <button onClick={onFechar}
            className="p-1.5 rounded-lg hover:bg-marinho-50 text-marinho-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Corpo */}
        <div className="px-5 py-4 space-y-4">
          <p className="text-sm text-marinho-600">
            Tire uma foto do material separado para registrar a conclusão.
            <span className="text-red-500 font-medium"> A foto é obrigatória.</span>
          </p>

          {/* Área de foto */}
          {fotoPreview ? (
            <div className="relative">
              <img
                src={fotoPreview}
                alt="Preview"
                className="w-full h-48 object-cover rounded-xl border border-marinho-100"
              />
              <button
                onClick={() => { onFoto({ target: { files: [] } }); }}
                className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow
                            hover:bg-red-50 transition-colors"
              >
                <X className="w-3.5 h-3.5 text-marinho-600" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => inputRef.current?.click()}
              className="w-full h-40 border-2 border-dashed border-marinho-200 rounded-xl
                          flex flex-col items-center justify-center gap-2
                          hover:border-marinho-400 hover:bg-marinho-50 transition-colors group"
            >
              <Camera className="w-8 h-8 text-marinho-200 group-hover:text-marinho-400 transition-colors" />
              <span className="text-sm text-marinho-300 group-hover:text-marinho-500">
                Clique para tirar ou escolher foto
              </span>
            </button>
          )}

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={onFoto}
          />

          {/* Erro */}
          {erro && (
            <p className="text-xs text-red-600 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
              {erro}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 flex gap-3">
          <button
            onClick={onFechar}
            disabled={salvando}
            className="flex-1 py-2.5 rounded-xl border border-marinho-100 text-sm font-medium
                        text-marinho-600 hover:bg-marinho-50 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirmar}
            disabled={salvando || !fotoPreview}
            className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700
                        text-white text-sm font-semibold transition-colors
                        disabled:opacity-50 disabled:cursor-not-allowed
                        flex items-center justify-center gap-2"
          >
            {salvando ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</>
            ) : (
              <><CheckCircle className="w-4 h-4" /> Confirmar</>
            )}
          </button>
        </div>
      </div>

      {/* Toast de sucesso */}
      <ToastContainer toasts={toast.toasts} onRemover={toast.remover} />
    </div>
  );
}
