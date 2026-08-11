/* ============================================================
   Nails & More Salon — app de agendamentos (v2)
   Preços transcritos do cardápio oficial do salão.

   Modo online: fala com a API (/api/*, Netlify Functions + Blobs) —
   agendamentos de qualquer celular chegam à Central do salão.
   Sem API (arquivo local / demo), cai no modo local (localStorage).
   ============================================================ */

'use strict';

// ---------- cardápio (preço em R$, dur em minutos) ----------
const CATEGORIAS = [
  {
    id: 'maos-pes',
    nome: 'Embelezamento · Mãos & Pés',
    icone: '🖐',
    servicos: [
      { id: 'mao', nome: 'Mão', preco: 49, dur: 40 },
      { id: 'pe', nome: 'Pé', preco: 55, dur: 45 },
      { id: 'mao-pe', nome: 'Mão e Pé', preco: 95, dur: 80 },
      { id: 'motor-pedicure', nome: 'Motor Pedicure', preco: 9, dur: 15 },
      { id: 'esfoliacao', nome: 'Esfoliação — Granado', preco: 25, dur: 15 },
      { id: 'hidratacao', nome: 'Hidratação — Granado', preco: 25, dur: 15 },
      { id: 'massagem-pernas', nome: 'Massagem Pernas & Pés Cansados — Granado', preco: 37, dur: 20 },
      { id: 'adicional-francesinha', nome: 'Adicional de Francesinha', preco: 5, dur: 10 },
      { id: 'esmaltar', nome: 'Esmaltar', preco: 29, dur: 20 },
      { id: 'cortar', nome: 'Cortar', preco: 29, dur: 15 },
      { id: 'decorada', nome: 'Decorada', preco: 69, dur: 30 },
    ],
  },
  {
    id: 'nail-designer',
    nome: 'Nail Designer & Alongamento',
    icone: '💅',
    servicos: [
      { id: 'colocacao', nome: 'Colocação', preco: 269, dur: 150, nota: 'Cutilagem com esmaltação tradicional' },
      { id: 'manutencao', nome: 'Manutenção', preco: 175, dur: 120 },
      { id: 'banho-gel', nome: 'Banho de Gel', preco: 135, dur: 90 },
      { id: 'banho-calcio', nome: 'Banho de Cálcio — Cuccio', preco: 119, dur: 90 },
      { id: 'nail-art', nome: 'Nail Art', preco: 69, dur: 30 },
      { id: 'decoracao-unitaria', nome: 'Decoração Unitária', preco: 9, dur: 10 },
      { id: 'reposicao-unitaria', nome: 'Reposição Unitária', preco: 25, dur: 20 },
      { id: 'francesinha-gel', nome: 'Francesinha Gel', preco: 35, dur: 15 },
      { id: 'esmaltacao-gel', nome: 'Esmaltação em Gel', preco: 109, dur: 60 },
      { id: 'mudanca-formato', nome: 'Mudança de Formato', preco: 35, dur: 20 },
      { id: 'reducao-tamanho', nome: 'Redução de Tamanho', preco: 25, dur: 15 },
      { id: 'remocao-gel', nome: 'Remoção — Esmaltação em Gel', preco: 35, dur: 30 },
      { id: 'remocao-alongamento', nome: 'Remoção — Alongamento', preco: 49, dur: 45 },
      { id: 'aplicacao-express', nome: 'Aplicação Express', preco: 129, dur: 90 },
    ],
  },
  {
    id: 'olhar',
    nome: 'Embelezamento do Olhar',
    icone: '👁',
    servicos: [
      { id: 'alongamento-cilios', nome: 'Alongamento de Cílios', preco: 205, dur: 120, aPartirDe: true },
      { id: 'manutencao-cilios', nome: 'Manutenção de Cílios', preco: 125, dur: 90, aPartirDe: true },
      { id: 'retirada-cilios', nome: 'Retirada de Cílios', preco: 65, dur: 30 },
      { id: 'sobrancelha', nome: 'Sobrancelha', preco: 65, dur: 30 },
      { id: 'tintura-sobrancelha', nome: 'Tintura de Sobrancelha', preco: 45, dur: 30 },
      { id: 'depilacao-buco', nome: 'Depilação de Buço/Queixo', preco: 29, dur: 15 },
      { id: 'depilacao-rosto', nome: 'Depilação de Rosto', preco: 89, dur: 30 },
      { id: 'lash-lifting', nome: 'Lash Lifting', preco: 169, dur: 60 },
      { id: 'brow-lamination', nome: 'Brow Lamination', preco: 159, dur: 60 },
    ],
  },
  {
    id: 'spa',
    nome: 'Spa & Experiência',
    icone: '🌸',
    servicos: [
      { id: 'spa-pes', nome: 'Spa dos Pés — Avatim', preco: 105, dur: 60, nota: 'Cutilagem com esmaltação tradicional' },
      { id: 'spa-vip', nome: 'Spa VIP — Cuccio', preco: 129, dur: 75, nota: 'Cutilagem com esmaltação tradicional' },
      { id: 'spa-maos', nome: 'Spa das Mãos', preco: 85, dur: 50, nota: 'Cutilagem com esmaltação tradicional' },
      { id: 'ofuroterapia', nome: 'Ofuroterapia', preco: 149, dur: 60, nota: 'Cutilagem com esmaltação tradicional' },
    ],
  },
  {
    id: 'hair',
    nome: 'Hair & Tratamentos',
    icone: '💇‍♀️',
    servicos: [
      { id: 'corte-feminino', nome: 'Corte Feminino + Finalização', preco: 249, dur: 60, aPartirDe: true },
      { id: 'corte-masculino', nome: 'Corte Masculino', preco: 120, dur: 40 },
      { id: 'corte-franja', nome: 'Corte de Franja', preco: 130, dur: 20 },
      { id: 'alinhamento', nome: 'Alinhamento Capilar', preco: 499, dur: 180, aPartirDe: true },
      { id: 'tratamento-spa', nome: 'Tratamento SPA', preco: 279, dur: 90, aPartirDe: true },
      { id: 'tratamento-shampoo', nome: 'Tratamento (Shampoo + Escova)', preco: 179, dur: 60, aPartirDe: true },
      { id: 'coloracao', nome: 'Coloração', preco: 249, dur: 120, aPartirDe: true },
      { id: 'aplicacao-coloracao', nome: 'Aplicação de Coloração', preco: 159, dur: 90 },
      { id: 'mechas', nome: 'Mechas (Com Plex) + Tratamento + Finalização', preco: 799, dur: 240, aPartirDe: true },
      { id: 'escova', nome: 'Escova', preco: 89, dur: 45, aPartirDe: true },
      { id: 'secagem', nome: 'Secagem', preco: 49, dur: 30 },
      { id: 'piastra', nome: 'Adicional Piastra/Baby Liss', preco: 49, dur: 20, aPartirDe: true },
    ],
  },
  {
    id: 'combos',
    nome: 'Combos & Pacotes',
    icone: '🎁',
    servicos: [
      { id: 'combo-gel', nome: 'Mão e Pé + Esmaltação em Gel', preco: 184, de: 204, dur: 140, combo: true, catRef: ['maos-pes', 'nail-designer'] },
      { id: 'combo-spa-maos', nome: 'Mão e Pé + Spa das Mãos', preco: 165, de: 180, dur: 130, combo: true, catRef: ['maos-pes', 'spa'] },
      { id: 'combo-olhar', nome: 'Sobrancelha + Depilação de Buço', preco: 84, de: 94, dur: 45, combo: true, catRef: ['olhar'] },
    ],
  },
];

