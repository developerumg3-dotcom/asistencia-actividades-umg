# Ronda — Asistencia por QR rotativo

Documento de definición del sistema de registro de participación en actividades para la UMG.

- **Versión:** 3 · 29 de agosto de 2026
- **Estado:** decisiones cerradas, sin código escrito
- **Nombre de trabajo:** Ronda

Este archivo es la **fuente de verdad** del proyecto. Cualquier agente o chat que trabaje
en este repositorio debe leerlo antes de proponer o escribir código. Si algo del código
contradice este documento, gana el documento (o se actualiza el documento primero).

---

## 1. Qué construimos

Una aplicación **web** donde el alumno se registra, declara su carné y sus clases, y gana
puntos de participación marcando asistencia en actividades. La verificación es automática:
no hay fotos, no hay carpetas de Drive, no hay revisión manual.

La app es web primero. La PWA es una comodidad para instalarla en el teléfono, **no** un
requisito para que el sistema funcione.

### Recorrido completo

1. El alumno se registra con correo y contraseña.
2. Completa su perfil: carné, nombre completo y ciclo que cursa (paso obligatorio).
3. Elige las clases en las que está inscrito.
4. El administrador crea las actividades y proyecta la pantalla del QR en el evento.
5. El alumno escanea el QR con la cámara de su teléfono, se abre el navegador, inicia
   sesión si hace falta, y pulsa **Marcar asistencia** dentro de la ventana vigente.
6. El sistema acredita el punto en todas sus clases (actividad global) o le abona saldo
   que él reparte (actividad extra).
7. El administrador descarga un Excel por catedrático y se lo envía.

### Lo que quedó descartado del diseño original

El planteamiento inicial contemplaba profesores revisando fotos subidas por los alumnos.
Se descartó a favor del QR rotativo. Como consecuencia:

- **No hay cuentas de profesor.** El catedrático es un registro de datos que agrupa clases.
- No hay subida ni almacenamiento de imágenes.
- No hay cola de aprobación ni estado intermedio de "punto posible".
- Un alumno tiene el punto o no lo tiene.

---

## 2. Alcance

### Sí entra

- Registro e inicio de sesión de alumnos, **abierto** (cualquiera puede crear cuenta).
- Perfil obligatorio con carné, nombre completo y ciclo.
- Autoinscripción del alumno a una o varias clases.
- Creación de actividades por el administrador, de dos tipos.
- Pantalla de kiosco con QR que rota cada 60 segundos.
- Marcaje de asistencia con validación de ventana temporal.
- Cálculo de puntos por alumno y por clase.
- Saldo de puntos extra que el propio alumno distribuye entre sus clases.
- Exportación a Excel: un libro por catedrático, una hoja por clase.
- Instalable como PWA en Android e iOS.

### No entra

- Cuentas de profesor. No hay login docente ni vista de catedrático.
- Subida de fotos o evidencias.
- Aprobación o rechazo manual de puntos. Solo corrección administrativa puntual.
- Escáner de QR dentro de la app (ver §6.4 — se usa la cámara nativa del teléfono).
- Notificaciones push, chat, calendario sincronizado, pagos.
- Integración con el sistema académico de la universidad.
- Verificación de identidad de los alumnos. Los carnés inventados **se ignoran en el Excel**,
  no se bloquean en la app.

---

## 3. Roles

| Rol | Cuenta | Qué puede hacer |
|---|---|---|
| **Alumno** | Sí | Registrarse · completar perfil · inscribirse a clases · ver actividades · marcar asistencia · repartir puntos extra · ver sus puntos por clase |
| **Administrador** | Sí | Todo lo del alumno, más: gestionar catedráticos, clases y actividades · abrir la pantalla del QR · ver asistencias en vivo · corregir inscripciones · marcaje manual · revisar bitácora · exportar Excel |
| **Catedrático** | **No** | Es un registro de datos (nombre, correo opcional) que agrupa clases. El administrador lo crea a mano y le asigna cursos; después descarga el Excel de esas clases y se lo hace llegar por fuera de la app. |

El rol se guarda como campo `rol` en la tabla `alumno`. Un solo administrador basta para
el piloto.

---

## 4. Modelo de datos

Nueve tablas. Los puntos **no se almacenan**: se calculan a partir de las asistencias y las
asignaciones. Un número almacenado se desincroniza; un número derivado, no.

### `alumno`

