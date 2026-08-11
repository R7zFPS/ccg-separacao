// API de agendamentos — Netlify Functions + Netlify Blobs
// Banco: store "agendamentos"
//   ag-<id>          → um blob por agendamento
//   config-equipe    → profissionais do salão
//   config-bloqueios → bloqueios de agenda (folgas, feriados)

import { getStore, getDeployStore } from '@netlify/blobs';

const UNIDADES = ['Shopping Tijuca', 'NorteShopping', 'Shopping Metropolitano', 'Shopping Via Parque'];
const QUANDO = ['na_hora', 'antecipado'];
const FORMAS = ['pix', 'credito', 'debito', 'dinheiro'];
const STATUS = ['pendente', 'confirmado', 'concluido', 'cancelado'];
const VAGAS_SEM_EQUIPE = 3;   // capacidade por meia hora quando a unidade não tem equipe cadastrada
const SELOS_META = 10;        // fidelidade: a cada 10 atendimentos concluídos, um brinde

function abrirStore() {
  // produção usa o store global; previews usam store do deploy para não misturar dados
  if (Netlify.context?.deploy.context === 'production') {
    return getStore({ name: 'agendamentos', consistency: 'strong' });
  }
  return getDeployStore({ name: 'agendamentos', consistency: 'strong' });
}

const json = (corpo, status = 200) =>
  new Response(JSON.stringify(corpo), { status, headers: { 'content-type': 'application/json; charset=utf-8' } });

function pinOk(req) {
  const pin = Netlify.env.get('ADMIN_PIN') || '2016';
  return req.headers.get('x-pin') === pin;
}

const digitos = (s) => String(s || '').replace(/\D/g, '');

async function listarAgendamentos(store) {
  const { blobs } = await store.list({ prefix: 'ag-' });
  const itens = await Promise.all(blobs.map((b) => store.get(b.key, { type: 'json' })));
  return itens.filter(Boolean);
}

const lerEquipe = async (store) => (await store.get('config-equipe', { type: 'json' })) || [];
const lerBloqueios = async (store) => (await store.get('config-bloqueios', { type: 'json' })) || [];

function hojeISO() {
  // horário de Brasília para validar "data no passado"
  const agora = new Date(Date.now() - 3 * 60 * 60 * 1000);
  return agora.toISOString().slice(0, 10);
}

// ---------- grade de horários ----------
function gerarHorarios(dataISO) {
  const [a, m, d] = dataISO.split('-').map(Number);
  const diaSemana = new Date(Date.UTC(a, m - 1, d)).getUTCDay();
  const inicio = diaSemana === 0 ? 13 * 60 : 10 * 60;
  const fim = diaSemana === 0 ? 21 * 60 : 22 * 60;
  const horarios = [];
  for (let min = inicio; min <= fim - 30; min += 30) {
    horarios.push(`${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`);
  }
  return horarios;
}

const minutosDe = (hora) => {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
};

const normalizarDuracao = (dur) => {
  const n = Number(dur);
  if (!Number.isFinite(n)) return 30;
  return Math.min(480, Math.max(30, Math.ceil(n / 30) * 30));
};

// intervalo [inicio, fim) em minutos de um agendamento
const intervaloDe = (ag) => {
  const ini = minutosDe(ag.hora);
  return [ini, ini + normalizarDuracao(ag.duracao || 30)];
};

const sobrepoe = (aIni, aFim, bIni, bFim) => aIni < bFim && bIni < aFim;

function bloqueiaProfissional(bloqueios, unidade, data, ini, fim, profissionalId) {
  return bloqueios.some((bl) => {
    if (bl.unidade !== unidade || bl.data !== data) return false;
    if (bl.profissionalId && bl.profissionalId !== profissionalId) return false;
    return sobrepoe(ini, fim, minutosDe(bl.inicio), minutosDe(bl.fim));
  });
}

