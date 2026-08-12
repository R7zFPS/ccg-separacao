// Service worker — deixa o app abrir rápido e funcionar como aplicativo instalado.
// API sempre vai à rede; arquivos estáticos usam cache com atualização em segundo plano.

const CACHE = 'nails-agenda-v2';
const ESTATICOS = ['.', 'index.html', 'style.css', 'app.js', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', (ev) => {
  ev.waitUntil(caches.open(CACHE).then((c) => c.addAll(ESTATICOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (ev) => {
  ev.waitUntil(
    caches.keys()
      .then((chaves) => Promise.all(chaves.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (ev) => {
  const url = new URL(ev.request.url);
  if (ev.request.method !== 'GET' || url.pathname.startsWith('/api/')) return; // API: sempre rede

  ev.respondWith(
    caches.match(ev.request).then((emCache) => {
      const daRede = fetch(ev.request)
        .then((resposta) => {
          if (resposta.ok && url.origin === location.origin) {
            const copia = resposta.clone();
            caches.open(CACHE).then((c) => c.put(ev.request, copia));
          }
          return resposta;
        })
        .catch(() => emCache);
      return emCache || daRede;
    })
  );
});
