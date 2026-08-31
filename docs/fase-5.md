# Fase 5 — PWA y endurecimiento

Objetivo: que la app se pueda instalar como PWA en Android e iOS (§11 de `PLANIFICACION.md`),
dejar claro que el marcaje nunca funciona sin conexión, y cerrar un endurecimiento razonable
del lado del servidor que no estaba cubierto en ninguna fase anterior.

Contexto obligatorio antes de empezar: [`AGENTS.md`](../AGENTS.md) →
[`PLANIFICACION.md`](../PLANIFICACION.md) §11 (PWA), §7 (Antifraude), §12 (Riesgos) →
[`ESTADO.md`](../ESTADO.md). Para el ícono y el color de tema,
[`docs/diseno-visual.md`](diseno-visual.md) §11.

---

## Qué entra

| | |
|---|---|
| Manifiesto e íconos | `src/app/manifest.ts` (convención de Next 15, genera `/manifest.webmanifest` solo) |
| Service worker | Caché del armazón estático únicamente. Ninguna ruta de datos (marcaje, acciones de servidor, `/api/*`) pasa por caché |
| Pantalla sin conexión | Se muestra si el service worker no puede llegar a la red en una navegación |
| Guía de instalación iOS | Pantalla nueva, enlazada desde `/inicio` (A5) |
| Cabeceras de seguridad | `next.config.ts` → `headers()` |
| `robots.ts` | Bloquea indexado de `/admin`, `/a/`, `/kiosco`, `/api` |
| Auditoría de dependencias | `pnpm audit`, corregir lo que salga en `high`/`critical` |
| Pruebas finales | Regresión manual de las fases 1 a 4 + instalación real en Android y iPhone |

## Qué NO entra en esta fase

- **Ningún cambio al antifraude del marcaje** (§7): la ventana de 60 s sigue siendo la única
  defensa, por decisión ya cerrada («Alguien pasa el QR por WhatsApp» en §12). No se agrega
  límite de intentos ni throttling a `marcarAsistencia` — eso reabriría una decisión de diseño
  ya tomada, no es parte del alcance que se confirmó para esta fase.
- **CSP (`Content-Security-Policy`) completa.** Escribir una CSP estricta que no rompa Neon Auth
  (`@neondatabase/auth-ui`, que inyecta su propio formulario e iframes) exige probarla a fondo
  contra el flujo de login real; el riesgo es justo el tipo de cosa que ya nos costó tiempo antes
  («cambio que no se ve en ningún diff y rompe todo en silencio», nota de la Data API en
  `AGENTS.md`). Queda para una fase posterior si hace falta. Esta fase sí deja las cabeceras
  simples que no tienen ese riesgo (`X-Content-Type-Options`, `X-Frame-Options`,
  `Referrer-Policy`, `Permissions-Policy`).
- **Bloquear/desbloquear cuentas.** Sigue diferido desde la Fase 4, sin relación con PWA.
- **El ensayo en campo** de la Fase 2 (tarea 7). Es una actividad aparte, aunque las pruebas de
  instalación de esta fase pueden aprovechar el mismo día si coincide.

---

## Tareas, en orden

### 1. Íconos

- Generar desde `public/escudo-umg.webp` (960×961, con transparencia) íconos con **fondo
  blanco** sólido detrás del escudo — transparente se ve mal en iOS, que no compone alfa sobre
  el fondo del sistema.
- Tamaños: 192×192 y 512×512 (`icons` del manifiesto) más 180×180 para
  `apple-touch-icon` (iOS no lee `manifest.json` para el ícono de inicio, usa su propia
  convención). Guardar en `public/iconos/`.
- `src/app/icon.png` (512×512) para que Next genere el favicon/ícono de pestaña automáticamente
  con su convención de archivo — no hace falta tocar `<head>` a mano para eso.

**Listo cuando:** los tres tamaños existen, tienen fondo blanco sin bordes recortados del
escudo, y `/favicon` en la pestaña del navegador se ve bien.

### 2. Manifiesto (`src/app/manifest.ts`)

- Usa la convención de Next 15 (`MetadataRoute.Manifest`): no hace falta `public/manifest.json`
  a mano ni un `<link rel="manifest">` en el layout, Next lo genera y lo enlaza solo.
