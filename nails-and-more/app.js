/* ============================================================
   Nails & More Salon — app de agendamentos
   Preços transcritos do cardápio oficial do salão.
   Os dados ficam no localStorage do navegador (chave nm_agendamentos).
   ============================================================ */

'use strict';

// ---------- cardápio ----------
const CATEGORIAS = [
  {
    id: 'maos-pes',
    nome: 'Embelezamento · Mãos & Pés',
    icone: '🖐',
    servicos: [
      { id: 'mao', nome: 'Mão', preco: 49 },
      { id: 'pe', nome: 'Pé', preco: 55 },
      { id: 'mao-pe', nome: 'Mão e Pé', preco: 95 },
      { id: 'motor-pedicure', nome: 'Motor Pedicure', preco: 9 },
      { id: 'esfoliacao', nome: 'Esfoliação — Granado', preco: 25 },
      { id: 'hidratacao', nome: 'Hidratação — Granado', preco: 25 },
      { id: 'massagem-pernas', nome: 'Massagem Pernas & Pés Cansados — Granado', preco: 37 },
      { id: 'adicional-francesinha', nome: 'Adicional de Francesinha', preco: 5 },
      { id: 'esmaltar', nome: 'Esmaltar', preco: 29 },
      { id: 'cortar', nome: 'Cortar', preco: 29 },
      { id: 'decorada', nome: 'Decorada', preco: 69 },
    ],
  },
  {
    id: 'nail-designer',
    nome: 'Nail Designer & Alongamento',
    icone: '💅',
    servicos: [
      { id: 'colocacao', nome: 'Colocação', preco: 269, nota: 'Cutilagem com esmaltação tradicional' },
      { id: 'manutencao', nome: 'Manutenção', preco: 175 },
      { id: 'banho-gel', nome: 'Banho de Gel', preco: 135 },
      { id: 'banho-calcio', nome: 'Banho de Cálcio — Cuccio', preco: 119 },
      { id: 'nail-art', nome: 'Nail Art', preco: 69 },
      { id: 'decoracao-unitaria', nome: 'Decoração Unitária', preco: 9 },
      { id: 'reposicao-unitaria', nome: 'Reposição Unitária', preco: 25 },
      { id: 'francesinha-gel', nome: 'Francesinha Gel', preco: 35 },
      { id: 'esmaltacao-gel', nome: 'Esmaltação em Gel', preco: 109 },
      { id: 'mudanca-formato', nome: 'Mudança de Formato', preco: 35 },
      { id: 'reducao-tamanho', nome: 'Redução de Tamanho', preco: 25 },
      { id: 'remocao-gel', nome: 'Remoção — Esmaltação em Gel', preco: 35 },
      { id: 'remocao-alongamento', nome: 'Remoção — Alongamento', preco: 49 },
      { id: 'aplicacao-express', nome: 'Aplicação Express', preco: 129 },
    ],
  },
  {
    id: 'olhar',
    nome: 'Embelezamento do Olhar',
    icone: '👁',
    servicos: [
      { id: 'alongamento-cilios', nome: 'Alongamento de Cílios', preco: 205, aPartirDe: true },
      { id: 'manutencao-cilios', nome: 'Manutenção de Cílios', preco: 125, aPartirDe: true },
      { id: 'retirada-cilios', nome: 'Retirada de Cílios', preco: 65 },
      { id: 'sobrancelha', nome: 'Sobrancelha', preco: 65 },
      { id: 'tintura-sobrancelha', nome: 'Tintura de Sobrancelha', preco: 45 },
      { id: 'depilacao-buco', nome: 'Depilação de Buço/Queixo', preco: 29 },
      { id: 'depilacao-rosto', nome: 'Depilação de Rosto', preco: 89 },
      { id: 'lash-lifting', nome: 'Lash Lifting', preco: 169 },
      { id: 'brow-lamination', nome: 'Brow Lamination', preco: 159 },
    ],
  },
  {
    id: 'spa',
    nome: 'Spa & Experiência',
    icone: '🌸',
    servicos: [
      { id: 'spa-pes', nome: 'Spa dos Pés — Avatim', preco: 105, nota: 'Cutilagem com esmaltação tradicional' },
      { id: 'spa-vip', nome: 'Spa VIP — Cuccio', preco: 129, nota: 'Cutilagem com esmaltação tradicional' },
      { id: 'spa-maos', nome: 'Spa das Mãos', preco: 85, nota: 'Cutilagem com esmaltação tradicional' },
      { id: 'ofuroterapia', nome: 'Ofuroterapia', preco: 149, nota: 'Cutilagem com esmaltação tradicional' },
    ],
  },
  {
    id: 'hair',
    nome: 'Hair & Tratamentos',
    icone: '💇‍♀️',
    servicos: [
      { id: 'corte-feminino', nome: 'Corte Feminino + Finalização', preco: 249, aPartirDe: true },
      { id: 'corte-masculino', nome: 'Corte Masculino', preco: 120 },
      { id: 'corte-franja', nome: 'Corte de Franja', preco: 130 },
      { id: 'alinhamento', nome: 'Alinhamento Capilar', preco: 499, aPartirDe: true },
      { id: 'tratamento-spa', nome: 'Tratamento SPA', preco: 279, aPartirDe: true },
      { id: 'tratamento-shampoo', nome: 'Tratamento (Shampoo + Escova)', preco: 179, aPartirDe: true },
      { id: 'coloracao', nome: 'Coloração', preco: 249, aPartirDe: true },
      { id: 'aplicacao-coloracao', nome: 'Aplicação de Coloração', preco: 159 },
      { id: 'mechas', nome: 'Mechas (Com Plex) + Tratamento + Finalização', preco: 799, aPartirDe: true },
      { id: 'escova', nome: 'Escova', preco: 89, aPartirDe: true },
      { id: 'secagem', nome: 'Secagem', preco: 49 },
      { id: 'piastra', nome: 'Adicional Piastra/Baby Liss', preco: 49, aPartirDe: true },
    ],
  },
];