const TODOS_SERVICOS = CATEGORIAS.flatMap((c) => c.servicos.map((s) => ({ ...s, categoria: c.id })));
const UPSELL_IDS = ['adicional-francesinha', 'motor-pedicure', 'esfoliacao', 'hidratacao', 'massagem-pernas', 'decoracao-unitaria'];
const CATEGORIAS_TRABALHO = CATEGORIAS.filter((c) => c.id !== 'combos');

const LABEL_FORMA = { pix: 'Pix', credito: 'Cartão de crédito', debito: 'Cartão de débito', dinheiro: 'Dinheiro' };
const LABEL_QUANDO = { na_hora: 'Pagar na hora', antecipado: 'Pagamento antecipado' };
const LABEL_STATUS = { pendente: 'Aguardando confirmação', confirmado: 'Confirmado', concluido: 'Concluído', cancelado: 'Cancelado' };
const UNIDADES = ['Shopping Tijuca', 'NorteShopping', 'Shopping Metropolitano'];

const CHAVE_DADOS = 'nm_agendamentos';
const CHAVE_EQUIPE = 'nm_equipe';
const CHAVE_BLOQUEIOS = 'nm_bloqueios';
const CHAVE_ULTIMO = 'nm_ultimo';
const CHAVE_PIN_SESSAO = 'nm_admin_pin';
const PIN_LOCAL = '2016';
const VAGAS_SEM_EQUIPE = 3;
const SELOS_META = 10;
const LINK_AVALIACAO = 'https://www.google.com/search?q=Nails+%26+More+Salon+Rio+de+Janeiro+avalia%C3%A7%C3%B5es';

// ---------- modo online ----------
const api = { online: false, pixOnline: false };

async function detectarAPI() {
  if (location.protocol === 'file:') return;
  try {
    const r = await fetch('/api/ping');
    if (r.ok) {
      const corpo = await r.json();
      api.online = true;
      api.pixOnline = !!corpo.pixOnline;
    }
  } catch {
    api.online = false;
  }
}

function pinSessao() { return sessionStorage.getItem(CHAVE_PIN_SESSAO) || ''; }

// ---------- estado ----------
const estado = {
  passo: 1,
  selecionados: new Set(),
  unidade: 'Shopping Tijuca',
  profissionalId: '',
  data: '',
  hora: '',
  nome: '',
  telefone: '',
  obs: '',
  quando: 'na_hora',
  forma: 'pix',
  horasLivres: [],
  equipeUnidade: [],
};

let listaCache = [];
let fidelidadeCache = {};
let equipeCache = [];
let bloqueiosCache = [];
let idsConhecidos = null;    // para detectar agendamento novo e tocar o sino
let pollAdmin = null;
let abaAtiva = 'agendamentos';

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

const minutosDe = (hora) => { const [h, m] = hora.split(':').map(Number); return h * 60 + m; };
const sobrepoe = (aIni, aFim, bIni, bFim) => aIni < bFim && bIni < aFim;
const normalizarDuracao = (n) => Math.min(480, Math.max(30, Math.ceil((Number(n) || 30) / 30) * 30));

function duracaoBonita(min) {
  const h = Math.floor(min / 60), m = min % 60;
  if (h === 0) return `${m}min`;
  return m === 0 ? `${h}h` : `${h}h${m}`;
}

let toastTimer = null;
function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.remove('oculto');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add('oculto'), 3200);
}

// ---------- armazenamento local (modo demo/offline) ----------
function lerLocal(chave, padrao) {
  try { return JSON.parse(localStorage.getItem(chave)) ?? padrao; }
  catch { return padrao; }
}
const salvarLocal = (chave, valor) => localStorage.setItem(chave, JSON.stringify(valor));

// ---------- lógica de agenda (espelho local da API) ----------
function gerarHorarios(dataISO) {
  const [a, m, d] = dataISO.split('-').map(Number);
  const diaSemana = new Date(a, m - 1, d).getDay();
  const inicio = diaSemana === 0 ? 13 * 60 : 10 * 60;
  const fim = diaSemana === 0 ? 21 * 60 : 22 * 60;
  const horarios = [];
  for (let min = inicio; min <= fim - 30; min += 30) {
    horarios.push(`${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`);
  }
  return horarios;
}

const intervaloDe = (ag) => {
  const ini = minutosDe(ag.hora);
  return [ini, ini + normalizarDuracao(ag.duracao || 30)];
};

function bloqueiaLocal(bloqueios, unidade, data, ini, fim, profissionalId) {
  return bloqueios.some((bl) => {
    if (bl.unidade !== unidade || bl.data !== data) return false;
    if (bl.profissionalId && bl.profissionalId !== profissionalId) return false;
    return sobrepoe(ini, fim, minutosDe(bl.inicio), minutosDe(bl.fim));
  });
}

function horasLivresLocal({ data, unidade, dur, profissionalId }) {
  const ags = lerLocal(CHAVE_DADOS, []);
  const equipe = lerLocal(CHAVE_EQUIPE, []);
  const bloqueios = lerLocal(CHAVE_BLOQUEIOS, []);
  const grade = gerarHorarios(data);
  const duracao = normalizarDuracao(dur);
  const fechamento = minutosDe(grade[grade.length - 1]) + 30;
  const doDia = ags.filter((ag) => ag.data === data && ag.unidade === unidade && ag.status !== 'cancelado');
  const profs = equipe.filter((p) => p.ativo !== false && (p.unidades || []).includes(unidade));

  const livres = [];
  for (const hora of grade) {
    const ini = minutosDe(hora);
    const fim = ini + duracao;
    if (fim > fechamento) continue;

    if (profs.length > 0) {
      const candidatos = profissionalId ? profs.filter((p) => p.id === profissionalId) : profs;
      const alguemLivre = candidatos.some((p) => {
        if (bloqueiaLocal(bloqueios, unidade, data, ini, fim, p.id)) return false;
        return !doDia.some((ag) => {
          if (ag.profissionalId !== p.id) return false;
          const [aIni, aFim] = intervaloDe(ag);
          return sobrepoe(ini, fim, aIni, aFim);
        });
      });
      if (alguemLivre) livres.push(hora);
    } else {
      if (bloqueiaLocal(bloqueios, unidade, data, ini, fim, null)) continue;
      let cabe = true;
      for (let b = ini; b < fim; b += 30) {
        const ocupadas = doDia.filter((ag) => {
          const [aIni, aFim] = intervaloDe(ag);
          return sobrepoe(b, b + 30, aIni, aFim);
        }).length;
        if (ocupadas >= VAGAS_SEM_EQUIPE) { cabe = false; break; }
      }
      if (cabe) livres.push(hora);
    }
  }
  return livres;
}