/**
 * Horários de início livres para um atendimento de `dur` minutos.
 * Com equipe cadastrada na unidade: um profissional atende um cliente por vez.
 * Sem equipe: modelo simples de capacidade (VAGAS_SEM_EQUIPE por meia hora).
 */
function horasLivres({ data, unidade, dur, profissionalId, ags, equipe, bloqueios }) {
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
        if (bloqueiaProfissional(bloqueios, unidade, data, ini, fim, p.id)) return false;
        return !doDia.some((ag) => {
          if (ag.profissionalId !== p.id) return false;
          const [aIni, aFim] = intervaloDe(ag);
          return sobrepoe(ini, fim, aIni, aFim);
        });
      });
      if (alguemLivre) livres.push(hora);
    } else {
      if (bloqueiaProfissional(bloqueios, unidade, data, ini, fim, null)) continue;
      // capacidade: nenhum bloco de 30min dentro do intervalo pode estar lotado
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

function escolherProfissional({ data, unidade, hora, dur, profissionalId, ags, equipe, bloqueios }) {
  const profs = equipe.filter((p) => p.ativo !== false && (p.unidades || []).includes(unidade));
  if (profs.length === 0) return { id: null, nome: null };

  const ini = minutosDe(hora);
  const fim = ini + normalizarDuracao(dur);
  const doDia = ags.filter((ag) => ag.data === data && ag.unidade === unidade && ag.status !== 'cancelado');

  const livres = (profissionalId ? profs.filter((p) => p.id === profissionalId) : profs).filter((p) => {
    if (bloqueiaProfissional(bloqueios, unidade, data, ini, fim, p.id)) return false;
    return !doDia.some((ag) => {
      if (ag.profissionalId !== p.id) return false;
      const [aIni, aFim] = intervaloDe(ag);
      return sobrepoe(ini, fim, aIni, aFim);
    });
  });
  if (livres.length === 0) return null;

  // sem preferência: quem tem menos minutos agendados no dia
  livres.sort((a, b) => {
    const carga = (p) => doDia.filter((ag) => ag.profissionalId === p.id)
      .reduce((s, ag) => s + normalizarDuracao(ag.duracao || 30), 0);
    return carga(a) - carga(b);
  });
  return { id: livres[0].id, nome: livres[0].nome };
}

// ---------- fidelidade ----------
function calcularFidelidade(ags, telefone) {
  const tel = digitos(telefone);
  const concluidos = ags.filter((ag) => digitos(ag.telefone) === tel && ag.status === 'concluido').length;
  return {
    concluidos,
    selos: concluidos % SELOS_META,
    faltam: SELOS_META - (concluidos % SELOS_META),
    meta: SELOS_META,
    temBrinde: concluidos > 0 && concluidos % SELOS_META === 0,
  };
}

// ---------- validação ----------
function validarAgendamento(b) {
  if (!b || typeof b !== 'object') return 'Dados inválidos.';
  if (typeof b.nome !== 'string' || b.nome.trim().length < 3) return 'Digite o nome completo.';
  if (typeof b.telefone !== 'string' || digitos(b.telefone).length < 10) return 'Telefone inválido.';
  if (!UNIDADES.includes(b.unidade)) return 'Unidade inválida.';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(b.data || '')) return 'Data inválida.';
  if (b.data < hojeISO()) return 'Essa data já passou.';
  if (!/^\d{2}:\d{2}$/.test(b.hora || '')) return 'Horário inválido.';
  if (!Array.isArray(b.servicos) || b.servicos.length === 0) return 'Escolha pelo menos um serviço.';
  for (const s of b.servicos) {
    if (typeof s?.nome !== 'string' || typeof s?.preco !== 'number' || s.preco < 0) return 'Serviço inválido.';
  }
  if (!QUANDO.includes(b.pagamento?.quando)) return 'Momento de pagamento inválido.';
  if (!FORMAS.includes(b.pagamento?.forma)) return 'Forma de pagamento inválida.';
  if (b.pagamento.quando === 'antecipado' && b.pagamento.forma === 'dinheiro') {
    return 'Pagamento antecipado não aceita dinheiro.';
  }
  return null;
}