const TODOS_SERVICOS = CATEGORIAS.flatMap((c) => c.servicos);

const LABEL_FORMA = { pix: 'Pix', credito: 'Cartão de crédito', debito: 'Cartão de débito', dinheiro: 'Dinheiro' };
const LABEL_QUANDO = { na_hora: 'Pagar na hora', antecipado: 'Pagamento antecipado' };
const LABEL_STATUS = { pendente: 'Aguardando confirmação', confirmado: 'Confirmado', concluido: 'Concluído', cancelado: 'Cancelado' };

const CHAVE_DADOS = 'nm_agendamentos';
const CHAVE_SESSAO_ADMIN = 'nm_admin';
const PIN_ADMIN = '2016'; // ano de fundação do salão
const VAGAS_POR_HORARIO = 3; // profissionais atendendo em paralelo por unidade

// ---------- estado ----------
const estado = {
  passo: 1,
  selecionados: new Set(),
  unidade: 'Shopping Tijuca',
  data: '',
  hora: '',
  nome: '',
  telefone: '',
  obs: '',
  quando: 'na_hora',
  forma: 'pix',
};

// ---------- utilidades ----------
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

const brl = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 });

function hojeISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function dataBonita(iso) {
  if (!iso) return '';
  const [a, m, d] = iso.split('-').map(Number);
  const data = new Date(a, m - 1, d);
  const texto = data.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });
  return texto.replace(/\.?,/g, ',').replace(/\.$/, '');
}

function somenteDigitos(s) { return (s || '').replace(/\D/g, ''); }

function mascaraTelefone(valor) {
  const d = somenteDigitos(valor).slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

let toastTimer = null;
function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.remove('oculto');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add('oculto'), 3200);
}

// ---------- armazenamento ----------
function carregarAgendamentos() {
  try { return JSON.parse(localStorage.getItem(CHAVE_DADOS)) || []; }
  catch { return []; }
}

function salvarAgendamentos(lista) {
  localStorage.setItem(CHAVE_DADOS, JSON.stringify(lista));
}

