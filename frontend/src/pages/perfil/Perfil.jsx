/**
 * Página de Perfil do Usuário
 * - Visualiza suas informações
 * - Upload de foto de perfil (overlay com câmera)
 * - Estatísticas pessoais por role
 * - Troca de senha
 */

import { useState, useEffect, useRef } from 'react';
import {
  User, Lock, Eye, EyeOff, Save, CheckCircle, Shield,
  Package, TrendingUp, Clock, Award, Activity, Camera,
} from 'lucide-react';
import { usuariosApi, solicitacoesApi } from '../../services/api';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useAuth }     from '../../context/AuthContext';
import { Spinner }     from '../../components/ui/Spinner';
import { LABELS_ROLE, LABELS_SETOR } from '../../utils/constantes';
import { formatarData, formatarDataHora } from '../../utils/formatters';
import { resolveFileUrl } from '../../utils/arquivos';

function gerarIniciais(nome) {
  if (!nome) return '??';
  const partes = nome.trim().split(' ').filter(Boolean);
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

function formatarTempo(seg) {
  if (!seg) return '—';
  if (seg < 60) return `${Math.round(seg)}s`;
  const m = Math.floor(seg / 60);
  const s = Math.round(seg % 60);
  if (m < 60) return s > 0 ? `${m}min ${s}s` : `${m}min`;
  return `${Math.floor(m / 60)}h ${m % 60}min`;
}

// ── Mini barra de progresso ───────────────────────────────
function BarraMeta({ pct }) {
  const cor = pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-yellow-400' : 'bg-red-400';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${cor}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <span className="text-xs text-gray-500 w-10 text-right">{pct}%</span>
    </div>
  );
}

