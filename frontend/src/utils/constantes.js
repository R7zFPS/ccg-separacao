/**
 * Constantes globais do sistema
 */

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  GERENCIA:    'gerencia',
  VENDEDOR:    'vendedor',
  ESTOQUISTA:  'estoquista',
  ALMOXARIFE:  'almoxarife',
  ADM:         'adm',
  MOTORISTA:   'motorista',
  FISCAL:      'fiscal',
};

export const SETORES = {
  LOJA:   'loja',
  GALPAO: 'galpao',
  AMBOS:  'ambos',
};

export const STATUS_SOLICITACAO = {
  ABERTA:                'aberta',
  EM_CONFERENCIA:        'em_conferencia',
  AGUARDANDO_ATRIBUICAO: 'aguardando_atribuicao',
  AGUARDANDO_NF:         'aguardando_nf',
  EM_EMISSAO_NF:         'em_emissao_nf',
  EM_SEPARACAO:          'em_separacao',
  MATERIAL_SEPARADO:     'material_separado',
  ENTREGA_SOLICITADA:    'entrega_solicitada',
  PROPOSTA_RECUSADA:     'proposta_recusada',
  AGENDAMENTO_REALIZADO: 'agendamento_realizado',
  ROTA_ENVIADA:          'rota_enviada',
  ENTREGUE:              'entregue',
};

// =====================================================
// PRIORIDADES DE SEPARAÇÃO
// =====================================================
export const PRIORIDADES = {
  MATERIAL_SEPARADO:   'material_separado',
  EM_SEPARACAO:        'em_separacao',
  AGUARDANDO_MATERIAL: 'aguardando_material',
  PRIORIDADE_MAXIMA:   'prioridade_maxima',
  PARA_HOJE:           'para_hoje',
  OCEANPACT:           'oceanpact',
};

export const LABELS_PRIORIDADE = {
  material_separado:   'Material Separado',
  em_separacao:        'Em Separação',
  aguardando_material: 'Aguardando Material',
  prioridade_maxima:   'Prioridade Máxima — Para agora',
  para_hoje:           'Prioridade — Para hoje',
  oceanpact:           'Prioridade — Oceanpact',
};

/** Classes Tailwind para badge de prioridade */
export const CORES_PRIORIDADE = {
  material_separado:   'bg-green-100  text-green-800  border border-green-300',
  em_separacao:        'bg-yellow-100 text-yellow-800 border border-yellow-300',
  aguardando_material: 'bg-gray-100   text-gray-600   border border-gray-300',
  prioridade_maxima:   'bg-red-100    text-red-800    border border-red-400',
  para_hoje:           'bg-pink-100   text-pink-800   border border-pink-300',
  oceanpact:           'bg-red-200    text-red-900    border border-red-500',
};

export const LABELS_STATUS = {
  aberta:                'Aberta',
  em_conferencia:        'Em Conferência',
  aguardando_atribuicao: 'Aguardando Atribuição',
  aguardando_nf:         'Aguardando Nota Fiscal',
  em_emissao_nf:         'Emitindo Nota Fiscal',
  em_separacao:          'Em Separação',
  material_separado:     'Material Separado',
  entrega_solicitada:    'Entrega Solicitada',
  proposta_recusada:     'Proposta Recusada',
  agendamento_realizado: 'Agendamento Confirmado',
  rota_enviada:          'Rota Enviada',
  entregue:              'Entregue',
};

export const LABELS_ROLE = {
  super_admin: 'Administrador Total',
  gerencia:    'Gerência',
  vendedor:    'Vendedor',
  estoquista:  'Estoquista',
  almoxarife:  'Almoxarife',
  adm:         'Administração',
  motorista:   'Motorista',
  fiscal:      'Fiscal / NF',
};

export const LABELS_SETOR = {
  loja:   'Loja',
  galpao: 'Galpão',
  ambos:  'Ambos',
};

export const LABELS_LOCAL_MATERIAL = {
  loja:   'Loja',
  galpao: 'Galpão',
  ambos:  'Loja / Galpão',
};

// Perfis que usam preferencialmente o celular (PWA)
export const ROLES_MOBILE  = ['estoquista', 'almoxarife', 'motorista', 'fiscal'];
// Perfis que usam preferencialmente o navegador desktop
export const ROLES_DESKTOP = ['super_admin', 'gerencia', 'vendedor', 'adm'];

export const TEMPO_ESCALADA_MS = 30 * 60 * 1000;

// Ordem lógica do fluxo completo
export const ORDEM_STATUS = [
  'aberta',
  'em_conferencia',
  'aguardando_atribuicao',
  'aguardando_nf',
  'em_emissao_nf',
  'em_separacao',
  'material_separado',
  'entrega_solicitada',
  'proposta_recusada',
  'agendamento_realizado',
  'rota_enviada',
  'entregue',
];
