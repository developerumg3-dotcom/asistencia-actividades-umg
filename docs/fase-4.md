# Fase 4 — Administración y Excel

Objetivo: cerrar el ciclo completo para el administrador — panorama general (B1), gestión de
alumnos con sus casos de borde (B7), marcaje manual para quien no tiene teléfono (B8), bitácora
consultable (B9) y el entregable final del sistema, el Excel por catedrático o consolidado
(B10).

Contexto obligatorio antes de empezar: [`AGENTS.md`](../AGENTS.md) →
[`PLANIFICACION.md`](../PLANIFICACION.md) §8 (B1, B7, B8, B9, B10) y §9 (Excel) →
[`ESTRUCTURA.md`](../ESTRUCTURA.md) → [`ESTADO.md`](../ESTADO.md). Para cualquier interfaz,
además [`docs/diseno-visual.md`](diseno-visual.md).

---

## Pantallas que entran

| ID | Pantalla | Ruta |
|---|---|---|
| B1 | Tablero | `/admin` |
| B7 | Alumnos | `/admin/alumnos` |
| B8 | Marcaje manual | dentro de `/admin/actividades/{id}/en-vivo` (B6, ya existe) |
| B9 | Bitácora | `/admin/bitacora` |
| B10 | Exportar | botón en `/admin/catedraticos/{id}` (nueva vista de detalle) + botón global en `/admin` (B1) |

El panel de administración **ya existe** como sección (`/admin`, con las pestañas de
Actividades, Catedráticos, Clases, Mis clases en `NavAdmin`). Lo que faltaba era la página de
aterrizaje — B1 — y dos pestañas nuevas — B7 y B9. No hace falta ninguna fase adicional para
esto.

## Qué NO entra en esta fase

- **Bloquear/desbloquear cuentas.** La columna `alumno.estado` (`activo`/`bloqueado`) ya existe
  en el esquema desde la Fase 1, pero no se usa todavía. Se decidió dejarla para una fase
  posterior: no es una necesidad del sistema hoy y generaba dudas de diseño (qué pasa con una
  sesión ya abierta, si el bloqueo es total o parcial) que no vale la pena cerrar ahora. B7 se
  queda solo con: buscar, ver clases y puntos, corregir inscripciones, liberar carné.
- PWA (Fase 5).
- Nada de las fases 1 a 3.

---

## Tareas, en orden

### 1. B1 — Tablero (`/admin`)

- Nueva pestaña "Tablero" en `NavAdmin`, primera de la lista. `/admin` pasa a tener su propio
  `page.tsx` (hoy no existe: la sección solo tiene subrutas).
- Contenido:
  - Actividad con el marcaje abierto ahora mismo, si hay una.
  - Asistencias marcadas hoy, contando todas las actividades.
  - Total de alumnos registrados.
  - Sección de alertas (ver abajo).
  - Botón **"Descargar reporte global"** — todas las clases de todos los catedráticos en un
    solo libro (tarea 5).
- Alertas para esta fase (confirmadas con Daniel el 30 de agosto de 2026):
  - Clases sin catedrático asignado — bloquean el Excel. Cantidad + enlace a `/admin/clases`.
  - Saldo de puntos extra sin repartir cerca de la fecha de corte (reusa
    `calcularFechaDeCorte` de `src/lib/puntos/calculo.ts`, Fase 3). Aviso si faltan menos de
    48 h y hay alumnos con saldo pendiente.
  - Picos de intentos fallidos de marcaje recientes (bitácora con `resultado` distinto de
    `ok`), agrupados por alumno o por dispositivo — mismo criterio que la tarea 4 (B9).
- Nunca acción automática: la alerta informa, el administrador decide qué hacer desde B2/B3/B7.

**Listo cuando:** entrando a `/admin` se ven los tres números y, con datos de prueba armados a
propósito para cada caso, aparecen las tres alertas (y ninguna cuando no aplican).

### 2. B7 — Alumnos (`/admin/alumnos`)

- Nueva pestaña "Alumnos" en `NavAdmin`.
- Buscar por carné, nombre o correo.
- Detalle de un alumno: sus clases (inscripciones vigentes) y sus puntos por clase — reusa el
  motor de `src/lib/puntos/calculo.ts` (Fase 3, tarea 1: un solo cálculo alimenta A9, B7 y B10).
