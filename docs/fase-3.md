# Fase 3 — Puntos

Objetivo: que un alumno vea su tabla de participaciones por clase y reparta su saldo de
puntos extra. **El motor de cálculo no lee nada que la Fase 2 no haya escrito todavía**, así
que esta fase se puede armar y probar con datos sembrados en paralelo a que la Fase 2 avance.

Contexto obligatorio antes de empezar: [`AGENTS.md`](../AGENTS.md) →
[`PLANIFICACION.md`](../PLANIFICACION.md) §4, §5 y §9 → [`ESTRUCTURA.md`](../ESTRUCTURA.md) →
[`ESTADO.md`](../ESTADO.md). Para cualquier interfaz, además
[`docs/diseno-visual.md`](diseno-visual.md).

---

## Pantallas que entran

| ID | Pantalla | Ruta |
|---|---|---|
| A9 | Participaciones | `/participaciones` |
| A10 | Puntos extra | `/puntos-extra` |

## Qué NO entra en esta fase

Excel (B10), tablero del administrador (B1), corrección administrativa de inscripciones
(B7), marcaje manual (B8), bitácora (B9), PWA. Esas son de las fases 4 y 5. Tampoco entra
nada de la Fase 2: actividades, QR, kiosco, marcaje (A5, A6, A7, B4, B5, B6).

---

## Por qué se puede trabajar en paralelo con la Fase 2

Las 9 tablas de la §4 ya están migradas en Neon (ver [`ESTADO.md`](../ESTADO.md)). El motor de
puntos lee directo de `asistencia`, `asignacion_extra`, `inscripcion`, `clase` y `actividad`;
no depende de que existan las pantallas B4/A6/A7/B5/B6, solo de que esas tablas tengan filas.

Mientras el compañero construye el flujo real del QR, esta fase se prueba con **datos
sembrados a mano** (fixtures de prueba, al estilo de `scripts/probar-qr.mts`), no con
asistencias reales. Antes de cerrar la fase hace falta un paso extra que no tiene equivalente
en las otras fases: **repetir la prueba contra asistencias reales**, generadas por el flujo
completo de la Fase 2 ya terminada, para confirmar que el motor lee exactamente lo que el
marcaje escribe. Ver tarea 5.

---

## Tareas, en orden

### 1. Motor de cálculo — `src/lib/puntos/`

Función pura, sin acceso a la base, que reproduce la fórmula de la §5:

```
puntos(alumno, clase) =
      Σ  puntos de actividades tipo global con asistencia registrada
    + Σ  asignaciones_extra del alumno hacia esa clase
```

- Recibe listas ya cargadas (actividades, asistencias, inscripciones vigentes, asignaciones
  extra) y devuelve la tabla alumno × clase. Ninguna llamada a Drizzle adentro — igual que
  `src/lib/qr/codigo.ts` no toca la base y `marcaje.ts` la envuelve después.
- Se aplica a **toda clase en la que el alumno esté inscrito al momento de consultar**, no a
  la que tenía cuando se marcó la asistencia. Una clase agregada después de una actividad
  global también recibe el punto.
- Sin tope por clase: se suma todo lo que exista.
- `clases_snapshot` de `asistencia` es solo auditoría; el motor no lo lee.
- Un solo cálculo alimenta A9 y, en la Fase 4, la hoja de Excel (§9) — de ahí que viva
  aislado en `lib/puntos` y no adentro de la pantalla.

**Pruebas** en `scripts/probar-puntos.mts` (`tsx --test`, mismo patrón que
`scripts/probar-qr.mts`). Agregar un script a `package.json` — expandir `probar` a un glob
(`tsx --test scripts/probar-*.mts`) en vez de sumar un script por archivo.

Casos obligatorios:
- El ejemplo trabajado de María (§5) tiene que reproducirse exacto.
- Alumno sin inscripciones: 0 en todo.
- Clase agregada después de la actividad: igual recibe el punto.
- Actividad sin asistencia del alumno: no suma.
- Alumno con asistencia pero sin ninguna inscripción: la asistencia existe pero no aporta a
  ninguna clase (coincide con la regla de §7: la asistencia nunca se pierde, los puntos
  aparecen solos cuando se inscriba).

**Listo cuando:** todos los casos de arriba pasan en `pnpm probar`.

### 2. Saldo de puntos extra

```
saldo(alumno) = Σ puntos de asistencias a actividades tipo extra
              − Σ asignacion_extra.puntos del alumno
```

- Reglas de reparto (§5): solo enteros, solo hacia clases con inscripción vigente, la suma de
  asignaciones nunca supera el saldo ganado.
- El documento dice que esa última regla se valida **en base de datos**, no solo en pantalla.
  La propuesta original (una transacción de servidor con relectura) resultó irrealizable: el
  driver `neon-http` que usa esta app no soporta `db.transaction()` (ver «Trampas conocidas»
  en [`AGENTS.md`](../AGENTS.md)). Se implementó en cambio como una sola sentencia
  `INSERT ... SELECT ... WHERE` con `pg_advisory_xact_lock`, atómica de por sí porque Postgres
  envuelve cada sentencia suelta en su propia transacción implícita — ver
  `repartirPuntos` en `src/lib/puntos/consulta.ts`.

