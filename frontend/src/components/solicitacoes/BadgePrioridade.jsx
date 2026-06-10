/**
 * Badge de Prioridade — visual por nível de urgência
 */

import { LABELS_PRIORIDADE, CORES_PRIORIDADE } from '../../utils/constantes';

export function BadgePrioridade({ prioridade, className = '' }) {
  if (!prioridade) return null;

  return (
    <span className={`
      inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold
      ${CORES_PRIORIDADE[prioridade] || 'bg-marinho-50 text-marinho-600'}
      ${className}
    `}>
      {LABELS_PRIORIDADE[prioridade] || prioridade}
    </span>
  );
}
