const CACHE = "ronda-armazon-v1";
const OFFLINE_URL = "/sin-conexion";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.add(OFFLINE_URL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((claves) => Promise.all(claves.filter((clave) => clave !== CACHE).map((clave) => caches.delete(clave))))
      .then(() => self.clients.claim()),
  );
});

function esEstaticoDeNext(url) {
  return url.origin === self.location.origin && url.pathname.startsWith("/_next/static/");
}

function esIcono(url) {
  return url.origin === self.location.origin && url.pathname.startsWith("/iconos/");
}

async function cacheFirst(request) {
  const cacheado = await caches.match(request);
  if (cacheado) return cacheado;
  const respuesta = await fetch(request);
  const cache = await caches.open(CACHE);
  cache.put(request, respuesta.clone());
  return respuesta;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Nunca intercepta escrituras: el marcaje y las acciones de servidor tienen que fallar
  // de forma visible sin red, no simular exito desde una cache.
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Nunca cachea datos: nada bajo /api/ pasa por aca.
  if (url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)));
    return;
  }

  if (esEstaticoDeNext(url) || esIcono(url)) {
    event.respondWith(cacheFirst(request));
  }
});
