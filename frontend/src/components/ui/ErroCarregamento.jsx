/**
 * ErroCarregamento — exibido quando uma página falha ao buscar dados.
 *
 * Props:
 *   mensagem   {string}    — descrição do erro (padrão genérico)
 *   onTentar   {function}  — callback chamado ao clicar em "Tentar novamente"
 *   tentando   {boolean}   — mostra spinner no botão enquanto recarrega
 */

import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Spinner } from './Spinner';

export function ErroCarregamento({
  mensagem = 'Não foi possível carregar os dados. Verifique sua conexão.',
  onTentar,
  tentando = false,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-red-100 flex items-center
                      justify-center mb-4">
        <AlertTriangle className="w-8 h-8 text-red-500" />
      </div>

      <h3 className="text-base font-semibold text-gray-800 mb-1">
        Falha ao carregar
      </h3>

      <p className="text-sm text-gray-500 max-w-xs mb-6">
        {mensagem}
      </p>

      {onTentar && (
        <button
          onClick={onTentar}
          disabled={tentando}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl
                     bg-blue-600 hover:bg-blue-700 text-white text-sm
                     font-semibold disabled:opacity-60 transition-colors"
        >
          {tentando
            ? <Spinner tamanho="sm" />
            : <RefreshCw className="w-4 h-4" />}
          {tentando ? 'Carregando…' : 'Tentar novamente'}
        </button>
      )}
    </div>
  );
}