- Campos: `name` ("Ronda — Asistencia UMG" o el nombre que confirme Daniel), `short_name`
  ("Ronda"), `start_url: "/inicio"`, `display: "standalone"`, `background_color: "#FFFFFF"`
  (mismo blanco del ícono, es el color de la pantalla de arranque), `theme_color: "#1C72A5"`
  (ya decidido en `diseno-visual.md` §11), `icons` apuntando a los tres tamaños de la tarea 1.

**Listo cuando:** Chrome en Android ofrece "Instalar aplicación" solo, sin errores en la
consola de Lighthouse sobre el manifiesto.

### 3. Service worker — solo el armazón

- Un service worker escrito a mano (sin `next-pwa` ni `serwist`): el alcance es chico —cachear
  un puñado de rutas estáticas— y una librería agrega una capa de configuración que no hace
  falta para esto. Coherente con cómo se resolvió el QR (librería propia en vez de una de
  terceros).
- Se registra desde un componente cliente mínimo en el layout raíz.
- Estrategia:
  - **Nunca cachea ni intercepta** `POST`, Server Actions, ni nada bajo `/api/`. El marcaje y
    cualquier escritura tienen que fallar de forma visible si no hay red, no fallar en
    silencio ni parecer que funcionaron.
  - Para navegaciones (`GET` de documento HTML): red primero; si falla, sirve la página de
    "sin conexión" cacheada de la tarea 4.
  - Cachea de forma perezosa (`cache first`, sin lista fija para precargar) los assets
    estáticos de Next (`/_next/static/*`) y los íconos — lo que ya bajó el navegador, no hace
    falta pedirlo de nuevo.
- Nada de `background sync` ni cola de reintentos: si no hay red, el alumno tiene que volver a
  intentar cuando la recupere. Coincide con «el marcaje nunca funciona sin conexión» de §11.

**Listo cuando:** con DevTools en "Offline", abrir la app ya instalada muestra la pantalla de
sin conexión en vez de un error del navegador, y un intento de marcaje con la ventana abierta
antes de perder la red falla con un mensaje claro en vez de quedar colgado o simular éxito.

### 4. Pantalla "sin conexión"

- Página simple, sin datos: "No hay conexión. El marcaje de asistencia necesita internet —
  intentá de nuevo cuando la recuperes." Coherente con la advertencia obligatoria de §11.
- Es la que cachea el service worker de la tarea 3 para servirla como *fallback* de navegación.

**Listo cuando:** aparece al perder la red y desaparece sola al recuperarla y navegar de nuevo.

### 5. Guía de instalación en iOS

- Pantalla nueva (`/ayuda/instalar-ios` o ruta similar a confirmar con el resto de rutas de
  ayuda si existieran) con el paso a paso: abrir en Safari → botón Compartir → "Agregar a
  inicio". Sin detección de sistema operativo ni banner automático — es un enlace fijo.
