/**
 * Página completa de Notificações
 * Visível para: todos os perfis
 * Lista paginada com filtro lidas/não-lidas, marcar todas lidas,
 * clicar na notificação navega para a solicitação correspondente
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, CheckCheck, RefreshCw, Filter,
  CheckCircle, XCircle, ChevronRight,
} from 'lucide-react';
import { notificacoesApi } from '../../services/api';
import { useNotificacoes } from '../../context/NotificacoesContext';
import { Spinner }          from '../../components/ui/Spinner';
import { ErroCarregamento } from '../../components/ui/ErroCarregamento';
import { tempoRelativo, formatarDataHora } from '../../utils/formatters';
import { usePageTitle }     from '../../hooks/usePageTitle';

const FILTROS = [
  { value: 'todas',    label: 'Todas' },
  { value: 'nao_lidas', label: 'Não lidas' },
  { value: 'lidas',    label: 'Lidas' },
];

const CORES_TIPO = {
  sucesso: { badge: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
  alerta:  { badge: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500' },
  erro:    { badge: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
  info:    { badge: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
};

const POR_PAGINA = 30;

export default function Notificacoes() {
  usePageTitle('Notificações');
  const navigate  = useNavigate();
  const { marcarLida, marcarTodasLidas, buscarNotificacoes } = useNotificacoes();

  const [lista,      setLista]      = useState([]);
  const [total,      setTotal]      = useState(0);
  const [naoLidas,   setNaoLidas]   = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [erro,       setErro]       = useState('');
  const [filtro,     setFiltro]     = useState('todas');
  const [pagina,     setPagina]     = useState(1);

  const buscar = useCallback(async () => {
    setCarregando(true);
    setErro('');
    try {
      const params = { limite: POR_PAGINA, pagina };
      if (filtro === 'nao_lidas') params.lida = 0;
      if (filtro === 'lidas')     params.lida = 1;

      const { data } = await notificacoesApi.listar(params);
      if (data.sucesso) {
        setLista(data.dados.notificacoes || []);
        setTotal(data.dados.total        ?? data.dados.notificacoes?.length ?? 0);
        setNaoLidas(data.dados.totalNaoLidas ?? 0);
      }
    } catch { setErro('Erro ao carregar notificações. Verifique sua conexão.'); }
    finally { setCarregando(false); }
  }, [filtro, pagina]);

  useEffect(() => { buscar(); }, [buscar]);

  // Ao trocar filtro, volta para página 1
  function aplicarFiltro(f) {
    setFiltro(f);
    setPagina(1);
  }

  async function handleMarcarLida(id) {
    await marcarLida(id);
    // Atualiza item local sem re-fetch
    setLista((prev) => prev.map((n) => (n.id === id ? { ...n, lida: 1 } : n)));
    setNaoLidas((prev) => Math.max(0, prev - 1));
  }

  async function handleMarcarTodasLidas() {
    await marcarTodasLidas();
    setLista((prev) => prev.map((n) => ({ ...n, lida: 1 })));
    setNaoLidas(0);
  }

  function handleClicarNotif(notif) {
    // Marca como lida
    if (!notif.lida) handleMarcarLida(notif.id);
    // Navega para a solicitação se houver referência
    if (notif.solicitacao_id) {
      navigate(`/solicitacoes/${notif.solicitacao_id}`);
    }
  }

  const totalPaginas = Math.ceil(total / POR_PAGINA);

  return (
    <div className="max-w-3xl mx-auto space-y-5">

      {/* Cabeçalho */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="w-6 h-6 text-marinho-600" />
            Notificações
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {naoLidas > 0
              ? `${naoLidas} não lida${naoLidas !== 1 ? 's' : ''}`
              : 'Todas em dia'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {naoLidas > 0 && (
            <button
              onClick={handleMarcarTodasLidas}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium
                         text-blue-600 hover:text-blue-800 hover:bg-blue-50
                         rounded-lg transition-colors"
            >
              <CheckCheck className="w-4 h-4" />
              Marcar todas lidas
            </button>
          )}
          <button
            onClick={buscar}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            title="Atualizar"
          >
            <RefreshCw className={`w-4 h-4 ${carregando ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="card-base p-3 flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
        {FILTROS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => aplicarFiltro(value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
              ${filtro === value
                ? 'bg-marinho-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Erro de carregamento com retry */}
      {erro && !carregando && (
        <ErroCarregamento
          mensagem={erro}
          onTentar={buscar}
          tentando={carregando}
        />
      )}

      {/* Lista */}
      {carregando ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : !erro && lista.length === 0 ? (
        <div className="card-base p-14 text-center">
          <CheckCircle className="w-14 h-14 text-gray-200 mx-auto mb-3" />
          <p className="font-medium text-gray-600">
            {filtro === 'nao_lidas'
              ? 'Nenhuma notificação não lida.'
              : filtro === 'lidas'
              ? 'Nenhuma notificação lida ainda.'
              : 'Nenhuma notificação encontrada.'}
          </p>
        </div>
      ) : !erro ? (
        <>
          <div className="card-base overflow-hidden divide-y divide-gray-50">
            {lista.map((notif) => {
              const cores  = CORES_TIPO[notif.tipo] || CORES_TIPO.info;
              const naolida = !notif.lida;

              return (
                <button
                  key={notif.id}
                  onClick={() => handleClicarNotif(notif)}
                  className={`w-full text-left px-5 py-4 flex items-start gap-3
                               hover:bg-gray-50 transition-colors group
                               ${naolida ? 'bg-blue-50/40' : ''}`}
                >
                  {/* Indicador de lida/não-lida */}
                  <div className="flex-shrink-0 mt-1">
                    {naolida
                      ? <span className={`block w-2.5 h-2.5 rounded-full ${cores.dot}`} />
                      : <span className="block w-2.5 h-2.5 rounded-full bg-gray-200" />
                    }
                  </div>

                  {/* Conteúdo */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm font-medium leading-snug
                        ${naolida ? 'text-gray-900' : 'text-gray-600'}`}>
                        {notif.titulo}
                      </p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                                        flex-shrink-0 ${cores.badge}`}>
                        {notif.tipo}
                      </span>
                    </div>

                    {notif.mensagem && (
                      <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">
                        {notif.mensagem}
                      </p>
                    )}

                    <div className="flex items-center justify-between mt-1.5">
                      <span
                        className="text-xs text-gray-400"
                        title={formatarDataHora(notif.created_at)}
                      >
                        {tempoRelativo(notif.created_at)}
                      </span>
                      {notif.solicitacao_id && (
                        <span className="flex items-center gap-0.5 text-xs text-marinho-500
                                          group-hover:text-marinho-700 transition-colors">
                          Ver solicitação <ChevronRight className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Botão marcar lida individualmente (quando não lida) */}
                  {naolida && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleMarcarLida(notif.id); }}
                      className="flex-shrink-0 p-1 rounded text-gray-300 hover:text-blue-500
                                  hover:bg-blue-50 transition-colors mt-0.5"
                      title="Marcar como lida"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  )}
                </button>
              );
            })}
          </div>

          {/* Paginação */}
          {totalPaginas > 1 && (
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>
                Página {pagina} de {totalPaginas} ({total} registros)
              </span>
              <div className="flex gap-2">
                <button
                  disabled={pagina <= 1}
                  onClick={() => setPagina((p) => p - 1)}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40
                              hover:bg-gray-50 transition-colors disabled:cursor-not-allowed"
                >
                  ← Anterior
                </button>
                <button
                  disabled={pagina >= totalPaginas}
                  onClick={() => setPagina((p) => p + 1)}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40
                              hover:bg-gray-50 transition-colors disabled:cursor-not-allowed"
                >
                  Próxima →
                </button>
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
