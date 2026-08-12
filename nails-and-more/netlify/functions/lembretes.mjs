// Lembretes automáticos de WhatsApp — roda todo dia às 09h (horário de Brasília).
// Envia mensagem para as clientes com horário marcado para AMANHÃ.
//
// Liga sozinho quando estas variáveis de ambiente existirem no painel do Netlify:
//   ZAPI_SEND_TEXT_URL  → URL "send-text" da sua instância Z-API
//                         (ex.: https://api.z-api.io/instances/SUA_INSTANCIA/token/SEU_TOKEN/send-text)
//   ZAPI_CLIENT_TOKEN   → Client-Token da conta Z-API (aba Segurança)
// Sem as variáveis, a função só registra no log e não envia nada.

import { getStore, getDeployStore } from '@netlify/blobs';

function abrirStore() {
  if (Netlify.context?.deploy.context === 'production') {
    return getStore({ name: 'agendamentos', consistency: 'strong' });
  }
  return getDeployStore({ name: 'agendamentos', consistency: 'strong' });
}

const digitos = (s) => String(s || '').replace(/\D/g, '');

function dataBonita(iso) {
  const [a, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(a, m - 1, d)).toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long', timeZone: 'UTC',
  });
}

export default async () => {
  const urlEnvio = Netlify.env.get('ZAPI_SEND_TEXT_URL');
  const clientToken = Netlify.env.get('ZAPI_CLIENT_TOKEN');

  // amanhã no horário de Brasília
  const amanha = new Date(Date.now() - 3 * 60 * 60 * 1000 + 24 * 60 * 60 * 1000)
    .toISOString().slice(0, 10);

  const store = abrirStore();
  const { blobs } = await store.list({ prefix: 'ag-' });
  const todos = (await Promise.all(blobs.map((b) => store.get(b.key, { type: 'json' })))).filter(Boolean);

  const paraLembrar = todos.filter(
    (ag) => ag.data === amanha &&
      (ag.status === 'pendente' || ag.status === 'confirmado') &&
      !ag.lembreteEnviado
  );

  if (!urlEnvio || !clientToken) {
    console.log(`Lembretes: ${paraLembrar.length} agendamento(s) para amanhã (${amanha}), mas o envio de WhatsApp não está configurado (ZAPI_SEND_TEXT_URL / ZAPI_CLIENT_TOKEN).`);
    return;
  }

  let enviados = 0;
  for (const ag of paraLembrar) {
    const mensagem = [
      `Olá, ${ag.nome.split(' ')[0]}! 💅 Aqui é do Nails & More Salon.`,
      `Passando para lembrar do seu horário amanhã, ${dataBonita(ag.data)}, às ${ag.hora}, no ${ag.unidade}.`,
      ag.profissional ? `Você será atendida por ${ag.profissional}.` : '',
      `Serviços: ${ag.servicos.map((s) => s.nome).join(', ')}.`,
      '',
      'Responda SIM para confirmar. Se precisar remarcar, é só avisar por aqui. Até amanhã! 🌸',
    ].filter(Boolean).join('\n');

    try {
      const r = await fetch(urlEnvio, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'client-token': clientToken },
        body: JSON.stringify({ phone: `55${digitos(ag.telefone)}`, message: mensagem }),
      });
      if (r.ok) {
        ag.lembreteEnviado = true;
        await store.setJSON(ag.id, ag);
        enviados++;
      } else {
        console.log(`Lembrete falhou para ${ag.id}: HTTP ${r.status}`, await r.text());
      }
    } catch (e) {
      console.log(`Lembrete falhou para ${ag.id}:`, e.message);
    }
  }
  console.log(`Lembretes: ${enviados}/${paraLembrar.length} enviados para ${amanha}.`);
};

export const config = {
  schedule: '0 12 * * *', // 12:00 UTC = 09:00 em Brasília
};
