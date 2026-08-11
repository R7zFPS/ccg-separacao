// API de agendamentos — Netlify Functions + Netlify Blobs
// Banco: store global "agendamentos", um blob por agendamento (chave ag-<id>).

import { getStore, getDeployStore } from '@netlify/blobs';

const UNIDADES = ['Shopping Tijuca', 'NorteShopping', 'Shopping Metropolitano'];
const QUANDO = ['na_hora', 'antecipado'];
const FORMAS = ['pix', 'credito', 'debito', 'dinheiro'];
const STATUS = ['pendente', 'confirmado', 'concluido', 'cancelado'];
const VAGAS_POR_HORARIO = 3;

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

async function listarTodos(store) {
  const { blobs } = await store.list({ prefix: 'ag-' });
  const itens = await Promise.all(blobs.map((b) => store.get(b.key, { type: 'json' })));
  return itens.filter(Boolean);
}

function hojeISO() {
  // horário de Brasília para validar "data no passado"
  const agora = new Date(Date.now() - 3 * 60 * 60 * 1000);
  return agora.toISOString().slice(0, 10);
}

function validarAgendamento(b) {
  if (!b || typeof b !== 'object') return 'Dados inválidos.';
  if (typeof b.nome !== 'string' || b.nome.trim().length < 3) return 'Digite o nome completo.';
  if (typeof b.telefone !== 'string' || (b.telefone.replace(/\D/g, '').length < 10)) return 'Telefone inválido.';
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

export default async (req) => {
  const url = new URL(req.url);
  const rota = url.pathname.replace(/\/+$/, '');
  const store = abrirStore();

  // GET /api/ping — o front usa para detectar o modo online
  if (rota === '/api/ping') return json({ ok: true });

  // GET /api/disponibilidade?data=YYYY-MM-DD&unidade=... — público (mapa hora -> vagas ocupadas)
  if (rota === '/api/disponibilidade' && req.method === 'GET') {
    const data = url.searchParams.get('data') || '';
    const unidade = url.searchParams.get('unidade') || '';
    const todos = await listarTodos(store);
    const mapa = {};
    for (const ag of todos) {
      if (ag.data === data && ag.unidade === unidade && ag.status !== 'cancelado') {
        mapa[ag.hora] = (mapa[ag.hora] || 0) + 1;
      }
    }
    return json({ vagasPorHorario: VAGAS_POR_HORARIO, ocupacao: mapa });
  }

  // POST /api/agendamentos — público (a cliente cria o agendamento)
  if (rota === '/api/agendamentos' && req.method === 'POST') {
    let corpo;
    try { corpo = await req.json(); } catch { return json({ erro: 'Corpo inválido.' }, 400); }

    const erro = validarAgendamento(corpo);
    if (erro) return json({ erro }, 400);

    // checa lotação no servidor (fonte da verdade)
    const todos = await listarTodos(store);
    const noMesmoHorario = todos.filter(
      (ag) => ag.data === corpo.data && ag.hora === corpo.hora && ag.unidade === corpo.unidade && ag.status !== 'cancelado'
    );
    if (noMesmoHorario.length >= VAGAS_POR_HORARIO) {
      return json({ erro: 'Esse horário acabou de lotar — escolha outro, por favor.' }, 409);
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
      servicos: corpo.servicos.map((s) => ({
        nome: String(s.nome).slice(0, 120),
        preco: s.preco,
        aPartirDe: !!s.aPartirDe,
      })),
      total: corpo.servicos.reduce((soma, s) => soma + s.preco, 0),
      obs: String(corpo.obs || '').slice(0, 500),
      pagamento: { quando: corpo.pagamento.quando, forma: corpo.pagamento.forma, status: 'pendente' },
      status: 'pendente',
    };
    await store.setJSON(agendamento.id, agendamento);
    return json({ agendamento }, 201);
  }

  // Daqui para baixo é a central do salão — exige PIN
  if (!pinOk(req)) return json({ erro: 'PIN incorreto.' }, 401);

  // GET /api/agendamentos — lista completa
  if (rota === '/api/agendamentos' && req.method === 'GET') {
    const todos = await listarTodos(store);
    todos.sort((a, b) => (a.data + a.hora).localeCompare(b.data + b.hora) || a.criadoEm.localeCompare(b.criadoEm));
    return json({ agendamentos: todos });
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

  return json({ erro: 'Rota não encontrada.' }, 404);
};

export const config = {
  path: ['/api/ping', '/api/disponibilidade', '/api/agendamentos', '/api/agendamentos/*'],
};