// ---------- navegação entre telas ----------
function mostrarView(id) {
  $$('.view').forEach((v) => v.classList.add('oculto'));
  $(`#view-${id}`).classList.remove('oculto');
  window.scrollTo({ top: 0 });
}

function navegar(destino) {
  if (destino === 'admin') {
    if (sessionStorage.getItem(CHAVE_SESSAO_ADMIN) === 'ok') {
      renderizarAdmin();
      mostrarView('admin');
    } else {
      mostrarView('admin-pin');
      $('#campo-pin').value = '';
      $('#campo-pin').focus();
    }
    return;
  }
  if (destino === 'agendar') {
    irParaPasso(1);
    mostrarView('agendar');
    return;
  }
  mostrarView(destino);
}

// ---------- passo 1: serviços ----------
function renderizarCardapio() {
  const raiz = $('#lista-categorias');
  raiz.innerHTML = '';
  for (const cat of CATEGORIAS) {
    const sec = document.createElement('section');
    sec.className = 'categoria';
    const cabeca = document.createElement('h3');
    cabeca.className = 'categoria-cabeca';
    cabeca.innerHTML = `<span class="icone" aria-hidden="true">${cat.icone}</span>${cat.nome}`;
    sec.appendChild(cabeca);

    for (const s of cat.servicos) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'servico';
      btn.dataset.id = s.id;
      btn.setAttribute('aria-pressed', estado.selecionados.has(s.id) ? 'true' : 'false');
      const prefixo = s.aPartirDe ? '<small>a partir de </small>' : '';
      const nota = s.nota ? `<em>${s.nota}</em>` : '';
      btn.innerHTML = `
        <span class="marcador" aria-hidden="true">✓</span>
        <span class="nome">${s.nome}${nota}</span>
        <span class="pontilhado" aria-hidden="true"></span>
        <span class="preco">${prefixo}${brl(s.preco)}</span>`;
      btn.addEventListener('click', () => {
        if (estado.selecionados.has(s.id)) estado.selecionados.delete(s.id);
        else estado.selecionados.add(s.id);
        btn.setAttribute('aria-pressed', estado.selecionados.has(s.id) ? 'true' : 'false');
        atualizarBarra();
      });
      sec.appendChild(btn);
    }
    raiz.appendChild(sec);
  }
}

function servicosSelecionados() {
  return TODOS_SERVICOS.filter((s) => estado.selecionados.has(s.id));
}

function totalSelecionado() {
  return servicosSelecionados().reduce((soma, s) => soma + s.preco, 0);
}

// ---------- passo 2: data e horário ----------
function gerarHorarios(dataISO) {
  const [a, m, d] = dataISO.split('-').map(Number);
  const diaSemana = new Date(a, m - 1, d).getDay();
  const inicio = diaSemana === 0 ? 13 * 60 : 10 * 60;      // domingo abre 13h
  const fim = diaSemana === 0 ? 21 * 60 : 22 * 60;          // último horário 30min antes de fechar
  const horarios = [];
  for (let min = inicio; min <= fim - 30; min += 30) {
    horarios.push(`${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`);
  }
  return horarios;
}

function vagasOcupadas(dataISO, hora, unidade) {
  return carregarAgendamentos().filter(
    (ag) => ag.data === dataISO && ag.hora === hora && ag.unidade === unidade && ag.status !== 'cancelado'
  ).length;
}

function renderizarHorarios() {
  const grade = $('#grade-horarios');
  const dica = $('#dica-horario');
  grade.innerHTML = '';
  if (!estado.data) {
    dica.textContent = 'Escolha um dia para ver os horários disponíveis.';
    dica.classList.remove('oculto');
    return;
  }
  const agora = new Date();
  const ehHoje = estado.data === hojeISO();
  let algumLivre = false;

  for (const hora of gerarHorarios(estado.data)) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'horario';
    btn.textContent = hora;
    const [h, min] = hora.split(':').map(Number);
    const jaPassou = ehHoje && (h * 60 + min) <= (agora.getHours() * 60 + agora.getMinutes());
    const lotado = vagasOcupadas(estado.data, hora, estado.unidade) >= VAGAS_POR_HORARIO;
    if (jaPassou || lotado) {
      btn.disabled = true;
      btn.title = lotado ? 'Horário lotado' : 'Horário já passou';
    } else {
      algumLivre = true;
    }
    btn.setAttribute('aria-pressed', estado.hora === hora ? 'true' : 'false');
    btn.addEventListener('click', () => {
      estado.hora = hora;
      renderizarHorarios();
      atualizarBarra();
    });
    grade.appendChild(btn);
  }

  dica.textContent = algumLivre ? '' : 'Nenhum horário livre neste dia — tente outra data.';
  dica.classList.toggle('oculto', algumLivre);
}

