/**
 * Página placeholder para rotas dos próximos Sprints
 * Visual alinhado ao design system navy + dourado
 */

import { Wrench, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PaginaEmConstrucao({ titulo, sprint }) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-up">
      <div className="w-16 h-16 bg-dourado-50 border border-dourado-200 rounded-2xl
                       flex items-center justify-center mb-6 animate-float">
        <Wrench className="w-8 h-8 text-dourado-500" />
      </div>
      <h1 className="text-2xl font-bold text-marinho-900 mb-1">{titulo}</h1>
      <div className="gold-line mb-3" />
      <p className="text-marinho-400 mb-2">
        Esta página está sendo desenvolvida.
      </p>
      {sprint && (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs
                          font-medium bg-marinho-50 text-marinho-600 border border-marinho-100 mb-6">
          Sprint {sprint}
        </span>
      )}
      <button onClick={() => navigate(-1)} className="btn-secundario mt-2">
        <ArrowLeft className="w-4 h-4" />
        Voltar
      </button>
    </div>
  );
}