function escolherProfissionalLocal({ data, unidade, hora, dur, profissionalId }) {
  const equipe = lerLocal(CHAVE_EQUIPE, []);
  const bloqueios = lerLocal(CHAVE_BLOQUEIOS, []);
  const profs = equipe.filter((p) => p.ativo !== false && (p.unidades || []).includes(unidade));
  if (profs.length === 0) return { id: null, nome: null };

  const ini = minutosDe(hora);
  const fim = ini + normalizarDuracao(dur);
  const doDia = lerLocal(CHAVE_DADOS, []).filter((ag) => ag.data === data && ag.unidade === unidade && ag.status !== 'cancelado');

  const livres = (profissionalId ? profs.filter((p) => p.id === profissionalId) : profs).filter((p) => {
    if (bloqueiaLocal(bloqueios, unidade, data, ini, fim, p.id)) return false;
    return !doDia.some((ag) => {
      if (ag.profissionalId !== p.id) return false;
      const [aIni, aFim] = intervaloDe(ag);
      return sobrepoe(ini, fim, aIni, aFim);
    });
  });
  if (livres.length === 0) return null;
  return { id: livres[0].id, nome: livres[0].nome };
}

function fidelidadeLocal(telefone) {
  const tel = somenteDigitos(telefone);
  const concluidos = lerLocal(CHAVE_DADOS, []).filter(
    (ag) => somenteDigitos(ag.telefone) === tel && ag.status === 'concluido'
  ).length;
  return {
    concluidos,
    selos: concluidos % SELOS_META,
    faltam: SELOS_META - (concluidos % SELOS_META),
    meta: SELOS_META,
    temBrinde: concluidos > 0 && concluidos % SELOS_META === 0,
  };
}

// ---------- navegação entre telas ----------
function mostrarView(id) {
  $$('.view').forEach((v) => v.classList.add('oculto'));
  $(`#view-${id}`).classList.remove('oculto');
  window.scrollTo({ top: 0 });

  clearInterval(pollAdmin);
  if (id === 'admin') {
    pollAdmin = setInterval(() => atualizarDadosAdmin(true), 25000);
  }
}

function navegar(destino) {
  if (destino === 'admin') {
    if (pinSessao()) {
      atualizarDadosAdmin();
      carregarConfigAdmin();
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
      sec.appendChild(botaoServico(s));
    }
    raiz.appendChild(sec);
  }
}

function botaoServico(s) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'servico';
  btn.dataset.id = s.id;
  btn.setAttribute('aria-pressed', estado.selecionados.has(s.id) ? 'true' : 'false');
  const prefixo = s.aPartirDe ? '<small>a partir de </small>' : '';
  const notas = [];
  if (s.de) notas.push(`de ${brl(s.de)} — economize ${brl(s.de - s.preco)}`);
  if (s.nota) notas.push(s.nota);
  const nota = notas.length ? `<em>${notas.join(' · ')}</em>` : '';
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
  return btn;
}

function servicosSelecionados() {
  return TODOS_SERVICOS.filter((s) => estado.selecionados.has(s.id));
}

const totalSelecionado = () => servicosSelecionados().reduce((soma, s) => soma + s.preco, 0);
const duracaoTotal = () => normalizarDuracao(servicosSelecionados().reduce((soma, s) => soma + (s.dur || 30), 0));

function categoriasNecessarias() {
  const cats = new Set();
  for (const s of servicosSelecionados()) {
    if (s.combo && s.catRef) s.catRef.forEach((c) => cats.add(c));
    else cats.add(s.categoria);
  }
  return cats;
}

// ---------- passo 2: unidade, profissional, data e horário ----------
async function carregarEquipeUnidade() {
  let equipe = [];
  if (api.online) {
    try {
      const r = await fetch(`/api/contexto?unidade=${encodeURIComponent(estado.unidade)}`);
      if (r.ok) equipe = (await r.json()).equipe || [];
    } catch { equipe = []; }
  } else {
    equipe = lerLocal(CHAVE_EQUIPE, [])
      .filter((p) => p.ativo !== false && (p.unidades || []).includes(estado.unidade))
      .map((p) => ({ id: p.id, nome: p.nome, categorias: p.categorias || [] }));
  }
  estado.equipeUnidade = equipe;

  const wrap = $('#campo-prof-wrap');
  const sel = $('#campo-profissional');
  if (equipe.length === 0) {
    wrap.classList.add('oculto');
    estado.profissionalId = '';
    return;
  }

  // mostra primeiro quem faz os serviços escolhidos
  const necessarias = categoriasNecessarias();
  const cobrem = equipe.filter((p) => [...necessarias].every((c) => (p.categorias || []).includes(c)));
  const lista = cobrem.length > 0 ? cobrem : equipe;

  sel.innerHTML = '<option value="">Sem preferência</option>' +
    lista.map((p) => `<option value="${p.id}">${p.nome}</option>`).join('');
  if (!lista.some((p) => p.id === estado.profissionalId)) estado.profissionalId = '';
  sel.value = estado.profissionalId;
  wrap.classList.remove('oculto');
}

async function carregarHorasLivres() {
  estado.horasLivres = [];
  if (!estado.data) return;
  const dur = duracaoTotal();
  if (api.online) {
    try {
      const qs = new URLSearchParams({
        data: estado.data, unidade: estado.unidade, dur: String(dur),
      });
      if (estado.profissionalId) qs.set('profissional', estado.profissionalId);
      const r = await fetch(`/api/disponibilidade?${qs}`);
      if (r.ok) estado.horasLivres = (await r.json()).horasLivres || [];
    } catch {
      toast('Sem conexão — tente de novo em instantes.');
    }
  } else {
    estado.horasLivres = horasLivresLocal({
      data: estado.data, unidade: estado.unidade, dur, profissionalId: estado.profissionalId || null,
    });
  }
}