Perfil de la persona. Extiende la tabla de autenticación.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | text PK | Igual al id que genera Neon Auth (Managed Better Auth). No se garantiza que sea un UUID válido, por eso el campo es texto y no uuid. Las columnas `alumno_id` de otras tablas heredan este tipo. |
| `email` | texto único | Identificador de login |
| `carne` | texto único, nullable | Se pide después del registro, es obligatorio para continuar |
| `nombre` | texto, nullable | Igual que el carné |
| `ciclo` | texto, nullable | Ciclo que cursa, «1» a «10». Se pide junto al carné. **No restringe** qué cursos puede elegir: solo hace que A4 arranque filtrada en su ciclo, que es donde estarán casi todos los suyos. Admite nulo por las cuentas creadas antes de pedirlo. |
| `rol` | enum `alumno` \| `admin` | |
| `estado` | enum `activo` \| `bloqueado` | |
| `perfil_completo` | bool | Se marca al completar A3: `carne`, `nombre`, `ciclo` y al menos un curso elegido; controla el bloqueo de navegación |
| `creado_en` | timestamptz | |

**Nota sobre `carne` único:** al ser registro abierto, alguien podría ocupar el carné de
otro. La restricción de unicidad se mantiene (evita duplicados accidentales) y el
administrador puede liberar o reasignar un carné desde la pantalla de alumnos.

### `docente`

Agrupa clases para la exportación. No es una cuenta: el administrador lo crea a mano con
solo el nombre, y le asigna cursos desde `/admin/clases`. Ese vínculo (`clase.docente_id`) es
lo único que hace falta para exportar el Excel de esas clases.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | |
| `nombre` | texto | Único dato obligatorio al crear el registro |
| `email` | texto, nullable | Opcional. No hace falta ni para crear el registro ni para exportar el Excel — el administrador lo descarga y lo hace llegar por fuera de la app, no la app por correo. |
| `creado_en` | timestamptz | |

### `clase`

| Campo | Tipo |
|---|---|
| `id` | uuid PK |
| `codigo` | texto |
| `nombre` | texto |
| `docente_id` | → `docente`, **nulo permitido** |
| `seccion` | texto, **nulo permitido** |
| `jornada` | texto |
| `ciclo` | texto |
| `activa` | bool |

#### El catálogo se carga del pensum, el catedrático se asigna después

La base de clases se siembra con el **pensum completo de la carrera** (los 50 cursos de
`0908 — Ingeniería en Sistemas, jornada sábado, Escuintla`), no con el listado de un ciclo.

La razón es que **no se puede deducir qué cursa un alumno a partir de su ciclo**: hay quien
lleva cursos atrasados y quien los lleva adelantados. Por eso el alumno elige sus cursos uno
por uno de la lista completa (A4), con buscador por texto y filtro por ciclo para que
encontrarlos entre cincuenta no sea una tarea.

Consecuencia directa sobre el modelo: un curso del pensum existe antes de que se sepa quién
lo imparte y en qué sección. Por eso `docente_id` y `seccion` **admiten nulo**. Una clase sin
catedrático es un curso del catálogo todavía sin asignar; el alumno puede inscribirse igual y
sus puntos se calculan igual.

**Lo que sí bloquea el nulo:** la exportación a Excel (§9) agrupa por catedrático. Una clase
sin `docente_id` no puede exportarse. Antes del primer envío hay que completar el catedrático
de toda clase que tenga al menos un alumno inscrito, desde B2/B3. La pantalla de exportación
debe advertirlo en lugar de producir un libro incompleto en silencio.

### `inscripcion`

Alumno ↔ clase. Única por par. El alumno puede agregar y quitar libremente; quitar
**borra la fila** y deja constancia en `bitacora`.

| Campo | Tipo |
|---|---|
| `id` | uuid PK |
| `alumno_id` | → `alumno` |
| `clase_id` | → `clase` |
| `inscrito_en` | timestamptz |

Restricción: `UNIQUE (alumno_id, clase_id)`

### `actividad`

| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | |
| `codigo_corto` | texto único | Va en la URL del QR, se mantiene breve |
| `nombre` | texto | |
| `descripcion` | texto | |
| `lugar` | texto | |
| `tipo` | enum `global` \| `extra` | |
| `puntos` | int | 1 para globales, 2 para la extra |
| `inicia_en` | timestamptz | Informativo, se muestra al alumno |
| `termina_en` | timestamptz | Informativo |
| `marcaje_abre_en` | timestamptz | Inicio de la ventana en que se acepta el marcaje |
| `marcaje_cierra_en` | timestamptz | Fin de la ventana. Por defecto `inicia_en + 24 h` |
| `estado` | enum `borrador` \| `publicada` \| `cerrada` | |
| `secreto_qr` | bytea | 32 bytes. **Nunca sale del servidor** |
| `ventana_seg` | int | Duración del código. Por defecto 60 |

