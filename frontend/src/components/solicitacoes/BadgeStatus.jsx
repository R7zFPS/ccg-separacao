/**
 * Badge de Status da Solicitação
 */

import { LABELS_STATUS } from '../../utils/constantes';

const CORES_STATUS = {
  aberta:                'bg-marinho-50    text-marinho-600    border border-marinho-200',
  em_conferencia:        'bg-orange-100  text-orange-700  border border-orange-300',
  aguardando_atribuicao: 'bg-red-100     text-red-700     border border-red-300',
  aguardando_nf:         'bg-amber-100   text-amber-800   border border-amber-300',
  em_emissao_nf:         'bg-indigo-100  text-indigo-700  border border-indigo-300',
  em_separacao:          'bg-yellow-100  text-yellow-800  border border-yellow-300',
  material_separado:     'bg-green-100   text-green-700   border border-green-300',
  entrega_solicitada:    'bg-sky-100     text-sky-700     border border-sky-300',
  proposta_recusada:     'bg-red-100     text-red-700     border border-red-300',
  agendamento_realizado: 'bg-marinho-100    text-marinho-700    border border-marinho-200',
  rota_enviada:          'bg-purple-100  text-purple-700  border border-purple-300',
  entregue:              'bg-emerald-100 text-emerald-700  border border-emerald-300',
};

export function BadgeStatus({ status, className = '' }) {
  return (
    <span className={`
      inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
      ${CORES_STATUS[status] || 'bg-marinho-50 text-marinho-600'}
      ${className}
    `}>
      {LABELS_STATUS[status] || status}
    </span>
  );
}
