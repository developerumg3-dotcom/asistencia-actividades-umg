# Plan — Rediseño de la pantalla principal del alumno (A5)

Decisiones cerradas con Daniel el 2026-09-05, antes de tocar código.

## Contexto

Hoy A5 (`/inicio`), A9 (`/participaciones`) y A10 (`/puntos-extra`) son tres pantallas
separadas, sin navegación clara entre ellas: `/inicio` no muestra `NavAlumno` (solo enlaza a
`/clases` y a la guía de iOS), así que llegar a la tabla de puntos o al reparto de extra
significa entrar primero a `/clases`. Lo que un alumno quiere saber al entrar —"¿cuántos
puntos llevo en cada clase?"— queda escondido dos clics más allá.

Daniel quiere una sola pantalla, más intuitiva: lo primero que importa es la tabla de puntos
por clase, no si hay marcaje abierto ahora mismo (eso es secundario, un aviso). Además, quien
administra también cursa (mismo patrón que `/admin/mis-clases`) y hoy no tiene forma de ver
sus propios puntos sin salir del panel.

## Decisiones

1. **Una sola pantalla en `/inicio`**, que fusiona el contenido de A5 + A9 + A10, en este
   orden de arriba hacia abajo:
   1. **Aviso compacto de "activo ahora"** — una barra angosta (una o dos líneas), siempre
      presente, nunca desaparece del layout. No es la tarjeta grande de hoy.
   2. **La tabla de participaciones** (protagonista): filas = clases inscritas, columnas =
      actividades globales + Extra + Total. Igual formato que hoy en A9/el Excel.
   3. **El contador de puntos extra**: saldo disponible + repartir (agregar) / deshacer
      (quitar). Sigue atado a una clase — no puede ser un número suelto, porque
      `asignacion_extra.clase_id` es obligatorio en el esquema y de ahí sale la columna
      "Extra" de la tabla.
2. **`/participaciones` y `/puntos-extra` desaparecen** como rutas propias. Su lógica se
   reutiliza tal cual (mismo motor de puntos, mismas Server Actions), solo cambia dónde se
   renderiza.
3. **`/clases` se mantiene sin cambios de contenido**, solo pierde la barra `NavAlumno` (que
   quedaba con una sola pestaña útil tras quitar Participaciones/Puntos extra) a cambio de un
   enlace de vuelta a Inicio, simétrico al enlace "Mis cursos" que ya tiene `/inicio`.
4. **Nueva pantalla espejo en el panel: `/admin/mis-puntos`**, pestaña "Mis puntos" en
   `NavAdmin` (después de "Mis clases"). Mismo contenido que el cuerpo de `/inicio` (aviso +
   tabla + contador extra), sin el saludo "Hola, X" ni los enlaces de pie de página, que son
   propios del layout de alumno y no hacen falta dentro del panel.

## Diseño del aviso "activo ahora"

Reemplaza la tarjeta grande actual por una barra compacta con 4 estados, mismo criterio de
datos que ya calcula A5 (`obtenerActividadesDelAlumno` + `marcajeAbierto`):

- **Abierta y sin marcar:** barra `primary` destacada — nombre de la actividad + la
  instrucción corta ("Apuntá la cámara de tu teléfono al QR de la pantalla").
- **Abierta y ya marcada:** barra en tono éxito (verde) — "Ya marcaste {nombre}, a las {hora}".
- **Sin marcaje abierto pero hay próxima:** barra neutra — "Próxima actividad: {nombre}, {fecha}".
- **Nada programado:** barra neutra tenue — "No hay actividades abiertas."

## Cambios de código

- **Nuevos componentes compartidos** (usados por `/inicio` y `/admin/mis-puntos`):
  - `src/componentes/aviso-actividad-abierta.tsx` — la barra de estado, recibe
    `ActividadDelAlumno[]`.
  - `src/componentes/tabla-participaciones.tsx` — extraída del `page.tsx` actual de A9, recibe
    `TablaParticipaciones`.
  - `RepartoPuntosExtra` (`src/componentes/reparto-puntos-extra.tsx`) se reutiliza tal cual.
- **Server Actions de puntos extra** (`repartir`, `deshacer`) se mudan de
  `app/(protegido)/(con-perfil)/puntos-extra/acciones.ts` a `src/lib/puntos/acciones.ts` (ya no
  tienen una ruta propia a la que pertenecer) y revalidan ambas rutas donde pueden llamarse:
  `/inicio` y `/admin/mis-puntos`.
- **`src/app/(protegido)/(con-perfil)/inicio/page.tsx`**: agrega las consultas de
  `obtenerParticipaciones` y `obtenerEstadoPuntosExtra` (ya existen en
  `src/lib/puntos/consulta.ts`, sin cambios) junto a la que ya tenía
  (`obtenerActividadesDelAlumno`), y renderiza el nuevo orden.
- **`src/app/(protegido)/(con-perfil)/admin/mis-puntos/page.tsx`** (nueva): `requireAdmin()` +
  las mismas tres consultas, mismo cuerpo sin saludo ni enlaces de pie de página.
- **`src/componentes/nav-admin.tsx`**: agrega la pestaña "Mis puntos" → `/admin/mis-puntos`.
- **`src/componentes/nav-alumno.tsx`**: se elimina (ya no queda más de una pestaña con sentido
  de mostrar como barra); `/clases` pasa a tener su propio enlace de vuelta a `/inicio`.
- **Se eliminan**: `app/(protegido)/(con-perfil)/participaciones/` y
  `app/(protegido)/(con-perfil)/puntos-extra/` completos.

## Lo que no cambia

- El motor de puntos (`src/lib/puntos/calculo.ts`, `consulta.ts`) — cero cambios, solo se
  reutiliza desde otro lado.
- El esquema de base de datos.
- El comportamiento de `/clases` (`SelectorClases`) más allá de la barra de navegación.