### `asistencia`

Un marcaje válido. Único por alumno y actividad.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | |
| `alumno_id` | → `alumno` | |
| `actividad_id` | → `actividad` | |
| `marcada_en` | timestamptz | |
| `slot` | bigint | Slot del código consumido |
| `origen` | enum `qr` \| `manual` | |
| `nota_manual` | texto | Obligatoria cuando `origen = manual` |
| `ip` | inet | Solo bitácora, nunca criterio de rechazo |
| `dispositivo_id` | texto | Identificador guardado en el navegador |
| `user_agent` | texto | |
| `clases_snapshot` | uuid[] | **Solo auditoría.** No participa en el cálculo de puntos |

Restricción: `UNIQUE (alumno_id, actividad_id)`

### `asignacion_extra`

El alumno decide en qué clase cae cada punto de su saldo.

| Campo | Tipo |
|---|---|
| `id` | uuid PK |
| `alumno_id` | → `alumno` |
| `actividad_id` | → `actividad` |
| `clase_id` | → `clase` |
| `puntos` | int |
| `creada_en` | timestamptz |

### `pantalla`

Permite abrir el kiosco del QR sin dejar una sesión de administrador abierta en una
computadora del salón.

| Campo | Tipo |
|---|---|
| `id` | uuid PK |
| `actividad_id` | → `actividad` |
| `clave` | texto único, aleatorio |
| `creada_en` | timestamptz |
| `activa` | bool |

### `bitacora`

Todo intento de marcaje, válido o no, más los cambios de inscripción. Es la única forma de
auditar después.

| Campo | Tipo |
|---|---|
| `id` | uuid PK |
| `alumno_id` | → `alumno` |
| `actividad_id` | → `actividad`, nullable |
| `evento` | enum |
| `resultado` | enum `ok` \| `expirado` \| `duplicado` \| `invalido` \| `fuera_de_horario` \| `sin_perfil` |
| `ocurrio_en` | timestamptz |
| `ip` | inet |
| `dispositivo_id` | texto |

### Zona horaria

Todo se almacena en **UTC**. Toda visualización usa `America/Guatemala` (UTC−6, sin horario
de verano). El servidor nunca confía en el reloj del teléfono para validar nada.

---

## 5. Reglas de puntos

### Dos tipos de actividad

| Tipo | Valor | Efecto al marcar asistencia |
|---|---|---|
| `global` | 1 pt | Acredita **el punto completo en cada una de las clases** del alumno. No se divide: si está en 3 clases, gana 1 punto en cada una. |
| `extra` | 2 pts | Abona **saldo** de 2 puntos. El alumno decide dónde caen: 2 en una clase, o 1 y 1 en dos clases distintas. |

### Fórmula

```
puntos(alumno, clase) =
      Σ  puntos de las actividades tipo `global` con asistencia registrada
    + Σ  asignaciones_extra del alumno hacia esa clase
```

El primer sumando aplica **a toda clase en la que el alumno esté inscrito al momento de
consultar**. No hay fecha de corte de inscripción: si alguien se inscribe a una clase
después de las actividades, sus puntos aparecen ahí. Es intencional.

`clases_snapshot` se guarda solo como dato de auditoría, por si en el futuro se quiere
cambiar este criterio sin haber perdido la información.

### Sin tope por clase

No hay máximo. Si hay 5 actividades globales de 1 punto, el alumno puede llegar a 5, más
los extras que gane. Si se agrega una sexta actividad global, el máximo sube a 6
automáticamente.

### Ejemplo trabajado

María está inscrita en tres clases. Hay 5 actividades globales de 1 punto y asiste a 3.
Además asiste a la Feria Tecnológica (extra, 2 puntos) y decide poner 1 en Redes y 1 en
Bases de Datos.

| Clase | Act. 1 | Act. 2 | Act. 3 | Act. 4 | Act. 5 | Extra | Total |
|---|---:|---:|---:|---:|---:|---:|---:|
| Programación II | 1 | 1 | 1 | 0 | 0 | 0 | **3** |
| Bases de Datos | 1 | 1 | 1 | 0 | 0 | 1 | **4** |
| Redes | 1 | 1 | 1 | 0 | 0 | 1 | **4** |

Esa tabla es, literalmente, la vista de "Participaciones" del alumno y también la hoja del
Excel. Un solo cálculo alimenta las dos.

### El saldo de puntos extra

Al asistir a una actividad extra, el alumno ve *"Tenés 2 puntos por asignar"*. Entra a
repartirlos: elige clase, elige cuántos, confirma. El saldo baja.