- **Corregir inscripciones:** agregar o quitar clases de cualquier alumno desde el panel, sobre
  el mismo catálogo de A4/A8. Va a `bitacora` con los mismos eventos que ya existen
  (`inscripcion_creada`, `inscripcion_eliminada`) para no perder la auditoría de quién lo hizo.
- **Liberar carné:** pone `alumno.carne` en `NULL`. Confirmado como el caso de borde real: una
  cuenta tecleó mal su carné y otra ya se lo ganó, o quedó un carné real en una cuenta de
  prueba. Pide confirmación explícita antes de aplicarlo porque afecta a quien tenía el carné.
- Ambas acciones (corregir inscripción desde el admin, liberar carné) quedan en `bitacora` con
  eventos nuevos — ver migración en la sección de esquema más abajo.

**Listo cuando:** se busca un alumno de prueba, se le corrige una inscripción y se le libera el
carné, y las dos acciones aparecen en la bitácora.

### 3. B8 — Marcaje manual (dentro de B6, `/admin/actividades/{id}/en-vivo`)

- Formulario en la misma pantalla de asistencias en vivo (no una ruta aparte): buscar alumno
  por carné o nombre, justificación obligatoria de texto libre, confirmar.
- **Se permite fuera de la ventana de marcaje y con la actividad en cualquier estado** —
  confirmado con Daniel: es justo el mecanismo para cubrir a quien no pudo marcar con el QR.
  La aprobación **es** el propio acto del administrador de crearlo con justificación; no hay un
  segundo paso de revisión.
- Sigue valiendo "un escaneo por actividad" (decisión 6 de §14): si el alumno ya tiene
  asistencia para esa actividad, se rechaza por duplicado, igual que en el flujo por QR.
- También se rechaza si el perfil del alumno está incompleto, igual que en `marcaje.ts`.
- `asistencia.origen = "manual"` — la columna y su render en la tabla de B6 ya existen. La
  justificación se guarda en `bitacora` (ver columna nueva `detalle` más abajo).
- Todo intento (éxito o rechazo) va a `bitacora` con evento `marcaje`, igual que el QR.

**Listo cuando:** el administrador registra una asistencia manual con justificación fuera de la
ventana de marcaje, aparece en la tabla de B6 como "Manual", queda en bitácora con la
justificación, y repetirla para el mismo alumno se rechaza por duplicado.

### 4. B9 — Bitácora (`/admin/bitacora`)

- Nueva pestaña "Bitácora" en `NavAdmin`.
- Lista de `bitacora` con filtros: alumno, actividad, evento, resultado, rango de fecha.
  Paginada — la tabla crece con cada intento de marcaje.
- **Señales raras** (confirmado con Daniel), solo resaltado visual, nunca acción automática:
  - Mismo alumno con varios resultados distintos de `ok` en poco tiempo. Punto de partida para
    ajustar durante las pruebas: 5 intentos fallidos en 10 minutos.
  - Mismo `dispositivo_id` o `ip` detrás de varios `alumno_id` distintos.
- El administrador decide qué hacer con lo resaltado (por ejemplo, revisar al alumno en B7);
  la pantalla no toma ninguna acción por su cuenta.

**Listo cuando:** con datos de prueba armados para gatillar cada señal, se ven resaltados en la
lista, y dejan de estarlo si los datos no cumplen el patrón.

### 5. B10 — Exportar Excel

- Instalar `exceljs`.
- **Nueva vista de detalle `/admin/catedraticos/{id}`** — no existe todavía (hoy `/admin/catedraticos` es una lista plana con edición en línea). Esta vista es además la que pedía
  originalmente B2 en §8 ("vista por docente con sus clases y su botón de descarga").
  - Muestra las clases de ese catedrático.
  - Botón **"Descargar reporte"**: un libro con una hoja por cada una de sus clases, formato
    exacto de §9 — encabezado con nombre/código/sección/jornada de la clase, nombre del
    catedrático, ciclo y fecha de generación; columnas Carné, Nombre, una por actividad con su
    **nombre real**, Extra y Total; alumnos ordenados por apellido; totales en negrita; anchos
    de columna ajustados.
- **Botón "Descargar reporte global" en el Tablero (B1):** un libro con todas las clases de
  todos los catedráticos, mismo formato de hoja que el individual.