// ---------- passo 4: pagamento ----------
function atualizarOpcoesPagamento() {
  const antecipado = estado.quando === 'antecipado';
  const opDinheiro = $('#opcao-dinheiro');
  opDinheiro.classList.toggle('desativada', antecipado);
  if (antecipado && estado.forma === 'dinheiro') {
    estado.forma = 'pix';
    $('#opcoes-forma input[value="pix"]').checked = true;
  }
  $('#aviso-antecipado').classList.toggle('oculto', !antecipado);
}

function renderizarResumoFinal() {
  const alvo = $('#resumo-final');
  const linhas = servicosSelecionados()
    .map((s) => `
      <div class="linha-resumo">
        <span>${s.nome}</span>
        <span class="pontilhado" aria-hidden="true"></span>
        <span class="valor">${s.aPartirDe ? 'a partir de ' : ''}${brl(s.preco)}</span>
      </div>`)
    .join('');
  const temAPartirDe = servicosSelecionados().some((s) => s.aPartirDe);
  alvo.innerHTML = `
    <h3>Resumo</h3>
    ${linhas}
    <div class="linha-resumo total">
      <span>Total${temAPartirDe ? ' estimado' : ''}</span>
      <span class="pontilhado" aria-hidden="true"></span>
      <span class="valor">${brl(totalSelecionado())}</span>
    </div>
    <p class="resumo-meta">
      <strong>${dataBonita(estado.data)}</strong> às <strong>${estado.hora}</strong> · ${estado.unidade}<br />
      ${estado.nome} · ${estado.telefone}
    </p>`;
}

// ---------- wizard ----------
function irParaPasso(n) {
  estado.passo = n;
  $$('.passo-painel').forEach((p) => p.classList.add('oculto'));
  $(`#passo-${n}`).classList.remove('oculto');
  $$('.passos li').forEach((li) => {
    const num = Number(li.dataset.passo);
    li.classList.toggle('ativo', num === n);
    li.classList.toggle('feito', num < n);
  });
  if (n === 2) renderizarHorarios();
  if (n === 4) { atualizarOpcoesPagamento(); renderizarResumoFinal(); }
  atualizarBarra();
  window.scrollTo({ top: 0 });
}

function validarPasso(n, silencioso = false) {
  if (n === 1 && estado.selecionados.size === 0) {
    if (!silencioso) toast('Escolha pelo menos um serviço para continuar.');
    return false;
  }
  if (n === 2) {
    if (!estado.data) { if (!silencioso) toast('Escolha o dia do atendimento.'); return false; }
    if (estado.data < hojeISO()) { if (!silencioso) toast('Essa data já passou — escolha outro dia.'); return false; }
    if (!estado.hora) { if (!silencioso) toast('Escolha um horário.'); return false; }
  }
  if (n === 3) {
    if (estado.nome.trim().length < 3) { if (!silencioso) toast('Digite seu nome completo.'); return false; }
    if (somenteDigitos(estado.telefone).length < 10) { if (!silencioso) toast('Digite um telefone válido com DDD.'); return false; }
  }
  return true;
}

function atualizarBarra() {
  const total = totalSelecionado();
  const qtd = estado.selecionados.size;
  const barra = $('#barra-total');
  if (qtd === 0) {
    barra.innerHTML = 'Nenhum serviço escolhido';
  } else {
    barra.innerHTML = `${qtd} ${qtd === 1 ? 'serviço' : 'serviços'}<strong>${brl(total)}</strong>`;
  }
  const btn = $('#btn-avancar');
  btn.textContent = estado.passo === 4 ? 'Confirmar agendamento' : 'Continuar';
  $('#btn-voltar').classList.toggle('oculto', estado.passo === 1);
}