- Solo puntos enteros.
- Solo hacia clases con inscripción vigente.
- La suma de asignaciones nunca supera el saldo ganado. **Validación en base de datos**, no
  solo en pantalla.
- Se puede deshacer y reasignar hasta la **fecha de corte de reparto**: 48 horas después de
  la última actividad. Después se congela.
- **Si el alumno no reparte su saldo antes del corte, esos puntos se pierden.** No se
  reparten solos: decidir por él sería peor. Mientras tenga saldo pendiente, la app le
  muestra un aviso permanente en el inicio y en su perfil, y el aviso se vuelve más
  insistente en las últimas 24 horas.

### Bajas de clase

El sistema no lleva registro de bajas. El alumno quita la clase y desaparece de su perfil y
del Excel. Si el catedrático ve un alumno que no reconoce, simplemente lo ignora.

---

## 6. El QR rotativo

Es el corazón del sistema y la parte con más aristas técnicas.

### 6.1 Cómo se genera el código

Cada actividad tiene un **secreto** de 32 bytes que vive solo en el servidor. El código
visible se deriva así:

```
slot   = floor(unix_time / ventana_seg)
codigo = base64url( HMAC_SHA256(secreto, actividad_id ‖ slot) )[0..9]
url    = https://{dominio}/a/{codigo_corto}/{codigo}
```

Es el mismo principio que un token de Google Authenticator. No hay que guardar cada código
en la base: el servidor recalcula el que corresponde al momento en que llega la petición y
compara. Cero escrituras para generar, una sola lectura para validar.

La URL se mantiene deliberadamente corta. Un QR con poco contenido tiene módulos más
grandes y se escanea desde el fondo del salón; uno largo obliga a acercarse.

### 6.2 La ventana de validez

- Duración por defecto: **60 segundos**, configurable por actividad.
- El servidor valida contra **la hora en que llega el botón "Marcar asistencia"**, no contra
  la hora del escaneo.
- Se acepta el slot actual, más **10 segundos de gracia** del slot anterior, para cubrir
  latencia de red y desfases de reloj.
- En la práctica un código sirve entre 10 y 70 segundos según cuándo se muestre.

Consecuencia: si alguien fotografía el QR y lo manda por WhatsApp, el que lo recibe tiene
que pulsar el botón dentro del mismo minuto. Fuera de eso, el sistema responde *expirado*.

### 6.3 Cómo se alimenta la pantalla

La pantalla de kiosco pide al servidor el código vigente y **precarga los siguientes cinco**.
Si la red se cae un momento, sigue rotando sin interrupción; si se cae más de cinco minutos,
muestra una advertencia visible en lugar de un QR que ya nadie puede validar.

El `secreto_qr` **nunca llega al navegador**. Si llegara, cualquiera con la consola abierta
podría fabricar códigos válidos durante todo el evento.

Requisitos de la pantalla:

- Se abre con una **clave de pantalla** (tabla `pantalla`), no con la sesión del
  administrador. Así no queda una sesión con permisos en una computadora del salón.
- Wake Lock API para que la computadora no bloquee la pantalla a mitad del evento.
- Pantalla completa, alto contraste, QR de al menos 40 % del alto de pantalla.
- Nivel de corrección de errores M: tolera reflejos y ángulos sin inflar la densidad.
- Muestra el nombre de la actividad, el contador regresivo y las asistencias en vivo.

### 6.4 Cómo escanea el alumno

**Decisión tomada: se usa la cámara nativa del teléfono. No se construye escáner dentro de
la app.**

El alumno abre la cámara del sistema, apunta al QR, toca la notificación y se abre el
navegador en la página de marcaje. Ahí pulsa el botón.

Ventajas de este camino:

- Cero código de escáner, cero dependencia de librerías de lectura.
- **Cero permisos de cámara**, que es donde más usuarios se pierden.
- Funciona igual en Android, iOS, y en cualquier versión razonablemente moderna.
- No exige tener la app instalada.

El costo conocido: en iOS el enlace abre en Safari, y el almacenamiento de Safari está
separado del de la PWA instalada. Si el alumno solo inició sesión dentro de la PWA, en
Safari aparece deslogueado.

**Esto es manejable y no se considera un bloqueante**, siempre que la página de marcaje esté
diseñada para el caso:

1. Si el alumno no tiene sesión, se muestra el formulario de ingreso **en la misma página**,
   sin redirecciones que pierdan el contexto.
2. Tras iniciar sesión, si el código ya expiró, la página no falla en silencio: muestra
   *"El código ya cambió. Escaneá otra vez el de la pantalla"* con un botón grande.
