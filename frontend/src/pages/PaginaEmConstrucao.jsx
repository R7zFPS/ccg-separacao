/**
 * Página placeholder para rotas dos próximos Sprints
 */

import { Wrench, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PaginaEmConstrucao({ titulo, sprint }) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="w-16 h-16 bg-yellow-100 rounded-2xl flex items-center
                       justify-center mb-6">
        <Wrench className="w-8 h-8 text-yellow-600" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{titulo}</h1>
      <p className="text-gray-500 mb-2">
        Esta página está sendo desenvolvida.
      </p>
      {sprint && (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs
                          font-medium bg-blue-100 text-blue-700 mb-6">
          Sprint {sprint}
        </span>
      )}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800
                    font-medium transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar
      </button>
    </div>
  );
}