function avancar() {
  if (!validarPasso(estado.passo)) return;
  if (estado.passo < 4) {
    irParaPasso(estado.passo + 1);
    return;
  }
  confirmarAgendamento();
}

function confirmarAgendamento() {
  // revalida tudo antes de gravar
  for (let n = 1; n <= 3; n++) {
    if (!validarPasso(n)) { irParaPasso(n); return; }
  }
  if (vagasOcupadas(estado.data, estado.hora, estado.unidade) >= VAGAS_POR_HORARIO) {
    toast('Esse horário acabou de lotar — escolha outro, por favor.');
    irParaPasso(2);
    return;
  }

  const agendamento = {
    id: `ag-${Date.now()}-${Math.floor(Math.random() * 1e4)}`,
    criadoEm: new Date().toISOString(),
    nome: estado.nome.trim(),
    telefone: estado.telefone,
    unidade: estado.unidade,
    data: estado.data,
    hora: estado.hora,
    servicos: servicosSelecionados().map((s) => ({ nome: s.nome, preco: s.preco, aPartirDe: !!s.aPartirDe })),
    total: totalSelecionado(),
    obs: estado.obs.trim(),
    pagamento: {
      quando: estado.quando,
      forma: estado.forma,
      status: 'pendente', // o salão marca como pago na central
    },
    status: 'pendente',
  };

  const lista = carregarAgendamentos();
  lista.push(agendamento);
  salvarAgendamentos(lista);
  renderizarSucesso(agendamento);
  mostrarView('sucesso');
}

// ---------- sucesso ----------
function renderizarSucesso(ag) {
  const linhas = ag.servicos
    .map((s) => `
      <div class="linha-resumo">
        <span>${s.nome}</span>
        <span class="pontilhado" aria-hidden="true"></span>
        <span class="valor">${s.aPartirDe ? 'a partir de ' : ''}${brl(s.preco)}</span>
      </div>`)
    .join('');
  const temAPartirDe = ag.servicos.some((s) => s.aPartirDe);
  $('#cartao-sucesso').innerHTML = `
    <h3>${dataBonita(ag.data)} · ${ag.hora}</h3>
    ${linhas}
    <div class="linha-resumo total">
      <span>Total${temAPartirDe ? ' estimado' : ''}</span>
      <span class="pontilhado" aria-hidden="true"></span>
      <span class="valor">${brl(ag.total)}</span>
    </div>
    <p class="resumo-meta">
      <strong>${ag.unidade}</strong><br />
      ${ag.nome} · ${ag.telefone}<br />
      ${LABEL_QUANDO[ag.pagamento.quando]} · ${LABEL_FORMA[ag.pagamento.forma]}
    </p>`;

  const texto = [
    'Olá! Acabei de agendar no Nails & More Salon 💅',
    `• ${dataBonita(ag.data)} às ${ag.hora} — ${ag.unidade}`,
    `• ${ag.servicos.map((s) => s.nome).join(', ')}`,
    `• Total${temAPartirDe ? ' estimado' : ''}: ${brl(ag.total)}`,
    `• Pagamento: ${LABEL_QUANDO[ag.pagamento.quando]} (${LABEL_FORMA[ag.pagamento.forma]})`,
    `• Nome: ${ag.nome} · ${ag.telefone}`,
  ].join('\n');
  $('#btn-whats-sucesso').href = `https://wa.me/?text=${encodeURIComponent(texto)}`;

  // recomeça o formulário para um próximo agendamento
  estado.selecionados.clear();
  estado.hora = '';
  estado.obs = '';
  $('#campo-obs').value = '';
  renderizarCardapio();
}

// ---------- central do salão ----------
function agendamentosOrdenados() {
  return carregarAgendamentos().sort((a, b) =>
    (a.data + a.hora).localeCompare(b.data + b.hora) || a.criadoEm.localeCompare(b.criadoEm)
  );
}