3. El segundo escaneo es instantáneo, porque la sesión de Safari ya quedó guardada.

En la práctica, el peor caso es un doble escaneo la primera vez. Se mitiga pidiendo a los
alumnos que inicien sesión antes de que empiece la actividad.

Si en el ensayo de campo (§9) esta fricción resulta mayor de lo esperado, el escáner dentro
de la app queda como mejora posterior, no como requisito de la versión 1.

### 6.5 Un escaneo por actividad

Un solo escaneo acredita la asistencia. No se exige un segundo escaneo de salida.

---

## 7. Antifraude

El registro es abierto y la verificación de identidad ocurre fuera de la app: el catedrático
ignora en el Excel los carnés que no reconoce. Dentro de la app, las capas son estas:

| Capa | Qué frena | Estado |
|---|---|---|
| Ventana de 60 s | Compartir la foto del QR fuera del momento | Base |
| Sesión obligatoria | Marcaje anónimo o sin cuenta | Base |
| Perfil completo obligatorio | Marcajes sin carné asociado | Base |
| Unicidad alumno + actividad | Marcar dos veces la misma actividad | Base |
| Ventana de marcaje de la actividad | Marcar fuera del horario del evento | Base |
| Huella de dispositivo | Un mismo teléfono marcando por varias cuentas | Señal, no bloqueo |
| Bitácora completa | Nada por sí sola; permite investigar después | Señal |
| Filtro final del catedrático | Carnés inventados | Fuera de la app |

### No bloquear por dirección IP

Todo el campus sale por la misma IP pública. Bloquear "muchos marcajes desde una IP" dejaría
fuera al salón entero. La IP sirve como dato de bitácora, **nunca como criterio de rechazo
automático**.

### Mensajes de error visibles para el alumno

| Resultado | Lo que ve el alumno |
|---|---|
| `expirado` | El código ya cambió. Escaneá otra vez el de la pantalla. |
| `duplicado` | Ya marcaste asistencia en esta actividad a las 10:23. |
| `sin_perfil` | Completá tu carné y nombre para registrar tu asistencia. |
| `invalido` | Ese código no corresponde a esta actividad. |
| `fuera_de_horario` | La actividad todavía no abre / ya cerró. |

**Si el alumno no está inscrito a ninguna clase, la asistencia se guarda de todas formas.**
Los puntos aparecen solos cuando se inscriba. Perder una asistencia real por un trámite
pendiente sería el peor error posible del sistema.

---

## 8. Pantallas

### Alumno

| ID | Pantalla | Descripción |
|---|---|---|
| A1 | Registro | Correo y contraseña. Abierto a cualquiera. |
| A2 | Ingreso | Correo y contraseña, con recuperación por enlace. |
| A3 | Completar perfil | Carné, nombre completo, ciclo que cursa y al menos un curso (combobox tipo select2, sin límite, sobre el mismo catálogo de A4). **Obligatorio**, bloquea el resto de la app. |
| A4 | Elegí tus clases | Catálogo completo del pensum, con buscador por texto y filtro por ciclo. Arranca filtrada en el ciclo del alumno, pero puede ver todos. Selección múltiple. Sugerido tras el perfil, no bloqueante. |
| A5 | Inicio | **Pantalla de entrada del alumno.** La actividad con el marcaje abierto y qué hacer para marcarla, o la próxima si no hay ninguna abierta. Resumen de puntos y aviso de saldo extra se suman en la Fase 3. |
| A6 | Marcar asistencia | Página a la que llega el QR. Login en línea si hace falta, botón grande. |
| A7 | Resultado | Éxito con la hora exacta, o el error correspondiente con su instrucción. |
| A8 | Mis clases | Agregar o quitar clases, y total de puntos de cada una. |
| A9 | Participaciones | La tabla de actividades por clase. Todas las actividades visibles, con 1 o 0. |
| A10 | Puntos extra | Saldo disponible y reparto entre clases, con deshacer hasta la fecha de corte. |

### Administrador

| ID | Pantalla | Descripción |
|---|---|---|
| B1 | Tablero | Actividad en curso, asistencias de hoy, alumnos registrados, alertas. |
| B2 | Catedráticos | Alta y edición de docentes. Vista por docente con sus clases y su botón de descarga. |
| B3 | Clases | Alta, edición e importación por CSV. Cada clase se asocia a un docente. |
| B4 | Actividades | Tipo, puntos, horario, ventana de marcaje, duración del código. |
| B5 | Pantalla QR | Modo kiosco a pantalla completa, abierto por clave de pantalla. |
| B6 | Asistencias en vivo | Quién va marcando, en tiempo real, durante la actividad. |
| B7 | Alumnos | Buscar, ver clases y puntos, corregir inscripciones, liberar carnés, bloquear cuentas. |
| B8 | Marcaje manual | Registrar una asistencia con justificación obligatoria. Queda en bitácora. |
| B9 | Bitácora | Intentos de marcaje y señales raras, para revisión humana. Nunca acción automática. |
| B10 | Exportar | Un libro por catedrático, o consolidado. |

