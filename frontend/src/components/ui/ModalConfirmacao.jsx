/**
 * ModalConfirmacao — diálogo de confirmação para ações destrutivas.
 *
 * Props:
 *   aberto       {boolean}   — controla visibilidade
 *   titulo       {string}    — título do modal
 *   mensagem     {string}    — corpo explicativo
 *   textoBotao   {string}    — texto do botão de confirmação (padrão: "Confirmar")
 *   variante     {string}    — "perigo" (vermelho) | "aviso" (âmbar) | "normal" (azul)
 *   carregando   {boolean}   — desabilita botões enquanto a ação ocorre
 *   onConfirmar  {function}  — chamado ao clicar em Confirmar
 *   onCancelar   {function}  — chamado ao clicar em Cancelar ou no overlay
 */

import { useEffect } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

const VARIANTES = {
  perigo: {
    icone:   <Trash2        className="w-6 h-6 text-red-600"    />,
    bg:      'bg-red-100',
    botao:   'bg-red-600 hover:bg-red-700 focus:ring-red-500',
  },
  aviso: {
    icone:   <AlertTriangle className="w-6 h-6 text-amber-600"  />,
    bg:      'bg-amber-100',
    botao:   'bg-amber-500 hover:bg-amber-600 focus:ring-amber-400',
  },
  normal: {
    icone:   <AlertTriangle className="w-6 h-6 text-marinho-600"   />,
    bg:      'bg-marinho-100',
    botao:   'bg-marinho-600 hover:bg-marinho-700 focus:ring-marinho-400',
  },
};

export function ModalConfirmacao({
  aberto,
  titulo      = 'Confirmar ação',
  mensagem    = 'Tem certeza que deseja continuar?',
  textoBotao  = 'Confirmar',
  variante    = 'perigo',
  carregando  = false,
  onConfirmar,
  onCancelar,
}) {
  const v = VARIANTES[variante] || VARIANTES.perigo;

  // Fecha no Escape
  useEffect(() => {
    if (!aberto) return;
    function onKey(e) {
      if (e.key === 'Escape') onCancelar?.();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [aberto, onCancelar]);

  // Impede scroll do body quando aberto
  useEffect(() => {
    document.body.style.overflow = aberto ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [aberto]);

  if (!aberto) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-titulo"
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancelar}
      />

      {/* Card */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm
                      animate-in fade-in zoom-in-95 duration-150">
        {/* Botão fechar */}
        <button
          onClick={onCancelar}
          className="absolute top-3 right-3 p-1.5 rounded-lg text-marinho-300
                     hover:text-marinho-600 hover:bg-marinho-50 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6">
          {/* Ícone */}
          <div className={`w-12 h-12 rounded-full ${v.bg} flex items-center
                           justify-center mb-4`}>
            {v.icone}
          </div>

          {/* Título */}
          <h3 id="modal-titulo"
              className="text-lg font-bold text-marinho-900 mb-2">
            {titulo}
          </h3>

          {/* Mensagem */}
          <p className="text-sm text-marinho-600 leading-relaxed">
            {mensagem}
          </p>
        </div>

        {/* Ações */}
        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={onCancelar}
            disabled={carregando}
            className="flex-1 py-2.5 rounded-xl border border-marinho-100
                       text-sm font-semibold text-marinho-700
                       hover:bg-marinho-50 disabled:opacity-50
                       transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirmar}
            disabled={carregando}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold
                        text-white focus:outline-none focus:ring-2
                        focus:ring-offset-2 disabled:opacity-50
                        transition-colors ${v.botao}`}
          >
            {carregando ? 'Aguarde…' : textoBotao}
          </button>
        </div>
      </div>
    </div>
  );
}