// ---------- Pix (Mercado Pago) — liga sozinho quando MP_ACCESS_TOKEN existir ----------
async function criarPagamentoPix(ag) {
  const token = Netlify.env.get('MP_ACCESS_TOKEN');
  if (!token) return null;
  try {
    const r = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
        'x-idempotency-key': ag.id,
      },
      body: JSON.stringify({
        transaction_amount: ag.total,
        description: `Nails & More Salon — ${ag.data} ${ag.hora} (${ag.nome})`,
        payment_method_id: 'pix',
        external_reference: ag.id,
        payer: { email: `${digitos(ag.telefone)}@clientes.nailsandmore.app` },
      }),
    });
    if (!r.ok) {
      console.log('MercadoPago recusou o pagamento:', r.status, await r.text());
      return null;
    }
    const pg = await r.json();
    const dados = pg.point_of_interaction?.transaction_data;
    if (!dados?.qr_code) return null;
    return {
      mpPaymentId: pg.id,
      copiaECola: dados.qr_code,
      qrCodeBase64: dados.qr_code_base64 || null,
    };
  } catch (e) {
    console.log('Erro ao criar Pix no Mercado Pago:', e.message);
    return null;
  }
}

async function processarWebhookMercadoPago(req, store) {
  const token = Netlify.env.get('MP_ACCESS_TOKEN');
  if (!token) return json({ ok: true });
  let corpo;
  try { corpo = await req.json(); } catch { return json({ ok: true }); }
  const pagamentoId = corpo?.data?.id;
  if (!pagamentoId || corpo?.type !== 'payment') return json({ ok: true });

  // nunca confiar no corpo do webhook: busca o pagamento direto no Mercado Pago
  const r = await fetch(`https://api.mercadopago.com/v1/payments/${pagamentoId}`, {
    headers: { authorization: `Bearer ${token}` },
  });
  if (!r.ok) return json({ ok: true });
  const pg = await r.json();
  if (pg.status === 'approved' && pg.external_reference?.startsWith('ag-')) {
    const ag = await store.get(pg.external_reference, { type: 'json' });
    if (ag) {
      ag.pagamento.status = 'pago';
      await store.setJSON(ag.id, ag);
    }
  }
  return json({ ok: true });
}

