# Estado del proyecto

Dónde estamos, qué existe, qué sigue. **Actualizá este archivo al terminar cada fase.**

## Cola Codex — 5/10/2026

- ASI2-19: consulta publica de marcaje oculta borradores y conserva contexto de publicadas
  y cerradas. Rama `codex/asi2-19`, entrega En pruebas. TypeScript y 81 unitarias correctos;
  prueba de navegador pendiente del proximo despliegue agrupado de Julio. Sin migracion.
- ASI2-17: /clases valida UUID y clase activa en la escritura, mantiene idempotencia y
  muestra error controlado. Rama `codex/asi2-17`, sin migracion; pendientes de SQL concurrente
  y navegador descritos en docs/asi2-17.md. No toca las acciones admin/perfil en paralelo.
- ASI2-22: avisos y entregas persistentes, reintentos limitados y reserva mediante candado
  separado en db.batch; migracion 0007 generada para revision, sin aplicar. Ver tarjeta para
  pruebas pendientes de concurrencia PostgreSQL y recepción. VAPID ya cargado según Julio.
- Workflow vigente: una tarjeta Codex por rama y commit; empujar esa rama y parar ahi.
  Solo Julio integra a main y decide despliegues. No más docs/asi2-NN.md; validación y
  pendientes en kanban. Los dos archivos ya creados se conservan. ASI2-19/17 se integraron
  localmente antes de esta última corrección; no repetir integración desde Codex.
  No disparar deploys desde Netlify. Migraciones 0007 en adelante se generan de una en una,
  pero solo Julio las aplica tras revisar. No ejecutar probar:base contra produccion.
  Usar corepack pnpm; VAPID ya configurado en Netlify segun Julio, no regenerarlo.
  Estas autorizaciones actualizan las restricciones historicas de la sesion anterior.

- **Última actualización:** 4 de octubre de 2026 (hora de Guatemala).
- **Estado actual:** geolocalización etapas 1 y 2 integrada, con rechazo fuera y aceptación
  dentro verificados en producción. Push etapa 1 tiene código y botón de envío desplegado,
  pero la recepción real sigue pendiente. La invitación posterior al login, el módulo de
  notificaciones generales y el recordatorio previo están definidos, todavía sin implementar.
