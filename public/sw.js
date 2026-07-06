// Service worker manual del app-shell de Wellium PWA.
// Alcance decidido: SOLO precache/runtime-cache del shell y assets estaticos.
// NO cachea respuestas de API (evita duplicar logica de sync; ver docs/pwa-web-support-plan.md #6.3).
const SHELL_CACHE = 'wellium-shell-v3';
const RUNTIME_CACHE = 'wellium-runtime-v3';
const CURRENT_CACHES = [SHELL_CACHE, RUNTIME_CACHE];

// Precachea el shell HTML y ADEMAS los bundles hasheados que referencia (/_expo/*.js,
// css). Sin esto, el bundle solo se cachea si el SW ya controlaba la pagina cuando el
// navegador lo pidio — cosa que NO pasa en la primera visita: un SW recien instalado no
// controla la carga que lo instalo. Resultado offline: el HTML abre pero el JS falta y la
// app "queda ahi" en blanco (roto en Android e iOS por igual). Leemos los nombres del
// propio HTML porque el hash cambia en cada build; no se pueden hardcodear.
async function precacheShell() {
  const cache = await caches.open(SHELL_CACHE);
  await cache.add('/');

  const res = await cache.match('/');
  if (!res) return;

  const html = await res.text();
  // Set: el HTML referencia el CSS dos veces (stylesheet + preload) y cache.addAll()
  // RECHAZA con InvalidStateError si le pasas URLs duplicadas — tumbaria todo el precache.
  const assets = Array.from(
    new Set(
      Array.from(
        html.matchAll(/(?:src|href)="(\/_expo\/[^"]+)"/g),
        (match) => match[1],
      ),
    ),
  );
  if (assets.length) await cache.addAll(assets);
}

self.addEventListener('install', (event) => {
  event.waitUntil(precacheShell().then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => !CURRENT_CACHES.includes(key))
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

function isRuntimeCacheable(url) {
  return (
    url.pathname.startsWith('/_expo/') ||
    url.pathname.startsWith('/assets/') ||
    url.pathname.startsWith('/icons/')
  );
}

async function networkFirstNavigation(request) {
  const cache = await caches.open(SHELL_CACHE);
  try {
    const response = await fetch(request);
    // Write-through: refresca el shell cacheado en cada visita online, asi offline se
    // sirve SIEMPRE el ultimo deploy. Sin esto el HTML queda congelado en el install del
    // SW (que solo corre una vez) apuntando a un bundle viejo → offline = codigo viejo.
    // El bundle nuevo lo cachea staleWhileRevalidate cuando la pagina lo pide online.
    if (response && response.ok) {
      cache.put('/', response.clone());
    }
    return response;
  } catch {
    const cached = await cache.match('/');
    if (cached) return cached;
    throw new Error('offline-and-no-shell-cached');
  }
}

// Busca en TODOS los caches (caches.match global), no solo en RUNTIME_CACHE: los bundles
// del shell se precachean en SHELL_CACHE durante el install, asi que offline hay que
// mirar ahi tambien. Revalida en segundo plano contra la red y refresca RUNTIME_CACHE.
async function staleWhileRevalidate(request) {
  const cached = await caches.match(request);
  const networkPromise = fetch(request)
    .then((response) => {
      if (response && response.ok) {
        const copy = response.clone();
        caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
      }
      return response;
    })
    .catch(() => undefined);

  return cached || (await networkPromise) || Response.error();
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  if (isRuntimeCacheable(url)) {
    event.respondWith(staleWhileRevalidate(request));
  }
});