// ── Bloco de estatísticas por role ───────────────────────
function EstatisticasPessoais({ role }) {
  const [stats,  setStats]  = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    solicitacoesApi.minhasEstatisticas()
      .then(({ data }) => { if (data.sucesso) setStats(data.dados); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-6"><Spinner /></div>;
  if (!stats)  return null;

  const v = stats.como_vendedor;
  const e = stats.como_estoquista;

  return (
    <div className="card-base p-6 space-y-5">
      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
        <Activity className="w-5 h-5 text-marinho-600" />
        Minha Performance
      </h3>

      {/* Vendedor / Gerência */}
      {v && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Como Solicitante
          </p>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-gray-900">{v.total_criadas}</p>
              <p className="text-xs text-gray-500 mt-0.5">Criadas</p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-emerald-700">{v.entregues}</p>
              <p className="text-xs text-emerald-600 mt-0.5">Entregues</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-blue-700">{v.em_andamento}</p>
              <p className="text-xs text-blue-600 mt-0.5">Em andamento</p>
            </div>
          </div>

          {v.total_criadas > 0 && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Taxa de conclusão</span>
                <span>{Math.round((v.entregues / v.total_criadas) * 100)}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${Math.min(100, Math.round((v.entregues / v.total_criadas) * 100))}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Estoquista / Almoxarife */}
      {e && e.total_atribuidos > 0 && (
        <div className={v ? 'pt-4 border-t border-gray-100' : ''}>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Como Separador
          </p>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-gray-900">{e.total_atribuidos}</p>
              <p className="text-xs text-gray-500 mt-0.5">Atribuídos</p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-emerald-700">{e.concluidos}</p>
              <p className="text-xs text-emerald-600 mt-0.5">Concluídos</p>
            </div>
          </div>

          <div className="space-y-2">
            {e.avg_segundos != null && (
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-gray-600">
                  <Clock className="w-3.5 h-3.5 text-blue-500" /> Tempo médio
                </span>
                <span className="font-semibold text-gray-900">{formatarTempo(e.avg_segundos)}</span>
              </div>
            )}
            {e.min_segundos != null && (
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-gray-600">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> Melhor tempo
                </span>
                <span className="font-semibold text-emerald-700">{formatarTempo(e.min_segundos)}</span>
              </div>
            )}
            {e.max_segundos != null && (
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-gray-600">
                  <Clock className="w-3.5 h-3.5 text-orange-400" /> Maior tempo
                </span>
                <span className="font-semibold text-gray-600">{formatarTempo(e.max_segundos)}</span>
              </div>
            )}
            {e.pct_dentro_meta != null && (
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span className="flex items-center gap-1">
                    <Award className="w-3 h-3 text-yellow-500" /> Dentro da meta (≤ 30 min)
                  </span>
                </div>
                <BarraMeta pct={e.pct_dentro_meta} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Última atividade */}
      {stats.ultima_atividade && (
        <p className="text-xs text-gray-400 pt-2 border-t border-gray-50">
          Última atividade: {formatarDataHora(stats.ultima_atividade)}
        </p>
      )}

      {/* Sem dados */}
      {!v && (!e || e.total_atribuidos === 0) && (
        <p className="text-sm text-gray-400 text-center py-4">
          Nenhuma estatística disponível ainda.
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
export default function Perfil() {
  usePageTitle('Meu Perfil');
  const { usuario, atualizarUsuario, roles } = useAuth();

  // ── Upload de foto ──────────────────────────────────────
  const inputFotoRef  = useRef(null);
  const [enviandoFoto, setEnviandoFoto] = useState(false);
  const [errFoto,      setErrFoto]      = useState('');
  const [okFoto,       setOkFoto]       = useState(false);

  async function handleUploadFoto(e) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;

    // Reset input para permitir re-selecionar o mesmo arquivo
    e.target.value = '';

    setErrFoto('');
    setOkFoto(false);
    setEnviandoFoto(true);

    try {
      const formData = new FormData();
      formData.append('foto', arquivo);
      const { data } = await usuariosApi.uploadFotoPerfil(formData);

      if (data.sucesso) {
        atualizarUsuario({ foto_perfil: data.dados.foto_perfil });
        setOkFoto(true);
        setTimeout(() => setOkFoto(false), 3000);
      } else {
        setErrFoto(data.mensagem || 'Erro ao salvar foto.');
      }
    } catch (err) {
      setErrFoto(err?.response?.data?.mensagem || 'Erro ao enviar foto.');
    } finally {
      setEnviandoFoto(false);
    }
  }

  const fotoUrl = resolveFileUrl(usuario?.foto_perfil);

  // ── Troca de senha ─────────────────────────────────────
  const [senhaAtual,   setSenhaAtual]   = useState('');
  const [novaSenha,    setNovaSenha]    = useState('');
  const [confirmar,    setConfirmar]    = useState('');
  const [mostrarAtual, setMostrarAtual] = useState(false);
  const [mostrarNova,  setMostrarNova]  = useState(false);
  const [salvando,     setSalvando]     = useState(false);
  const [errSenha,     setErrSenha]     = useState('');
  const [okSenha,      setOkSenha]      = useState(false);

  async function handleTrocarSenha(e) {
    e.preventDefault();
    if (novaSenha !== confirmar) {
      setErrSenha('As senhas não coincidem.');
      return;
    }
    if (novaSenha.length < 8) {
      setErrSenha('A nova senha deve ter pelo menos 8 caracteres.');
      return;
    }
    if (!/[A-Z]/.test(novaSenha)) {
      setErrSenha('A nova senha deve conter pelo menos uma letra maiúscula.');
      return;
    }
    if (!/[0-9]/.test(novaSenha)) {
      setErrSenha('A nova senha deve conter pelo menos um número.');
      return;
    }

    setSalvando(true);
    setErrSenha('');
    setOkSenha(false);

    try {
      await usuariosApi.alterarSenha({ senhaAtual, novaSenha });
      setOkSenha(true);
      setSenhaAtual('');
      setNovaSenha('');
      setConfirmar('');
    } catch (err) {
      setErrSenha(err?.response?.data?.mensagem || 'Erro ao alterar senha.');
    } finally {
      setSalvando(false);
    }
  }

  const rolesExibidos = roles || [usuario?.role];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <User className="w-6 h-6 text-marinho-600" />
          Meu Perfil
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">Suas informações de acesso ao sistema</p>
      </div>

      {/* Card de informações */}
      <div className="card-base p-6">
        <div className="flex items-center gap-4 mb-6">

          {/* Avatar com overlay de câmera */}
          <div className="relative flex-shrink-0 group">
            {/* Foto ou iniciais */}
            <div
              className="w-16 h-16 rounded-full overflow-hidden bg-marinho-600
                          flex items-center justify-center text-white text-xl font-bold"
            >
              {fotoUrl ? (
                <img
                  src={fotoUrl}
                  alt={usuario?.nome}
                  className="w-full h-full object-cover"
                />
              ) : (
                gerarIniciais(usuario?.nome)
              )}
            </div>

            {/* Overlay de câmera — visível ao hover ou durante envio */}
            <button
              type="button"
              title="Alterar foto de perfil"
              disabled={enviandoFoto}
              onClick={() => inputFotoRef.current?.click()}
              className="absolute inset-0 rounded-full flex items-center justify-center
                          bg-black/40 opacity-0 group-hover:opacity-100
                          transition-opacity cursor-pointer disabled:cursor-wait"
            >
              {enviandoFoto
                ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <Camera className="w-5 h-5 text-white" />
              }
            </button>

            {/* Input oculto */}
            <input
              ref={inputFotoRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              className="hidden"
              onChange={handleUploadFoto}
            />
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-900">{usuario?.nome}</h2>
            <p className="text-sm text-gray-500 font-mono">{usuario?.usuario_login}</p>
            {usuario?.email && (
              <p className="text-sm text-gray-500">{usuario.email}</p>
            )}
            {/* Feedback de foto */}
            {okFoto && (
              <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Foto atualizada!
              </p>
            )}
            {errFoto && (
              <p className="text-xs text-red-500 mt-1">{errFoto}</p>
            )}
            {!okFoto && !errFoto && (
              <button
                type="button"
                onClick={() => inputFotoRef.current?.click()}
                disabled={enviandoFoto}
                className="text-xs text-marinho-600 hover:underline mt-1 disabled:opacity-50"
              >
                {enviandoFoto ? 'Enviando…' : 'Alterar foto'}
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Perfil(s) */}
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2 flex items-center gap-1">
              <Shield className="w-3.5 h-3.5" /> Perfis de acesso
            </p>
            <div className="flex flex-wrap gap-1.5">
              {rolesExibidos.map((r) => (
                <span
                  key={r}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold
                    ${r === usuario?.role
                      ? 'bg-marinho-600 text-white'
                      : 'bg-marinho-100 text-marinho-800'
                    }`}
                >
                  {LABELS_ROLE[r] || r}
                </span>
              ))}
            </div>
          </div>

          {/* Setor */}
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2">
              Setor
            </p>
            <p className="text-gray-900 font-medium">
              {LABELS_SETOR[usuario?.setor] || usuario?.setor || '—'}
            </p>
          </div>

          {/* Membro desde */}
          {usuario?.created_at && (
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2">
                Membro desde
              </p>
              <p className="text-gray-900 font-medium">{formatarData(usuario.created_at)}</p>
            </div>
          )}

          {/* Status */}
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2">
              Status da conta
            </p>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
                               bg-green-100 text-green-700 text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
              Ativa
            </span>
          </div>
        </div>
      </div>

      {/* Estatísticas pessoais */}
      <EstatisticasPessoais role={usuario?.role} />

      {/* Card de troca de senha */}
      <div className="card-base p-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-5">
          <Lock className="w-5 h-5 text-marinho-600" />
          Alterar Senha
        </h3>

        <form onSubmit={handleTrocarSenha} className="space-y-4">
          {/* Senha atual */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Senha atual
            </label>
            <div className="relative">
              <input
                type={mostrarAtual ? 'text' : 'password'}
                value={senhaAtual}
                onChange={(e) => { setSenhaAtual(e.target.value); setErrSenha(''); setOkSenha(false); }}
                className="input-base pr-10"
                required
                disabled={salvando}
                autoComplete="current-password"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setMostrarAtual(!mostrarAtual)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {mostrarAtual ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Nova senha */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nova senha
            </label>
            <div className="relative">
              <input
                type={mostrarNova ? 'text' : 'password'}
                value={novaSenha}
                onChange={(e) => { setNovaSenha(e.target.value); setErrSenha(''); setOkSenha(false); }}
                className="input-base pr-10"
                placeholder="Mín. 8 chars, 1 maiúscula, 1 número"
                required
                disabled={salvando}
                autoComplete="new-password"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setMostrarNova(!mostrarNova)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {mostrarNova ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirmar nova senha */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Confirmar nova senha
            </label>
            <input
              type="password"
              value={confirmar}
              onChange={(e) => { setConfirmar(e.target.value); setErrSenha(''); setOkSenha(false); }}
              className={`input-base ${
                confirmar && novaSenha !== confirmar
                  ? 'border-red-300 focus:ring-red-400'
                  : ''
              }`}
              placeholder="Repita a nova senha"
              required
              disabled={salvando}
              autoComplete="new-password"
            />
            {confirmar && novaSenha !== confirmar && (
              <p className="text-xs text-red-500 mt-1">As senhas não coincidem.</p>
            )}
          </div>

          {/* Feedback */}
          {errSenha && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
              {errSenha}
            </div>
          )}
          {okSenha && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-green-700 text-sm
                             flex items-center gap-2">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              Senha alterada com sucesso!
            </div>
          )}

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={salvando || !senhaAtual || !novaSenha || !confirmar}
              className="btn-primario disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {salvando ? <Spinner tamanho="sm" /> : <Save className="w-4 h-4" />}
              Salvar nova senha
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