function renderizarHorarios() {
  const grade = $('#grade-horarios');
  const dica = $('#dica-horario');
  $('#info-duracao').textContent = `Duração estimada do atendimento: ${duracaoBonita(duracaoTotal())}.`;
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
    const indisponivel = !estado.horasLivres.includes(hora);
    if (jaPassou || indisponivel) {
      btn.disabled = true;
      btn.title = jaPassou ? 'Horário já passou' : 'Horário indisponível';
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

async function recarregarHorarios() {
  await carregarHorasLivres();
  renderizarHorarios();
}

// ---------- passo 4: upsell e pagamento ----------
function renderizarUpsell() {
  const wrap = $('#upsell');
  const lista = $('#upsell-lista');
  const sugestoes = UPSELL_IDS
    .filter((id) => !estado.selecionados.has(id))
    .map((id) => TODOS_SERVICOS.find((s) => s.id === id))
    .filter(Boolean)
    .slice(0, 4);
  if (sugestoes.length === 0) {
    wrap.classList.add('oculto');
    return;
  }
  lista.innerHTML = '';
  for (const s of sugestoes) {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'upsell-chip';
    chip.innerHTML = `+ ${s.nome.replace(' — Granado', '')} <strong>${brl(s.preco)}</strong>`;
    chip.addEventListener('click', () => {
      estado.selecionados.add(s.id);
      toast(`${s.nome} adicionado ao seu atendimento.`);
      renderizarCardapio();
      renderizarUpsell();
      renderizarResumoFinal();
      atualizarBarra();
    });
    lista.appendChild(chip);
  }
  wrap.classList.remove('oculto');
}

function atualizarOpcoesPagamento() {
  const antecipado = estado.quando === 'antecipado';
  const opDinheiro = $('#opcao-dinheiro');
  opDinheiro.classList.toggle('desativada', antecipado);
  if (antecipado && estado.forma === 'dinheiro') {
    estado.forma = 'pix';
    $('#opcoes-forma input[value="pix"]').checked = true;
  }
  const aviso = $('#aviso-antecipado');
  aviso.textContent = api.pixOnline
    ? 'Escolhendo Pix, o código de pagamento aparece na tela assim que você confirmar.'
    : 'Após confirmar, o salão envia pelo WhatsApp as instruções para concluir o pagamento antecipado.';
  aviso.classList.toggle('oculto', !antecipado);
}

function linhasServicosHTML(servicos) {
  return servicos.map((s) => `
    <div class="linha-resumo">
      <span>${s.nome}</span>
      <span class="pontilhado" aria-hidden="true"></span>
      <span class="valor">${s.aPartirDe ? 'a partir de ' : ''}${brl(s.preco)}</span>
    </div>`).join('');
}

function renderizarResumoFinal() {
  const alvo = $('#resumo-final');
  const selecao = servicosSelecionados();
  const temAPartirDe = selecao.some((s) => s.aPartirDe);
  const prof = estado.equipeUnidade.find((p) => p.id === estado.profissionalId);
  alvo.innerHTML = `
    <h3>Resumo</h3>
    ${linhasServicosHTML(selecao)}
    <div class="linha-resumo total">
      <span>Total${temAPartirDe ? ' estimado' : ''}</span>
      <span class="pontilhado" aria-hidden="true"></span>
      <span class="valor">${brl(totalSelecionado())}</span>
    </div>
    <p class="resumo-meta">
      <strong>${dataBonita(estado.data)}</strong> às <strong>${estado.hora}</strong> · ${estado.unidade}<br />
      ${prof ? `Com ${prof.nome} · ` : ''}Duração aproximada: ${duracaoBonita(duracaoTotal())}<br />
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
  if (n === 2) { carregarEquipeUnidade().then(recarregarHorarios); }
  if (n === 4) { renderizarUpsell(); atualizarOpcoesPagamento(); renderizarResumoFinal(); }
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

function montarAgendamento() {
  return {
    nome: estado.nome.trim(),
    telefone: estado.telefone,
    unidade: estado.unidade,
    data: estado.data,
    hora: estado.hora,
    duracao: duracaoTotal(),
    profissionalId: estado.profissionalId || null,
    servicos: servicosSelecionados().map((s) => ({ nome: s.nome, preco: s.preco, aPartirDe: !!s.aPartirDe, combo: !!s.combo })),
    obs: estado.obs.trim(),
    pagamento: { quando: estado.quando, forma: estado.forma },
  };
}

function salvarUltimo(ag) {
  salvarLocal(CHAVE_ULTIMO, {
    nome: ag.nome,
    telefone: ag.telefone,
    unidade: ag.unidade,
    servicoIds: [...estado.selecionados],
  });
}

async function confirmarAgendamento() {
  for (let n = 1; n <= 3; n++) {
    if (!validarPasso(n)) { irParaPasso(n); return; }
  }

  const btn = $('#btn-avancar');
  btn.disabled = true;

  try {
    if (api.online) {
      const r = await fetch('/api/agendamentos', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(montarAgendamento()),
      });
      const corpo = await r.json().catch(() => ({}));
      if (r.status === 409) {
        toast(corpo.erro || 'Esse horário acabou de ficar indisponível — escolha outro.');
        irParaPasso(2);
        recarregarHorarios();
        return;
      }
      if (!r.ok) {
        toast(corpo.erro || 'Não foi possível agendar agora. Tente de novo.');
        return;
      }
      salvarUltimo(corpo.agendamento);
      renderizarSucesso(corpo.agendamento, corpo.fidelidade, corpo.pix);
      mostrarView('sucesso');
      return;
    }

    // modo local (demo)
    const dur = duracaoTotal();
    const livres = horasLivresLocal({
      data: estado.data, unidade: estado.unidade, dur, profissionalId: estado.profissionalId || null,
    });
    if (!livres.includes(estado.hora)) {
      toast('Esse horário acabou de ficar indisponível — escolha outro.');
      irParaPasso(2);
      recarregarHorarios();
      return;
    }
    const prof = escolherProfissionalLocal({
      data: estado.data, unidade: estado.unidade, hora: estado.hora, dur,
      profissionalId: estado.profissionalId || null,
    }) || { id: null, nome: null };

    const agendamento = {
      id: `ag-${Date.now()}-${Math.floor(Math.random() * 1e4)}`,
      criadoEm: new Date().toISOString(),
      ...montarAgendamento(),
      profissionalId: prof.id,
      profissional: prof.nome,
      total: totalSelecionado(),
      status: 'pendente',
      lembreteEnviado: false,
    };
    agendamento.pagamento.status = 'pendente';
    const lista = lerLocal(CHAVE_DADOS, []);
    lista.push(agendamento);
    salvarLocal(CHAVE_DADOS, lista);
    salvarUltimo(agendamento);
    renderizarSucesso(agendamento, fidelidadeLocal(agendamento.telefone), null);
    mostrarView('sucesso');
  } catch {
    toast('Sem conexão — verifique a internet e tente de novo.');
  } finally {
    btn.disabled = false;
  }
}

// ---------- sucesso ----------
function renderizarSucesso(ag, fidelidade, pix) {
  const temAPartirDe = ag.servicos.some((s) => s.aPartirDe);
  $('#cartao-sucesso').innerHTML = `
    <h3>${dataBonita(ag.data)} · ${ag.hora}</h3>
    ${linhasServicosHTML(ag.servicos)}
    <div class="linha-resumo total">
      <span>Total${temAPartirDe ? ' estimado' : ''}</span>
      <span class="pontilhado" aria-hidden="true"></span>
      <span class="valor">${brl(ag.total)}</span>
    </div>
    <p class="resumo-meta">
      <strong>${ag.unidade}</strong>${ag.profissional ? ` · com ${ag.profissional}` : ''}<br />
      ${ag.nome} · ${ag.telefone}<br />
      ${LABEL_QUANDO[ag.pagamento.quando]} · ${LABEL_FORMA[ag.pagamento.forma]}
    </p>`;

  // Pix na tela (quando o Mercado Pago está configurado no servidor)
  const pixBox = $('#pix-box');
  if (pix && pix.copiaECola) {
    $('#pix-codigo').value = pix.copiaECola;
    const img = $('#pix-qr');
    if (pix.qrCodeBase64) {
      img.src = `data:image/png;base64,${pix.qrCodeBase64}`;
      img.classList.remove('oculto');
    } else {
      img.classList.add('oculto');
    }
    pixBox.classList.remove('oculto');
  } else {
    pixBox.classList.add('oculto');
  }

  // fidelidade
  const fid = $('#fidelidade-msg');
  if (fidelidade && fidelidade.concluidos > 0) {
    fid.textContent = fidelidade.temBrinde
      ? '🎁 Você completou a cartela de fidelidade! Fale com o salão para resgatar seu brinde.'
      : `🌸 Fidelidade: você tem ${fidelidade.selos} de ${fidelidade.meta} selos — faltam ${fidelidade.faltam} atendimentos para o próximo brinde.`;
  } else {
    fid.textContent = `🌸 Programa de fidelidade: a cada ${SELOS_META} atendimentos concluídos, você ganha um brinde do salão.`;
  }

  const texto = [
    'Olá! Acabei de agendar no Nails & More Salon 💅',
    `• ${dataBonita(ag.data)} às ${ag.hora} — ${ag.unidade}`,
    ag.profissional ? `• Com ${ag.profissional}` : '',
    `• ${ag.servicos.map((s) => s.nome).join(', ')}`,
    `• Total${temAPartirDe ? ' estimado' : ''}: ${brl(ag.total)}`,
    `• Pagamento: ${LABEL_QUANDO[ag.pagamento.quando]} (${LABEL_FORMA[ag.pagamento.forma]})`,
    `• Nome: ${ag.nome} · ${ag.telefone}`,
  ].filter(Boolean).join('\n');
  $('#btn-whats-sucesso').href = `https://wa.me/?text=${encodeURIComponent(texto)}`;

  atualizarBotaoRebook();

  // recomeça o formulário para um próximo agendamento
  estado.selecionados.clear();
  estado.hora = '';
  estado.obs = '';
  $('#campo-obs').value = '';
  renderizarCardapio();
}

// ---------- repetir último atendimento ----------
function atualizarBotaoRebook() {
  const ultimo = lerLocal(CHAVE_ULTIMO, null);
  $('#rebook-wrap').classList.toggle('oculto', !ultimo || !ultimo.servicoIds?.length);
}

function repetirUltimo() {
  const ultimo = lerLocal(CHAVE_ULTIMO, null);
  if (!ultimo) return;
  estado.selecionados = new Set(ultimo.servicoIds.filter((id) => TODOS_SERVICOS.some((s) => s.id === id)));
  estado.nome = ultimo.nome || '';
  estado.telefone = ultimo.telefone || '';
  if (UNIDADES.includes(ultimo.unidade)) {
    estado.unidade = ultimo.unidade;
    $('#campo-unidade').value = ultimo.unidade;
  }
  $('#campo-nome').value = estado.nome;
  $('#campo-telefone').value = estado.telefone;
  renderizarCardapio();
  navegar('agendar');
  toast('Repetimos sua última seleção — é só escolher o dia e o horário.');
}

// ---------- central: dados ----------
async function obterLista() {
  if (api.online) {
    const r = await fetch('/api/agendamentos', { headers: { 'x-pin': pinSessao() } });
    if (r.status === 401) {
      sessionStorage.removeItem(CHAVE_PIN_SESSAO);
      mostrarView('admin-pin');
      throw new Error('pin');
    }
    if (!r.ok) throw new Error('http');
    const corpo = await r.json();
    fidelidadeCache = corpo.fidelidade || {};
    return corpo.agendamentos || [];
  }
  const lista = lerLocal(CHAVE_DADOS, []).sort((a, b) =>
    (a.data + a.hora).localeCompare(b.data + b.hora) || a.criadoEm.localeCompare(b.criadoEm)
  );
  fidelidadeCache = {};
  for (const ag of lista) {
    const tel = somenteDigitos(ag.telefone);
    if (!fidelidadeCache[tel]) fidelidadeCache[tel] = fidelidadeLocal(ag.telefone);
  }
  return lista;
}

async function atualizarDadosAdmin(silencioso = false) {
  try {
    const lista = await obterLista();
    // sino: detecta agendamentos que chegaram desde a última carga
    if (idsConhecidos) {
      const novos = lista.filter((ag) => !idsConhecidos.has(ag.id));
      if (novos.length > 0) {
        tocarSino();
        notificar(novos);
      }
    }
    idsConhecidos = new Set(lista.map((ag) => ag.id));
    listaCache = lista;
    renderizarListaAdmin();
    if (abaAtiva === 'relatorios') renderizarRelatorios();
  } catch (e) {
    if (e.message !== 'pin' && !silencioso) toast('Não foi possível carregar os agendamentos. Verifique a conexão.');
  }
}

async function carregarConfigAdmin() {
  if (api.online) {
    try {
      const [re, rb] = await Promise.all([
        fetch('/api/equipe', { headers: { 'x-pin': pinSessao() } }),
        fetch('/api/bloqueios', { headers: { 'x-pin': pinSessao() } }),
      ]);
      if (re.ok) equipeCache = (await re.json()).equipe || [];
      if (rb.ok) bloqueiosCache = (await rb.json()).bloqueios || [];
    } catch { /* mantém o cache atual */ }
  } else {
    equipeCache = lerLocal(CHAVE_EQUIPE, []);
    bloqueiosCache = lerLocal(CHAVE_BLOQUEIOS, []);
  }
  renderizarEquipe();
  renderizarBloqueios();
}

async function salvarEquipe() {
  if (api.online) {
    const r = await fetch('/api/equipe', {
      method: 'PUT',
      headers: { 'content-type': 'application/json', 'x-pin': pinSessao() },
      body: JSON.stringify({ equipe: equipeCache }),
    });
    if (!r.ok) { toast('Não foi possível salvar a equipe.'); return false; }
    equipeCache = (await r.json()).equipe;
  } else {
    salvarLocal(CHAVE_EQUIPE, equipeCache);
  }
  renderizarEquipe();
  return true;
}

async function salvarBloqueios() {
  if (api.online) {
    const r = await fetch('/api/bloqueios', {
      method: 'PUT',
      headers: { 'content-type': 'application/json', 'x-pin': pinSessao() },
      body: JSON.stringify({ bloqueios: bloqueiosCache }),
    });
    if (!r.ok) { toast('Não foi possível salvar o bloqueio.'); return false; }
    bloqueiosCache = (await r.json()).bloqueios;
  } else {
    salvarLocal(CHAVE_BLOQUEIOS, bloqueiosCache);
  }
  renderizarBloqueios();
  return true;
}

// ---------- central: sino e notificações ----------
function tocarSino() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const tocar = (freq, inicio, dur) => {
      const osc = ctx.createOscillator();
      const ganho = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      ganho.gain.setValueAtTime(0.001, ctx.currentTime + inicio);
      ganho.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + inicio + 0.02);
      ganho.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + inicio + dur);
      osc.connect(ganho).connect(ctx.destination);
      osc.start(ctx.currentTime + inicio);
      osc.stop(ctx.currentTime + inicio + dur);
    };
    tocar(880, 0, 0.5);
    tocar(1174.66, 0.18, 0.6);
  } catch { /* sem áudio disponível */ }
}