---

## 9. Exportación a Excel

**Un libro por catedrático, con una hoja por cada una de sus clases.**

El flujo: el administrador entra a la página del catedrático (B2), ve sus clases, y descarga
un archivo. Ese archivo se envía por fuera de la app — no hay envío automático de correo.

### Encabezado de cada hoja

- Nombre y código de la clase, sección y jornada.
- Nombre del catedrático.
- Ciclo y fecha de generación del reporte.

### Columnas

| # | Carné | Nombre | Act. 1 | … | Act. 5 | Extra | Total |
|---:|---|---|---:|---:|---:|---:|---:|
| 1 | 0905-22-1234 | García López, María | 1 | … | 0 | 1 | **4** |
| 2 | 0905-22-5678 | Pérez Ruiz, Juan | 1 | … | 1 | 0 | **5** |

- Los encabezados de las columnas de actividad llevan el **nombre real del evento**, no "Act. 1".
- Alumnos ordenados por apellido.
- Totales en negrita, anchos de columna ya ajustados.

---

## 10. Arquitectura

| Pieza | Elección | Por qué |
|---|---|---|
| Aplicación | Next.js 15 (App Router) + TypeScript | Frontend y backend en un repo. Las rutas de servidor sirven la validación del QR y la generación del Excel. |
| Base de datos | **Neon** (PostgreSQL serverless) | Postgres real, plan gratuito, buena experiencia de uso. |
| ORM y migraciones | Drizzle | Encaja bien con Neon y con TypeScript. Migraciones versionadas en el repo. |
| Autenticación | **Neon Auth** (Managed Better Auth) | Ya viene con la base. Dos variables: `NEON_AUTH_BASE_URL` y `NEON_AUTH_COOKIE_SECRET`. Respaldo: Auth.js. |
| Hospedaje | **Netlify** | Despliegue desde el repo, HTTPS automático. Era Vercel hasta el 30 de agosto de 2026 — ver «Netlify en vez de Vercel» más abajo. |
| Generar QR | `qrcode` sobre canvas | Ligero y controlable en tamaño y corrección de errores. |
| Leer QR | — | No se implementa. Se usa la cámara nativa del teléfono. |
| Excel | `exceljs` en ruta de servidor | Control total sobre formato, anchos y negritas. |
| Estilos | Tailwind CSS | Velocidad de iteración en pantallas móviles. |

**Costo de infraestructura: cero** en los planes gratuitos de Netlify y Neon.

### Netlify en vez de Vercel

Desplegado desde el 30 de agosto de 2026 en **Netlify**, no en Vercel como decía este
documento hasta esa fecha. Decisión del usuario; no cambia nada del diseño, solo el
hospedaje. Todo lo demás de esta sección sigue igual, incluido el cálculo del largo del QR
más abajo: solo cambió el dominio del que sale la URL.

### Dominio

No se compra dominio propio por ahora. Se usa el **subdominio gratuito de Netlify**:

```
https://app-asist-actividades-umg.netlify.app
```

Esto tiene una consecuencia directa en el QR: el dominio **es** parte de la URL que se
codifica, y una URL más corta produce un QR con módulos más grandes, que se lee desde más
lejos. Con el nombre de proyecto de Netlify la URL queda así:

```
https://app-asist-actividades-umg.netlify.app/a/x3/k9f2mq8w1p     (61 caracteres)
```

Son 61 caracteres, que en modo byte con corrección de errores M **siguen entrando** en un QR
de versión 4 (33 × 33 módulos, capacidad máxima 62 caracteres en modo byte con nivel M) — pero
raspando el límite, con un solo carácter de margen. Con el dominio de Vercel el margen era de
13 caracteres (49 de 62); con este dominio, más largo, un `codigo_corto` de tres caracteres en
vez de dos ya empujaría el QR a versión 5 (37 × 37, un módulo más denso, más difícil de leer
desde el fondo del salón). **Mientras se use este dominio, conviene mantener `codigo_corto`
en dos caracteres.** Se confirma que el QR se lee bien de todos modos en el ensayo de campo de
la §12; si en algún momento no alcanza, la salida más simple es comprar un dominio corto.

