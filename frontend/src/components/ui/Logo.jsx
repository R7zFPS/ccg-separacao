/**
 * Logo Casa das Correntes
 * Reprodução fiel do logo oficial: losango + 3 elos de corrente
 * Usa currentColor → funciona em fundos escuros (branco) e claros (marinho)
 */

/**
 * SVG do ícone: losango + 3 elos de corrente
 * Sem texto — texto fica em HTML separado para permitir corTexto independente
 */
function LogoIconeSVG({ className = '' }) {
  return (
    <svg
      viewBox="0 0 220 212"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* ── Losango ─────────────────────────────────── */}
      <path
        d="M 110 8 L 208 106 L 110 204 L 12 106 Z"
        stroke="currentColor"
        strokeWidth="6"
        fill="none"
        strokeLinejoin="miter"
      />

      {/* ── 3 elos de corrente horizontais ──────────── */}
      {/* Elo esquerdo */}
      <rect x="30"  y="93" width="58" height="26" rx="13"
            stroke="currentColor" strokeWidth="5" fill="none" />
      {/* Elo central */}
      <rect x="81"  y="93" width="58" height="26" rx="13"
            stroke="currentColor" strokeWidth="5" fill="none" />
      {/* Elo direito */}
      <rect x="132" y="93" width="58" height="26" rx="13"
            stroke="currentColor" strokeWidth="5" fill="none" />
    </svg>
  );
}

/**
 * Componente de logo exportado
 * variante: "horizontal" | "vertical" | "icone"
 * corIcone: classe Tailwind para o SVG (ex: "text-white", "text-marinho-700")
 * corTexto: classe Tailwind para o texto (ex: "text-white", "text-marinho-800")
 */
export function LogoCasaDasCorrentes({
  variante = 'horizontal',
  className = '',
  corIcone = 'text-white',
  corTexto = 'text-white',
}) {
  // ── Apenas ícone ──────────────────────────────────
  if (variante === 'icone') {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <LogoIconeSVG className={`w-full h-full ${corIcone}`} />
      </div>
    );
  }

  // ── Vertical: ícone em cima, texto embaixo ────────
  // Usado na tela de login (desktop escuro e mobile claro)
  if (variante === 'vertical') {
    return (
      <div className={`flex flex-col items-center gap-4 ${className}`}>
        <LogoIconeSVG className={`w-36 h-36 ${corIcone}`} />
        <div className="text-center leading-tight">
          <p className={`text-2xl font-black tracking-widest uppercase ${corTexto}`}>
            CASA DAS CORRENTES
          </p>
          <p className={`text-sm tracking-widest uppercase opacity-70 mt-0.5 ${corTexto}`}>
            GUANABARA
          </p>
        </div>
      </div>
    );
  }

  // ── Horizontal (default): ícone + texto ao lado ───
  // Usado no Header e Sidebar (fundo marinho → texto branco)
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <LogoIconeSVG className={`w-9 h-9 flex-shrink-0 ${corIcone}`} />
      <div className="hidden sm:block leading-tight">
        <p className={`text-sm font-black tracking-wide uppercase ${corTexto}`}>
          Casa das Correntes
        </p>
        <p className={`text-xs tracking-widest uppercase opacity-70 ${corTexto}`}>
          Separação de Estoque
        </p>
      </div>
    </div>
  );
}