function renderizarStats(lista) {
  const hoje = hojeISO();
  const deHoje = lista.filter((ag) => ag.data === hoje && ag.status !== 'cancelado');
  const proximos = lista.filter((ag) => ag.data >= hoje && (ag.status === 'pendente' || ag.status === 'confirmado'));
  const receitaHoje = deHoje.reduce((soma, ag) => soma + ag.total, 0);
  const aReceber = lista.filter((ag) => ag.status !== 'cancelado' && ag.pagamento.status !== 'pago');
  $('#painel-stats').innerHTML = `
    <div class="stat"><b>${deHoje.length}</b><span>hoje</span></div>
    <div class="stat"><b>${proximos.length}</b><span>próximos</span></div>
    <div class="stat"><b>${brl(receitaHoje)}</b><span>previsto hoje</span></div>
    <div class="stat"><b>${aReceber.length}</b><span>pagamentos em aberto</span></div>`;
}

function renderizarAdmin() {
  const todas = agendamentosOrdenados();
  renderizarStats(todas);

  const busca = $('#filtro-busca').value.trim().toLowerCase();
  const dataFiltro = $('#filtro-data').value;
  const statusFiltro = $('#filtro-status').value;

  const filtradas = todas.filter((ag) => {
    if (busca && !ag.nome.toLowerCase().includes(busca) && !somenteDigitos(ag.telefone).includes(somenteDigitos(busca))) return false;
    if (dataFiltro && ag.data !== dataFiltro) return false;
    if (statusFiltro && ag.status !== statusFiltro) return false;
    return true;
  });

  const raiz = $('#lista-agendamentos');
  raiz.innerHTML = '';

  if (filtradas.length === 0) {
    const temDados = todas.length > 0;
    raiz.innerHTML = `
      <div class="vazio">
        <div class="hero-flor" aria-hidden="true"></div>
        <p>${temDados ? 'Nenhum agendamento com esses filtros.' : 'Ainda não há agendamentos por aqui.'}</p>
        ${temDados ? '' : '<button class="btn btn-fantasma" id="btn-exemplos" type="button">Carregar dados de exemplo</button>'}
      </div>`;
    const btnEx = $('#btn-exemplos');
    if (btnEx) btnEx.addEventListener('click', carregarExemplos);
    return;
  }

  for (const ag of filtradas) {
    const card = document.createElement('article');
    card.className = 'cartao-agendamento';

    const linhasServicos = ag.servicos
      .map((s) => `
        <div class="linha-resumo">
          <span>${s.nome}</span>
          <span class="pontilhado" aria-hidden="true"></span>
          <span class="valor">${s.aPartirDe ? 'a partir de ' : ''}${brl(s.preco)}</span>
        </div>`)
      .join('');

    const pagBadge = ag.pagamento.status === 'pago'
      ? '<span class="badge badge-pago">Pago</span>'
      : '<span class="badge badge-apagar">A receber</span>';

    const fone = somenteDigitos(ag.telefone);
    const linkWhats = `https://wa.me/55${fone}?text=${encodeURIComponent(`Olá, ${ag.nome.split(' ')[0]}! Aqui é do Nails & More Salon, sobre seu horário de ${dataBonita(ag.data)} às ${ag.hora} 💅`)}`;

    card.innerHTML = `
      <div class="ag-topo">
        <span class="ag-nome">${ag.nome}</span>
        <span class="ag-quando">${dataBonita(ag.data)} · ${ag.hora} · ${ag.unidade}</span>
        <span class="ag-badges">
          <span class="badge badge-${ag.status}">${LABEL_STATUS[ag.status]}</span>
          ${pagBadge}
        </span>
      </div>
      <div class="ag-detalhes">
        ${linhasServicos}
        <div class="linha-resumo total">
          <span>Total</span>
          <span class="pontilhado" aria-hidden="true"></span>
          <span class="valor">${brl(ag.total)}</span>
        </div>
        <div class="ag-contato">
          <span>📞 <a href="tel:+55${fone}">${ag.telefone}</a></span>
          <span>💬 <a href="${linkWhats}" target="_blank" rel="noopener">Chamar no WhatsApp</a></span>
          <span>💳 ${LABEL_QUANDO[ag.pagamento.quando]} · <strong>${LABEL_FORMA[ag.pagamento.forma]}</strong></span>
        </div>
        ${ag.obs ? `<p class="ag-obs">“${ag.obs}”</p>` : ''}
      </div>
      <div class="ag-acoes"></div>`;

    const acoes = card.querySelector('.ag-acoes');
    const addAcao = (rotulo, classe, fn) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = `btn-mini ${classe}`;
      b.textContent = rotulo;
      b.addEventListener('click', fn);
      acoes.appendChild(b);
    };

    if (ag.status === 'pendente') addAcao('Confirmar', 'solido', () => mudarStatus(ag.id, 'confirmado'));
    if (ag.status === 'confirmado') addAcao('Concluir atendimento', 'verde', () => mudarStatus(ag.id, 'concluido'));
    if (ag.pagamento.status !== 'pago' && ag.status !== 'cancelado') {
      addAcao('Marcar como pago', '', () => marcarPago(ag.id, true));
    }
    if (ag.pagamento.status === 'pago') addAcao('Desfazer pagamento', '', () => marcarPago(ag.id, false));
    if (ag.status === 'pendente' || ag.status === 'confirmado') {
      addAcao('Cancelar', 'perigo', () => {
        if (confirm(`Cancelar o agendamento de ${ag.nome} (${dataBonita(ag.data)} às ${ag.hora})?`)) {
          mudarStatus(ag.id, 'cancelado');
        }
      });
    }

    raiz.appendChild(card);
  }
}

