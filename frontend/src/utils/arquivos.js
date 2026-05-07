/**
 * Utilitário de URLs de arquivos
 *
 * Compatível com dois formatos:
 *  - Cloudinary (produção): URL absoluta "https://res.cloudinary.com/..."
 *  - Legado local (dev):    "/uploads/fotos/<filename>"
 *  - Legado foto_perfil:    "fotos/<filename>"  (sem barra inicial)
 *
 * A função resolve corretamente em ambos os casos.
 */

const API_BASE = import.meta.env.VITE_API_URL || '';

/**
 * Retorna a URL pública do arquivo.
 * Se já for uma URL absoluta (Cloudinary), usa diretamente.
 * Se for um caminho relativo, prepende API_BASE.
 *
 * @param {string|null} url
 * @returns {string|null}
 */
export function resolveFileUrl(url) {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url; // Cloudinary ou URL absoluta
  }
  if (url.startsWith('/uploads/')) {
    return `${API_BASE}${url}`; // /uploads/fotos/... → API_BASE/uploads/fotos/...
  }
  // Formato legado foto_perfil: "fotos/<filename>"
  return `${API_BASE}/uploads/${url}`;
}
