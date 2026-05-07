/**
 * ╔══════════════════════════════════════════════════════╗
 * ║  Sistema RBAC — Casa das Correntes Guanabara        ║
 * ║  Role-Based Access Control                          ║
 * ╚══════════════════════════════════════════════════════╝
 *
 * Hierarquia:
 *   super_admin > gerencia > adm/almoxarife > fiscal > vendedor/estoquista/motorista
 *
 * Alterações v2:
 *   - Removido: logistica (incorporado em gerencia)
 *   - Adicionado: gerencia (acesso combinado + pode editar usuários)
 */

const PERMISSIONS = {
  // ── Super Admin ─────────────────────────────────────
  full_access:               'full_access',
  gerenciar_usuarios:        'gerenciar_usuarios',
  criar_usuario:             'criar_usuario',
  editar_usuario:            'editar_usuario',       // gerencia também tem
  excluir_usuario:           'excluir_usuario',
  atribuir_roles:            'atribuir_roles',
  remover_roles:             'remover_roles',
  visualizar_todos_dados:    'visualizar_todos_dados',
  sobrescrever_permissoes:   'sobrescrever_permissoes',

  // ── Vendedor ─────────────────────────────────────────
  solicitar_verificacao_material: 'solicitar_verificacao_material',
  anexar_arquivo_solicitacao:     'anexar_arquivo_solicitacao',
  enviar_solicitacao_estoque:     'enviar_solicitacao_estoque',
  enviar_solicitacao_almoxarife:  'enviar_solicitacao_almoxarife',
  enviar_nota_para_separacao:     'enviar_nota_para_separacao',
  sugerir_data_entrega:           'sugerir_data_entrega',
  cancelar_solicitacao_proposta:  'cancelar_solicitacao_proposta',
  cancelar_nota_fiscal:           'cancelar_nota_fiscal',

  // ── Almoxarife / Adm ─────────────────────────────────
  visualizar_solicitacoes:        'visualizar_solicitacoes',
  designar_estoquista:            'designar_estoquista',
  assumir_atendimento:            'assumir_atendimento',
  confirmar_separacao_material:   'confirmar_separacao_material',
  retornar_para_vendas:           'retornar_para_vendas',
  definir_prioridade:             'definir_prioridade',

  // ── Logística / Gerência ─────────────────────────────
  agendar_entrega:                'agendar_entrega',
  definir_rota_entrega:           'definir_rota_entrega',
  enviar_rota_motorista:          'enviar_rota_motorista',
  aprovar_proposta_entrega:       'aprovar_proposta_entrega',
  recusar_proposta_entrega:       'recusar_proposta_entrega',   // novo

  // ── Motorista ────────────────────────────────────────
  visualizar_entregas:            'visualizar_entregas',
  atualizar_status_entrega:       'atualizar_status_entrega',

  // ── Estoquista ───────────────────────────────────────
  responder_solicitacoes:         'responder_solicitacoes',
  atualizar_status_separacao:     'atualizar_status_separacao',
  iniciar_separacao:              'iniciar_separacao',           // novo: salva timestamp início
  concluir_separacao:             'concluir_separacao',          // novo: requer foto, salva tempo

  // ── Fiscal ───────────────────────────────────────────
  visualizar_solicitacoes_nf:     'visualizar_solicitacoes_nf',
  emitir_nota_fiscal:             'emitir_nota_fiscal',
  anexar_pdf_nfe:                 'anexar_pdf_nfe',
  anexar_pdf_boleto:              'anexar_pdf_boleto',
  anexar_certificado:             'anexar_certificado',
  retornar_documentos:            'retornar_documentos',
};

