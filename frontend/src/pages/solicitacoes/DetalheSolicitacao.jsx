/**
 * Página — Detalhe da Solicitação
 * Mostra todos os dados, linha do tempo do status,
 * e ações disponíveis conforme o role do usuário logado.
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, FileText, Package, User, Clock,
  CheckCircle, AlertTriangle, ChevronDown,
  Play, Flag, UserCheck, Trash2, Camera,
  ExternalLink, Search, Send, Upload,
} from 'lucide-react';
import { solicitacoesApi, usuariosApi, propostasApi } from '../../services/api';
import api from '../../services/api';
import { useAuth }          from '../../context/AuthContext';
import { Spinner }          from '../../components/ui/Spinner';
import { BadgeStatus }      from '../../components/solicitacoes/BadgeStatus';
import { BadgePrioridade }  from '../../components/solicitacoes/BadgePrioridade';
import {
  LABELS_STATUS, LABELS_SETOR, LABELS_PRIORIDADE,
} from '../../utils/constantes';
import { formatarDataHora, tempoRelativo } from '../../utils/formatters';
import { usePageTitle }       from '../../hooks/usePageTitle';
import { ModalConfirmacao }   from '../../components/ui/ModalConfirmacao';
import { ErroCarregamento }   from '../../components/ui/ErroCarregamento';
import { useToast }           from '../../hooks/useToast';
import { ToastContainer }     from '../../components/ui/Toast';
import { resolveFileUrl }     from '../../utils/arquivos';

const agendamentosApi = {
  criar: (fd) => api.post('/agendamentos', fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
  buscarPorSolicitacao: (solId) => api.get(`/agendamentos/por-solicitacao/${solId}`),
};
const entregasApi = {
  criar: (dados) => api.post('/entregas', dados),
};

// ── Helper: formata segundos → "Xh Ymin" / "Xmin Ys" / "Ys" ──
function formatarDuracaoSep(seg) {
  if (seg == null || isNaN(seg)) return '—';
  if (seg >= 3600) {
    const h   = Math.floor(seg / 3600);
    const min = Math.floor((seg % 3600) / 60);
    return `${h}h ${min}min`;
  }
  if (seg >= 60) {
    const min = Math.floor(seg / 60);
    const s   = seg % 60;
    return `${min}min ${s}s`;
  }
  return `${seg}s`;
}

const ROLES_ADMIN    = ['super_admin', 'adm'];
const ROLES_SEPARACAO = ['estoquista', 'almoxarife'];

// ── Ícones por status na timeline ─────────────────────
const ICONE_STATUS = {
  aberta:                <Package className="w-4 h-4" />,
  aguardando_atribuicao: <AlertTriangle className="w-4 h-4" />,
  em_conferencia:        <Search className="w-4 h-4" />,
  aguardando_nf:         <FileText className="w-4 h-4" />,
  em_emissao_nf:         <Send className="w-4 h-4" />,
  em_separacao:          <Play className="w-4 h-4" />,
  material_separado:     <CheckCircle className="w-4 h-4" />,
  entrega_solicitada:    <Send className="w-4 h-4" />,
  proposta_recusada:     <AlertTriangle className="w-4 h-4" />,
  agendamento_realizado: <Clock className="w-4 h-4" />,
  rota_enviada:          <Flag className="w-4 h-4" />,
  entregue:              <CheckCircle className="w-4 h-4" />,
};

export default function DetalheSolicitacao() {
  usePageTitle('Detalhe da Solicitação');
  const { id }    = useParams();
  const navigate  = useNavigate();
  const { usuario } = useAuth();

  const [solicitacao,  setSolicitacao]  = useState(null);
  const [historico,    setHistorico]    = useState([]);
  const [carregando,   setCarregando]   = useState(true);
  const [erro,         setErro]         = useState('');

  // Estados das ações
  const [acaoStatus,   setAcaoStatus]   = useState('');
  const [obsStatus,    setObsStatus]    = useState('');
  const [fotoFile,     setFotoFile]     = useState(null);
  const [nfFile,       setNfFile]       = useState(null);   // PDF da Nota Fiscal
  const [salvarAtivo,  setSalvarAtivo]  = useState(false);
  const [erroAcao,     setErroAcao]     = useState('');

  // Modal de prioridade
  const [modalPrior,   setModalPrior]   = useState(false);
  const [novaPrior,    setNovaPrior]    = useState('');

  // Modal de atribuição de estoquista
  const [modalAtrib,   setModalAtrib]   = useState(false);
  const [estoquistas,  setEstoquistas]  = useState([]);
  const [estoquistaId, setEstoquistaId] = useState('');

  // Modal de agendamento
  const [modalAgend,   setModalAgend]   = useState(false);
  const [agendForm,    setAgendForm]    = useState({
    data_entrega: '', endereco_completo: '', observacoes: '',
  });
  const [agendFiles,   setAgendFiles]   = useState({});

  // Modal de envio de rota
  const [modalRota,    setModalRota]    = useState(false);
  const [motoristas,   setMotoristas]   = useState([]);
  const [motoristaId,  setMotoristaId]  = useState('');
  const [agendamentoId, setAgendamentoId] = useState(null);

  // Modal de proposta de data (vendedor)
  const [modalProposta,    setModalProposta]    = useState(false);
  const [propostaData,     setPropostaData]     = useState('');
  const [propostaObs,      setPropostaObs]      = useState('');

  // Modal de confirmação — cancelar solicitação
  const [modalCancelar,    setModalCancelar]    = useState(false);
  const [cancelando,       setCancelando]       = useState(false);

  // Modal de resposta do gerente (aprovar / recusar)
  const [modalResposta,    setModalResposta]    = useState(false);
  const [propostaAtual,    setPropostaAtual]    = useState(null);
  const [respostaDecisao,  setRespostaDecisao]  = useState('');  // 'aprovada' | 'recusada'
  const [respostaTexto,    setRespostaTexto]    = useState('');
  const [respostaEndereco, setRespostaEndereco] = useState('');

  const toast = useToast();

  const role = usuario?.role;
  const ehAdmin     = ROLES_ADMIN.includes(role);
  const ehSeparador = ROLES_SEPARACAO.includes(role);

  async function carregar() {
    setCarregando(true);
    setErro('');
    try {
      const { data } = await solicitacoesApi.buscar(id);
      if (data.sucesso) {
        setSolicitacao(data.dados.solicitacao);
        setHistorico(data.dados.historico);
      }
    } catch {
      setErro('Solicitação não encontrada ou sem permissão.');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => { carregar(); }, [id]);

  // ── Ações de status disponíveis pelo role ────────────
  function acoesDisponiveis() {
    if (!solicitacao) return [];
    const s    = solicitacao.status;
    const tipo = solicitacao.tipo_documento; // 'orcamento' | 'nota_fiscal'
    const acoes = [];

    // ── Estoquista / Almoxarife / Admin ──────────────────
    if (ehSeparador || ehAdmin) {
      // aberta ou aguardando_atribuicao → iniciar conferência
      if (['aberta', 'aguardando_atribuicao'].includes(s)) {
        acoes.push({
          valor: 'em_conferencia',
          label: 'Iniciar Conferência',
          icone: <Search className="w-4 h-4" />,
          cor: 'bg-orange-500 hover:bg-orange-600 text-white',
        });
      }

      // em_conferencia → sempre solicita NF (independente do tipo de documento)
      if (s === 'em_conferencia') {
        acoes.push({
          valor: 'aguardando_nf',
          label: 'Confirmar Material — Aguardar NF',
          icone: <FileText className="w-4 h-4" />,
          cor: 'bg-amber-500 hover:bg-amber-600 text-white',
        });
      }

      // em_separacao → concluir com FOTO OBRIGATÓRIA
      if (s === 'em_separacao' &&
          (ehAdmin || solicitacao.estoquista_id === usuario?.id ||
           (ehSeparador && !solicitacao.estoquista_id))) {
        acoes.push({
          valor: 'material_separado',
          label: 'Concluir Separação',
          icone: <CheckCircle className="w-4 h-4" />,
          cor: 'bg-green-600 hover:bg-green-700 text-white',
          temFoto: true,
          fotoObrigatoria: true,
        });
      }
    }

    // ── Fiscal / Vendedor / Admin — anexar NF e liberar ──
    const ehFiscalOuVendedor = ['fiscal', 'vendedor', 'gerencia'].includes(role);

    if (ehFiscalOuVendedor || ehAdmin) {
      // aguardando_nf → anexar NF (PDF obrigatório) e liberar para separação
      if (s === 'aguardando_nf') {
        acoes.push({
          valor: 'em_separacao',
          label: 'Anexar NF e Liberar para Separação',
          icone: <Play className="w-4 h-4" />,
          cor: 'bg-indigo-600 hover:bg-indigo-700 text-white',
          temNF: true, // upload de PDF obrigatório
        });
      }
      // em_emissao_nf (retrocompatível) → também exige NF
      if (s === 'em_emissao_nf' && (role === 'fiscal' || ehAdmin)) {
        acoes.push({
          valor: 'em_separacao',
          label: 'NF Emitida — Liberar para Separação',
          icone: <Play className="w-4 h-4" />,
          cor: 'bg-indigo-600 hover:bg-indigo-700 text-white',
          temNF: true,
        });
      }
    }

    // ── Vendedor / Gerência — propor entrega ─────────────
    const ehVendedorOuGerente = ['vendedor', 'gerencia'].includes(role);

    if (ehVendedorOuGerente || ehAdmin) {
      // material_separado ou proposta_recusada → vendedor propõe (ou repropõe) data de entrega
      if (s === 'material_separado' || s === 'proposta_recusada') {
        acoes.push({
          valor: 'entrega_solicitada',
          label: s === 'proposta_recusada' ? 'Sugerir Nova Data de Entrega' : 'Propor Data de Entrega',
          icone: <Clock className="w-4 h-4" />,
          cor: s === 'proposta_recusada'
            ? 'bg-orange-500 hover:bg-orange-600 text-white'
            : 'bg-sky-500 hover:bg-sky-600 text-white',
          modal: 'proposta',
        });
      }
    }

    // ── Gerência / Admin — aprovar ou recusar proposta ──
    if (role === 'gerencia' || ehAdmin) {
      if (s === 'entrega_solicitada') {
        acoes.push({
          valor: 'agendamento_realizado',
          label: 'Aprovar Data de Entrega',
          icone: <CheckCircle className="w-4 h-4" />,
          cor: 'bg-green-600 hover:bg-green-700 text-white',
          modal: 'aprovar',
        });
        acoes.push({
          valor: 'material_separado',
          label: 'Recusar Proposta',
          icone: <AlertTriangle className="w-4 h-4" />,
          cor: 'bg-red-500 hover:bg-red-600 text-white',
          modal: 'recusar',
        });
      }

      // agendamento_realizado → enviar rota ao motorista
      if (s === 'agendamento_realizado') {
        acoes.push({
          valor: 'rota_enviada',
          label: 'Enviar Rota ao Motorista',
          icone: <Flag className="w-4 h-4" />,
          cor: 'bg-purple-600 hover:bg-purple-700 text-white',
          modal: 'rota',
        });
      }
    }

    // ── Admin — devolver para fila ───────────────────────
    if (ehAdmin && ['aberta', 'em_conferencia', 'em_separacao'].includes(s)) {
      acoes.push({
        valor: 'aguardando_atribuicao',
        label: 'Devolver para Fila',
        icone: <AlertTriangle className="w-4 h-4" />,
        cor: 'bg-orange-400 hover:bg-orange-500 text-white',
      });
    }

    return acoes;
  }

  async function executarAcaoStatus(acao) {
    setSalvarAtivo(true);
    setErroAcao('');
    try {
      const fd = new FormData();
      fd.append('status', acao.valor);
      if (obsStatus) fd.append('observacao', obsStatus);
      if (fotoFile)  fd.append('foto_separacao', fotoFile);
      if (nfFile)    fd.append('nota_fiscal', nfFile);

      const { data } = await solicitacoesApi.atualizarStatus(id, fd);
      if (!data.sucesso) throw new Error(data.mensagem);

      setAcaoStatus('');
      setObsStatus('');
      setFotoFile(null);
      setNfFile(null);
      toast.sucesso('Status atualizado!', LABELS_STATUS[acao.valor] || acao.label);
      await carregar();
    } catch (err) {
      setErroAcao(err?.response?.data?.mensagem || err?.message || 'Erro.');
    } finally {
      setSalvarAtivo(false);
    }
  }

  async function salvarPrioridade() {
    try {
      await solicitacoesApi.atualizarPrioridade(id, novaPrior || null);
      setModalPrior(false);
      toast.sucesso('Prioridade atualizada!');
      await carregar();
    } catch (err) {
      setErroAcao(err?.response?.data?.mensagem || 'Erro ao salvar prioridade.');
    }
  }

  async function abrirModalAtribuicao() {
    try {
      const setor = solicitacao?.setor_destino || 'ambos'; // 'galpao' | 'loja' | 'ambos'
      const [r1, r2] = await Promise.all([
        usuariosApi.listar({ role: 'estoquista', ativo: 'true' }),
        usuariosApi.listar({ role: 'almoxarife', ativo: 'true' }),
      ]);
      const todos = [
        ...(r1.data.dados?.usuarios || []),
        ...(r2.data.dados?.usuarios || []),
      ];
      // Filtra pelo setor: quem é 'ambos' sempre aparece; senão só o setor correto
      const filtrados = setor === 'ambos'
        ? todos
        : todos.filter((u) => u.setor === setor || u.setor === 'ambos');
      setEstoquistas(filtrados);
      setModalAtrib(true);
    } catch {
      setErroAcao('Erro ao carregar estoquistas.');
    }
  }

  async function salvarAtribuicao() {
    if (!estoquistaId) return;
    try {
      await solicitacoesApi.atribuir(id, estoquistaId);
      setModalAtrib(false);
      toast.sucesso('Estoquista atribuído!', 'A solicitação foi encaminhada com sucesso.');
      await carregar();
    } catch (err) {
      setErroAcao(err?.response?.data?.mensagem || 'Erro ao atribuir.');
    }
  }

  async function cancelarSolicitacao() {
    setCancelando(true);
    try {
      await solicitacoesApi.cancelar(id);
      setModalCancelar(false);
      navigate('/solicitacoes');
    } catch (err) {
      setErroAcao(err?.response?.data?.mensagem || 'Erro ao cancelar.');
      setModalCancelar(false);
    } finally {
      setCancelando(false);
    }
  }

  // ── Modal de Agendamento ──────────────────────────────
  async function abrirModalAgendamento() {
    setAgendForm({ data_entrega: '', endereco_completo: '', observacoes: '' });
    setAgendFiles({});
    setErroAcao('');
    setModalAgend(true);
  }

  async function salvarAgendamento() {
    if (!agendForm.data_entrega || !agendForm.endereco_completo) {
      setErroAcao('Data de entrega e endereço são obrigatórios.');
      return;
    }
    setSalvarAtivo(true);
    setErroAcao('');
    try {
      const fd = new FormData();
      fd.append('solicitacao_id', id);
      fd.append('data_entrega',       agendForm.data_entrega);
      fd.append('endereco_completo',  agendForm.endereco_completo);
      if (agendForm.observacoes) fd.append('observacoes', agendForm.observacoes);
      if (agendFiles.nota_fiscal)  fd.append('nota_fiscal',  agendFiles.nota_fiscal);
      if (agendFiles.boleto)       fd.append('boleto',       agendFiles.boleto);
      if (agendFiles.certificado)  fd.append('certificado',  agendFiles.certificado);

      const { data } = await agendamentosApi.criar(fd);
      if (!data.sucesso) throw new Error(data.mensagem);

      setModalAgend(false);
      toast.sucesso('Agendamento criado!', 'Entrega agendada com sucesso.');
      await carregar();
    } catch (err) {
      setErroAcao(err?.response?.data?.mensagem || err?.message || 'Erro ao salvar agendamento.');
    } finally {
      setSalvarAtivo(false);
    }
  }

  // ── Modal de Envio de Rota ────────────────────────────
  async function abrirModalRota() {
    setErroAcao('');
    setMotoristaId('');
    try {
      // Busca o agendamento desta solicitação
      const { data: ag } = await agendamentosApi.buscarPorSolicitacao(id);
      if (ag.sucesso && ag.dados?.agendamento) {
        setAgendamentoId(ag.dados.agendamento.id);
      } else {
        throw new Error('Agendamento não encontrado.');
      }
      // Busca motoristas disponíveis
      const { data: mot } = await usuariosApi.listar({ role: 'motorista', ativo: 'true' });
      setMotoristas(mot.dados?.usuarios || []);
      setModalRota(true);
    } catch (err) {
      setErroAcao(err?.response?.data?.mensagem || err?.message || 'Erro ao carregar motoristas.');
    }
  }

  async function salvarRota() {
    if (!motoristaId || !agendamentoId) {
      setErroAcao('Selecione um motorista.');
      return;
    }
    setSalvarAtivo(true);
    setErroAcao('');
    try {
      const { data } = await entregasApi.criar({ agendamento_id: agendamentoId, motorista_id: motoristaId });
      if (!data.sucesso) throw new Error(data.mensagem);

      setModalRota(false);
      toast.sucesso('Rota enviada!', 'Motorista notificado com sucesso.');
      await carregar();
    } catch (err) {
      setErroAcao(err?.response?.data?.mensagem || err?.message || 'Erro ao enviar rota.');
    } finally {
      setSalvarAtivo(false);
    }
  }

  // ── Proposta de data de entrega (vendedor) ───────────
  async function abrirModalProposta() {
    setPropostaData('');
    setPropostaObs('');
    setErroAcao('');
    setModalProposta(true);
  }

  async function salvarProposta() {
    if (!propostaData) {
      setErroAcao('Informe a data sugerida para entrega.');
      return;
    }
    setSalvarAtivo(true);
    setErroAcao('');
    try {
      const { data } = await propostasApi.criar({
        solicitacao_id: id,
        data_sugerida:  propostaData,
        observacoes:    propostaObs || undefined,
      });
      if (!data.sucesso) throw new Error(data.mensagem);
      setModalProposta(false);
      toast.sucesso('Proposta enviada!', 'Aguardando aprovação do gerente.');
      await carregar();
    } catch (err) {
      setErroAcao(err?.response?.data?.mensagem || err?.message || 'Erro ao enviar proposta.');
    } finally {
      setSalvarAtivo(false);
    }
  }

  // ── Resposta do gerente (aprovação / recusa) ──────────
  async function abrirModalResposta(decisao) {
    setRespostaDecisao(decisao);
    setRespostaTexto('');
    setRespostaEndereco('');
    setErroAcao('');
    try {
      const { data } = await propostasApi.buscarPorSolicitacao(id);
      setPropostaAtual(data.dados?.proposta || null);
      setModalResposta(true);
    } catch (err) {
      setErroAcao('Erro ao carregar proposta.');
    }
  }

  async function salvarResposta() {
    if (!propostaAtual) return;
    if (respostaDecisao === 'aprovada' && !respostaEndereco) {
      setErroAcao('Informe o endereço de entrega para aprovar.');
      return;
    }
    setSalvarAtivo(true);
    setErroAcao('');
    try {
      const { data } = await propostasApi.responder(propostaAtual.id, {
        decisao:           respostaDecisao,
        resposta:          respostaTexto || undefined,
        endereco_completo: respostaDecisao === 'aprovada' ? respostaEndereco : undefined,
      });
      if (!data.sucesso) throw new Error(data.mensagem);
      setModalResposta(false);
      if (respostaDecisao === 'aprovada') {
        toast.sucesso('Proposta aprovada!', 'Entrega confirmada com o endereço informado.');
      } else {
        toast.alerta('Proposta recusada.', 'O vendedor será notificado.');
      }
      await carregar();
    } catch (err) {
      setErroAcao(err?.response?.data?.mensagem || err?.message || 'Erro ao responder proposta.');
    } finally {
      setSalvarAtivo(false);
    }
  }

  // ── Loading / Erro ────────────────────────────────────
  if (carregando) {
    return <div className="flex justify-center py-20"><Spinner /></div>;
  }
  if (erro || !solicitacao) {
    return (
      <ErroCarregamento
        mensagem={erro || 'Solicitação não encontrada ou sem permissão de acesso.'}
        onTentar={erro ? carregar : undefined}
        tentando={carregando}
      />
    );
  }

  const acoes = acoesDisponiveis();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/solicitacoes')}
          className="p-2 rounded-lg hover:bg-marinho-50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-marinho-400" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-marinho-900 truncate">
            Proposta #{solicitacao.numero_proposta}
          </h1>
          <p className="text-sm text-marinho-300">{tempoRelativo(solicitacao.created_at)}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {solicitacao.prioridade && (
            <BadgePrioridade prioridade={solicitacao.prioridade} />
          )}
          <BadgeStatus status={solicitacao.status} />
        </div>
      </div>

      {/* Erro de ação */}
      {erroAcao && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200
                         rounded-lg text-red-700 text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{erroAcao}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Coluna principal ──────────────────────── */}
        <div className="lg:col-span-2 space-y-5">
          {/* Dados da solicitação */}
          <div className="card-base p-5 space-y-4">
            <h2 className="text-base font-semibold text-marinho-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-marinho-600" />
              Dados da Solicitação
            </h2>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-marinho-300 mb-0.5">Nº Proposta</p>
                <p className="font-medium text-marinho-900">{solicitacao.numero_proposta}</p>
              </div>
              {solicitacao.numero_orcamento && (
                <div>
                  <p className="text-marinho-300 mb-0.5">Nº Orçamento</p>
                  <p className="font-medium text-marinho-900">{solicitacao.numero_orcamento}</p>
                </div>
              )}
              <div>
                <p className="text-marinho-300 mb-0.5">Tipo de Documento</p>
                <p className="font-medium text-marinho-900 capitalize">
                  {solicitacao.tipo_documento === 'orcamento' ? 'Orçamento' : 'Nota Fiscal'}
                </p>
              </div>
              <div>
                <p className="text-marinho-300 mb-0.5">Setor de Destino</p>
                <p className="font-medium text-marinho-900">
                  {LABELS_SETOR[solicitacao.setor_destino]}
                </p>
              </div>
              <div>
                <p className="text-marinho-300 mb-0.5">Vendedor</p>
                <p className="font-medium text-marinho-900">{solicitacao.vendedor_nome}</p>
              </div>
              {solicitacao.estoquista_nome && (
                <div>
                  <p className="text-marinho-300 mb-0.5">Separando</p>
                  <p className="font-medium text-marinho-900">{solicitacao.estoquista_nome}</p>
                </div>
              )}
            </div>

            {solicitacao.observacoes && (
              <div className="pt-3 border-t border-marinho-100/60">
                <p className="text-marinho-300 text-sm mb-1">Observações</p>
                <p className="text-sm text-marinho-700 whitespace-pre-wrap">
                  {solicitacao.observacoes}
                </p>
              </div>
            )}

            {/* Documento */}
            {solicitacao.url_documento && (
              <div className="pt-3 border-t border-marinho-100/60">
                <a
                  href={resolveFileUrl(solicitacao.url_documento)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-marinho-600 hover:text-marinho-800"
                >
                  <FileText className="w-4 h-4" />
                  {solicitacao.nome_arquivo || 'Ver documento'}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            {/* Nota Fiscal anexada */}
            {solicitacao.url_nota_fiscal && (
              <div className="pt-3 border-t border-marinho-100/60">
                <a
                  href={resolveFileUrl(solicitacao.url_nota_fiscal)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800"
                >
                  <FileText className="w-4 h-4" />
                  Nota Fiscal anexada
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            {/* Foto de separação */}
            {solicitacao.url_foto_separacao && (
              <div className="pt-3 border-t border-marinho-100/60">
                <p className="text-marinho-300 text-sm mb-2 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5" /> Foto da separação
                </p>
                <img
                  src={resolveFileUrl(solicitacao.url_foto_separacao)}
                  alt="Separação"
                  className="rounded-lg max-h-48 object-cover"
                />
              </div>
            )}

            {/* Métricas de separação */}
            {(solicitacao.timestamp_inicio_separacao || solicitacao.tempo_separacao_segundos) && (
              <div className="pt-3 border-t border-marinho-100/60">
                <p className="text-marinho-300 text-sm mb-2 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Métricas de Separação
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {solicitacao.timestamp_inicio_separacao && (
                    <div className="bg-marinho-50 rounded-lg p-2.5 text-center">
                      <p className="text-xs text-marinho-500 mb-0.5">Início</p>
                      <p className="text-xs font-semibold text-marinho-800">
                        {formatarDataHora(solicitacao.timestamp_inicio_separacao)}
                      </p>
                    </div>
                  )}
                  {solicitacao.timestamp_fim_separacao && (
                    <div className="bg-emerald-50 rounded-lg p-2.5 text-center">
                      <p className="text-xs text-emerald-500 mb-0.5">Conclusão</p>
                      <p className="text-xs font-semibold text-emerald-800">
                        {formatarDataHora(solicitacao.timestamp_fim_separacao)}
                      </p>
                    </div>
                  )}
                  {solicitacao.tempo_separacao_segundos != null && (
                    <div className="bg-purple-50 rounded-lg p-2.5 text-center">
                      <p className="text-xs text-purple-500 mb-0.5">Duração</p>
                      <p className="text-sm font-bold text-purple-800">
                        {formatarDuracaoSep(solicitacao.tempo_separacao_segundos)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Ações disponíveis */}
          {acoes.length > 0 && (
            <div className="card-base p-5 space-y-4">
              <h2 className="text-base font-semibold text-marinho-900">Ações</h2>

              <div className="space-y-3">
                {acoes.map((acao) => (
                  <div key={acao.valor}>
                    {acaoStatus === acao.valor ? (
                      <div className="space-y-3 p-4 bg-marinho-50 rounded-xl">
                        <p className="text-sm font-medium text-marinho-700">{acao.label}</p>
                        <textarea
                          rows={2}
                          placeholder="Observação (opcional)..."
                          value={obsStatus}
                          onChange={(e) => setObsStatus(e.target.value)}
                          className="input-base resize-none text-sm"
                        />

                        {/* Upload de Nota Fiscal — OBRIGATÓRIO */}
                        {acao.temNF && (
                          <div className={`rounded-lg border-2 p-3 transition-colors ${
                            nfFile
                              ? 'border-indigo-300 bg-indigo-50'
                              : 'border-dashed border-red-300 bg-red-50'
                          }`}>
                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                              <Upload className={`w-4 h-4 ${nfFile ? 'text-indigo-600' : 'text-red-500'}`} />
                              <span className={nfFile ? 'text-indigo-700 font-medium' : 'text-red-600 font-medium'}>
                                {nfFile
                                  ? `✓ ${nfFile.name}`
                                  : 'Nota Fiscal em PDF — obrigatório *'}
                              </span>
                              <input
                                type="file"
                                accept="application/pdf"
                                className="hidden"
                                onChange={(e) => setNfFile(e.target.files?.[0] || null)}
                              />
                            </label>
                          </div>
                        )}

                        {/* Upload de Foto — OBRIGATÓRIO */}
                        {acao.temFoto && (
                          <div className={`rounded-lg border-2 p-3 transition-colors ${
                            fotoFile
                              ? 'border-green-300 bg-green-50'
                              : 'border-dashed border-red-300 bg-red-50'
                          }`}>
                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                              <Camera className={`w-4 h-4 ${fotoFile ? 'text-green-600' : 'text-red-500'}`} />
                              <span className={fotoFile ? 'text-green-700 font-medium' : 'text-red-600 font-medium'}>
                                {fotoFile
                                  ? `✓ ${fotoFile.name}`
                                  : 'Foto do material separado — obrigatório *'}
                              </span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => setFotoFile(e.target.files?.[0] || null)}
                              />
                            </label>
                          </div>
                        )}

                        <div className="flex gap-2">
                          <button
                            onClick={() => executarAcaoStatus(acao)}
                            disabled={
                              salvarAtivo ||
                              (acao.temNF && !nfFile) ||
                              (acao.fotoObrigatoria && !fotoFile)
                            }
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm
                                         font-medium ${acao.cor} transition-colors
                                         disabled:opacity-40 disabled:cursor-not-allowed`}
                          >
                            {salvarAtivo ? <Spinner tamanho="sm" /> : acao.icone}
                            Confirmar
                          </button>
                          <button
                            onClick={() => {
                              setAcaoStatus('');
                              setObsStatus('');
                              setFotoFile(null);
                              setNfFile(null);
                            }}
                            className="px-4 py-2 text-sm text-marinho-600 bg-marinho-100
                                        rounded-lg hover:bg-marinho-100 transition-colors"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          if (acao.modal === 'proposta')    abrirModalProposta();
                          else if (acao.modal === 'aprovar') abrirModalResposta('aprovada');
                          else if (acao.modal === 'recusar') abrirModalResposta('recusada');
                          else if (acao.modal === 'agendamento') abrirModalAgendamento();
                          else if (acao.modal === 'rota')   abrirModalRota();
                          else setAcaoStatus(acao.valor);
                        }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm
                                     font-medium ${acao.cor} transition-colors w-full sm:w-auto`}
                      >
                        {acao.icone}
                        {acao.label}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="card-base p-5">
            <h2 className="text-base font-semibold text-marinho-900 mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-marinho-600" />
              Histórico
            </h2>
            {historico.length === 0 ? (
              <p className="text-sm text-marinho-300">Nenhum registro ainda.</p>
            ) : (
              <ol className="relative border-l-2 border-marinho-100/60 space-y-0 ml-3">
                {historico.map((h, i) => {
                  const ehUltimo = i === historico.length - 1;
                  const proxTs   = historico[i + 1]?.created_at;
                  const deltaMs  = proxTs
                    ? new Date(proxTs).getTime() - new Date(h.created_at).getTime()
                    : null;
                  const deltaSeg = deltaMs != null ? Math.round(deltaMs / 1000) : null;

                  // Color-code por tipo
                  const ehProblema = ['aguardando_atribuicao', 'proposta_recusada'].includes(h.status_novo);
                  const ehFinal    = ['entregue', 'cancelada'].includes(h.status_novo);
                  const corDot     = ehFinal    ? 'bg-emerald-500'
                                   : ehProblema ? 'bg-red-400'
                                   : ehUltimo   ? 'bg-marinho-600'
                                   :              'bg-marinho-200';

                  return (
                    <li key={h.id} className="ml-6 pb-5">
                      <span className={`
                        absolute -left-3.5 flex items-center justify-center w-7 h-7
                        rounded-full border-2 border-white shadow-sm ${corDot}
                      `}>
                        <span className="text-white [&>svg]:w-3.5 [&>svg]:h-3.5">
                          {ICONE_STATUS[h.status_novo] || <Package className="w-3.5 h-3.5" />}
                        </span>
                      </span>
                      <div className="pl-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className={`text-sm font-semibold
                            ${ehProblema ? 'text-red-700' : ehFinal ? 'text-emerald-700' : 'text-marinho-900'}`}>
                            {LABELS_STATUS[h.status_novo] || h.status_novo}
                          </p>
                          {ehUltimo && (
                            <span className="text-xs bg-marinho-100 text-marinho-700 px-1.5 py-0.5 rounded-full font-medium">
                              atual
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-marinho-300 mt-0.5">
                          {h.alterado_por_nome} · {formatarDataHora(h.created_at)}
                        </p>
                        {h.observacao && (
                          <p className="text-xs text-marinho-600 mt-0.5 italic bg-marinho-50 rounded px-2 py-1">
                            "{h.observacao}"
                          </p>
                        )}
                        {/* Duração até próximo evento */}
                        {deltaSeg != null && (
                          <p className="text-xs text-marinho-200 mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatarDuracaoSep(deltaSeg)} neste status
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        </div>

        {/* ── Coluna lateral ────────────────────────── */}
        <div className="space-y-4">
          {/* Ações de gestão — admins + almoxarife */}
          {(ehAdmin || role === 'almoxarife') && (
            <div className="card-base p-4 space-y-3">
              <h3 className="text-sm font-semibold text-marinho-700 flex items-center gap-2">
                <Flag className="w-4 h-4 text-orange-500" />
                Gestão
              </h3>

              {/* Prioridade — layout em duas linhas para evitar overflow */}
              <div className="rounded-lg border border-marinho-100 overflow-hidden">
                <button
                  onClick={() => { setNovaPrior(solicitacao.prioridade || ''); setModalPrior(true); }}
                  className="w-full flex items-center justify-between px-3 py-2
                              hover:bg-marinho-50 text-sm transition-colors"
                >
                  <span className="text-marinho-700 font-medium">Prioridade</span>
                  <span className="text-marinho-300 text-xs">
                    {solicitacao.prioridade ? 'Alterar' : 'Definir'}
                  </span>
                </button>
                {solicitacao.prioridade && (
                  <div className="px-3 pb-2">
                    <BadgePrioridade prioridade={solicitacao.prioridade} />
                  </div>
                )}
              </div>

              {/* Atribuir estoquista */}
              {['aberta','aguardando_atribuicao','em_conferencia'].includes(solicitacao.status) && (
                <button
                  onClick={abrirModalAtribuicao}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg
                              border border-marinho-100 hover:bg-marinho-50 text-sm text-marinho-700 transition-colors"
                >
                  <UserCheck className="w-4 h-4 text-marinho-500" />
                  Atribuir separador
                </button>
              )}
            </div>
          )}

          {/* Cancelar — somente vendedor (própria, aberta) ou super_admin */}
          {(role === 'vendedor'
              ? solicitacao.vendedor_id === usuario?.id && solicitacao.status === 'aberta'
              : role === 'super_admin') && (
            <button
              onClick={() => setModalCancelar(true)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg
                          border border-red-200 text-red-600 hover:bg-red-50
                          text-sm transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Cancelar Solicitação
            </button>
          )}

          {/* Criado em */}
          <div className="card-base p-4 text-sm text-marinho-400 space-y-1">
            <p className="text-xs text-marinho-300 font-medium uppercase tracking-wide">Info</p>
            <p>Criado em {formatarDataHora(solicitacao.created_at)}</p>
            {solicitacao.updated_at !== solicitacao.created_at && (
              <p>Atualizado {tempoRelativo(solicitacao.updated_at)}</p>
            )}
          </div>
        </div>
      </div>

      {/* Modal — Prioridade */}
      {modalPrior && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <h3 className="text-lg font-semibold text-marinho-900">Definir Prioridade</h3>
            <div className="relative">
              <select
                value={novaPrior}
                onChange={(e) => setNovaPrior(e.target.value)}
                className="input-base appearance-none pr-8"
              >
                <option value="">Sem prioridade</option>
                {Object.entries(LABELS_PRIORIDADE).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4
                                       text-marinho-300 pointer-events-none" />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setModalPrior(false)}
                className="px-4 py-2 text-sm text-marinho-600 bg-marinho-50 rounded-lg hover:bg-marinho-100"
              >
                Cancelar
              </button>
              <button
                onClick={salvarPrioridade}
                className="btn-primario"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal — Atribuir Estoquista */}
      {modalAtrib && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-marinho-900">Atribuir Estoquista</h3>
              {solicitacao?.setor_destino && solicitacao.setor_destino !== 'ambos' && (
                <p className="text-xs text-marinho-600 mt-0.5 flex items-center gap-1">
                  <Package className="w-3 h-3" />
                  Setor: <span className="font-semibold capitalize">{solicitacao.setor_destino}</span>
                  {' '}— exibindo apenas colaboradores deste setor
                </p>
              )}
            </div>
            {estoquistas.length === 0 ? (
              <p className="text-sm text-marinho-400">
                Nenhum estoquista disponível para o setor "{solicitacao?.setor_destino}".
              </p>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {estoquistas.map((e) => {
                  const selecionado = estoquistaId === e.id;
                  const corSetor = e.setor === 'galpao'
                    ? 'bg-marinho-50 text-marinho-600'
                    : e.setor === 'loja'
                    ? 'bg-purple-50 text-purple-600'
                    : 'bg-marinho-50 text-marinho-400';
                  return (
                    <button
                      key={e.id}
                      onClick={() => setEstoquistaId(e.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5
                        rounded-xl border-2 text-sm transition-all
                        ${selecionado
                          ? 'border-marinho-500 bg-marinho-50'
                          : 'border-marinho-100 hover:border-marinho-200 bg-white'}`}
                    >
                      <span className={`font-medium ${selecionado ? 'text-marinho-800' : 'text-marinho-800'}`}>
                        {e.nome}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${corSetor}`}>
                        {e.setor === 'ambos' ? 'ambos' : e.setor}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setModalAtrib(false)}
                className="px-4 py-2 text-sm text-marinho-600 bg-marinho-50 rounded-lg hover:bg-marinho-100"
              >
                Cancelar
              </button>
              <button
                onClick={salvarAtribuicao}
                disabled={!estoquistaId}
                className="btn-primario disabled:opacity-50"
              >
                Atribuir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal — Confirmar Agendamento */}
      {modalAgend && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-marinho-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-marinho-600" />
              Confirmar Agendamento
            </h3>

            {erroAcao && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200
                               rounded-lg text-red-700 text-sm">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                {erroAcao}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-marinho-700 mb-1">
                  Data de Entrega <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={agendForm.data_entrega}
                  onChange={(e) => setAgendForm(f => ({ ...f, data_entrega: e.target.value }))}
                  className="input-base"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-marinho-700 mb-1">
                  Endereço de Entrega <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="Rua, número, bairro, cidade..."
                  value={agendForm.endereco_completo}
                  onChange={(e) => setAgendForm(f => ({ ...f, endereco_completo: e.target.value }))}
                  className="input-base resize-none text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-marinho-700 mb-1">
                  Observações
                </label>
                <textarea
                  rows={2}
                  placeholder="Instruções para o motorista, horário preferido..."
                  value={agendForm.observacoes}
                  onChange={(e) => setAgendForm(f => ({ ...f, observacoes: e.target.value }))}
                  className="input-base resize-none text-sm"
                />
              </div>

              {/* Upload de documentos */}
              <div className="space-y-2 pt-1">
                <p className="text-sm font-medium text-marinho-700">Documentos (opcional)</p>
                {[
                  { key: 'nota_fiscal',    label: 'Nota Fiscal (PDF)' },
                  { key: 'boleto',         label: 'Boleto (PDF)' },
                  { key: 'certificado',    label: 'Certificado (PDF)' },
                  { key: 'proposta',       label: 'Proposta (PDF)' },
                  { key: 'ordem_de_compra',label: 'Ordem de Compra (PDF)' },
                ].map(({ key, label }) => (
                  <label key={key}
                    className="flex items-center gap-2 cursor-pointer text-sm text-marinho-600
                                hover:text-marinho-600 bg-marinho-50 border border-dashed border-marinho-100
                                rounded-lg px-3 py-2 transition-colors">
                    <FileText className="w-4 h-4 flex-shrink-0" />
                    {agendFiles[key] ? (
                      <span className="text-green-600 truncate">{agendFiles[key].name}</span>
                    ) : (
                      <span className="text-marinho-300">{label}</span>
                    )}
                    <input
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={(e) => setAgendFiles(f => ({ ...f, [key]: e.target.files?.[0] || undefined }))}
                    />
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-2 border-t border-marinho-100/60">
              <button
                onClick={() => { setModalAgend(false); setErroAcao(''); }}
                className="px-4 py-2 text-sm text-marinho-600 bg-marinho-50 rounded-lg hover:bg-marinho-100"
              >
                Cancelar
              </button>
              <button
                onClick={salvarAgendamento}
                disabled={salvarAtivo || !agendForm.data_entrega || !agendForm.endereco_completo}
                className="btn-primario disabled:opacity-50 flex items-center gap-2"
              >
                {salvarAtivo ? <Spinner tamanho="sm" /> : <CheckCircle className="w-4 h-4" />}
                Confirmar Agendamento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal — Propor Data de Entrega (Vendedor) */}
      {modalProposta && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-semibold text-marinho-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-sky-600" />
              Propor Data de Entrega
            </h3>
            <p className="text-sm text-marinho-400">
              Sua sugestão será enviada para aprovação do gerente antes de ser confirmada.
            </p>

            {erroAcao && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                {erroAcao}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-marinho-700 mb-1">
                  Data Sugerida <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={propostaData}
                  onChange={(e) => setPropostaData(e.target.value)}
                  className="input-base"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-marinho-700 mb-1">
                  Observações <span className="text-marinho-300 text-xs">(opcional)</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="Período preferido, instruções para entrega..."
                  value={propostaObs}
                  onChange={(e) => setPropostaObs(e.target.value)}
                  className="input-base resize-none text-sm"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-2 border-t border-marinho-100/60">
              <button
                onClick={() => { setModalProposta(false); setErroAcao(''); }}
                className="px-4 py-2 text-sm text-marinho-600 bg-marinho-50 rounded-lg hover:bg-marinho-100"
              >
                Cancelar
              </button>
              <button
                onClick={salvarProposta}
                disabled={salvarAtivo || !propostaData}
                className="flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-600
                            text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {salvarAtivo ? <Spinner tamanho="sm" /> : <Send className="w-4 h-4" />}
                Enviar para Aprovação
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal — Gerente aprova / recusa proposta */}
      {modalResposta && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <h3 className={`text-lg font-semibold flex items-center gap-2 ${
              respostaDecisao === 'aprovada' ? 'text-green-700' : 'text-red-700'
            }`}>
              {respostaDecisao === 'aprovada'
                ? <><CheckCircle className="w-5 h-5" /> Confirmar Agendamento</>
                : <><AlertTriangle className="w-5 h-5" /> Recusar Proposta</>
              }
            </h3>

            {propostaAtual && (
              <div className="bg-sky-50 border border-sky-200 rounded-xl p-3 text-sm">
                <p className="font-medium text-sky-800">Proposta do vendedor</p>
                <p className="text-sky-700 mt-1">
                  📅 Data sugerida: <strong>{propostaAtual.data_sugerida}</strong>
                </p>
                {propostaAtual.observacoes && (
                  <p className="text-sky-600 mt-0.5 text-xs italic">
                    "{propostaAtual.observacoes}"
                  </p>
                )}
              </div>
            )}

            {erroAcao && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                {erroAcao}
              </div>
            )}

            {respostaDecisao === 'aprovada' && (
              <div>
                <label className="block text-sm font-medium text-marinho-700 mb-1">
                  Endereço de Entrega <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="Rua, número, bairro, cidade..."
                  value={respostaEndereco}
                  onChange={(e) => setRespostaEndereco(e.target.value)}
                  className="input-base resize-none text-sm"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-marinho-700 mb-1">
                {respostaDecisao === 'aprovada' ? 'Observações' : 'Motivo da recusa'}{' '}
                <span className="text-marinho-300 text-xs">(opcional)</span>
              </label>
              <textarea
                rows={2}
                placeholder={respostaDecisao === 'aprovada'
                  ? 'Instruções para o motorista...'
                  : 'Explique o motivo para o vendedor...'}
                value={respostaTexto}
                onChange={(e) => setRespostaTexto(e.target.value)}
                className="input-base resize-none text-sm"
              />
            </div>

            <div className="flex gap-3 justify-end pt-2 border-t border-marinho-100/60">
              <button
                onClick={() => { setModalResposta(false); setErroAcao(''); }}
                className="px-4 py-2 text-sm text-marinho-600 bg-marinho-50 rounded-lg hover:bg-marinho-100"
              >
                Cancelar
              </button>
              <button
                onClick={salvarResposta}
                disabled={salvarAtivo || (respostaDecisao === 'aprovada' && !respostaEndereco)}
                className={`flex items-center gap-2 px-4 py-2 text-white text-sm font-medium
                            rounded-lg transition-colors disabled:opacity-50
                            ${respostaDecisao === 'aprovada'
                              ? 'bg-green-600 hover:bg-green-700'
                              : 'bg-red-500 hover:bg-red-600'
                            }`}
              >
                {salvarAtivo ? <Spinner tamanho="sm" />
                  : respostaDecisao === 'aprovada'
                    ? <CheckCircle className="w-4 h-4" />
                    : <AlertTriangle className="w-4 h-4" />
                }
                {respostaDecisao === 'aprovada' ? 'Confirmar Entrega' : 'Recusar Proposta'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal — Enviar Rota ao Motorista */}
      {modalRota && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <h3 className="text-lg font-semibold text-marinho-900 flex items-center gap-2">
              <Flag className="w-5 h-5 text-purple-600" />
              Enviar Rota ao Motorista
            </h3>

            {erroAcao && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200
                               rounded-lg text-red-700 text-sm">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                {erroAcao}
              </div>
            )}

            {motoristas.length === 0 ? (
              <p className="text-sm text-marinho-400">Nenhum motorista disponível.</p>
            ) : (
              <div>
                <label className="block text-sm font-medium text-marinho-700 mb-1">
                  Selecionar Motorista <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={motoristaId}
                    onChange={(e) => setMotoristaId(e.target.value)}
                    className="input-base appearance-none pr-8"
                  >
                    <option value="">Selecione o motorista...</option>
                    {motoristas.map((m) => (
                      <option key={m.id} value={m.id}>{m.nome}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4
                                           text-marinho-300 pointer-events-none" />
                </div>
                <p className="text-xs text-marinho-300 mt-1">
                  O motorista receberá uma notificação com o endereço de entrega.
                </p>
              </div>
            )}

            <div className="flex gap-3 justify-end pt-2 border-t border-marinho-100/60">
              <button
                onClick={() => { setModalRota(false); setErroAcao(''); }}
                className="px-4 py-2 text-sm text-marinho-600 bg-marinho-50 rounded-lg hover:bg-marinho-100"
              >
                Cancelar
              </button>
              <button
                onClick={salvarRota}
                disabled={salvarAtivo || !motoristaId}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700
                            text-white text-sm font-medium rounded-lg transition-colors
                            disabled:opacity-50"
              >
                {salvarAtivo ? <Spinner tamanho="sm" /> : <Flag className="w-4 h-4" />}
                Enviar Rota
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmação — Cancelar Solicitação */}
      <ModalConfirmacao
        aberto={modalCancelar}
        titulo="Cancelar Solicitação"
        mensagem={`Tem certeza que deseja cancelar a solicitação #${solicitacao?.numero_proposta}? Esta ação não pode ser desfeita.`}
        textoBotao="Sim, cancelar"
        variante="perigo"
        carregando={cancelando}
        onConfirmar={cancelarSolicitacao}
        onCancelar={() => setModalCancelar(false)}
      />

      {/* Notificações toast de sucesso/alerta */}
      <ToastContainer toasts={toast.toasts} onRemover={toast.remover} />
    </div>
  );
}