- **Para retomar con Claude:** leer [el registro de esta sesión](docs/registro-2026-10-04.md)
  y el [kanban Asistencia Actividades UMG](https://kanban-3nt0.onrender.com/projects/4tzo77UYtC9aHs).
  ASI2-1 permanece En pruebas; ASI2-21 bloquea la prueba push; ASI2-26 y ASI2-27 están Por hacer.
- **Restricciones vigentes:** no ejecutar migraciones ni scripts que escriban en la base
  compartida de producción; no instalar dependencias ni crear ramas. Commits/push requieren
  autorización explícita: Julio autorizó el commit de esta documentación, sin solicitar push.
  Usar siempre `corepack pnpm`. Este registro autoriza cambios de documentación únicamente.

## Verificado y pendiente al 4/10/2026

- **Geolocalización:** opcional por actividad, apagada por defecto. Con zona y rechazo
  activado, solo bloquea una lectura buena fuera del radio. Sin lectura o con precisión peor
  que el radio deja marcar; la IP no decide. Pruebas reales del alumno
  `juliocesarticaspalencia@gmail.com`: a las 23:17, Enchulados, radio 200 m, resultado
  `fuera_de_zona` y 0 asistencias; a las 23:26, zona de prueba, radio 200 m, resultado `ok`,
  1 asistencia QR, distancia 12 m y precisión ±9 m. Falta probar permisos denegados, lectura
  imprecisa, reuso/expiración y ensayo con varios teléfonos. No equivale a cerrar el ensayo en campo.
- **Push etapa 1:** `src/lib/push/`, `ActivarAvisos`, `BotonAvisarActividad` y manejadores de
  push/clic en `public/sw.js` existen. En Chrome se vio el botón del panel, alcance 0 de 7
  alumnos y ausencia del control de suscripción en `/inicio`. Es compatible con VAPID
  incompleto; no se verificaron las variables de producción ni una recepción real. ASI2-21.
- **Decisión push:** entra al alcance. Tras el primer login, proponer invitación general
  «Activar notificaciones» / «Ahora no» para alumno y admin. El permiso nativo se solicita al
  pulsar Activar, sin bloquear la app ni repetir la invitación en cada login. ASI2-27.
- **Nuevos avisos:** sección del panel para información general, prueba a la propia cuenta,
  historial y resultados (ASI2-27); recordatorio de actividad un día antes (ASI2-26), con
  propuesta de 24 h antes y despachador programado en Netlify. Falta ratificar 24 h frente a
  una hora fija del día anterior. Registro de envíos y concurrencia en ASI2-22; ensayos en ASI2-6.
- **Esquema:** el archivo `0006_acoustic_mercury.sql` incorpora `fuera_de_zona`,
  `exige_ubicacion` y `suscripcion_push`. El kanban previo lo reporta aplicado y la interfaz
  usa esos campos. Esta sesión no ejecutó ni verificó el historial de migraciones.
- **TypeScript:** `tsconfig.json` incluye `**/*.mts`. No se ejecutó typecheck para estos
  cambios documentales. Las 66 pruebas puras pasaron durante la auditoría previa de esta sesión;
  no es validación del código que haya cambiado después.
- **Seguridad:** auditoría en ASI2-12 y hallazgos ASI2-13 a ASI2-20; siguen pendientes, con
  certeza y escenarios en cada tarea. No se aplicaron arreglos.
- **Cuenta admin:** por pedido explícito, `jticasp@miumg.edu.gt` quedó con rol admin y ciclo
  10 (antes alumno/7), verificado tras actualización acotada. Motivo: `ADMIN_EMAILS` solo se
  evalúa al crear el perfil, no promueve perfiles existentes. ASI2-25; no resuelve ASI2-13.
- **Datos de prueba:** dos actividades publicadas creadas mediante la interfaz, una sin
  asistencia y otra con 1 asistencia y valor de 1 punto extra. Ambas cierran marcaje el
  5/10/2026 a las 00:30 GT. No se borraron ni anularon. El máximo cierre publicado/cerrado
  influye en el corte general del reparto; revisar el efecto antes de usar datos reales.

## Estado histórico al 30 de agosto de 2026

La descripción siguiente conserva el contexto de fases anteriores; para geolocalización,
push y pruebas recientes prevalecen las notas de arriba y el registro enlazado.

- **Fase en esa fecha:** Fase 2 construida entera y ya desplegada en Netlify
  (`https://app-asist-actividades-umg.netlify.app`). Solo falta el ensayo en campo (tarea 7),
  presencial, estimado para dentro de una semana. Ver [`docs/fase-2.md`](docs/fase-2.md). En
  paralelo, **Fase 3 adelantada**: el motor de cálculo y las pantallas A9/A10 (tareas 1 a 4) ya
  están construidos y probados; falta la tarea 5, cerrarla contra asistencias reales — ver
  [`docs/fase-3.md`](docs/fase-3.md). **Fase 4 también adelantada y construida entera**:
  Tablero, Alumnos, marcaje manual, Bitácora y exportación a Excel (B1, B7, B8, B9, B10) — ver
  [`docs/fase-4.md`](docs/fase-4.md). **Fase 5 (PWA y endurecimiento) también construida
  entera**: manifiesto, service worker, guía de instalación iOS, cabeceras de seguridad,
  `robots.txt` y auditoría de dependencias — ver [`docs/fase-5.md`](docs/fase-5.md). Falta
  únicamente la instalación real en un Android y un iPhone físicos (tarea 9 de esa fase); no se
  pudo probar en este entorno porque no tiene Xcode instalado para el simulador de iOS. Se
  puede aprovechar el mismo ensayo en campo de la Fase 2 para eso.

---

## Qué existe

| | |
|---|---|
| Documentación | Completa. Diseño cerrado, 14 decisiones tomadas. |
| Repositorio | `developerumg3-dotcom/asistencia-actividades-umg`, privado, rama `main` |
| Neon | Proyecto `app_asistencia_actividades` (`hidden-art-98202594`), org DeveloperUMG (`org-dawn-math-42337202`), región `us-east-2` |
| Netlify | Proyecto `app-asist-actividades-umg` → `https://app-asist-actividades-umg.netlify.app`, desplegado. Era Vercel hasta el 30/08/2026 — ver PLANIFICACION.md §10 |
| `.env.local` | Las 6 variables llenas y verificadas |
| Aplicación | Next.js 15 + TypeScript + Tailwind, `pnpm dev` sirve en `localhost:3000` |
| Base de datos | Las 9 tablas de la §4 migradas en Neon (`src/db/migraciones/0000_...sql`) |
| Autenticación | Neon Auth (Managed Better Auth) integrado: registro, ingreso, recuperación de contraseña, sesión de servidor |
| Perfil obligatorio (A3) | Bloquea navegación hasta cargar carné y nombre; carné único con mensaje de conflicto |
| Catedráticos y clases (B2, B3) | Alta y edición manual, más importación por CSV |
| Autoinscripción (A4, A8) | Agregar/quitar clases, con constancia en bitácora al quitar. Buscador por texto, filtro por ciclo y «solo las mías» |
| Diseño visual | Paleta del escudo UMG y primitivos en `src/componentes/ui/`. Norma en [`docs/diseno-visual.md`](docs/diseno-visual.md) |
| Catálogo de cursos | Los 50 del pensum 0908 (jornada sábado, Escuintla) sembrados en `clase`, **sin catedrático ni sección** |
| Perfil con ciclo (A3) | Carné, nombre y ciclo. El ciclo solo decide el filtro inicial de A4, no restringe |
| Librería del QR | `src/lib/qr/codigo.ts` — derivación HMAC, ventana con gracia, precarga, contador. 21 pruebas: `pnpm probar` |
| Cuentas de prueba | `admin@ronda.test` y `alumno@ronda.test`, `pnpm db:sembrar-usuarios`. **Borrar antes de usar el sistema de verdad** |
| Actividades (B4) | `/admin/actividades`. El `secreto_qr` se genera al crear y no sale del servidor |
| Marcaje contra la base | `src/lib/qr/marcaje.ts`. 11 pruebas de integración: `pnpm probar:base` |
| Marcar asistencia (A6, A7) | `/a/{codigo_corto}/{codigo}`, con ingreso en la misma página |
| Kiosco (B5) | `/kiosco/{clave}`, QR rotativo con precarga y Wake Lock |
| Asistencias en vivo (B6) | `/admin/actividades/{id}/en-vivo` |
| Inicio del alumno (A5) | `/inicio`, la actividad abierta y qué hacer |
| Motor de puntos | `src/lib/puntos/calculo.ts` (puro) + `consulta.ts` (base). Participaciones, saldo extra, fecha de corte. 13 pruebas: `pnpm probar` |
| Participaciones (A9) | `/participaciones` — tabla clase × actividad, igual formato que la hoja de Excel de la §9 |
| Puntos extra (A10) | `/puntos-extra` — saldo, repartir, deshacer hasta la fecha de corte (48 h después del cierre de marcaje de la última actividad) |
| Datos de prueba de actividades | `pnpm db:sembrar-actividades` — 5 actividades globales + 1 extra con `codigo_corto` `demo-*`, para probar A9/A10 sin esperar a B4. **Borrar (ver el propio script) antes de que B4 esté en uso real** |
| Catedrático sin cuenta | `docente.email` es opcional (migración `0003`): se crea con solo el nombre en `/admin/catedraticos` y se le asignan cursos desde `/admin/clases`. Ver bitácora |
| Tablero (B1) | `/admin` — actividad con marcaje abierto, asistencias de hoy, alumnos registrados, alertas (clases sin catedrático, saldo extra por vencer, picos de fallos en bitácora) y el botón de reporte global |
| Alumnos (B7) | `/admin/alumnos` — buscar por carné, nombre o correo; ficha con sus clases y puntos (mismo motor que A9), corregir inscripciones, liberar carné |
| Marcaje manual (B8) | Dentro de `/admin/actividades/{id}/en-vivo` (B6). Sin restricción de horario ni de estado de la actividad; justificación obligatoria en `asistencia.nota_manual` |
| Bitácora (B9) | `/admin/bitacora` — filtros por alumno, actividad, evento, resultado y fecha; resalta (sin actuar) intentos fallidos repetidos y dispositivos compartidos entre alumnos |
| Exportar Excel (B10) | Detalle de catedrático en `/admin/catedraticos/{id}` con botón de reporte individual; botón de reporte global en `/admin`. `exceljs`, probado contra datos reales bajado y leído de vuelta — 10 pruebas nuevas entre reportes y señales de bitácora: `pnpm probar` (52 en total) |
| PWA | Manifiesto (`src/app/manifest.ts`), íconos 192/512/180 con fondo blanco sobre el escudo de la UMG, `theme-color` `#1C72A5`. Instalable en Android (Chrome ofrece el botón solo) |
| Service worker | `public/sw.js`, registrado desde `src/componentes/registrar-service-worker.tsx`. Cachea solo el armazón estático (`/_next/static/*`, `/iconos/*`) y la página `/sin-conexion`; nunca intercepta `POST`, Server Actions ni `/api/*` — el marcaje nunca puede parecer que funciona sin red |
| Guía de instalación iOS | `/ayuda/instalar-ios`, enlazada desde `/inicio` |
| Cabeceras de seguridad | `next.config.ts` → `headers()`: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`. Verificado que no rompen el login de Neon Auth |
| `robots.txt` | `src/app/robots.ts`, bloquea `/admin`, `/a/`, `/kiosco`, `/api/` |
| Auditoría de dependencias | `pnpm audit` limpio (`No known vulnerabilities found`) tras fijar `postcss`, `uuid` y `esbuild` a versiones parchadas vía `pnpm.overrides` en `package.json` — eran transitivas de `next`, `exceljs` y `drizzle-kit`, no dependencias directas desactualizadas |

## Qué NO existe todavía

- **El ensayo en campo** (tarea 7 de la Fase 2). Es presencial y obligatorio: salón real,
  cinco teléfonos, al menos un iPhone y un Android viejo. La fase no está cerrada sin eso
- **De la Fase 3 falta la tarea 5** de [`docs/fase-3.md`](docs/fase-3.md): cerrarla contra
  asistencias reales generadas por el flujo terminado de la Fase 2. Las tareas 1 a 4 (motor,
  A9, A10) están hechas y probadas con datos sembrados a mano
  (`pnpm db:sembrar-actividades`), no con el marcaje de verdad todavía
- **Instalación real de la PWA en un Android y un iPhone físicos.** El manifiesto, el service
  worker y la guía de iOS están construidos y probados en el navegador (`pnpm build`, cabeceras,
  cachés, service worker activo), pero no hay confirmación en hardware real todavía — este
  entorno no tiene Xcode para el simulador de iOS. Ver [`docs/fase-5.md`](docs/fase-5.md) tarea 9
- **CSP completa y límite de intentos en el marcaje.** Quedaron fuera de la Fase 5 a propósito,
  ver bitácora de cambios de rumbo más abajo
- **Bloquear/desbloquear cuentas.** La columna `alumno.estado` existe desde la Fase 1 pero
  nada la revisa todavía. Se decidió dejarlo para más adelante — ver bitácora de cambios de
  rumbo — porque generaba dudas de diseño (qué pasa con una sesión ya abierta) y no era una
  necesidad real del sistema en este momento
- **Ningún catedrático cargado.** Las 50 clases tienen `docente_id` en NULL. Sin eso no se
  puede exportar el Excel, que es el entregable final del sistema. El flujo para cargarlos es
  simple: crear el catedrático con solo el nombre en `/admin/catedraticos`, y asignarle sus
  cursos desde `/admin/clases` — ver «El catedrático no tiene cuenta» en la bitácora

---

## Qué sigue

**Terminar la Fase 1.** Falta solo:

1. **Asignar los catedráticos** a las clases que tengan alumnos inscritos. El flujo es
   simple: crear el catedrático con su nombre en `/admin/catedraticos` (correo opcional) y
   asignarle sus cursos desde `/admin/clases`. El catálogo ya está cargado; falta quién imparte
   cada curso.

El despliegue (tarea 7) ya está hecho, en Netlify:
`https://app-asist-actividades-umg.netlify.app`.

La Fase 2 está construida y **ya está desplegada**. Lo único que le falta a la fase es el
**ensayo en campo**, estimado para dentro de aproximadamente una semana desde el 30 de agosto
de 2026 (posiblemente el sábado 5 de septiembre). Mientras tanto la semana se usa para
avanzar: cargar catedráticos y crear las actividades reales con sus fechas.

La **Fase 3** se adelantó en paralelo a la 2, porque el motor de puntos solo necesita las
tablas ya migradas, no las pantallas de la Fase 2 (ver «Por qué se puede trabajar en
paralelo» en [`docs/fase-3.md`](docs/fase-3.md)). Motor, A9 y A10 (tareas 1 a 4) están
construidos y probados con datos sembrados a mano. Lo único que falta ahí es la **tarea 5**:
repetir la prueba contra asistencias reales una vez que la Fase 2 esté terminada, para
confirmar que el motor lee exactamente lo que el marcaje de verdad escribe.

Dos hallazgos de la implementación de la Fase 3 quedan anotados en «Trampas conocidas» de
[`AGENTS.md`](AGENTS.md) porque van a volver a aparecer en la Fase 2: `neon-http` (el driver
de Neon que usa esta app) no soporta transacciones interactivas, y `Intl.DateTimeFormat`
puede formatear fechas distinto entre el servidor y el navegador para `es-GT`.

La **Fase 4** se adelantó por la misma razón que la Fase 3, y ya está **completa**: Tablero
(B1), Alumnos (B7), marcaje manual (B8), Bitácora (B9) y exportación a Excel (B10) — ver
[`docs/fase-4.md`](docs/fase-4.md). Verificada en el navegador contra datos reales: una
asistencia marcada manualmente en B8 se reflejó correctamente en el Excel descargado desde
B10, con las cifras exactas de `/participaciones`. Lo único que quedó fuera a propósito es
bloquear/desbloquear cuentas (ver «Qué NO existe todavía»).

La **Fase 5** (PWA y endurecimiento) también está **completa**: manifiesto, íconos, service
worker que nunca cachea el marcaje, página de "sin conexión", guía de instalación en iOS,
cabeceras de seguridad, `robots.txt` y auditoría de dependencias — ver
[`docs/fase-5.md`](docs/fase-5.md). Verificada con `pnpm build`, las cuatro cabeceras
confirmadas en la respuesta real y el service worker activo cacheando el armazón en el
navegador. Lo único que falta es instalarla de verdad en un Android y un iPhone físicos —
puede esperar al mismo ensayo en campo de la Fase 2.

Con las fases 1 a 5 construidas, solo falta el **ensayo en campo** de la Fase 2 (que de paso
sirve para probar la instalación real de la PWA) para cerrar todo el alcance de
`PLANIFICACION.md`.

---

## Verificar el entorno antes de empezar

`.env.local` no está en el repositorio: cada quien lo tiene en su máquina. Para confirmar que
está completo sin exponer los valores:

```bash
python3 -c "
import io
for l in io.open('.env.local',encoding='utf-8'):
    s=l.strip()
    if s and not s.startswith('#') and '=' in s:
        k,v=s.split('=',1); print(f'{k:28s}', '✓' if v.strip() else '← FALTA')
"
```

Deben aparecer seis, todas con ✓. Si falta alguna, ver [`ESTRUCTURA.md`](ESTRUCTURA.md).

---

## Bitácora de cambios de rumbo

Decisiones que ya se tomaron y **no hay que volver a discutir**. Están acá porque en cada una
se descartó un diseño completo, y sin el contexto es fácil reintroducirlo.

### Netlify en vez de Vercel (30 de agosto de 2026)

**Era:** hospedaje en Vercel, proyecto `asistencia-umg`,
`https://asistencia-umg.vercel.app`. Así está en la mayoría de los ejemplos y URLs viejas que
puedan quedar sueltas en algún lado.

**Es:** hospedaje en Netlify, proyecto `app-asist-actividades-umg`,
`https://app-asist-actividades-umg.netlify.app`. Decisión del usuario, sin efecto en el diseño
más allá del nombre del dominio.

**Se llevó por delante:** el dominio nuevo es más largo (45 caracteres contra 33), lo que le
deja al QR mucho menos margen del que tenía — con `codigo_corto` de dos caracteres la URL
completa da 61 de los 62 que caben en un QR versión 4 con corrección M. Ver «Dominio» en
PLANIFICACION.md §10: mientras se use este dominio, `codigo_corto` no puede pasar de dos
caracteres sin subir de versión de QR.

### El catedrático no tiene cuenta (revertido el 30 de agosto de 2026)

**Era, desde el diseño original:** el catedrático es solo un registro de datos (nombre +
correo) que agrupa clases. No hay login docente ni vista de catedrático.

**Pasó a ser, el 29 de agosto de 2026:** por decisión del consejo de organizadores,
`PLANIFICACION.md` se actualizó para que el catedrático tuviera cuenta y descargara él mismo
su Excel — de solo lectura, sin aprobar ni rechazar puntos. Traía consigo `docente.alumno_id`,
un valor `catedratico` en el enum `rol`, y una decisión pendiente sobre cómo se le da la
cuenta. Nada de esto llegó a tocar el código: quedó solo documentado.

**Es, otra vez, desde el 30 de agosto de 2026:** el catedrático sigue sin cuenta. El
administrador lo crea a mano con solo el nombre y le asigna cursos desde `/admin/clases`; ese
vínculo (`clase.docente_id`) es lo único que hace falta para descargar su Excel. El correo
queda como dato opcional (`docente.email` es nullable), no obligatorio como antes.

**Por qué se revirtió:** simplifica bastante y no hacía falta — el administrador ya podía
descargar el Excel sin que el catedrático tuviera que entrar a ningún lado. Decisión del
usuario, 30 de agosto de 2026.

**Se llevó por delante:** el pendiente de "cómo obtiene su cuenta el catedrático" (§15 de
`PLANIFICACION.md`) desapareció entero, porque ya no hay cuenta que obtener.

### CSP completa y límite de intentos en el marcaje quedaron fuera de la Fase 5 (30 de agosto de 2026)

**Era, según §13 de `PLANIFICACION.md`:** la Fase 5 es "PWA y endurecimiento", sin más detalle
de qué cubre "endurecimiento".

**Es:** el endurecimiento de esta fase se limitó a cabeceras de seguridad simples
(`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`),
`robots.txt` y auditoría de dependencias. Quedaron fuera dos cosas que también entran bajo
"endurecimiento" pero no se tocaron:

- **Una `Content-Security-Policy` completa.** Escribirla sin romper `@neondatabase/auth-ui`
  (que inyecta su propio formulario) exige probarla a fondo contra el login real; el riesgo es
  el mismo tipo de falla en silencio que ya costó tiempo con la Data API de Neon (ver más
  abajo). Queda para una fase posterior si hace falta.
- **Límite de intentos (throttling) en `marcarAsistencia`.** Tocaría una decisión de diseño ya
  cerrada del antifraude (§7, §12): la ventana de 60 s es la única defensa contra compartir el
  QR, a propósito. Agregar throttling ahí reabriría esa decisión sin que nadie lo haya pedido.

**Por qué:** decisión de Daniel al confirmar el alcance de la Fase 5, para no reabrir una
decisión de antifraude ya cerrada ni introducir un cambio de alto riesgo (CSP) sin la prueba a
fondo que necesita.

**Se llevó por delante:** nada del código existente. Si se retoma la CSP, probar primero contra
`/ingreso`, `/registro` y `/auth/forgot-password` — son las pantallas donde vive
`@neondatabase/auth-ui`.

### Bloquear cuentas se dejó pendiente (30 de agosto de 2026)

**Era, según §8 de `PLANIFICACION.md`:** B7 (Alumnos) incluía "bloquear cuentas" como parte de
la Fase 4, sobre la columna `alumno.estado` (`activo`/`bloqueado`) que ya existía desde la
Fase 1 sin usarse.

**Es:** B7 se construyó sin esa función. La columna sigue sin usarse.

**Por qué:** al bajar la pantalla a tareas concretas aparecieron preguntas de diseño sin
resolver — qué pasa con una sesión ya abierta de una cuenta que se bloquea a mitad de evento,
si el bloqueo debía ser total o solo para marcar asistencia — y no era una necesidad real del
sistema en este momento. Decisión del usuario: mejor dejarlo pendiente que resolverlo con
suposiciones.

**Se llevó por delante:** nada del código existente; es una función que nunca se construyó.
Si se retoma, revisar `requireAlumno`/`obtenerAlumnoActual` en `src/lib/sesion.ts` — es el
único punto por el que pasan todas las rutas protegidas y el marcaje (A6), así que es ahí
donde conviene cortar el acceso, no en cada pantalla por separado.

### El catálogo de clases sale del pensum, no de un listado por ciclo

**Era:** cargar las clases del ciclo que cursa el alumno.

**Es:** se siembran los 50 cursos del pensum 0908 y el alumno elige uno por uno los que lleva,
con buscador y filtro por ciclo.

**Por qué:** no se puede deducir qué cursa alguien a partir de su ciclo — hay quien lleva
cursos atrasados y quien los lleva adelantados. Decisión del usuario, 29 de agosto de 2026.

**Se llevó por delante:** `clase.docente_id` y `clase.seccion` dejaron de ser obligatorios
(migración `0001`), porque un curso del catálogo existe antes de saber quién lo imparte. La
consulta de A4 pasó de `innerJoin` a `leftJoin`: con `innerJoin` no se veía ninguna clase.

**Lo que queda pendiente por esto:** la exportación a Excel agrupa por catedrático, así que
una clase sin `docente_id` no se puede exportar. B10 debe avisarlo en vez de generar un libro
incompleto en silencio.

### El diseño original con fotos y profesores quedó descartado

**Era:** los alumnos subían fotos de las actividades, los profesores tenían cuenta y revisaban
carpeta por carpeta aprobando o rechazando puntos. Existía un estado «tenés un posible punto».

**Es:** QR que rota cada 60 segundos, verificación automática, cero revisión manual.

**Se llevó por delante:** las cuentas de profesor, el almacenamiento de imágenes, la cola de
aprobación y el estado intermedio. Un alumno tiene el punto o no lo tiene.

### El escáner dentro de la app quedó descartado

**Era:** abrir la cámara dentro de la aplicación con `BarcodeDetector` y una librería de
respaldo para Safari.

**Es:** la cámara nativa del teléfono abre el enlace del QR en el navegador.

**Por qué:** cero permisos de cámara, que es donde más usuarios se pierden, y cero
dependencias de lectura. El costo conocido —que en iOS abra Safari sin la sesión de la PWA—
se resuelve poniendo el formulario de ingreso en la misma página de marcaje. Queda como
mejora posterior si el ensayo de campo muestra fricción real.

### Supabase quedó descartado a favor de Neon

Preferencia del usuario. Encaja mejor además: como todo el acceso a la base pasa por el
servidor, la seguridad a nivel de fila —que era la ventaja fuerte de Supabase— no hace falta.

### .NET quedó descartado a favor de TypeScript

Nada del sistema exigía TypeScript; la decisión fue por despliegue. Un solo proyecto, un solo
despliegue, hospedaje gratuito (Vercel en ese momento, Netlify desde el 30/08/2026), y la
pantalla del QR es JavaScript de todos modos.

### La Data API de Neon queda deshabilitada

**Por qué:** expone las tablas como API REST pública consultable desde el navegador. Con el
registro abierto que decidimos, un alumno registrado podría escribir directo en `asistencia`
y regalarse los puntos sin escanear ningún QR.

Es un cambio que no se ve en ningún diff y rompería el sistema entero en silencio.

### Neon Auth ya no es Stack Auth

Neon migró a **Managed Better Auth** en enero de 2026. Las variables
`NEXT_PUBLIC_STACK_PROJECT_ID`, `NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY` y
`STACK_SECRET_SERVER_KEY` **ya no existen**.

Casi todo lo publicado sobre «Neon Auth + Next.js» es anterior a la migración. Si un tutorial
menciona `stackframe` o variables `STACK_*`, está desactualizado.

Lo actual son dos variables: `NEON_AUTH_BASE_URL` y `NEON_AUTH_COOKIE_SECRET`.

### `alumno.id` es texto, no uuid

La documentación de Neon Auth no publica el formato exacto del id que genera Better Auth para
cada usuario. En vez de asumir que es un uuid válido, `alumno.id` (y las columnas `alumno_id`
que lo referencian) se definieron como `text`. Es un superset seguro: cualquier uuid cabe como
texto. Ver `PLANIFICACION.md` §4.

### La recuperación de contraseña usa `@neondatabase/auth-ui`, no una acción a medida

El resto de las pantallas (registro, ingreso, perfil, admin) son formularios propios en
español que llaman al SDK directo. La recuperación de contraseña es la excepción: la
documentación de Neon dice explícitamente que los métodos de SDK para esto "no están
completamente soportados todavía" y recomienda los componentes prearmados
`<ForgotPasswordForm>` / `<ResetPasswordForm>`, que sí soportan una prop `localization` para
traducir los textos. Viven en `/auth/forgot-password` y `/auth/reset-password` (esas rutas las
espera la librería por defecto para el enlace que manda el correo).

Un detalle no documentado que costó tiempo: ambos formularios, al terminar, navegan solitos a
`/auth/sign-in` (no a `/ingreso`, que es donde vive el login real de esta app). Sin una página
en esa ruta, el flujo terminaba en un 404. La solución fue agregar
`src/app/auth/sign-in/page.tsx`, que solo redirige a `/ingreso`.

---

## Pendientes de Daniel

Ninguno bloquea la Fase 1. Hacen falta antes del primer evento.

- **Asignar catedráticos a las clases.** El catálogo de cursos ya entró desde el pensum
  oficial (PDF `Pensum 0908 2014`), pero el pensum no trae catedráticos ni secciones. El flujo
  es crear el catedrático con su nombre en `/admin/catedraticos` y asignarle sus cursos desde
  `/admin/clases` — el correo es opcional, no hace falta para nada de esto (ver la bitácora)
- Fechas, horas y lugares de las 5 actividades globales y de la actividad extra — se van
  cargando en `/admin/actividades` conforme se crean, no hace falta juntarlas todas antes