**Listo cuando:** dos inserciones casi simultáneas del mismo alumno no logran superar el
saldo entre las dos.

### 3. A9 — Participaciones (`/participaciones`)

- Tabla: filas = clases del alumno, columnas = cada actividad con su **nombre real** (no
  "Act. 1") más Extra y Total — mismo formato que la hoja del Excel de la §9, porque es el
  mismo cálculo.
- Todas las actividades visibles, con 1 o 0, hayan pasado ya o no.
- Usa el motor de la tarea 1.

**Listo cuando:** la tabla de un alumno de prueba coincide a mano con el ejemplo de María.

### 4. A10 — Puntos extra (`/puntos-extra`)

- Muestra el saldo disponible (tarea 2).
- Reparto: elegir clase (solo entre las inscritas), elegir cuántos puntos, confirmar.
- Deshacer y reasignar libremente hasta la **fecha de corte**.
- Pasada la fecha de corte: pantalla de solo lectura, sin botón de repartir ni de deshacer.
- Mientras haya saldo pendiente: aviso permanente en A5 (inicio) y en la propia pantalla. El
  aviso cambia de tono en las últimas 24 horas antes del corte (§5).
- Si llega la fecha de corte con saldo sin repartir, se pierde. No hay reparto automático.

**Listo cuando:** un alumno de prueba reparte 2 puntos en dos clases, deshace uno, lo
reasigna a una tercera, y — simulando que ya pasó la fecha de corte — la pantalla no deja
tocar nada más.

### 5. Cerrar contra datos reales de la Fase 2

- Repetir las pruebas de las tareas 3 y 4 usando asistencias creadas por el flujo real de
  marcaje (A6/A7) de la Fase 2, no solo los datos sembrados a mano.
- Confirmar que el motor de la tarea 1 produce el mismo resultado con datos reales que con
  los fixtures de prueba.

**Listo cuando:** un alumno que marcó asistencia de verdad en una actividad real ve el punto
reflejado en `/participaciones` sin ningún ajuste manual.

---

## Decisiones a confirmar

Dos puntos del documento de planificación no bajaban a una regla única de implementación.
Según [`AGENTS.md`](../AGENTS.md), eso se pregunta antes de programar, no se asume — las dos
se confirmaron con Daniel el 29 de agosto de 2026 y ya están implementadas:

1. **Qué cuenta como "la última actividad"** para calcular la fecha de corte (48 h después,
   §5, decisión 3 de §14). El texto no aclaraba si es la última de cualquier tipo o solo las
   extra, ni si una actividad en `borrador` cuenta, ni contra qué campo de fecha. **Cerrado:**
   `max(marcajeCierraEn)` entre las actividades en estado `publicada` o `cerrada`, de
   cualquier tipo — **no** `terminaEn`. `marcajeCierraEn` es configurable por actividad
   (B4, Fase 2) y puede caer después de `terminaEn`; contar el corte desde `terminaEn` se
   arriesgaba a cerrar el reparto antes de que la propia ventana de marcaje de esa actividad
   terminara de aceptar asistencias, perdiendo puntos que todavía se podían ganar de forma
   legítima. `terminaEn` es solo informativo (§4) y no decide nada operativo. Implementado en
   `calcularFechaDeCorte` (`src/lib/puntos/calculo.ts`).
2. **Cómo leer "validación en base de datos"** para el tope del saldo (tarea 2). La propuesta
   original —una transacción de servidor con relectura— resultó irrealizable ya avanzada la
   implementación: `neon-http` no soporta `db.transaction()` (ver «Trampas conocidas» en
   [`AGENTS.md`](../AGENTS.md)). **Cerrado con la alternativa que sí es real:** una sola
   sentencia `INSERT ... SELECT ... WHERE` con `pg_advisory_xact_lock`, atómica porque
   Postgres envuelve cada sentencia suelta en su propia transacción implícita. Implementado en
   `repartirPuntos` (`src/lib/puntos/consulta.ts`).

---

## Criterio de aceptación de la fase

Un alumno de prueba con asistencias e inscripciones sembradas ve en `/participaciones` una
tabla idéntica a calcularla a mano, reparte su saldo de puntos extra en `/puntos-extra`,
deshace y reasigna antes del corte, y el aviso de saldo pendiente desaparece apenas termina de
repartir todo. El mismo resultado se confirma después con una asistencia real generada por el
flujo terminado de la Fase 2.

---

## Al terminar

1. Actualizar [`ESTADO.md`](../ESTADO.md): mover la Fase 3 a «qué existe», apuntar a la Fase 4.
2. Anotar en la bitácora de `ESTADO.md` cualquier diseño que se haya descartado en el camino,
   en particular cómo se resolvieron las dos decisiones de la sección anterior.
3. Si algo del código terminó contradiciendo la planificación, **actualizar
   [`PLANIFICACION.md`](../PLANIFICACION.md)**, no dejar la contradicción.