function notificar(novos) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const ag = novos[0];
  const titulo = novos.length === 1
    ? `Novo agendamento: ${ag.nome}`
    : `${novos.length} novos agendamentos`;
  const corpo = novos.length === 1
    ? `${dataBonita(ag.data)} às ${ag.hora} · ${ag.servicos.map((s) => s.nome).join(', ')}`
    : novos.map((a) => `${a.nome} — ${dataBonita(a.data)} ${a.hora}`).join('\n');
  try { new Notification(titulo, { body: corpo, icon: 'icon-192.png' }); } catch { /* sem permissão */ }
}

function ativarAvisos() {
  tocarSino();
  if (!('Notification' in window)) {
    toast('Som ativado! Este navegador não aceita notificações.');
    return;
  }
  Notification.requestPermission().then((perm) => {
    toast(perm === 'granted'
      ? 'Avisos ativados! Você ouvirá um sino e verá uma notificação a cada novo agendamento.'
      : 'Som ativado! Permita as notificações do navegador para receber avisos na tela.');
  });
}

// ---------- central: abas ----------
function trocarAba(aba) {
  abaAtiva = aba;
  $$('.abas .aba').forEach((b) => b.classList.toggle('ativo', b.dataset.aba === aba));
  ['agendamentos', 'relatorios', 'equipe', 'bloqueios'].forEach((nome) => {
    $(`#aba-${nome}`).classList.toggle('oculto', nome !== aba);
  });
  if (aba === 'relatorios') renderizarRelatorios();
}