- Ambos reusan el motor de `src/lib/puntos/calculo.ts` — el mismo cálculo que alimenta A9 y B7.
- Alumnos con carné vacío o inventado **no se filtran**: se exportan igual, con la celda de
  carné vacía si no lo tienen. Es el catedrático quien los ignora al revisar (decisión 1 de
  §14) — excluirlos en silencio sería peor que mostrarlos con un hueco.
- Una clase sin `docente_id` no se puede exportar (ya anotado como pendiente en `ESTADO.md`).
  El botón global debe **avisarlo explícitamente** en vez de generar un libro incompleto en
  silencio — lista las clases que quedaron fuera por esa razón.

**Listo cuando:** se descarga el Excel de un catedrático de prueba y las cifras coinciden a
mano con `/participaciones` de esos mismos alumnos; el reporte global incluye todas las clases
con catedrático asignado y avisa cuáles quedaron fuera.

---

## Cambios de esquema que requiere esta fase

Migración nueva (mismo patrón que `0001`–`0003`):

- `evento_bitacora`: agregar `carne_liberado` (tarea 2). `inscripcion_creada` **ya existe**
  desde la migración `0000` pero nunca se usó: el alta de clase de un alumno
  (`clases/acciones.ts`) nunca la registró, solo la baja. La corrección de inscripciones desde
  el admin (tarea 2) sí la usa, tanto para agregar como para quitar.
- `bitacora`: columna nueva `detalle` (`text`, nullable). Dos usos en esta fase: guarda qué
  carné se liberó (tarea 2, para poder investigar si ese carné vuelve a dar conflicto), y
  guarda quién de administración corrigió una inscripción (tarea 2) — sin esto, un
  `inscripcion_creada`/`inscripcion_eliminada` disparado por el admin es indistinguible del
  que dispara el propio alumno desde `/clases`, y se perdería la auditoría de quién lo hizo.
  Campo libre para no abrir una columna nueva por cada caso futuro que necesite contexto en
  texto.
- La justificación del marcaje manual (tarea 3) **no** va en `bitacora`: usa
  `asistencia.nota_manual`, columna que ya existe desde la Fase 1 y hasta ahora no se llenaba
  nunca. B9 la muestra uniendo por `(alumno_id, actividad_id)` cuando el evento es `marcaje`.

No hace falta tocar `estado_alumno` ni `origen_asistencia`: ya traían `bloqueado` y `manual`
reservados desde la Fase 1 y la Fase 2 respectivamente.

---

## Decisiones a confirmar

Todas se cerraron con Daniel el 30 de agosto de 2026, en la misma conversación donde se armó
este documento:

1. **Bloquear cuentas** queda fuera de la Fase 4 — ver «Qué NO entra en esta fase».
2. **Marcaje manual fuera de horario:** permitido sin restricción de ventana ni de estado de la
   actividad. La justificación obligatoria más el acto del administrador de crearlo son la
   aprobación; no hay un paso adicional.
3. **Ubicación de los botones de exportar:** por catedrático, en la página de detalle de ese
   catedrático (B2). Global, en el Tablero (B1). No hay una pantalla aparte para esto.
4. **Formato del reporte:** Excel (`.xlsx`, `exceljs`), no CSV — se mantiene la decisión 7 de
   §14, no se reabrió.

---

## Criterio de aceptación de la fase

El administrador entra a `/admin`, ve el resumen del día y las alertas activas, corrige la
inscripción de un alumno de prueba y le libera el carné desde `/admin/alumnos`, registra una
asistencia manual justificada desde B6, revisa la bitácora y ve resaltada una señal armada a
propósito, y descarga tanto el Excel de un catedrático como el reporte global — las cifras de
ambos coinciden a mano con `/participaciones`.

---

## Al terminar

1. Actualizar [`ESTADO.md`](../ESTADO.md): mover la Fase 4 a «qué existe», apuntar a la Fase 5.
2. Anotar en la bitácora de `ESTADO.md` la decisión de diferir el bloqueo de cuentas, para que
   no se reintroduzca sin este contexto.
3. Si algo del código terminó contradiciendo la planificación, **actualizar
   [`PLANIFICACION.md`](../PLANIFICACION.md)**, no dejar la contradicción.
