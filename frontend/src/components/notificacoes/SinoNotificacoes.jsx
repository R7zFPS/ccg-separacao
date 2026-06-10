/**
 * Componente Sino de Notificações
 * Exibe badge com contador de não lidas e dropdown com a lista
 */

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, ChevronRight } from 'lucide-react';
import { useNotificacoes } from '../../context/NotificacoesContext';
import { tempoRelativo } from '../../utils/formatters';

const CORES_TIPO = {
  sucesso: 'bg-green-100 text-green-700',
  alerta:  'bg-yellow-100 text-yellow-700',
  erro:    'bg-red-100 text-red-700',
  info:    'bg-marinho-100 text-marinho-700',
};

export function SinoNotificacoes() {
  const [aberto, setAberto] = useState(false);
  const { notificacoes, totalNaoLidas, marcarLida, marcarTodasLidas } = useNotificacoes();
  const containerRef = useRef(null);
  const autoLerRef   = useRef(null);
  const navigate     = useNavigate();

  // Fecha ao clicar fora
  useEffect(() => {
    function handleClickFora(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setAberto(false);
      }
    }
    document.addEventListener('mousedown', handleClickFora);
    return () => document.removeEventListener('mousedown', handleClickFora);
  }, []);

  // Ao abrir, marca todas como lidas após 4s (leu visualmente)
  useEffect(() => {
    if (aberto && totalNaoLidas > 0) {
      autoLerRef.current = setTimeout(() => {
        marcarTodasLidas();
      }, 4000);
    }
    return () => clearTimeout(autoLerRef.current);
  }, [aberto, totalNaoLidas, marcarTodasLidas]);

  return (
    <div className="relative" ref={containerRef}>
      {/* Botão do sino */}
      <button
        onClick={() => setAberto(!aberto)}
        className="relative p-2 rounded-lg text-marinho-400 hover:text-marinho-700
                   hover:bg-marinho-50 transition-colors"
        aria-label={`Notificações${totalNaoLidas > 0 ? ` — ${totalNaoLidas} não lidas` : ''}`}
      >
        <Bell className="w-5 h-5" />
        {/* Badge contador */}
        {totalNaoLidas > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px]
                           bg-red-500 text-white text-xs font-bold rounded-full
                           flex items-center justify-center px-1">
            {totalNaoLidas > 99 ? '99+' : totalNaoLidas}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {aberto && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl
                        shadow-xl border border-marinho-100 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3
                          border-b border-marinho-100/60">
            <h3 className="font-semibold text-marinho-900 text-sm">
              Notificações
              {totalNaoLidas > 0 && (
                <span className="ml-2 text-xs bg-red-100 text-red-700
                                  px-1.5 py-0.5 rounded-full font-medium">
                  {totalNaoLidas} nova{totalNaoLidas !== 1 ? 's' : ''}
                </span>
              )}
            </h3>
            {totalNaoLidas > 0 && (
              <button
                onClick={marcarTodasLidas}
                className="flex items-center gap-1 text-xs text-marinho-600
                           hover:text-marinho-800 transition-colors"
                title="Marcar todas como lidas"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Marcar todas
              </button>
            )}
          </div>

          {/* Lista (máx. 5 itens no dropdown — "ver todas" no rodapé) */}
          <div className="max-h-80 overflow-y-auto divide-y divide-marinho-50">
            {notificacoes.length === 0 ? (
              <div className="py-8 text-center">
                <Bell className="w-8 h-8 text-marinho-200 mx-auto mb-2" />
                <p className="text-marinho-400 text-sm">Nenhuma notificação</p>
              </div>
            ) : (
              notificacoes.slice(0, 6).map((notif) => (
                <button
                  key={notif.id}
                  onClick={() => {
                    marcarLida(notif.id);
                    setAberto(false);
                    if (notif.solicitacao_id) navigate(`/solicitacoes/${notif.solicitacao_id}`);
                  }}
                  className={`w-full text-left px-4 py-3 hover:bg-marinho-50
                              transition-colors ${!notif.lida ? 'bg-marinho-50/50' : ''}`}
                >
                  <div className="flex items-start gap-2">
                    {/* Indicador de não lida */}
                    {!notif.lida && (
                      <span className="mt-1.5 w-2 h-2 bg-marinho-500 rounded-full
                                        flex-shrink-0" />
                    )}
                    <div className={!notif.lida ? '' : 'ml-4'}>
                      <p className={`text-sm font-medium ${
                        !notif.lida ? 'text-marinho-900' : 'text-marinho-600'
                      }`}>
                        {notif.titulo}
                      </p>
                      <p className="text-xs text-marinho-400 mt-0.5 line-clamp-2">
                        {notif.mensagem}
                      </p>
                      <p className="text-xs text-marinho-300 mt-1">
                        {tempoRelativo(notif.created_at)}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Rodapé — "Ver todas" */}
          <div className="border-t border-marinho-100/60 px-4 py-2.5">
            <button
              onClick={() => { setAberto(false); navigate('/notificacoes'); }}
              className="w-full flex items-center justify-center gap-1.5 text-xs
                         text-marinho-600 hover:text-marinho-800 font-medium
                         py-1 rounded transition-colors"
            >
              Ver todas as notificações
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