### Acceso a datos

**Todo el acceso a la base pasa por el servidor.** No hay cliente de base de datos en el
navegador, así que no se depende de seguridad a nivel de fila: la autorización se hace en las
rutas de servidor y en las server actions.

Reglas:

**La Data API de Neon queda deshabilitada a propósito.** Expone las tablas como una API REST
pública consultable desde el navegador. Con el registro abierto que decidimos en la §14, y con
la opción «Grant public schema access» activa, cualquier alumno registrado podría escribir
directo en `asistencia` desde la consola del navegador y regalarse los puntos, sin escanear
ningún QR. Es exactamente lo que todo el diseño del QR existe para impedir. La Data API sirve
para aplicaciones sin backend; nosotros tenemos backend.

- Un alumno solo puede leer y modificar sus propias inscripciones y asignaciones.
- Nadie escribe directo en `asistencia`. Solo la ruta de servidor que valida el código.
- El `secreto_qr` no es legible por ningún cliente, ni siquiera el del administrador.
- La bitácora es de solo escritura para el sistema y de solo lectura para el administrador.

### Nota sobre Neon y el arranque en frío

Neon suspende la base tras un rato de inactividad y la primera consulta después tarda unos
cientos de milisegundos. Para un evento con marcajes en ráfaga es irrelevante a partir de la
segunda petición, pero conviene **hacer una consulta de calentamiento** unos minutos antes
de que empiece la actividad, o ajustar el tiempo de autosuspensión ese día.

### Por qué TypeScript y no .NET

Nada en este sistema exige TypeScript; .NET haría el trabajo perfectamente. Las razones de
la elección son prácticas:

- **Un solo proyecto y un solo despliegue.** Con .NET serían una API de ASP.NET Core más un
  frontend aparte, o Blazor. Dos cosas que desplegar en vez de una.
- **Hospedaje gratuito y sencillo.** Netlify (o Vercel, cualquiera de los dos) despliega
  Next.js desde el repositorio sin configuración. Para .NET habría que ir a Azure, Render o
  Fly.io, con más pasos.
- **La pantalla del QR es JavaScript de todos modos.** Generar el código en canvas, el
  contador regresivo y el Wake Lock viven en el navegador. Con .NET igual habría que escribir
  esa parte en JS.
- **La PWA es territorio del ecosistema JS.** Manifiesto y service worker.

Si el desarrollo lo hace alguien con más soltura en C# que en TypeScript, **.NET es una
elección defendible** y no habría que rediseñar nada de este documento: el modelo de datos,
la derivación del código HMAC y las reglas de puntos son idénticos. Solo cambian el stack y
el hospedaje.

---

## 11. PWA e instalación

La app es **web primero**. La PWA es una comodidad, no un requisito: todo funciona en el
navegador sin instalar nada.

| Plataforma | Instalación | Consideraciones |
|---|---|---|
| Android | Chrome ofrece "Instalar aplicación" automáticamente | Sin fricción. |
| iOS | Manual: Compartir → Agregar a inicio. Safari no ofrece banner | El almacenamiento de la app instalada está separado del de Safari (ver §6.4). |

Requisitos técnicos:

- `manifest.json` con nombre, iconos de 192 y 512 px, `display: standalone` y color de tema.
- Service worker que cachee el armazón de la app. **El marcaje nunca funciona sin conexión** —
  la validación es del servidor por definición, y hay que decirlo claro en pantalla.
- HTTPS obligatorio.
- Diseño primero para móvil. La única pantalla pensada para escritorio es el kiosco del QR.
- Pantalla de ayuda con el paso a paso de instalación en iOS.

---

## 12. Riesgos

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Se cae el internet en el salón | Alto | Precarga de códigos en la pantalla. Si nadie puede marcar, el administrador toma lista y carga manualmente después. |
| Alumnos de iPhone se topan con login en Safari | Medio | Formulario de ingreso en la propia página de marcaje, mensaje claro de código expirado, y pedir que inicien sesión antes de la actividad. |
| El QR no se lee desde lejos | Medio | URL corta, QR grande, alto contraste, prueba en el salón real. |
| Alguien pasa el QR por WhatsApp | Medio | Ventana de 60 s. Es la única defensa y es deliberada. |
| Carnés inventados | Bajo | Filtro del catedrático en el Excel. Decisión explícita del proyecto. |
| Base suspendida por inactividad (Neon) | Bajo | Consulta de calentamiento antes del evento. |
| La computadora del kiosco se bloquea | Bajo | Wake Lock API y desactivar la suspensión del equipo. |
| Cien alumnos escaneando a la vez | Bajo | La validación es una operación de milisegundos. |

