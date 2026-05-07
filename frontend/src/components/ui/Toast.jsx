/**
 * Componente Toast — Notificações visuais temporárias
 * Renderizado no canto superior direito da tela
 */

import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const ICONES = {
  sucesso: <CheckCircle className="w-5 h-5 text-green-500" />,
  erro:    <XCircle    className="w-5 h-5 text-red-500" />,
  alerta:  <AlertTriangle className="w-5 h-5 text-yellow-500" />,
  info:    <Info       className="w-5 h-5 text-blue-500" />,
};

const ESTILOS = {
  sucesso: 'border-l-4 border-green-500',
  erro:    'border-l-4 border-red-500',
  alerta:  'border-l-4 border-yellow-500',
  info:    'border-l-4 border-blue-500',
};

function ToastItem({ toast, onRemover }) {
  return (
    <div
      className={`
        flex items-start gap-3 bg-white rounded-lg shadow-lg p-4 pr-3
        animate-slide-in-right max-w-sm w-full
        ${ESTILOS[toast.tipo] || ESTILOS.info}
      `}
      role="alert"
    >
      <div className="flex-shrink-0 mt-0.5">
        {ICONES[toast.tipo] || ICONES.info}
      </div>
      <div className="flex-1 min-w-0">
        {toast.titulo && (
          <p className="text-sm font-semibold text-gray-900">{toast.titulo}</p>
        )}
        {toast.descricao && (
          <p className="text-sm text-gray-600 mt-0.5">{toast.descricao}</p>
        )}
      </div>
      <button
        onClick={() => onRemover(toast.id)}
        className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors p-1"
        aria-label="Fechar"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

/**
 * Container de Toasts
 * Deve ser renderizado uma vez no App.jsx, no nível raiz
 */
export function ToastContainer({ toasts, onRemover }) {
  if (!toasts?.length) return null;

  return (
    <div
      className="fixed top-4 right-4 z-50 flex flex-col gap-2"
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemover={onRemover} />
      ))}
    </div>
  );
}