- Enlace visible desde `/inicio` (A5), con texto corto ("¿Cómo instalo esta app en mi
  iPhone?") que no compite con la actividad abierta, que sigue siendo el contenido principal
  de esa pantalla.

**Listo cuando:** desde `/inicio` se llega a la guía en un clic y los pasos coinciden con el
Safari real (verificar en el simulador o un iPhone antes de cerrar la tarea).

### 6. Cabeceras de seguridad (`next.config.ts`)

Agregar vía `headers()`, aplicadas a todas las rutas:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY` — nada de esta app necesita vivir dentro de un `<iframe>` ajeno.
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()` — la app no usa ninguno de los
  tres (el escáner de cámara ya se descartó, ver bitácora de `ESTADO.md`), así que se piden
  explícitamente cerrados.

**No se agrega en esta tarea:** `Strict-Transport-Security` (verificar primero si Netlify ya
la manda por defecto en el dominio `.netlify.app` — si ya está, agregarla de nuevo no aporta y
sí puede duplicarse) ni `Content-Security-Policy` (ver «Qué NO entra»).

**Listo cuando:** las cuatro cabeceras aparecen en la respuesta de `/` y de `/admin` (revisar
con las herramientas de red del navegador), y el login con Neon Auth sigue funcionando igual
que antes — confirma que `X-Frame-Options` no rompió nada suyo.

### 7. `robots.ts`

- Convención de Next (`src/app/robots.ts`): `disallow` para `/admin`, `/a/`, `/kiosco`, `/api`.
  Son rutas de marcaje, sesión y administración — no tienen nada que ganar con estar en un
  buscador y las de `/a/{codigoCorto}/{codigo}` en particular son enlaces que no deberían
  quedar indexados en ningún lado.
- El resto (`/`, `/ingreso`, `/registro`, `/inicio`, `/ayuda/*`) se deja indexar, no hay nada
  sensible ahí.

**Listo cuando:** `/robots.txt` responde con las reglas correctas.

### 8. Auditoría de dependencias

- Correr `pnpm audit`. Si aparece algo en `high` o `critical`, actualizar esa dependencia
  puntual (no un `pnpm update` general, que puede arrastrar cambios no relacionados).
- Documentar el resultado en el "Al terminar" de esta fase, aunque sea "sin hallazgos".

**Listo cuando:** `pnpm audit` corrió y cualquier hallazgo `high`/`critical` quedó resuelto o
anotado explícitamente como aceptado y por qué.

### 9. Pruebas finales

- Regresión manual rápida de las fases 1 a 4 (no hace falta repetir cada prueba automatizada,
  esas ya corren con `pnpm probar`): registro, perfil, elegir clases, marcaje por QR, kiosco,
  participaciones, puntos extra, tablero, alumnos, marcaje manual, bitácora, Excel.
- Instalación real: Android (Chrome, "Instalar aplicación") y al menos un iPhone (Safari,
  Compartir → Agregar a inicio, siguiendo la guía de la tarea 5). Confirmar que abre en modo
  standalone (sin barra de Safari/Chrome) y que el ícono se ve bien en la pantalla de inicio.
- Esto puede coincidir con el ensayo en campo de la Fase 2 si cae en la misma fecha, pero es
  una verificación aparte — no depende de que el ensayo de campo esté hecho.

**Listo cuando:** la regresión no encontró nada roto y la app quedó instalada y probada en al
menos un teléfono Android y un iPhone reales.

---

## Cambios de esquema

Ninguno. Esta fase no toca la base de datos.

---

## Decisiones cerradas

Confirmadas con Daniel el 30 de agosto de 2026, en la misma conversación donde se armó este
documento:

1. **Alcance de "endurecimiento":** PWA completa (manifiesto, service worker, guía iOS) más
   una revisión de seguridad del lado del servidor (cabeceras, `robots.txt`, auditoría de
   dependencias) — sin tocar el antifraude del marcaje ni escribir una CSP completa (ver «Qué
   NO entra» para el porqué de ambas exclusiones).
2. **Fondo de los íconos:** blanco liso detrás del escudo (no el azul primario ni transparente).
3. **Guía de instalación iOS:** pantalla fija enlazada desde `/inicio`, no un banner automático
   por detección de sistema operativo.

---

## Criterio de aceptación de la fase

La app se instala de verdad en un Android (Chrome ofrece el botón solo) y en un iPhone
(siguiendo la guía nueva desde `/inicio`), abre en modo standalone con el ícono correcto,
muestra la pantalla de "sin conexión" en vez de fallar en silencio cuando no hay red, las
cuatro cabeceras de seguridad están presentes sin romper el login, `/robots.txt` bloquea las
rutas sensibles, y `pnpm audit` no deja hallazgos `high`/`critical` sin resolver o sin
justificar.

---

## Al terminar

1. Actualizar [`ESTADO.md`](../ESTADO.md): mover la Fase 5 a «qué existe». Con esto y el
   ensayo en campo de la Fase 2, todo el alcance de `PLANIFICACION.md` queda construido.
2. Anotar en la bitácora de `ESTADO.md` la exclusión de la CSP completa y del throttling de
   marcaje, con el porqué, para que no se reintroduzcan sin este contexto la próxima vez que
   alguien piense en "endurecer" el sistema.
3. Si algo del código terminó contradiciendo la planificación, actualizar
   [`PLANIFICACION.md`](../PLANIFICACION.md).
