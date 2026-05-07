/**
 * Funções utilitárias de formatação
 */

import { format, formatDistance, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Formata data no padrão brasileiro: 13/04/2024
 */
export function formatarData(dataIso) {
  if (!dataIso) return '—';
  try {
    return format(parseISO(dataIso), 'dd/MM/yyyy', { locale: ptBR });
  } catch {
    return dataIso;
  }
}

/**
 * Formata data e hora: 13/04/2024 às 14:35
 */
export function formatarDataHora(dataIso) {
  if (!dataIso) return '—';
  try {
    return format(parseISO(dataIso), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  } catch {
    return dataIso;
  }
}

/**
 * Tempo relativo: "há 5 minutos", "há 2 dias"
 */
export function tempoRelativo(dataIso) {
  if (!dataIso) return '—';
  try {
    return formatDistance(parseISO(dataIso), new Date(), {
      addSuffix: true,
      locale: ptBR,
    });
  } catch {
    return dataIso;
  }
}

/**
 * Formata tamanho de arquivo em bytes para unidade legível
 */
export function formatarTamanhoArquivo(bytes) {
  if (!bytes) return '0 B';
  const unidades = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${unidades[i]}`;
}

/**
 * Abrevia nome para exibição (ex: "João da Silva" → "João S.")
 */
export function abreviarNome(nome) {
  if (!nome) return '';
  const partes = nome.trim().split(' ');
  if (partes.length === 1) return partes[0];
  return `${partes[0]} ${partes[partes.length - 1][0]}.`;
}

/**
 * Gera iniciais para avatar (ex: "João Silva" → "JS")
 */
export function gerarIniciais(nome) {
  if (!nome) return '??';
  const partes = nome.trim().split(' ').filter(Boolean);
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

/**
 * Capitaliza a primeira letra de cada palavra
 */
export function capitalize(texto) {
  if (!texto) return '';
  return texto
    .toLowerCase()
    .split(' ')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ');
}