function mudarStatus(id, novo) {
  const lista = carregarAgendamentos();
  const ag = lista.find((a) => a.id === id);
  if (!ag) return;
  ag.status = novo;
  salvarAgendamentos(lista);
  renderizarAdmin();
  toast(`Agendamento de ${ag.nome.split(' ')[0]}: ${LABEL_STATUS[novo].toLowerCase()}.`);
}

function marcarPago(id, pago) {
  const lista = carregarAgendamentos();
  const ag = lista.find((a) => a.id === id);
  if (!ag) return;
  ag.pagamento.status = pago ? 'pago' : 'pendente';
  salvarAgendamentos(lista);
  renderizarAdmin();
  toast(pago ? `Pagamento de ${ag.nome.split(' ')[0]} registrado (${LABEL_FORMA[ag.pagamento.forma]}).` : 'Pagamento desfeito.');
}

function exportarCSV() {
  const lista = agendamentosOrdenados();
  if (lista.length === 0) { toast('Nada para exportar ainda.'); return; }
  const cab = ['Data', 'Hora', 'Unidade', 'Cliente', 'Telefone', 'Serviços', 'Total (R$)', 'Quando paga', 'Forma', 'Pagamento', 'Status', 'Observações'];
  const linhas = lista.map((ag) => [
    ag.data, ag.hora, ag.unidade, ag.nome, ag.telefone,
    ag.servicos.map((s) => s.nome).join(' + '),
    String(ag.total).replace('.', ','),
    LABEL_QUANDO[ag.pagamento.quando], LABEL_FORMA[ag.pagamento.forma], ag.pagamento.status,
    LABEL_STATUS[ag.status], ag.obs || '',
  ]);
  const csv = [cab, ...linhas]
    .map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';'))
    .join('\r\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `agendamentos-nails-and-more-${hojeISO()}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function carregarExemplos() {
  const hoje = hojeISO();
  const amanha = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();
  const exemplos = [
    {
      nome: 'Mariana Duarte', telefone: '(21) 99876-1234', unidade: 'Shopping Tijuca',
      data: hoje, hora: '14:00',
      servicos: [{ nome: 'Mão e Pé', preco: 95 }, { nome: 'Esmaltação em Gel', preco: 109 }],
      obs: 'Prefere tons de nude.',
      pagamento: { quando: 'na_hora', forma: 'pix', status: 'pendente' }, status: 'confirmado',
    },
    {
      nome: 'Camila Rocha', telefone: '(21) 98765-4321', unidade: 'NorteShopping',
      data: hoje, hora: '16:30',
      servicos: [{ nome: 'Alongamento de Cílios', preco: 205, aPartirDe: true }],
      obs: '',
      pagamento: { quando: 'antecipado', forma: 'credito', status: 'pago' }, status: 'confirmado',
    },
    {
      nome: 'Beatriz Nunes', telefone: '(21) 97654-9870', unidade: 'Shopping Tijuca',
      data: amanha, hora: '10:30',
      servicos: [{ nome: 'Colocação', preco: 269 }, { nome: 'Nail Art', preco: 69 }],
      obs: 'Primeira vez no salão.',
      pagamento: { quando: 'na_hora', forma: 'dinheiro', status: 'pendente' }, status: 'pendente',
    },
  ].map((ex, i) => ({
    id: `ag-exemplo-${i}`,
    criadoEm: new Date().toISOString(),
    total: ex.servicos.reduce((s, x) => s + x.preco, 0),
    ...ex,
  }));
  salvarAgendamentos([...carregarAgendamentos(), ...exemplos]);
  renderizarAdmin();
  toast('Dados de exemplo carregados.');
}