### Ensayo obligatorio

Una prueba en el salón real, con la computadora real y cinco teléfonos distintos —al menos
un iPhone y un Android viejo—, **una semana antes de la primera actividad**. Casi todos los
riesgos de esta tabla aparecen ahí y no en el escritorio.

---

## 13. Fases de entrega

| Fase | Contenido | Entregable |
|---|---|---|
| **0** | Definición | Este documento + esquema SQL |
| **1** | Cuentas y clases | A1 A2 A3 A4 A8 · B2 B3 |
| **2** | El QR | A5 A6 A7 · B4 B5 B6 · **ensayo en campo** |
| **3** | Puntos | A9 A10 |
| **4** | Administración y Excel | B1 B7 B8 B9 B10 |
| **5** | PWA y endurecimiento | Manifiesto, service worker, guía de iOS, pruebas finales |

El orden importa: cada fase deja algo que se puede probar de verdad, y la fase 2 hay que
ensayarla en campo antes de seguir.

---

## 14. Decisiones cerradas

| # | Pregunta | Decisión |
|---|---|---|
| 1 | ¿Registro abierto o lista blanca? | **Abierto.** Correo y contraseña, luego carné y nombre completo como paso obligatorio. Los carnés inventados los ignora el catedrático en el Excel. |
| 2 | ¿Tope de puntos por clase? | **No hay tope.** Tantos puntos como actividades haya, más los extras. |
| 3 | ¿Fechas de corte? | **No hay corte de inscripción a clases.** Cada actividad tiene su ventana de marcaje, por defecto hasta 24 h después del inicio. El reparto de extras se congela 48 h después de la última actividad. |
| 4 | ¿Bajas de clase? | **No se registran.** El alumno quita la clase y desaparece; el catedrático ignora lo que no reconoce. |
| 5 | ¿Duración de la ventana del QR? | **60 s por defecto, configurable por actividad.** |
| 6 | ¿Uno o dos escaneos? | **Uno.** |
| 7 | ¿Formato del Excel? | **Un libro por catedrático, una hoja por clase.** Requiere entidad `docente`. Descarga manual, solo por el administrador. |
| 8 | ¿Alumnos sin teléfono? | **Marcaje manual del administrador** con justificación obligatoria. |
| 9 | ¿Cuántas actividades? | **5 globales de 1 punto + 1 extra de 2 puntos.** Faltan fechas y lugares. |
| 10 | ¿Escáner dentro de la app? | **No.** Cámara nativa del teléfono. La página de marcaje maneja el caso de sesión ausente y código expirado. |
| 11 | ¿Base de datos? | **Neon** (PostgreSQL serverless) con Neon Auth y Drizzle. |
| 12 | ¿Backend en TypeScript o .NET? | **TypeScript**, con Next.js. Más fácil de desplegar y mantener: un solo proyecto, un solo despliegue. |
| 13 | ¿Dominio propio? | **No por ahora.** Subdominio gratuito de Netlify. El nombre del proyecto debe ser corto porque va dentro del QR — ver «Dominio» en §10. |
| 14 | ¿Saldo extra sin repartir? | **Se pierde**, con aviso permanente en la app mientras haya saldo pendiente. |

---

## 15. Pendientes

Ninguno bloquea el arranque de la Fase 1. Son datos que hacen falta antes del primer evento.

- **Fechas, horas y lugares** de las 5 actividades globales y de la actividad extra. Se van
  cargando en `/admin/actividades` conforme se crean, no hace falta tenerlas todas de una vez.
- **Listado real de clases** con nombre del catedrático, sección, jornada y ciclo. El correo
  del catedrático es opcional (§3, §4).

## 16. Cuentas y servicios

| Servicio | Para qué | Estado |
|---|---|---|
| GitHub | Repositorio: `developerumg3-dotcom/asistencia-actividades-umg` (privado) | Listo |
| Neon | Proyecto `app_asistencia_actividades` (`hidden-art-98202594`), organización DeveloperUMG (`org-dawn-math-42337202`) | Listo |
| Netlify | Hospedaje y despliegue continuo. Proyecto: `app-asist-actividades-umg` | Listo |

Nombre público: **`https://app-asist-actividades-umg.netlify.app`**

No hace falta nada más para arrancar. Posibles agregados posteriores:

- **Servicio de correo** (Resend o similar), solo si el correo de recuperación de contraseña
  que trae Neon Auth no alcanza.
- **Registrador de dominio**, si más adelante se quiere una URL más corta para el QR.
