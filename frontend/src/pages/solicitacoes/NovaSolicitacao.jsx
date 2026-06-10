/**
 * Página — Nova Solicitação
 * Tipo de documento vem primeiro. Campo de número se adapta ao tipo selecionado.
 * - Orçamento → pede Nº da Proposta
 * - Nota Fiscal → pede Nº da Nota Fiscal (vai direto para separação)
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, Upload, ChevronDown, AlertCircle,
  CheckCircle, ArrowLeft, Send,
} from 'lucide-react';
import { solicitacoesApi } from '../../services/api';
import { useAuth }         from '../../context/AuthContext';
import { Spinner }         from '../../components/ui/Spinner';
import { useToast }        from '../../hooks/useToast';
import { ToastContainer }  from '../../components/ui/Toast';
import { usePageTitle } from '../../hooks/usePageTitle';

const LOCAIS_MATERIAL = [
  { value: 'loja',   label: 'Loja' },
  { value: 'galpao', label: 'Galpão' },
  { value: 'ambos',  label: 'Loja / Galpão' },
];

export default function NovaSolicitacao() {
  usePageTitle('Nova Solicitação');
  const navigate    = useNavigate();
  const { usuario } = useAuth();
  const toast       = useToast();

  const [tipo,       setTipo]       = useState('orcamento');
  const [form,       setForm]       = useState({
    numero_proposta: '',
    setor_destino:   usuario?.setor === 'loja' ? 'loja' : 'galpao',
    observacoes:     '',
  });
  const [arquivo,    setArquivo]    = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [erro,       setErro]       = useState('');

  const ehOrcamento = tipo === 'orcamento';

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (erro) setErro('');
  }

  function handleTipo(novoTipo) {
    setTipo(novoTipo);
    setForm((p) => ({ ...p, numero_proposta: '' }));
    if (erro) setErro('');
  }

  function handleArquivo(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setErro('Apenas arquivos PDF são aceitos.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErro('O arquivo não pode exceder 10 MB.');
      return;
    }
    setArquivo(file);
    setErro('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.numero_proposta.trim()) {
      setErro(ehOrcamento
        ? 'Informe o número da proposta.'
        : 'Informe o número da nota fiscal.');
      return;
    }

    setCarregando(true);
    setErro('');

    try {
      const fd = new FormData();
      fd.append('tipo_documento',  tipo);
      fd.append('numero_proposta', form.numero_proposta.trim());
      fd.append('setor_destino',   form.setor_destino);
      if (form.observacoes) fd.append('observacoes', form.observacoes.trim());
      if (arquivo)          fd.append('documento',   arquivo);

      const { data } = await solicitacoesApi.criar(fd);
      if (!data.sucesso) throw new Error(data.mensagem);

      toast.sucesso('Solicitação enviada!', 'Redirecionando para o acompanhamento...');
      setTimeout(() => navigate(`/solicitacoes/${data.dados.solicitacao.id}`), 1200);
    } catch (err) {
      const msg = err?.response?.data?.mensagem || err?.message || 'Erro ao criar solicitação.';
      setErro(msg);
      toast.erro('Erro ao enviar', msg);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <>
    <ToastContainer toasts={toast.toasts} onRemover={toast.remover} />
    <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn">
      {/* Cabeçalho */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/solicitacoes')}
          className="p-2 rounded-lg hover:bg-marinho-50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-marinho-400" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-marinho-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-marinho-600" />
            Nova Solicitação
          </h1>
          <p className="text-sm text-marinho-400">Preencha os dados do pedido de separação</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card-base p-6 space-y-5">

        {/* ── PASSO 1: Tipo de documento ───────────────── */}
        <div>
          <label className="block text-sm font-semibold text-marinho-700 mb-2">
            Tipo de Documento <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                value: 'orcamento',
                label: 'Orçamento',
                desc:  'Ainda precisa de nota fiscal',
                icone: '📋',
              },
              {
                value: 'nota_fiscal',
                label: 'Nota Fiscal',
                desc:  'Já possui NF — vai direto para separação',
                icone: '🧾',
              },
            ].map(({ value, label, desc, icone }) => (
              <button
                key={value}
                type="button"
                onClick={() => handleTipo(value)}
                disabled={carregando}
                className={`flex flex-col items-start p-4 rounded-xl border-2 text-left
                             transition-all duration-200
                             ${tipo === value
                               ? 'border-marinho-600 bg-marinho-50 shadow-md'
                               : 'border-marinho-100 hover:border-marinho-300 bg-white hover:shadow-sm'
                             }`}
              >
                <span className="text-xl mb-1">{icone}</span>
                <span className={`font-semibold text-sm ${tipo === value ? 'text-marinho-700' : 'text-marinho-800'}`}>
                  {label}
                </span>
                <span className="text-xs text-marinho-400 mt-0.5">{desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── PASSO 2: Número ──────────────────────────── */}
        <div>
          <label className="block text-sm font-semibold text-marinho-700 mb-1.5">
            {ehOrcamento ? 'Número da Proposta' : 'Número da Nota Fiscal'}{' '}
            <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="numero_proposta"
            value={form.numero_proposta}
            onChange={handleChange}
            placeholder={ehOrcamento ? 'Ex: 2024-001' : 'Ex: NF-2024-5891'}
            className="input-base"
            disabled={carregando}
            required
          />
        </div>

        {/* ── PASSO 3: Local do Material ────────────────── */}
        <div>
          <label className="block text-sm font-semibold text-marinho-700 mb-1.5">
            Local do Material <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {LOCAIS_MATERIAL.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setForm(f => ({ ...f, setor_destino: value }))}
                disabled={carregando}
                className={`py-2.5 px-3 rounded-lg border-2 text-sm font-medium transition-all duration-200
                  ${form.setor_destino === value
                    ? 'border-marinho-600 bg-marinho-600 text-white shadow-md'
                    : 'border-marinho-100 text-marinho-700 hover:border-marinho-300 hover:bg-marinho-50'
                  }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Upload de documento ───────────────────────── */}
        <div>
          <label className="block text-sm font-semibold text-marinho-700 mb-1.5">
            {ehOrcamento ? 'Orçamento em PDF' : 'Nota Fiscal em PDF'}{' '}
            <span className="text-marinho-300 text-xs font-normal">(opcional — máx. 10 MB)</span>
          </label>
          <label className={`
            flex flex-col items-center justify-center w-full h-28 border-2 border-dashed
            rounded-xl cursor-pointer transition-all duration-200
            ${arquivo
              ? 'border-green-400 bg-green-50'
              : 'border-marinho-200 bg-marinho-50 hover:bg-marinho-50 hover:border-marinho-400'
            }
            ${carregando ? 'pointer-events-none opacity-50' : ''}
          `}>
            {arquivo ? (
              <div className="text-center">
                <CheckCircle className="w-7 h-7 text-green-500 mx-auto mb-1" />
                <p className="text-sm font-medium text-green-700">{arquivo.name}</p>
                <p className="text-xs text-green-600">
                  {(arquivo.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            ) : (
              <div className="text-center">
                <Upload className="w-7 h-7 text-marinho-300 mx-auto mb-1" />
                <p className="text-sm text-marinho-400">Clique para selecionar ou arraste o PDF</p>
              </div>
            )}
            <input
              type="file"
              accept="application/pdf"
              onChange={handleArquivo}
              className="hidden"
              disabled={carregando}
            />
          </label>
          {arquivo && (
            <button
              type="button"
              onClick={() => setArquivo(null)}
              className="mt-1 text-xs text-red-500 hover:text-red-700"
            >
              Remover arquivo
            </button>
          )}
        </div>

        {/* ── Observações ───────────────────────────────── */}
        <div>
          <label className="block text-sm font-semibold text-marinho-700 mb-1.5">
            Observações{' '}
            <span className="text-marinho-300 text-xs font-normal">(opcional)</span>
          </label>
          <textarea
            name="observacoes"
            value={form.observacoes}
            onChange={handleChange}
            rows={3}
            placeholder="Informações adicionais para o estoquista..."
            className="input-base resize-none"
            disabled={carregando}
          />
        </div>

        {/* Erro */}
        {erro && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200
                           rounded-lg text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{erro}</span>
          </div>
        )}

        {/* Botões */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-marinho-100/60">
          <button
            type="button"
            onClick={() => navigate('/solicitacoes')}
            disabled={carregando}
            className="px-4 py-2 text-sm font-medium text-marinho-700 bg-marinho-50
                        rounded-lg hover:bg-marinho-100 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={carregando}
            className="btn-primario"
          >
            {carregando
              ? <><Spinner tamanho="sm" /><span>Enviando...</span></>
              : <><Send className="w-4 h-4" /><span>Enviar Solicitação</span></>
            }
          </button>
        </div>
      </form>
    </div>
    </>
  );
}