// ─────────────────────────────────────────────────────────────
// MAPA DE ROLES → PERMISSÕES
// ─────────────────────────────────────────────────────────────
const ROLE_PERMISSIONS = {

  super_admin: [
    'full_access',
    'gerenciar_usuarios',
    'criar_usuario',
    'editar_usuario',
    'excluir_usuario',
    'atribuir_roles',
    'remover_roles',
    'visualizar_todos_dados',
    'sobrescrever_permissoes',
    // Herda tudo dos demais
    'visualizar_solicitacoes',
    'designar_estoquista',
    'assumir_atendimento',
    'confirmar_separacao_material',
    'retornar_para_vendas',
    'definir_prioridade',
    'solicitar_verificacao_material',
    'enviar_solicitacao_estoque',
    'sugerir_data_entrega',
    'cancelar_solicitacao_proposta',
    'agendar_entrega',
    'definir_rota_entrega',
    'enviar_rota_motorista',
    'aprovar_proposta_entrega',
    'recusar_proposta_entrega',
    'visualizar_entregas',
    'atualizar_status_entrega',
    'responder_solicitacoes',
    'atualizar_status_separacao',
    'iniciar_separacao',
    'concluir_separacao',
    'visualizar_solicitacoes_nf',
    'emitir_nota_fiscal',
    'anexar_pdf_nfe',
    'anexar_pdf_boleto',
    'anexar_certificado',
    'retornar_documentos',
  ],

  /**
   * gerencia — substitui logistica
   * Acesso combinado: logística + vendedor + fiscal + adm/almoxarife
   * PODE editar usuários (mas NÃO criar, excluir ou atribuir roles)
   */
  gerencia: [
    'editar_usuario',              // pode editar, NÃO criar/excluir
    'visualizar_todos_dados',
    // Logística
    'agendar_entrega',
    'definir_rota_entrega',
    'enviar_rota_motorista',
    'aprovar_proposta_entrega',
    'recusar_proposta_entrega',
    'sugerir_data_entrega',
    // Vendedor
    'solicitar_verificacao_material',
    'anexar_arquivo_solicitacao',
    'enviar_solicitacao_estoque',
    'enviar_solicitacao_almoxarife',
    'enviar_nota_para_separacao',
    'cancelar_solicitacao_proposta',
    'cancelar_nota_fiscal',
    // Adm / Almoxarife (administração do chão)
    'visualizar_solicitacoes',
    'designar_estoquista',
    'assumir_atendimento',
    'confirmar_separacao_material',
    'retornar_para_vendas',
    'definir_prioridade',
    // Fiscal
    'visualizar_solicitacoes_nf',
    'emitir_nota_fiscal',
    'anexar_pdf_nfe',
    'anexar_pdf_boleto',
    'anexar_certificado',
    'retornar_documentos',
  ],

  vendedor: [
    'solicitar_verificacao_material',
    'anexar_arquivo_solicitacao',
    'enviar_solicitacao_estoque',
    'enviar_solicitacao_almoxarife',
    'enviar_nota_para_separacao',
    'sugerir_data_entrega',
    'cancelar_solicitacao_proposta',
    'cancelar_nota_fiscal',
    'visualizar_solicitacoes',
  ],

  almoxarife: [
    'visualizar_solicitacoes',
    'visualizar_todos_dados',
    'designar_estoquista',
    'assumir_atendimento',
    'confirmar_separacao_material',
    'retornar_para_vendas',
    'definir_prioridade',
    'responder_solicitacoes',
    'atualizar_status_separacao',
  ],

  adm: [
    'visualizar_solicitacoes',
    'designar_estoquista',
    'assumir_atendimento',
    'confirmar_separacao_material',
    'retornar_para_vendas',
    'definir_prioridade',
    'agendar_entrega',
    'aprovar_proposta_entrega',
    'enviar_rota_motorista',
  ],

  motorista: [
    'visualizar_entregas',
    'atualizar_status_entrega',
  ],

  estoquista: [
    'visualizar_solicitacoes',
    'responder_solicitacoes',
    'atualizar_status_separacao',
    'assumir_atendimento',
    'iniciar_separacao',
    'concluir_separacao',
  ],

  fiscal: [
    'visualizar_solicitacoes_nf',
    'visualizar_solicitacoes',
    'emitir_nota_fiscal',
    'anexar_pdf_nfe',
    'anexar_pdf_boleto',
    'anexar_certificado',
    'retornar_documentos',
  ],
};

const ROLES_VALIDOS = Object.keys(ROLE_PERMISSIONS);

function temPermissao(role, permissao) {
  if (role === 'super_admin') return true;
  const perms = ROLE_PERMISSIONS[role] || [];
  return perms.includes(permissao) || perms.includes('full_access');
}

function checkPermission(permissao) {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({ sucesso: false, mensagem: 'Não autenticado.' });
    }
    if (temPermissao(req.usuario.role, permissao)) return next();
    return res.status(403).json({
      sucesso: false,
      mensagem: `Permissão insuficiente. Requer: ${permissao}`,
    });
  };
}

module.exports = {
  PERMISSIONS,
  ROLE_PERMISSIONS,
  ROLES_VALIDOS,
  temPermissao,
  checkPermission,
};
