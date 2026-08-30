# AGENTS.md

Instrucciones para cualquier agente o asistente que trabaje en este repositorio.
**Empezá por acá.**

---

## Orden de lectura

| Archivo | Qué tiene | Cuándo leerlo |
|---|---|---|
| **AGENTS.md** | Reglas de trabajo, convenciones, trampas conocidas | Este. Siempre. |
| **[ESTADO.md](ESTADO.md)** | Qué existe hoy, qué sigue, decisiones ya cerradas | Siempre, segundo |
| **[PLANIFICACION.md](PLANIFICACION.md)** | **Fuente de verdad.** Diseño completo | Antes de tocar código |
| **[ESTRUCTURA.md](ESTRUCTURA.md)** | Carpetas, rutas, variables de entorno | Antes de crear archivos |
| **[docs/diseno-visual.md](docs/diseno-visual.md)** | Paleta, tokens Tailwind, componentes base de interfaz | Antes de tocar o crear interfaz |
| **[docs/](docs/)** | Plan detallado de la fase en curso | Al empezar una fase |

Reglas sobre la planificación:

- **No escribas código que la contradiga.** Si algo hay que cambiar, se actualiza el
  documento primero y después el código.
- Las **14 decisiones de la §14** están cerradas. No las reabras salvo que el usuario lo pida.
- Los **pendientes de la §15** están abiertos. Ahí sí hace falta preguntar.

---

## Qué es este proyecto

App web para registrar la participación de alumnos de la UMG en actividades. El alumno se
registra, declara su carné y sus clases, y marca asistencia escaneando un **código QR que
rota cada 60 segundos** proyectado en el evento. Al final, el administrador exporta un Excel
por catedrático con los puntos de cada alumno.

Nombre de trabajo: **Ronda**. Nombre público: `https://asistencia-umg.vercel.app`.

Dos roles con cuenta: **alumno** y **administrador**. Los catedráticos **no tienen cuenta**;
son un registro de datos que agrupa clases y reciben el Excel por fuera de la app.

## Estado actual

Ver **[ESTADO.md](ESTADO.md)**, que es el archivo que se mantiene al día. Resumen: Fase 0
cerrada, sin código, base de datos vacía, entorno configurado.

## Stack

| Pieza | Elección |
|---|---|
| Aplicación | Next.js 15 (App Router) + TypeScript |
| Base de datos | Neon (PostgreSQL serverless), región `us-east-2` |
| ORM | Drizzle, con migraciones versionadas en el repo |
| Autenticación | Neon Auth — **Managed Better Auth**, no Stack Auth |
| Hospedaje | Vercel, proyecto `asistencia-umg` |
| Estilos | Tailwind CSS |
| QR | `qrcode` para generar. **No se implementa lector**: se usa la cámara nativa. |
| Excel | `exceljs` en rutas de servidor |

---

## Reglas técnicas que no se negocian

Salen de decisiones de diseño ya tomadas. Romperlas rompe el sistema.

1. **El `secreto_qr` nunca sale del servidor.** Si llega al navegador, cualquiera fabrica
   códigos válidos. El kiosco pide códigos ya derivados a la API.
2. **La validación del código se hace contra la hora en que llega el botón**, no contra la
   hora del escaneo. Es lo que hace inútil compartir la foto del QR.
3. **Los puntos no se almacenan, se calculan.** A partir de `asistencia` y
   `asignacion_extra`, contra las inscripciones vigentes.
4. **Nunca se rechaza un marcaje por dirección IP.** Todo el campus sale por la misma IP. La
   IP es dato de bitácora, no criterio.
5. **Todo el acceso a la base pasa por el servidor.** No hay cliente de base de datos en el
   navegador.
6. **La Data API de Neon queda deshabilitada.** Ver «Trampas conocidas».
7. **Fechas en UTC** en la base; se muestran en `America/Guatemala` (UTC−6, sin horario de
   verano).
8. **La asistencia se guarda aunque el alumno no esté inscrito a ninguna clase.** Los puntos
   aparecen solos cuando se inscriba. Perder una asistencia real es el peor error posible.
9. **Todo intento de marcaje, válido o no, va a `bitacora`.**
10. **Nunca escribas un secreto real en un archivo versionado.** Los valores van en
    `.env.local`, que está en `.gitignore`. `.env.example` lleva solo los nombres.
11. **Solo lleva prefijo `NEXT_PUBLIC_` lo que puede ver el mundo.** Ese prefijo mete la
    variable en el JavaScript del navegador.

---

## Trampas conocidas

Cosas que ya nos costaron tiempo. No las repitas.

### Neon Auth ya no es Stack Auth

Neon migró a **Managed Better Auth** en enero de 2026. Las variables
`NEXT_PUBLIC_STACK_PROJECT_ID`, `NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY` y
`STACK_SECRET_SERVER_KEY` **ya no existen**. Casi todo lo publicado sobre «Neon Auth +
Next.js» es anterior a la migración: si un tutorial menciona `stackframe` o variables
`STACK_*`, está desactualizado.

Lo actual son dos: `NEON_AUTH_BASE_URL` y `NEON_AUTH_COOKIE_SECRET`. El `JWKS URL` que
muestra la consola **no es una variable**: se deriva como
`${NEON_AUTH_BASE_URL}/.well-known/jwks.json`.

### La Data API de Neon no se habilita

Expone las tablas como API REST pública consultable desde el navegador. Con el registro
abierto que decidimos, y con «Grant public schema access» activo, **un alumno registrado
podría escribir directo en `asistencia` desde la consola del navegador y regalarse los
puntos**, sin escanear ningún QR.