// ---------- central: agendamentos ----------
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

function renderizarListaAdmin() {
  renderizarStats(listaCache);

  const busca = $('#filtro-busca').value.trim().toLowerCase();
  const dataFiltro = $('#filtro-data').value;
  const statusFiltro = $('#filtro-status').value;

  const filtradas = listaCache.filter((ag) => {
    if (busca && !ag.nome.toLowerCase().includes(busca) && !somenteDigitos(ag.telefone).includes(somenteDigitos(busca))) return false;
    if (dataFiltro && ag.data !== dataFiltro) return false;
    if (statusFiltro && ag.status !== statusFiltro) return false;
    return true;
  });

  const raiz = $('#lista-agendamentos');
  raiz.innerHTML = '';

  if (filtradas.length === 0) {
    const temDados = listaCache.length > 0;
    raiz.innerHTML = `
      <div class="vazio">
        <div class="hero-flor" aria-hidden="true"></div>
        <p>${temDados ? 'Nenhum agendamento com esses filtros.' : 'Ainda não há agendamentos por aqui. Assim que uma cliente agendar, aparece nesta central.'}</p>
        ${temDados || api.online ? '' : '<button class="btn btn-fantasma" id="btn-exemplos" type="button">Carregar dados de exemplo</button>'}
      </div>`;
    const btnEx = $('#btn-exemplos');
    if (btnEx) btnEx.addEventListener('click', carregarExemplos);
    return;
  }

  for (const ag of filtradas) {
    const card = document.createElement('article');
    card.className = 'cartao-agendamento';

    const pagBadge = ag.pagamento.status === 'pago'
      ? '<span class="badge badge-pago">Pago</span>'
      : '<span class="badge badge-apagar">A receber</span>';

    const fone = somenteDigitos(ag.telefone);
    const fid = fidelidadeCache[fone];
    const seloBadge = fid && fid.concluidos > 0
      ? (fid.temBrinde
        ? '<span class="badge badge-brinde">🎁 Brinde disponível</span>'
        : `<span class="badge badge-selos">★ ${fid.selos}/${fid.meta} selos</span>`)
      : '';

    const linkWhats = `https://wa.me/55${fone}?text=${encodeURIComponent(`Olá, ${ag.nome.split(' ')[0]}! Aqui é do Nails & More Salon, sobre seu horário de ${dataBonita(ag.data)} às ${ag.hora} 💅`)}`;

    card.innerHTML = `
      <div class="ag-topo">
        <span class="ag-nome">${ag.nome}</span>
        <span class="ag-quando">${dataBonita(ag.data)} · ${ag.hora} · ${ag.unidade}</span>
        <span class="ag-badges">
          <span class="badge badge-${ag.status}">${LABEL_STATUS[ag.status]}</span>
          ${pagBadge}
          ${seloBadge}
        </span>
      </div>
      <div class="ag-detalhes">
        ${linhasServicosHTML(ag.servicos)}
        <div class="linha-resumo total">
          <span>Total</span>
          <span class="pontilhado" aria-hidden="true"></span>
          <span class="valor">${brl(ag.total)}</span>
        </div>
        <div class="ag-contato">
          <span>📞 <a href="tel:+55${fone}">${ag.telefone}</a></span>
          <span>💬 <a href="${linkWhats}" target="_blank" rel="noopener">Chamar no WhatsApp</a></span>
          <span>💳 ${LABEL_QUANDO[ag.pagamento.quando]} · <strong>${LABEL_FORMA[ag.pagamento.forma]}</strong></span>
          ${ag.profissional ? `<span>💅 Com <strong>${ag.profissional}</strong></span>` : ''}
          ${ag.duracao ? `<span>⏱ ${duracaoBonita(ag.duracao)}</span>` : ''}
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
    if (ag.status === 'concluido') {
      const msg = `Olá, ${ag.nome.split(' ')[0]}! Obrigada por escolher o Nails & More Salon 💅 Esperamos que tenha amado o resultado! Se puder, deixe uma avaliação para a gente — ajuda demais: ${LINK_AVALIACAO}`;
      const a = document.createElement('a');
      a.className = 'btn-mini';
      a.textContent = '⭐ Pedir avaliação';
      a.href = `https://wa.me/55${fone}?text=${encodeURIComponent(msg)}`;
      a.target = '_blank';
      a.rel = 'noopener';
      acoes.appendChild(a);
    }
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

async function aplicarMudanca(id, corpo, aoLocal) {
  if (api.online) {
    try {
      const r = await fetch(`/api/agendamentos/${id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json', 'x-pin': pinSessao() },
        body: JSON.stringify(corpo),
      });
      if (!r.ok) { toast('Não foi possível salvar. Tente de novo.'); return null; }
      const ag = (await r.json()).agendamento;
      await atualizarDadosAdmin(true);
      return ag;
    } catch {
      toast('Sem conexão — tente de novo.');
      return null;
    }
  }
  const lista = lerLocal(CHAVE_DADOS, []);
  const ag = lista.find((a) => a.id === id);
  if (!ag) return null;
  aoLocal(ag);
  salvarLocal(CHAVE_DADOS, lista);
  listaCache = lista;
  idsConhecidos = new Set(lista.map((a) => a.id));
  renderizarListaAdmin();
  return ag;
}

async function mudarStatus(id, novo) {
  const ag = await aplicarMudanca(id, { status: novo }, (a) => { a.status = novo; });
  if (ag) toast(`Agendamento de ${ag.nome.split(' ')[0]}: ${LABEL_STATUS[novo].toLowerCase()}.`);
}

async function marcarPago(id, pago) {
  const ag = await aplicarMudanca(id, { pagamentoStatus: pago ? 'pago' : 'pendente' }, (a) => {
    a.pagamento.status = pago ? 'pago' : 'pendente';
  });
  if (ag) toast(pago ? `Pagamento de ${ag.nome.split(' ')[0]} registrado (${LABEL_FORMA[ag.pagamento.forma]}).` : 'Pagamento desfeito.');
}

// ---------- central: relatórios ----------
function renderizarRelatorios() {
  const dias = Number($('#rel-periodo').value);
  const hoje = hojeISO();
  let inicio = '0000-00-00';
  if (dias > 0) {
    const d = new Date();
    d.setDate(d.getDate() - dias);
    inicio = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  const periodo = listaCache.filter((ag) => ag.data >= inicio);
  const futuros = listaCache.filter((ag) => ag.data > hoje && (ag.status === 'pendente' || ag.status === 'confirmado'));

  const concluidos = periodo.filter((ag) => ag.status === 'concluido');
  const cancelados = periodo.filter((ag) => ag.status === 'cancelado');
  const faturado = concluidos.reduce((s, ag) => s + ag.total, 0);
  const previstoFuturo = futuros.reduce((s, ag) => s + ag.total, 0);
  const totalComparecimento = concluidos.length + cancelados.length;
  const taxa = totalComparecimento > 0 ? Math.round((concluidos.length / totalComparecimento) * 100) : null;

  const somaPor = (chaveFn, valorFn) => {
    const mapa = new Map();
    for (const ag of concluidos) {
      const k = chaveFn(ag);
      mapa.set(k, (mapa.get(k) || 0) + valorFn(ag));
    }
    return [...mapa.entries()].sort((a, b) => b[1] - a[1]);
  };

  const porUnidade = somaPor((ag) => ag.unidade, (ag) => ag.total);
  const porProf = somaPor((ag) => ag.profissional || 'Sem profissional definida', (ag) => ag.total);

  const contagemServicos = new Map();
  for (const ag of concluidos) {
    for (const s of ag.servicos) contagemServicos.set(s.nome, (contagemServicos.get(s.nome) || 0) + 1);
  }
  const topServicos = [...contagemServicos.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

  const porCliente = new Map();
  for (const ag of concluidos) {
    const k = `${ag.nome}|${somenteDigitos(ag.telefone)}`;
    porCliente.set(k, (porCliente.get(k) || 0) + ag.total);
  }
  const topClientes = [...porCliente.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

  const barras = (dados, formato) => {
    if (dados.length === 0) return '<p class="vazio-rel">Sem dados no período.</p>';
    const max = Math.max(...dados.map(([, v]) => v));
    return dados.map(([nome, v]) => `
      <div class="barra-linha">
        <span class="barra-nome">${nome.split('|')[0]}</span>
        <span class="barra-trilho"><span class="barra-preenchida" style="width:${Math.max(4, Math.round((v / max) * 100))}%"></span></span>
        <span class="barra-valor">${formato(v)}</span>
      </div>`).join('');
  };

  $('#rel-conteudo').innerHTML = `
    <div class="painel-stats">
      <div class="stat"><b>${brl(faturado)}</b><span>faturado (concluídos)</span></div>
      <div class="stat"><b>${concluidos.length}</b><span>atendimentos concluídos</span></div>
      <div class="stat"><b>${taxa === null ? '—' : taxa + '%'}</b><span>comparecimento</span></div>
      <div class="stat"><b>${brl(previstoFuturo)}</b><span>já agendado (futuro)</span></div>
    </div>
    <div class="rel-grupo"><h3>Faturamento por unidade</h3>${barras(porUnidade, brl)}</div>
    <div class="rel-grupo"><h3>Faturamento por profissional</h3>${barras(porProf, brl)}</div>
    <div class="rel-grupo"><h3>Serviços mais pedidos</h3>${barras(topServicos, (v) => `${v}×`)}</div>
    <div class="rel-grupo"><h3>Clientes que mais gastaram</h3>${barras(topClientes, brl)}</div>`;
}

// ---------- central: equipe ----------
function chipsSelecao(container, itens, atributo) {
  container.innerHTML = '';
  for (const item of itens) {
    const lab = document.createElement('label');
    lab.className = 'chip';
    lab.innerHTML = `<input type="checkbox" value="${item.valor}" ${atributo && item.padrao ? 'checked' : ''} /><span>${item.rotulo}</span>`;
    container.appendChild(lab);
  }
}

function renderizarFormEquipe() {
  chipsSelecao($('#eq-unidades'), UNIDADES.map((u) => ({ valor: u, rotulo: u.replace('Shopping ', ''), padrao: true })), true);
  chipsSelecao($('#eq-categorias'), CATEGORIAS_TRABALHO.map((c) => ({ valor: c.id, rotulo: c.nome.replace('Embelezamento · ', '').replace('Embelezamento do ', ''), padrao: c.id === 'maos-pes' || c.id === 'nail-designer' })), true);
}

function renderizarEquipe() {
  const raiz = $('#lista-equipe');
  raiz.innerHTML = '';
  if (equipeCache.length === 0) {
    raiz.innerHTML = '<div class="vazio"><p>Nenhuma profissional cadastrada ainda. Sem equipe, a agenda usa 3 vagas por meia hora em cada unidade.</p></div>';
    return;
  }
  for (const p of equipeCache) {
    const card = document.createElement('article');
    card.className = `cartao-agendamento ${p.ativo === false ? 'inativo' : ''}`;
    const cats = (p.categorias || [])
      .map((c) => CATEGORIAS_TRABALHO.find((x) => x.id === c)?.nome.replace('Embelezamento · ', '').replace('Embelezamento do ', ''))
      .filter(Boolean).join(', ');
    card.innerHTML = `
      <div class="ag-topo">
        <span class="ag-nome">${p.nome}</span>
        ${p.ativo === false ? '<span class="badge badge-cancelado">Inativa</span>' : '<span class="badge badge-confirmado">Ativa</span>'}
      </div>
      <div class="ag-detalhes">
        <p>📍 ${(p.unidades || []).join(' · ') || 'Sem unidade'}</p>
        <p>💅 ${cats || 'Sem serviços definidos'}</p>
      </div>
      <div class="ag-acoes"></div>`;
    const acoes = card.querySelector('.ag-acoes');
    const btnAtivo = document.createElement('button');
    btnAtivo.type = 'button';
    btnAtivo.className = 'btn-mini';
    btnAtivo.textContent = p.ativo === false ? 'Reativar' : 'Pausar agenda';
    btnAtivo.addEventListener('click', () => {
      p.ativo = p.ativo === false;
      salvarEquipe();
    });
    const btnRemover = document.createElement('button');
    btnRemover.type = 'button';
    btnRemover.className = 'btn-mini perigo';
    btnRemover.textContent = 'Remover';
    btnRemover.addEventListener('click', () => {
      if (confirm(`Remover ${p.nome} da equipe?`)) {
        equipeCache = equipeCache.filter((x) => x.id !== p.id);
        salvarEquipe();
      }
    });
    acoes.append(btnAtivo, btnRemover);
    raiz.appendChild(card);
  }
}

async function adicionarProfissional() {
  const nome = $('#eq-nome').value.trim();
  if (nome.length < 2) { toast('Digite o nome da profissional.'); return; }
  const unidades = $$('#eq-unidades input:checked').map((i) => i.value);
  const categorias = $$('#eq-categorias input:checked').map((i) => i.value);
  if (unidades.length === 0) { toast('Escolha pelo menos uma unidade.'); return; }
  if (categorias.length === 0) { toast('Escolha pelo menos um tipo de serviço.'); return; }
  equipeCache.push({
    id: `pr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    nome, unidades, categorias, ativo: true,
  });
  if (await salvarEquipe()) {
    $('#eq-nome').value = '';
    toast(`${nome} entrou para a equipe!`);
    renderizarSeletorProfBloqueio();
  }
}

// ---------- central: bloqueios ----------
function renderizarFormBloqueios() {
  const horas = gerarHorarios(hojeISO());
  const opcoes = horas.map((h) => `<option value="${h}">${h}</option>`).join('');
  $('#bl-inicio').innerHTML = opcoes;
  $('#bl-fim').innerHTML = opcoes + '<option value="22:00">22:00</option>';
  $('#bl-fim').value = '22:00';
  $('#bl-data').min = hojeISO();
  renderizarSeletorProfBloqueio();
}

function renderizarSeletorProfBloqueio() {
  const sel = $('#bl-prof');
  sel.innerHTML = '<option value="">Unidade inteira</option>' +
    equipeCache.filter((p) => p.ativo !== false)
      .map((p) => `<option value="${p.id}">${p.nome}</option>`).join('');
}

function renderizarBloqueios() {
  const raiz = $('#lista-bloqueios');
  raiz.innerHTML = '';
  const futuros = bloqueiosCache.filter((bl) => bl.data >= hojeISO())
    .sort((a, b) => (a.data + a.inicio).localeCompare(b.data + b.inicio));
  if (futuros.length === 0) {
    raiz.innerHTML = '<div class="vazio"><p>Nenhum bloqueio futuro. Use os bloqueios para folgas, feriados e manutenção.</p></div>';
    return;
  }
  for (const bl of futuros) {
    const prof = equipeCache.find((p) => p.id === bl.profissionalId);
    const card = document.createElement('article');
    card.className = 'cartao-agendamento';
    card.innerHTML = `
      <div class="ag-topo">
        <span class="ag-nome">${dataBonita(bl.data)} · ${bl.inicio}–${bl.fim}</span>
        <span class="ag-quando">${bl.unidade}${prof ? ` · ${prof.nome}` : ' · unidade inteira'}</span>
      </div>
      ${bl.motivo ? `<div class="ag-detalhes"><p class="ag-obs">“${bl.motivo}”</p></div>` : ''}
      <div class="ag-acoes"></div>`;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn-mini perigo';
    btn.textContent = 'Remover bloqueio';
    btn.addEventListener('click', () => {
      bloqueiosCache = bloqueiosCache.filter((x) => x.id !== bl.id);
      salvarBloqueios();
    });
    card.querySelector('.ag-acoes').appendChild(btn);
    raiz.appendChild(card);
  }
}

async function adicionarBloqueio() {
  const data = $('#bl-data').value;
  const inicio = $('#bl-inicio').value;
  const fim = $('#bl-fim').value;
  if (!data) { toast('Escolha o dia do bloqueio.'); return; }
  if (minutosDe(inicio) >= minutosDe(fim)) { toast('O fim precisa ser depois do início.'); return; }
  bloqueiosCache.push({
    id: `bl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    unidade: $('#bl-unidade').value,
    data, inicio, fim,
    profissionalId: $('#bl-prof').value || null,
    motivo: $('#bl-motivo').value.trim(),
  });
  if (await salvarBloqueios()) {
    $('#bl-motivo').value = '';
    toast('Horário bloqueado.');
  }
}

// ---------- exportar / exemplos ----------
function exportarCSV() {
  if (listaCache.length === 0) { toast('Nada para exportar ainda.'); return; }
  const cab = ['Data', 'Hora', 'Unidade', 'Profissional', 'Cliente', 'Telefone', 'Serviços', 'Duração (min)', 'Total (R$)', 'Quando paga', 'Forma', 'Pagamento', 'Status', 'Observações'];
  const linhas = listaCache.map((ag) => [
    ag.data, ag.hora, ag.unidade, ag.profissional || '', ag.nome, ag.telefone,
    ag.servicos.map((s) => s.nome).join(' + '),
    ag.duracao || 30,
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
      data: hoje, hora: '14:00', duracao: 150,
      servicos: [{ nome: 'Mão e Pé', preco: 95 }, { nome: 'Esmaltação em Gel', preco: 109 }],
      obs: 'Prefere tons de nude.',
      pagamento: { quando: 'na_hora', forma: 'pix', status: 'pendente' }, status: 'confirmado',
    },
    {
      nome: 'Camila Rocha', telefone: '(21) 98765-4321', unidade: 'NorteShopping',
      data: hoje, hora: '16:30', duracao: 120,
      servicos: [{ nome: 'Alongamento de Cílios', preco: 205, aPartirDe: true }],
      obs: '',
      pagamento: { quando: 'antecipado', forma: 'credito', status: 'pago' }, status: 'confirmado',
    },
    {
      nome: 'Beatriz Nunes', telefone: '(21) 97654-9870', unidade: 'Shopping Tijuca',
      data: amanha, hora: '10:30', duracao: 180,
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
  salvarLocal(CHAVE_DADOS, [...lerLocal(CHAVE_DADOS, []), ...exemplos]);
  atualizarDadosAdmin();
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

  $('#btn-rebook').addEventListener('click', repetirUltimo);
  $('#btn-avancar').addEventListener('click', avancar);
  $('#btn-voltar').addEventListener('click', () => {
    if (estado.passo > 1) irParaPasso(estado.passo - 1);
  });

  const campoData = $('#campo-data');
  campoData.min = hojeISO();
  campoData.addEventListener('change', () => {
    estado.data = campoData.value;
    estado.hora = '';
    recarregarHorarios();
    atualizarBarra();
  });

  $('#campo-unidade').addEventListener('change', (ev) => {
    estado.unidade = ev.target.value;
    estado.hora = '';
    estado.profissionalId = '';
    carregarEquipeUnidade().then(recarregarHorarios);
  });

  $('#campo-profissional').addEventListener('change', (ev) => {
    estado.profissionalId = ev.target.value;
    estado.hora = '';
    recarregarHorarios();
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

  $('#btn-copiar-pix').addEventListener('click', async () => {
    const codigo = $('#pix-codigo').value;
    try {
      await navigator.clipboard.writeText(codigo);
      toast('Código Pix copiado! Cole no app do seu banco.');
    } catch {
      $('#pix-codigo').select();
      document.execCommand('copy');
      toast('Código Pix copiado!');
    }
  });

  $('#form-pin').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const pin = $('#campo-pin').value;
    let valido = false;

    if (api.online) {
      try {
        const r = await fetch('/api/agendamentos', { headers: { 'x-pin': pin } });
        valido = r.ok;
        if (valido) {
          const corpo = await r.json();
          listaCache = corpo.agendamentos || [];
          fidelidadeCache = corpo.fidelidade || {};
          idsConhecidos = new Set(listaCache.map((ag) => ag.id));
        }
      } catch {
        toast('Sem conexão — tente de novo.');
        return;
      }
    } else {
      valido = pin === PIN_LOCAL;
    }

    if (valido) {
      sessionStorage.setItem(CHAVE_PIN_SESSAO, pin);
      $('#erro-pin').classList.add('oculto');
      renderizarListaAdmin();
      carregarConfigAdmin();
      mostrarView('admin');
      if (!api.online) atualizarDadosAdmin(true);
    } else {
      $('#erro-pin').classList.remove('oculto');
      $('#campo-pin').value = '';
      $('#campo-pin').focus();
    }
  });

  $('#btn-sair-admin').addEventListener('click', () => {
    sessionStorage.removeItem(CHAVE_PIN_SESSAO);
    idsConhecidos = null;
    mostrarView('home');
  });

  $('#btn-avisos').addEventListener('click', ativarAvisos);
  $('#btn-exportar').addEventListener('click', exportarCSV);
  $$('.abas .aba').forEach((b) => b.addEventListener('click', () => trocarAba(b.dataset.aba)));
  $('#rel-periodo').addEventListener('change', renderizarRelatorios);
  $('#btn-add-prof').addEventListener('click', adicionarProfissional);
  $('#btn-add-bloqueio').addEventListener('click', adicionarBloqueio);

  ['#filtro-busca', '#filtro-data', '#filtro-status'].forEach((sel) =>
    $(sel).addEventListener('input', renderizarListaAdmin)
  );
  $('#btn-limpar-filtros').addEventListener('click', () => {
    $('#filtro-busca').value = '';
    $('#filtro-data').value = '';
    $('#filtro-status').value = '';
    renderizarListaAdmin();
  });
}

// ---------- início ----------
renderizarCardapio();
renderizarFormEquipe();
renderizarFormBloqueios();
ligarEventos();
atualizarBarra();
atualizarBotaoRebook();
mostrarView('home');
detectarAPI();

// PWA: ícone na tela e abertura rápida
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('sw.js').catch(() => { /* sem PWA, sem problema */ });
}