// ---------- eventos ----------
function ligarEventos() {
  $$('[data-nav]').forEach((el) =>
    el.addEventListener('click', (ev) => {
      ev.preventDefault();
      navegar(el.dataset.nav);
    })
  );

  $('#btn-avancar').addEventListener('click', avancar);
  $('#btn-voltar').addEventListener('click', () => {
    if (estado.passo > 1) irParaPasso(estado.passo - 1);
  });

  const campoData = $('#campo-data');
  campoData.min = hojeISO();
  campoData.addEventListener('change', () => {
    estado.data = campoData.value;
    estado.hora = '';
    renderizarHorarios();
    atualizarBarra();
  });

  $('#campo-unidade').addEventListener('change', (ev) => {
    estado.unidade = ev.target.value;
    estado.hora = '';
    renderizarHorarios();
  });

  $('#campo-nome').addEventListener('input', (ev) => { estado.nome = ev.target.value; });
  $('#campo-obs').addEventListener('input', (ev) => { estado.obs = ev.target.value; });

  const campoTel = $('#campo-telefone');
  campoTel.addEventListener('input', () => {
    campoTel.value = mascaraTelefone(campoTel.value);
    estado.telefone = campoTel.value;
  });

  $('#opcoes-quando').addEventListener('change', (ev) => {
    estado.quando = ev.target.value;
    atualizarOpcoesPagamento();
  });
  $('#opcoes-forma').addEventListener('change', (ev) => {
    estado.forma = ev.target.value;
  });

  $('#form-pin').addEventListener('submit', (ev) => {
    ev.preventDefault();
    if ($('#campo-pin').value === PIN_ADMIN) {
      sessionStorage.setItem(CHAVE_SESSAO_ADMIN, 'ok');
      $('#erro-pin').classList.add('oculto');
      renderizarAdmin();
      mostrarView('admin');
    } else {
      $('#erro-pin').classList.remove('oculto');
      $('#campo-pin').value = '';
      $('#campo-pin').focus();
    }
  });

  $('#btn-sair-admin').addEventListener('click', () => {
    sessionStorage.removeItem(CHAVE_SESSAO_ADMIN);
    mostrarView('home');
  });

  $('#btn-exportar').addEventListener('click', exportarCSV);
  ['#filtro-busca', '#filtro-data', '#filtro-status'].forEach((sel) =>
    $(sel).addEventListener('input', renderizarAdmin)
  );
  $('#btn-limpar-filtros').addEventListener('click', () => {
    $('#filtro-busca').value = '';
    $('#filtro-data').value = '';
    $('#filtro-status').value = '';
    renderizarAdmin();
  });
}

// ---------- início ----------
renderizarCardapio();
ligarEventos();
atualizarBarra();
mostrarView('home');