// ---------- handler ----------
export default async (req) => {
  const url = new URL(req.url);
  const rota = url.pathname.replace(/\/+$/, '');
  const store = abrirStore();

  // GET /api/ping — o front usa para detectar o modo online
  if (rota === '/api/ping') return json({ ok: true, versao: 2, pixOnline: !!Netlify.env.get('MP_ACCESS_TOKEN') });

  // POST /api/webhooks/mercadopago — confirmação automática de Pix
  if (rota === '/api/webhooks/mercadopago' && req.method === 'POST') {
    return processarWebhookMercadoPago(req, store);
  }

  // GET /api/contexto?unidade=... — público: equipe da unidade (para escolher profissional)
  if (rota === '/api/contexto' && req.method === 'GET') {
    const unidade = url.searchParams.get('unidade') || '';
    const equipe = await lerEquipe(store);
    const daUnidade = equipe
      .filter((p) => p.ativo !== false && (p.unidades || []).includes(unidade))
      .map((p) => ({ id: p.id, nome: p.nome, categorias: p.categorias || [] }));
    return json({ equipe: daUnidade });
  }

  // GET /api/disponibilidade?data=&unidade=&dur=&profissional= — público
  if (rota === '/api/disponibilidade' && req.method === 'GET') {
    const data = url.searchParams.get('data') || '';
    const unidade = url.searchParams.get('unidade') || '';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data) || !UNIDADES.includes(unidade)) {
      return json({ erro: 'Parâmetros inválidos.' }, 400);
    }
    const [ags, equipe, bloqueios] = await Promise.all([
      listarAgendamentos(store), lerEquipe(store), lerBloqueios(store),
    ]);
    const livres = horasLivres({
      data, unidade,
      dur: url.searchParams.get('dur') || 30,
      profissionalId: url.searchParams.get('profissional') || null,
      ags, equipe, bloqueios,
    });
    return json({ horasLivres: livres });
  }

  // POST /api/agendamentos — público (a cliente cria o agendamento)
  if (rota === '/api/agendamentos' && req.method === 'POST') {
    let corpo;
    try { corpo = await req.json(); } catch { return json({ erro: 'Corpo inválido.' }, 400); }

    const erro = validarAgendamento(corpo);
    if (erro) return json({ erro }, 400);

    const [ags, equipe, bloqueios] = await Promise.all([
      listarAgendamentos(store), lerEquipe(store), lerBloqueios(store),
    ]);

    const duracao = normalizarDuracao(corpo.duracao);
    const livres = horasLivres({
      data: corpo.data, unidade: corpo.unidade, dur: duracao,
      profissionalId: corpo.profissionalId || null,
      ags, equipe, bloqueios,
    });
    if (!livres.includes(corpo.hora)) {
      return json({ erro: 'Esse horário acabou de ficar indisponível — escolha outro, por favor.' }, 409);
    }

    const prof = escolherProfissional({
      data: corpo.data, unidade: corpo.unidade, hora: corpo.hora, dur: duracao,
      profissionalId: corpo.profissionalId || null,
      ags, equipe, bloqueios,
    });
    if (prof === null) {
      return json({ erro: 'Esse horário acabou de ficar indisponível — escolha outro, por favor.' }, 409);
    }

    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const agendamento = {
      id: `ag-${id}`,
      criadoEm: new Date().toISOString(),
      nome: corpo.nome.trim().slice(0, 120),
      telefone: corpo.telefone.slice(0, 20),
      unidade: corpo.unidade,
      data: corpo.data,
      hora: corpo.hora,
      duracao,
      profissionalId: prof.id,
      profissional: prof.nome,
      servicos: corpo.servicos.map((s) => ({
        nome: String(s.nome).slice(0, 120),
        preco: s.preco,
        aPartirDe: !!s.aPartirDe,
        combo: !!s.combo,
      })),
      total: corpo.servicos.reduce((soma, s) => soma + s.preco, 0),
      obs: String(corpo.obs || '').slice(0, 500),
      pagamento: { quando: corpo.pagamento.quando, forma: corpo.pagamento.forma, status: 'pendente' },
      status: 'pendente',
      lembreteEnviado: false,
    };

    let pix = null;
    if (agendamento.pagamento.quando === 'antecipado' && agendamento.pagamento.forma === 'pix') {
      pix = await criarPagamentoPix(agendamento);
      if (pix) agendamento.pagamento.mpPaymentId = pix.mpPaymentId;
    }

    await store.setJSON(agendamento.id, agendamento);

    return json({
      agendamento,
      fidelidade: calcularFidelidade(ags, agendamento.telefone),
      pix: pix ? { copiaECola: pix.copiaECola, qrCodeBase64: pix.qrCodeBase64 } : null,
    }, 201);
  }

  // Daqui para baixo é a central do salão — exige PIN
  if (!pinOk(req)) return json({ erro: 'PIN incorreto.' }, 401);

  // GET /api/agendamentos — lista completa + selos de fidelidade por cliente
  if (rota === '/api/agendamentos' && req.method === 'GET') {
    const todos = await listarAgendamentos(store);
    todos.sort((a, b) => (a.data + a.hora).localeCompare(b.data + b.hora) || a.criadoEm.localeCompare(b.criadoEm));
    const fidelidade = {};
    for (const ag of todos) {
      const tel = digitos(ag.telefone);
      if (!fidelidade[tel]) fidelidade[tel] = calcularFidelidade(todos, ag.telefone);
    }
    return json({ agendamentos: todos, fidelidade });
  }

  // PATCH /api/agendamentos/ag-<id> — atualiza status e/ou pagamento
  const patch = rota.match(/^\/api\/agendamentos\/(ag-[\w-]+)$/);
  if (patch && req.method === 'PATCH') {
    let corpo;
    try { corpo = await req.json(); } catch { return json({ erro: 'Corpo inválido.' }, 400); }

    const ag = await store.get(patch[1], { type: 'json' });
    if (!ag) return json({ erro: 'Agendamento não encontrado.' }, 404);

    if (corpo.status !== undefined) {
      if (!STATUS.includes(corpo.status)) return json({ erro: 'Status inválido.' }, 400);
      ag.status = corpo.status;
    }
    if (corpo.pagamentoStatus !== undefined) {
      if (!['pendente', 'pago'].includes(corpo.pagamentoStatus)) return json({ erro: 'Pagamento inválido.' }, 400);
      ag.pagamento.status = corpo.pagamentoStatus;
    }
    await store.setJSON(ag.id, ag);
    return json({ agendamento: ag });
  }

  // GET/PUT /api/equipe — profissionais do salão
  if (rota === '/api/equipe') {
    if (req.method === 'GET') return json({ equipe: await lerEquipe(store) });
    if (req.method === 'PUT') {
      let corpo;
      try { corpo = await req.json(); } catch { return json({ erro: 'Corpo inválido.' }, 400); }
      if (!Array.isArray(corpo.equipe)) return json({ erro: 'Formato inválido.' }, 400);
      const equipe = corpo.equipe.slice(0, 60).map((p) => ({
        id: String(p.id || `pr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`),
        nome: String(p.nome || '').slice(0, 80),
        unidades: (Array.isArray(p.unidades) ? p.unidades : []).filter((u) => UNIDADES.includes(u)),
        categorias: (Array.isArray(p.categorias) ? p.categorias : []).map(String),
        ativo: p.ativo !== false,
      })).filter((p) => p.nome.trim().length > 0);
      await store.setJSON('config-equipe', equipe);
      return json({ equipe });
    }
  }

  // GET/PUT /api/bloqueios — folgas, feriados, manutenção
  if (rota === '/api/bloqueios') {
    if (req.method === 'GET') return json({ bloqueios: await lerBloqueios(store) });
    if (req.method === 'PUT') {
      let corpo;
      try { corpo = await req.json(); } catch { return json({ erro: 'Corpo inválido.' }, 400); }
      if (!Array.isArray(corpo.bloqueios)) return json({ erro: 'Formato inválido.' }, 400);
      const bloqueios = corpo.bloqueios.slice(0, 300).map((bl) => ({
        id: String(bl.id || `bl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`),
        unidade: bl.unidade,
        data: bl.data,
        inicio: bl.inicio,
        fim: bl.fim,
        profissionalId: bl.profissionalId || null,
        motivo: String(bl.motivo || '').slice(0, 120),
      })).filter((bl) =>
        UNIDADES.includes(bl.unidade) &&
        /^\d{4}-\d{2}-\d{2}$/.test(bl.data || '') &&
        /^\d{2}:\d{2}$/.test(bl.inicio || '') &&
        /^\d{2}:\d{2}$/.test(bl.fim || '') &&
        minutosDe(bl.inicio) < minutosDe(bl.fim)
      );
      await store.setJSON('config-bloqueios', bloqueios);
      return json({ bloqueios });
    }
  }

  return json({ erro: 'Rota não encontrada.' }, 404);
};

export const config = {
  path: [
    '/api/ping',
    '/api/contexto',
    '/api/disponibilidade',
    '/api/agendamentos',
    '/api/agendamentos/*',
    '/api/equipe',
    '/api/bloqueios',
    '/api/webhooks/mercadopago',
  ],
};

// exportado para testes
export { horasLivres, escolherProfissional, calcularFidelidade, validarAgendamento, gerarHorarios, normalizarDuracao };
