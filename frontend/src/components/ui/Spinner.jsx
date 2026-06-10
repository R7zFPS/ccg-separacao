/**
 * Componente Spinner — Indicador de carregamento
 */

export function Spinner({ tamanho = 'md', className = '' }) {
  const tamanhos = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div
      className={`
        ${tamanhos[tamanho]}
        rounded-full border-marinho-100 border-t-marinho-600
        animate-spin ${className}
      `}
      role="status"
      aria-label="Carregando..."
    />
  );
}

/**
 * Tela de carregamento full-screen
 */
export function CarregandoTela({ mensagem = 'Carregando...' }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <Spinner tamanho="lg" />
      <p className="text-marinho-400 text-sm">{mensagem}</p>
    </div>
  );
}
