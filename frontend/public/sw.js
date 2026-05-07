/**
 * Service Worker — Casa das Correntes Separação
 * Estratégia: Network First com fallback para cache
 */

const CACHE_NAME  = 'ccg-separacao-v1';
const OFFLINE_URL = '/offline.html';

// Recursos que sempre ficam em cache
const PRECACHE = [
  '/',
  '/offline.html',
];

// ── Instalação ────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

// ── Ativação ──────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch — Network First ─────────────────────────────
self.addEventListener('fetch', (event) => {
  // Ignora requisições não-GET e API calls
  if (event.request.method !== 'GET') return;
  if (event.request.url.includes('/api/'))  return;
  if (event.request.url.includes('/uploads/')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Atualiza o cache com a resposta mais recente
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(async () => {
        // Offline: tenta servir do cache
        const cached = await caches.match(event.request);
        return cached || caches.match(OFFLINE_URL);
      })
  );
});
