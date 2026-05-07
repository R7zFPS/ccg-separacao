/**
 * Página de Agendamentos — Gerência e admins
 * Abas: Para Agendar · Agendados · Em Rota · Calendário
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar, Clock, CheckCircle, MapPin,
  Truck, RefreshCw, ArrowRight,
  ChevronLeft, ChevronRight, LayoutGrid,
} from 'lucide-react';
import { solicitacoesApi }  from '../../services/api';
import { Spinner }          from '../../components/ui/Spinner';
import { BadgeStatus }      from '../../components/solicitacoes/BadgeStatus';
import { formatarDataHora, tempoRelativo } from '../../utils/formatters';
import { usePageTitle }     from '../../hooks/usePageTitle';
import { ErroCarregamento } from '../../components/ui/ErroCarregamento';

const ABA = {
  PRONTOS:    'material_separado',
  AGENDADOS:  'agendamento_realizado',
  ROTA:       'rota_enviada',
  CALENDARIO: 'calendario',
};

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

// ── Mini-calendário mensal ────────────────────────────────
function CalendarioEntregas({ agendados, onSelecionarDia, diaSelecionado }) {
  const hoje = new Date();
  const [mes,  setMes]  = useState(hoje.getMonth());
  const [ano,  setAno]  = useState(hoje.getFullYear());

  // Mapa dia → lista de solicitações com data de entrega naquele dia
  const mapaEntregas = useMemo(() => {
    const m = {};
    agendados.forEach((s) => {
      // Tenta pegar data_entrega do agendamento — campo disponível via join ou updated_at
      const raw = s.data_entrega || s.updated_at;
      if (!raw) return;
      const dia = raw.slice(0, 10);
      if (!m[dia]) m[dia] = [];
      m[dia].push(s);
    });
    return m;
  }, [agendados]);

  // Grade do mês
  const grade = useMemo(() => {
    const primeiroDia = new Date(ano, mes, 1).getDay(); // 0=Dom
    const ultimoDia   = new Date(ano, mes + 1, 0).getDate();
    const dias = [];
    for (let i = 0; i < primeiroDia; i++) dias.push(null); // células vazias
    for (let d = 1; d <= ultimoDia; d++) dias.push(d);
    return dias;
  }, [mes, ano]);

  function diaStr(d) {
    return `${ano}-${String(mes + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  }

  function navMes(delta) {
    const d = new Date(ano, mes + delta, 1);
    setMes(d.getMonth());
    setAno(d.getFullYear());
  }

  return (
    <div className="card-base p-5">
      {/* Navegação de mês */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => navMes(-1)}
          className="p-1.5 rounded hover:bg-gray-100 transition-colors">
          <ChevronLeft className="w-4 h-4 text-gray-600" />
        </button>
        <h2 className="text-base font-semibold text-gray-900">
          {MESES[mes]} {ano}
        </h2>
        <button onClick={() => navMes(1)}
          className="p-1.5 rounded hover:bg-gray-100 transition-colors">
          <ChevronRight className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      {/* Cabeçalho de dias da semana */}
      <div className="grid grid-cols-7 mb-1">
        {DIAS_SEMANA.map((d) => (
          <div key={d} className="text-center text-xs font-semibold text-gray-400 py-1">{d}</div>
        ))}
      </div>

      {/* Grade de dias */}
      <div className="grid grid-cols-7 gap-1">
        {grade.map((dia, idx) => {
          if (!dia) return <div key={`v-${idx}`} />;
          const str       = diaStr(dia);
          const entregas  = mapaEntregas[str] || [];
          const temEntrega = entregas.length > 0;
          const ehHoje     = str === hoje.toISOString().slice(0, 10);
          const selecionado = diaSelecionado === str;

          return (
            <button
              key={str}
              onClick={() => onSelecionarDia(selecionado ? null : str)}
              className={`relative flex flex-col items-center py-1.5 rounded-lg text-sm
                transition-all
                ${selecionado
                  ? 'bg-blue-600 text-white shadow-md'
                  : ehHoje
                  ? 'bg-blue-50 text-blue-800 font-bold border border-blue-200'
                  : temEntrega
                  ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                  : 'text-gray-600 hover:bg-gray-50'
                }`}
            >
              <span className="font-medium leading-tight">{dia}</span>
              {temEntrega && (
                <span className={`text-xs font-semibold leading-tight
                  ${selecionado ? 'text-blue-100' : 'text-emerald-600'}`}>
                  {entregas.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Legenda */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
        <span className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300 inline-block" />
          Tem entregas
        </span>
        <span className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="w-3 h-3 rounded bg-blue-100 border border-blue-300 inline-block" />
          Hoje
        </span>
        {diaSelecionado && (
          <button
            onClick={() => onSelecionarDia(null)}
            className="ml-auto text-xs text-red-500 hover:text-red-700"
          >
            Limpar filtro
          </button>
        )}
      </div>

      {/* Lista do dia selecionado */}
      {diaSelecionado && (
        <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
          <p className="text-sm font-semibold text-gray-700">
            Entregas em {diaSelecionado.split('-').reverse().join('/')}
            {' '}({(mapaEntregas[diaSelecionado] || []).length})
          </p>
          {(mapaEntregas[diaSelecionado] || []).length === 0 ? (
            <p className="text-sm text-gray-400">Nenhuma entrega neste dia.</p>
          ) : (
            (mapaEntregas[diaSelecionado] || []).map((s) => (
              <div key={s.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">#{s.numero_proposta}</p>
                  <p className="text-xs text-gray-500">{s.vendedor_nome}</p>
                </div>
                <BadgeStatus status={s.status} />
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
export default function Agendamentos() {
  usePageTitle('Agendamentos');
  const navigate = useNavigate();
  const [aba,          setAba]         = useState(ABA.PRONTOS);
  const [lista,        setLista]       = useState([]);
  const [agendados,    setAgendados]   = useState([]); // para o calendário
  const [carregando,   setCarregando]  = useState(true);
  const [erro,         setErro]        = useState('');
  const [diaSelecionado, setDia]       = useState(null);

  const buscar = useCallback(async () => {
    setCarregando(true);
    setErro('');
    try {
      if (aba === ABA.CALENDARIO) {
        // Carrega agendados + em rota para o calendário
        const [r1, r2] = await Promise.all([
          solicitacoesApi.listar({ status: ABA.AGENDADOS, limite: 200 }),
          solicitacoesApi.listar({ status: ABA.ROTA,      limite: 200 }),
        ]);
        const todos = [
          ...(r1.data.dados?.solicitacoes || []),
          ...(r2.data.dados?.solicitacoes || []),
        ];
        setAgendados(todos);
      } else {
        const { data } = await solicitacoesApi.listar({ status: aba });
        if (data.sucesso) setLista(data.dados.solicitacoes);
      }
    } catch {
      setErro('Erro ao carregar.');
    } finally {
      setCarregando(false);
    }
  }, [aba]);

  useEffect(() => { buscar(); }, [buscar]);

  const abas = [
    { key: ABA.PRONTOS,    label: 'Para Agendar', icone: <Clock className="w-4 h-4" /> },
    { key: ABA.AGENDADOS,  label: 'Agendados',    icone: <Calendar className="w-4 h-4" /> },
    { key: ABA.ROTA,       label: 'Em Rota',      icone: <Truck className="w-4 h-4" /> },
    { key: ABA.CALENDARIO, label: 'Calendário',   icone: <LayoutGrid className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-5">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-blue-600" />
            Agendamentos
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Gerencie as entregas e envie rotas para os motoristas
          </p>
        </div>
        <button onClick={buscar}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
          <RefreshCw className={`w-4 h-4 ${carregando ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Abas */}
      <div className="flex border-b border-gray-200 gap-1 overflow-x-auto">
        {abas.map(({ key, label, icone }) => (
          <button
            key={key}
            onClick={() => setAba(key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium
                         border-b-2 transition-colors -mb-px whitespace-nowrap
                         ${aba === key
                           ? 'border-blue-600 text-blue-600'
                           : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            {icone}
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

      {/* Calendário */}
      {aba === ABA.CALENDARIO && (
        carregando
          ? <div className="flex justify-center py-16"><Spinner /></div>
          : <CalendarioEntregas
              agendados={agendados}
              diaSelecionado={diaSelecionado}
              onSelecionarDia={setDia}
            />
      )}

      {/* Lista normal */}
      {aba !== ABA.CALENDARIO && (
        carregando ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : lista.length === 0 ? (
          <div className="card-base p-12 text-center">
            <CheckCircle className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">
              {aba === ABA.PRONTOS   ? 'Nenhum material pronto para agendar'
               : aba === ABA.AGENDADOS ? 'Nenhum agendamento pendente'
               :                         'Nenhuma rota em andamento'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {lista.map((s) => (
              <div key={s.id} className="card-base p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-gray-900">#{s.numero_proposta}</p>
                      <BadgeStatus status={s.status} />
                    </div>
                    <p className="text-sm text-gray-500">
                      Vendedor: <span className="font-medium text-gray-700">{s.vendedor_nome}</span>
                      {' · '}{s.setor_destino === 'loja' ? 'Loja' : 'Galpão'}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Atualizado {tempoRelativo(s.updated_at)}
                    </p>
                  </div>
                  <button
                    onClick={() => navigate(`/solicitacoes/${s.id}`)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm
                                 font-medium transition-colors flex-shrink-0
                                 ${aba === ABA.PRONTOS
                                   ? 'bg-blue-600 text-white hover:bg-blue-700'
                                   : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  >
                    {aba === ABA.PRONTOS ? (
                      <><Calendar className="w-4 h-4" /> Agendar</>
                    ) : aba === ABA.AGENDADOS ? (
                      <><Truck className="w-4 h-4" /> Enviar Rota</>
                    ) : (
                      <><ArrowRight className="w-4 h-4" /> Ver</>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
