# Fase 2 — El QR

Objetivo: que el administrador cree una actividad, proyecte la pantalla del QR rotativo, y
un alumno marque asistencia escaneándolo con la cámara de su teléfono. **Sin cálculo de
puntos ni Excel todavía.**

Contexto obligatorio antes de empezar: [`AGENTS.md`](../AGENTS.md) →
[`PLANIFICACION.md`](../PLANIFICACION.md) §6 y §7 → [`ESTRUCTURA.md`](../ESTRUCTURA.md) →
[`ESTADO.md`](../ESTADO.md). Para cualquier interfaz, además
[`docs/diseno-visual.md`](diseno-visual.md).

Es la fase con más aristas del proyecto y la única que **no se puede dar por terminada en el
escritorio**: cierra con un ensayo en el salón real.

---

## Pantallas que entran

| ID | Pantalla | Ruta |
|---|---|---|
| A5 | Inicio | `/` |
| A6 | Marcar asistencia | `/a/{codigo_corto}/{codigo}` |
| A7 | Resultado | misma ruta que A6, tras pulsar el botón |
| B4 | Actividades | `/admin/actividades` |
| B5 | Pantalla QR (kiosco) | `/kiosco/{clave}` |
| B6 | Asistencias en vivo | `/admin/actividades/{id}/en-vivo` |

A6 y A7 comparten ruta a propósito: el resultado se muestra sin navegar, para no perder el
contexto en Safari (§6.4).

## Qué NO entra en esta fase

Cálculo y visualización de puntos (A9, A10), saldo extra, Excel, tablero, PWA. La asistencia
**se guarda**; convertirla en puntos es de la Fase 3.

---

## Lo que ya está construido

La librería del código vive en [`src/lib/qr/codigo.ts`](../src/lib/qr/codigo.ts), con 21
pruebas en [`scripts/probar-qr.mts`](../scripts/probar-qr.mts) (`pnpm probar`). Cubre
derivación HMAC, ventana de validez con gracia, precarga para el kiosco, contador regresivo
y armado de la URL. **No toca la base ni el horario de la actividad**: eso es de la tarea 2.

---

## Tareas, en orden

### 1. B4 — Actividades

- CRUD de `actividad` en `/admin/actividades`, solo administrador.
- El `secreto_qr` se genera con `generarSecreto()` al crear la actividad y **nunca** se
  expone en ninguna respuesta, ni siquiera al administrador.
- Campos: nombre, descripción, lugar, tipo (`global` / `extra`), puntos, `inicia_en`,
  `termina_en`, `marcaje_abre_en`, `marcaje_cierra_en`, `ventana_seg` (60 por defecto),
  estado.
- `codigo_corto`: único, breve y sin caracteres ambiguos, porque va dentro del QR.
- Fechas: se guardan en UTC, se muestran en `America/Guatemala`.

**Listo cuando:** se crea una actividad, se ve en la lista, y `secreto_qr` no aparece en
ninguna respuesta del servidor.

### 2. Validación del marcaje contra la base

Envuelve la librería con lo que necesita la base, en `src/lib/qr/marcaje.ts`:

- Buscar la actividad por `codigo_corto`.
- Rechazar fuera de `[marcaje_abre_en, marcaje_cierra_en]` → `fuera_de_horario`.
- Rechazar si el estado no es `publicada`.
- Validar el código con `validarCodigo()` → `ok` / `expirado` / `invalido`.
- Rechazar si ya existe asistencia de ese alumno para esa actividad → `duplicado`.
- Rechazar si el perfil está incompleto → `sin_perfil`.
- **Todo intento, válido o no, va a `bitacora`.** Sin excepción.
- La asistencia se guarda **aunque el alumno no esté inscrito a ninguna clase**.

**Listo cuando:** hay pruebas de cada uno de los seis resultados del enum
`resultado_bitacora`.

### 3. A6 y A7 — Marcar asistencia

- Ruta `/a/{codigo_corto}/{codigo}`, pensada para llegar desde la cámara nativa.
- Si no hay sesión, **formulario de ingreso en la misma página**, sin redirección.
- Botón grande y único. La validación corre contra la hora en que llega el botón, no la
  del escaneo.
- Resultado en la misma pantalla, con los textos exactos de §7.
- Éxito: hora exacta del marcaje.

**Listo cuando:** funciona el peor caso de iPhone — escanear sin sesión, iniciar sesión,
ver «el código ya cambió», volver a escanear y marcar.

### 4. B5 — Kiosco

- Ruta `/kiosco/{clave}`, abierta con la clave de la tabla `pantalla`, **no** con la sesión
  del administrador.
- Pide el código vigente y **precarga los siguientes cinco** (`codigosProximos`).
- Si la red se cae más de cinco minutos, advertencia visible en lugar de un QR muerto.
- Wake Lock API, pantalla completa, alto contraste, QR de al menos 40 % del alto.
- Corrección de errores nivel M.
- Muestra nombre de la actividad, contador regresivo y asistencias en vivo.
- Única pantalla del proyecto pensada para escritorio; no hay norma de diseño para pantallas
  grandes todavía (ver `docs/diseno-visual.md`).

**Listo cuando:** rota sola durante diez minutos seguidos sin intervención, y sigue rotando
con la red desconectada un minuto.

### 5. B6 — Asistencias en vivo

- Quién va marcando, durante la actividad.
- Sondeo simple; no hace falta websockets para el volumen esperado.

### 6. A5 — Inicio

- Próxima actividad arriba.
- Sin resumen de puntos todavía: eso llega en la Fase 3.

### 7. Ensayo en campo

**Obligatorio. La fase no está terminada sin esto.** Ver §12 de `PLANIFICACION.md`.

- Salón real, computadora real del salón, proyector real.
- Cinco teléfonos distintos, al menos un iPhone y un Android viejo.
- Una semana antes de la primera actividad.
- Probar explícitamente: escanear desde el fondo del salón, escanear sin sesión previa,
  compartir la foto del QR por WhatsApp y confirmar que el receptor no puede marcar fuera
  del minuto, y desconectar la red del kiosco un minuto.

**Listo cuando:** los cinco teléfonos marcaron, y la foto compartida falló como se espera.

---

## Dependencias

- `qrcode`, para generar la imagen del QR en el servidor. Ya está en `package.json`.
- **Nada de librerías de lectura**: la cámara nativa hace el escaneo (decisión 10).

## Prerrequisito externo

El despliegue (tarea 7 de la Fase 1, en Netlify) **bloqueaba el ensayo**, no el desarrollo: la
URL que se codifica en el QR sale de `NEXT_PUBLIC_APP_URL` y hay que probar el escaneo con
el dominio real, no con `localhost`. Ya está desplegado; falta solo el ensayo en sí.

---

## Criterio de aceptación de la fase

En el salón real, con el QR proyectado, cinco alumnos con teléfonos distintos escanean y
marcan asistencia dentro de su minuto. Una foto del QR compartida por WhatsApp no sirve
pasado el minuto. Todo intento quedó en `bitacora`.

---

## Al terminar

1. Actualizar [`ESTADO.md`](../ESTADO.md): mover la Fase 2 a «qué existe», apuntar a la Fase 3.
2. Anotar en la bitácora de `ESTADO.md` lo que el ensayo en campo haya obligado a cambiar.
   Es la fase donde más probable es que la realidad corrija al diseño.
3. Si algo del código terminó contradiciendo la planificación, **actualizar
   [`PLANIFICACION.md`](../PLANIFICACION.md)**, no dejar la contradicción.