Es un cambio que no aparece en ningún diff y deja el sistema del QR de adorno.

### `@neondatabase/auth-ui/css` sin `@layer` rompía el fondo de todos los botones

Ese CSS viene sin `@layer`: en CSS, lo que no tiene capa le gana a cualquier CSS con capa, sin
importar especificidad. Antes de corregirlo, su reset de `<button>` (`background-color:
transparent`) le ganaba al `bg-primary-600`/`bg-neutral-900` de **cualquier** botón de la app,
no solo de sus propios formularios — el botón existía y el texto se veía, pero el fondo era
invisible. Se arregló envolviendo ese import en `@layer neon-ui` (de menor prioridad que las
capas propias) dentro de `globals.css`, en vez de importarlo suelto en `layout.tsx`. Detalle
completo en [`docs/diseno-visual.md`](docs/diseno-visual.md).

### Pooled contra directa

`DATABASE_URL` lleva `-pooler` en el host y la usa la aplicación. `DATABASE_URL_UNPOOLED` no
lo lleva y la usa Drizzle para migraciones. Usar la equivocada da errores raros e
intermitentes en las migraciones.

### iOS separa Safari de la PWA instalada

El QR abre en Safari, cuyo almacenamiento es distinto del de la PWA instalada: el alumno
aparece deslogueado. Por eso la página de marcaje **tiene que llevar el formulario de ingreso
en la misma página**, sin redirecciones, y decir claramente *«El código ya cambió, escaneá
otra vez»* cuando expira. Nunca fallar en silencio ahí.

### `neon-http` no soporta transacciones interactivas

El driver que usa esta app (`drizzle-orm/neon-http`, ver ESTRUCTURA.md) tira `Error: No
transactions support in neon-http driver` en cuanto se llama `db.transaction(...)`. Cualquier
regla que necesite "leer, decidir, escribir" de forma atómica (por ejemplo, que un total no
supere un saldo — §5) no se puede resolver con una transacción de Drizzle.

La salida que se usó en la Fase 3 ([`src/lib/puntos/consulta.ts`](src/lib/puntos/consulta.ts),
`repartirPuntos`): una sola sentencia `INSERT ... SELECT ... WHERE` con
`pg_advisory_xact_lock` en una CTE al principio. Postgres envuelve cada sentencia suelta en su
propia transacción implícita, así que el candado y el chequeo quedan atómicos igual, sin
depender de `db.transaction()`. Sirve como patrón para cualquier otra escritura de la Fase 2
en adelante que necesite la misma garantía (por ejemplo, `asistencia` + `bitacora` al validar
un marcaje).

### `Intl.DateTimeFormat` no siempre coincide entre servidor y navegador

El ICU de Node (servidor) y el de Chromium (navegador) pueden formatear el mismo `Date` con
texto distinto para `es-GT`, y React lo marca como error de hidratación en cualquier
componente cliente que reciba una fecha ya formateada desde el servidor. Dos formas en que
aparece, ambas resueltas en [`src/lib/fecha.ts`](src/lib/fecha.ts):

- Un `skeleton` con fecha y hora juntas (`day` + `month` + `hour` + `minute` en el mismo
  `Intl.DateTimeFormat`) puede elegir un conector distinto ("29 de agosto **a las** 6:17 p.
  m." contra "29 de agosto**,** 6:17 p. m."). Se resuelve formateando fecha y hora por
  separado y uniéndolas con un separador fijo, en vez de dejar que el `skeleton` combinado lo
  decida.
- El espacio antes de "p. m." puede ser un espacio normal en un ICU y un espacio angosto de
  no separación (U+202F) o de no separación común (U+00A0) en el otro — invisible a simple
  vista. Se resuelve normalizando esos espacios a uno común después de formatear.

### Neon se suspende por inactividad

La primera consulta tras un rato de reposo tarda cientos de milisegundos. Irrelevante en
ráfaga, pero antes de un evento conviene calentar la base.

---

## Convenciones

- **Idioma:** todo en español. Interfaz, mensajes de error, nombres de tablas y columnas,
  comentarios y mensajes de commit. Sin tildes ni ñ en identificadores de código
  (`carne`, `bitacora`, `asignacion_extra`).
- **Móvil primero.** La única pantalla pensada para escritorio es el kiosco del QR (B5).
- **Mensajes de error accionables.** Dicen qué pasó y qué hacer. Los textos exactos están en
  la §7 de la planificación; usalos tal cual.
- **Las pantallas tienen identificador** (A1–A10 alumno, B1–B10 admin). Referilas por su ID
  en commits y conversación.
- **Commits en español, en imperativo.** Explicando el porqué, no solo el qué.

---

## Cómo trabajar acá

- **Planificar antes de implementar.** Cuando algo no esté definido, preguntá en vez de
  asumir y seguir.
- **No hagas commits ni push salvo que el usuario lo pida.**
- **No instales software del sistema ni servidores MCP sin permiso explícito.**
- Si detectás un problema real en el diseño, decilo con claridad y proponé la alternativa.
  Ya pasó dos veces y las dos veces el proyecto mejoró: el diseño con fotos y profesores se
  descartó entero a favor del QR, y el escáner dentro de la app se descartó a favor de la
  cámara nativa.
- **Al terminar una fase, actualizá [ESTADO.md](ESTADO.md).** Es lo que permite que el
  siguiente chat arranque sin contexto previo.
