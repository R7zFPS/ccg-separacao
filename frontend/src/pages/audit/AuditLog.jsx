/**
 * Página de Audit Log — /audit
 * Disponível apenas para super_admin
 * Exibe historico_acoes com filtros por tipo, usuário, período e paginação
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Shield, RefreshCw, ChevronLeft, ChevronRight,
  Filter, Clock, User, FileText, Package,
  CheckCircle, AlertTriangle, Send, Download,
} from 'lucide-react';
import { auditApi, usuariosApi } from '../../services/api';
import { Spinner }               from '../../components/ui/Spinner';
import { ErroCarregamento }      from '../../components/ui/ErroCarregamento';
import { formatarDataHora }      from '../../utils/formatters';
import { usePageTitle }          from '../../hooks/usePageTitle';

// ── Ícone por tipo de ação ──────────────────────────────────
const ICONE_ACAO = {
  mudanca_status:        <Clock className="w-4 h-4 text-marinho-500" />,
  atribuicao_estoquista: <User className="w-4 h-4 text-orange-500" />,
  proposta_criada:       <Send className="w-4 h-4 text-sky-500" />,
  proposta_aprovada:     <CheckCircle className="w-4 h-4 text-emerald-500" />,
  proposta_recusada:     <AlertTriangle className="w-4 h-4 text-red-500" />,
};

// ── Cor do badge por tipo de ação ──────────────────────────
const COR_ACAO = {
  mudanca_status:        'bg-marinho-50 text-marinho-700',
  atribuicao_estoquista: 'bg-orange-50 text-orange-700',
  proposta_criada:       'bg-sky-50 text-sky-700',
  proposta_aprovada:     'bg-emerald-50 text-emerald-700',
  proposta_recusada:     'bg-red-50 text-red-700',
};

// ── Formata detalhe (objeto JSON) para exibição legível ──────
function DetalheAcao({ acao, detalhe }) {
  if (!detalhe) return <span className="text-marinho-300">—</span>;

  if (acao === 'mudanca_status') {
    return (
      <span>
        <span className="text-marinho-400">{detalhe.de}</span>
        <span className="text-marinho-200 mx-1">→</span>
        <span className="font-medium text-marinho-800">{detalhe.para}</span>
        {detalhe.obs && (
          <span className="text-marinho-300 italic"> · "{detalhe.obs}"</span>
        )}
        {detalhe.foto && (
          <span className="ml-1 text-xs text-purple-600 font-medium">📷 foto</span>
        )}
      </span>
    );
  }
  if (acao === 'atribuicao_estoquista') {
    return <span className="text-marinho-700">→ {detalhe.estoquista_nome}</span>;
  }
  if (acao === 'proposta_criada') {
    return <span className="text-marinho-700">data: {detalhe.data_sugerida}</span>;
  }
  if (acao === 'proposta_aprovada') {
    return <span className="text-marinho-700">{detalhe.data_entrega} · {detalhe.endereco}</span>;
  }
  if (acao === 'proposta_recusada') {
    return <span className="text-marinho-700">{detalhe.motivo || 'sem motivo'}</span>;
  }
  return <span className="text-marinho-300 text-xs font-mono">{JSON.stringify(detalhe)}</span>;
}

// ── Exportar CSV ────────────────────────────────────────────
function exportarCSV(acoes) {
  const linhas = [
    ['Data/Hora', 'Usuário', 'Role', 'Ação', 'Detalhe', 'Solicitação', 'IP'],
    ...acoes.map((a) => [
      a.created_at,
      a.usuario_nome,
      a.usuario_role,
      a.acao_label,
      JSON.stringify(a.detalhe || {}),
      a.solicitacao_numero || '',
      a.ip || '',
    ]),
  ];
  const csv  = linhas.map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a'); a.href = url;
  a.download = `audit_${new Date().toISOString().slice(0,10)}.csv`;
  a.click(); URL.revokeObjectURL(url);
}

// ───────────────────────────────────────────────────────────
export default function AuditLog() {
  usePageTitle('Audit Log');
  const [acoes,      setAcoes]    = useState([]);
  const [resumo,     setResumo]   = useState(null);
  const [tipos,      setTipos]    = useState([]);
  const [usuarios,   setUsuarios] = useState([]);
  const [carregando, setCarr]     = useState(true);
  const [erro,       setErro]     = useState('');
  const [total,      setTotal]    = useState(0);
  const [totalPags,  setTotalPags]= useState(1);

  const [filtros, setFiltros] = useState({
    acao:        '',
    usuario_id:  '',
    data_inicio: '',
    data_fim:    '',
    pagina:      1,
    limite:      50,
  });

  const buscar = useCallback(async () => {
    setCarr(true);
    setErro('');
    try {
      const params = { ...filtros };
      // Remove campos vazios
      Object.keys(params).forEach((k) => { if (!params[k]) delete params[k]; });

      const [resAcoes, resResumo] = await Promise.all([
        auditApi.listar(params),
        resumo ? Promise.resolve(null) : auditApi.resumo(),
      ]);

      if (resAcoes.data.sucesso) {
        const d = resAcoes.data.dados;
        setAcoes(d.acoes);
        setTipos(d.tipos);
        setTotal(d.total);
        setTotalPags(d.total_paginas);
      }
      if (resResumo?.data?.sucesso) {
        setResumo(resResumo.data.dados);
      }
    } catch { setErro('Erro ao carregar o audit log. Verifique sua conexão.'); }
    finally  { setCarr(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros]);

  // Carrega lista de usuários para o select de filtro
  useEffect(() => {
    usuariosApi.listar({ ativo: 'true' })
      .then(({ data }) => setUsuarios(data.dados?.usuarios || []))
      .catch(() => {});
  }, []);

  useEffect(() => { buscar(); }, [buscar]);

  function handleFiltro(campo, valor) {
    setFiltros((prev) => ({ ...prev, [campo]: valor, pagina: 1 }));
  }
  function irPagina(p) {
    setFiltros((prev) => ({ ...prev, pagina: p }));
  }
  function limparFiltros() {
    setFiltros({ acao: '', usuario_id: '', data_inicio: '', data_fim: '', pagina: 1, limite: 50 });
  }

  const temFiltroAtivo = filtros.acao || filtros.usuario_id || filtros.data_inicio || filtros.data_fim;

  return (
    <div className="space-y-6">

      {/* Cabeçalho */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-marinho-600" />
          <div>
            <h1 className="text-xl font-bold text-marinho-900">Audit Log</h1>
            <p className="text-sm text-marinho-300">{total} registro{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={buscar}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <RefreshCw className="w-4 h-4" /> Atualizar
          </button>
          {acoes.length > 0 && (
            <button
              onClick={() => exportarCSV(acoes)}
              className="btn-secondary flex items-center gap-2 text-sm"
            >
              <Download className="w-4 h-4" /> CSV
            </button>
          )}
        </div>
      </div>

      {/* Cards de resumo */}
      {resumo && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {Object.entries(resumo.porAcao).map(([key, { total: t, label }]) => (
            <div key={key} className="card-base p-4 flex items-start gap-3">
              <span className="mt-0.5">{ICONE_ACAO[key] || <Package className="w-4 h-4 text-marinho-300" />}</span>
              <div className="min-w-0">
                <p className="text-2xl font-bold text-marinho-900">{t}</p>
                <p className="text-xs text-marinho-400 leading-tight">{label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Atividade últimos 7 dias */}
      {resumo?.ultimos7?.length > 0 && (
        <div className="card-base p-5">
          <h2 className="text-sm font-semibold text-marinho-700 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-marinho-600" />
            Atividade — últimos 7 dias
          </h2>
          <div className="flex items-end gap-2 h-20">
            {(() => {
              const max = Math.max(...resumo.ultimos7.map((d) => d.total), 1);
              return resumo.ultimos7.map((d) => (
                <div key={d.dia} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs text-marinho-400">{d.total}</span>
                  <div
                    className="w-full bg-marinho-500 rounded-t"
                    style={{ height: `${Math.round((d.total / max) * 56)}px`, minHeight: '4px' }}
                  />
                  <span className="text-xs text-marinho-300">{d.dia.slice(5)}</span>
                </div>
              ));
            })()}
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="card-base p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-marinho-400" />
          <span className="text-sm font-semibold text-marinho-700">Filtros</span>
          {temFiltroAtivo && (
            <button
              onClick={limparFiltros}
              className="ml-auto text-xs text-red-500 hover:text-red-700"
            >
              Limpar filtros
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Tipo de ação */}
          <select
            value={filtros.acao}
            onChange={(e) => handleFiltro('acao', e.target.value)}
            className="input-base text-sm"
          >
            <option value="">Todos os tipos</option>
            {tipos.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>

          {/* Usuário */}
          <select
            value={filtros.usuario_id}
            onChange={(e) => handleFiltro('usuario_id', e.target.value)}
            className="input-base text-sm"
          >
            <option value="">Todos os usuários</option>
            {usuarios.map((u) => (
              <option key={u.id} value={u.id}>{u.nome} ({u.role})</option>
            ))}
          </select>

          {/* Data início */}
          <input
            type="date"
            value={filtros.data_inicio}
            onChange={(e) => handleFiltro('data_inicio', e.target.value)}
            className="input-base text-sm"
          />

          {/* Data fim */}
          <input
            type="date"
            value={filtros.data_fim}
            onChange={(e) => handleFiltro('data_fim', e.target.value)}
            className="input-base text-sm"
          />
        </div>
      </div>

      {/* Erro de carregamento com retry */}
      {erro && !carregando && (
        <ErroCarregamento
          mensagem={erro}
          onTentar={buscar}
          tentando={carregando}
        />
      )}

      {/* Tabela */}
      {!erro && (
      <div className="card-base overflow-hidden">
        {carregando ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : acoes.length === 0 ? (
          <div className="text-center py-12 text-marinho-300">
            <Shield className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Nenhuma ação registrada{temFiltroAtivo ? ' com estes filtros' : ''}.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-marinho-50 border-b border-marinho-100/60">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-marinho-400 uppercase tracking-wide">Data/Hora</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-marinho-400 uppercase tracking-wide">Usuário</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-marinho-400 uppercase tracking-wide">Ação</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-marinho-400 uppercase tracking-wide">Detalhe</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-marinho-400 uppercase tracking-wide">Solicitação</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-marinho-400 uppercase tracking-wide">IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-marinho-50">
                  {acoes.map((a) => (
                    <tr key={a.id} className="hover:bg-marinho-50 transition-colors">
                      <td className="px-4 py-3 text-marinho-400 text-xs whitespace-nowrap">
                        {formatarDataHora(a.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-marinho-900 text-xs">{a.usuario_nome}</p>
                        <p className="text-marinho-300 text-xs">{a.usuario_role}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium
                          ${COR_ACAO[a.acao] || 'bg-marinho-50 text-marinho-600'}`}>
                          {ICONE_ACAO[a.acao]}
                          {a.acao_label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs max-w-xs truncate">
                        <DetalheAcao acao={a.acao} detalhe={a.detalhe} />
                      </td>
                      <td className="px-4 py-3 text-xs text-marinho-600 font-medium">
                        {a.solicitacao_numero ? `#${a.solicitacao_numero}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-marinho-300 font-mono">
                        {a.ip || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            {totalPags > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-marinho-100/60">
                <p className="text-xs text-marinho-400">
                  Página {filtros.pagina} de {totalPags} · {total} registros
                </p>
                <div className="flex gap-1">
                  <button
                    onClick={() => irPagina(filtros.pagina - 1)}
                    disabled={filtros.pagina <= 1}
                    className="p-1.5 rounded hover:bg-marinho-50 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {/* Botões numéricos */}
                  {Array.from({ length: Math.min(totalPags, 7) }, (_, i) => {
                    const p = filtros.pagina <= 4
                      ? i + 1
                      : filtros.pagina >= totalPags - 3
                      ? totalPags - 6 + i
                      : filtros.pagina - 3 + i;
                    if (p < 1 || p > totalPags) return null;
                    return (
                      <button
                        key={p}
                        onClick={() => irPagina(p)}
                        className={`w-8 h-8 rounded text-xs font-medium transition-colors
                          ${p === filtros.pagina
                            ? 'bg-marinho-600 text-white'
                            : 'hover:bg-marinho-50 text-marinho-600'}`}
                      >
                        {p}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => irPagina(filtros.pagina + 1)}
                    disabled={filtros.pagina >= totalPags}
                    className="p-1.5 rounded hover:bg-marinho-50 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      )}
    </div>
  );
}
