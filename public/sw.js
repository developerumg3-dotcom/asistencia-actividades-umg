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

// ---------------------------------------------------------------------------
// Notificaciones push. Ver docs/plan-notificaciones-push.md, etapa 1.
// ---------------------------------------------------------------------------

const ICONO_POR_DEFECTO = "/iconos/icon-192.png";
const RUTA_POR_DEFECTO = "/inicio";

function leerAviso(event) {
  // El navegador puede despertar al service worker con un push sin datos (algunos lo usan
  // para verificar la suscripcion). Mostrar algo generico es mejor que no mostrar nada:
  // Chrome y Firefox penalizan al sitio que recibe un push y no notifica.
  if (!event.data) return { titulo: "Ronda", cuerpo: "Abrí la app para ver qué hay nuevo." };
  try {
    const datos = event.data.json();
    return {
      titulo: datos.titulo || "Ronda",
      cuerpo: datos.cuerpo || "",
      icono: datos.icono,
      url: datos.url,
    };
  } catch {
    // Payload que no es JSON: se trata como el cuerpo del aviso en vez de perderlo.
    return { titulo: "Ronda", cuerpo: event.data.text() };
  }
}

self.addEventListener("push", (event) => {
  const aviso = leerAviso(event);

  event.waitUntil(
    self.registration.showNotification(aviso.titulo, {
      body: aviso.cuerpo,
      icon: aviso.icono || ICONO_POR_DEFECTO,
      badge: aviso.icono || ICONO_POR_DEFECTO,
      // La URL viaja en `data` porque es lo unico que sobrevive hasta el clic.
      data: { url: aviso.url || RUTA_POR_DEFECTO },
      // Avisos del mismo tipo se reemplazan en vez de apilarse: tres recordatorios de la
      // misma actividad en la bandeja son ruido, no tres avisos.
      tag: aviso.url || RUTA_POR_DEFECTO,
      renotify: false,
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const destino = new URL(event.notification.data?.url || RUTA_POR_DEFECTO, self.location.origin);

  event.waitUntil(
    (async () => {
      const ventanas = await self.clients.matchAll({ type: "window", includeUncontrolled: true });

      // Reusar una ventana ya abierta en vez de abrir otra: en iPhone la app instalada es una
      // sola ventana, y abrir una nueva sacaria al alumno de donde estaba.
      for (const ventana of ventanas) {
        if (new URL(ventana.url).origin !== destino.origin) continue;
        await ventana.focus();
        if (new URL(ventana.url).pathname !== destino.pathname && "navigate" in ventana) {
          await ventana.navigate(destino.href);
        }
        return;
      }

      await self.clients.openWindow(destino.href);
    })(),
  );
});
