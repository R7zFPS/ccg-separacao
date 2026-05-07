/**
 * Som de corrente — Web Audio API
 * Toca um som metálico de corrente/clique quando uma nova
 * solicitação chega para o estoquista/almoxarife.
 *
 * Não requer arquivos de áudio externos — gerado sinteticamente.
 */

let audioCtx = null;

function getAudioContext() {
  if (!audioCtx || audioCtx.state === 'closed') {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

/**
 * Toca um clique metálico de corrente.
 * offset: atraso em segundos a partir de agora
 */
function tocarClique(ctx, offset = 0) {
  const t = ctx.currentTime + offset;

  // Ruído branco curto filtrado para som metálico
  const bufferSize = ctx.sampleRate * 0.04; // 40ms
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data   = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.15));
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  // Filtro passa-alta para deixar mais "metálico"
  const hpf = ctx.createBiquadFilter();
  hpf.type = 'highpass';
  hpf.frequency.value = 1800;

  // Filtro de pico para ressonância
  const peak = ctx.createBiquadFilter();
  peak.type = 'peaking';
  peak.frequency.value = 3500;
  peak.gain.value = 8;

  // Ganho
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.6, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

  source.connect(hpf);
  hpf.connect(peak);
  peak.connect(gain);
  gain.connect(ctx.destination);

  source.start(t);
  source.stop(t + 0.06);
}

/**
 * Toca a sequência de corrente (3 cliques espaçados)
 */
export async function tocarCorrente() {
  try {
    const ctx = getAudioContext();

    // iOS/Safari requerem que o AudioContext seja "resumed" após interação
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    // 3 cliques com espaçamento de corrente caindo
    tocarClique(ctx, 0.00);
    tocarClique(ctx, 0.12);
    tocarClique(ctx, 0.22);
  } catch (e) {
    // Silencioso — browsers podem bloquear sem interação do usuário
    console.debug('[Som] Não foi possível tocar notificação:', e.message);
  }
}

/**
 * "Desbloqueia" o audio context após a primeira interação do usuário.
 * Chame isso num click/touch handler.
 */
export function desbloquearAudio() {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') ctx.resume();
  } catch {
    // Silencioso
  }
}
