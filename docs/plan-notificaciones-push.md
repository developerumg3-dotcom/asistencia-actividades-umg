# Plan — Notificaciones push

Pedido del Ing. Fonseca. Reabre una decisión de alcance: la §2 de
[`PLANIFICACION.md`](../PLANIFICACION.md) lista «Notificaciones push» en **No entra**.

**Estado:** plan, sin código. Iría en rama aparte (`feature/notificaciones`).

---

## Respuesta corta

**Sí es posible, y la parte difícil ya está hecha.** La Web Push API necesita un service
worker registrado, y la app ya lo tiene desde la Fase 5 (`public/sw.js`, activo y verificado
en producción). Lo que falta es un manejador de `push`, un par de claves VAPID, una tabla de
suscripciones y algo que dispare los envíos.

**Pero hay un límite que conviene decir antes que nada, porque cambia lo que se le puede
prometer al director.**

---

## El problema del iPhone

En iOS, las notificaciones push **solo funcionan si el alumno agregó la app a su pantalla de
inicio**. Safari navegando normal no las recibe: no hay forma de pedirle permiso siquiera.

Esto no es un detalle de configuración, es cómo Apple lo diseñó. Y tiene dos consecuencias
que pegan justo en este proyecto:

1. **Un alumno con iPhone que no instale la app no recibe ninguna notificación, nunca, y sin
   enterarse.** No hay aviso ni error: simplemente no le llegan.
2. **Instalar una PWA en iPhone es un trámite manual** —Compartir → Añadir a inicio— que hay
   que explicar. Ya existe la guía en `/ayuda/instalar-ios` precisamente por esto.

Y hay un agravante: **la instalación real en un iPhone físico nunca se probó**. Es la tarea 9
de la Fase 5, pendiente porque este entorno no tiene cómo simular iOS. O sea que el
prerrequisito de las notificaciones en iPhone **ni siquiera está verificado**.

En Android es más simple: Chrome recibe push tanto con la app instalada como navegando.

**Qué significa en la práctica:** las notificaciones van a llegarle a una parte de los
alumnos, no a todos, y esa parte depende de cuántos instalen la app. No se puede plantear
como «les avisamos a todos». Se plantea como **un recordatorio extra para quien la tenga
instalada**, y el canal principal sigue siendo el aviso dentro de la app.

---

## Los otros dos peros

### El permiso se pide una sola vez en la vida

Si el alumno toca «Bloquear», **no se le puede volver a preguntar**. El navegador recuerda esa
decisión y la única forma de revertirla es que él entre a la configuración del sitio, cosa que
nadie hace. Un solo diálogo mal puesto y ese alumno queda inalcanzable para siempre.

Es el mismo tema que salió con la geolocalización, pero con una diferencia a favor: acá **no
hay un reloj de 60 segundos corriendo**. El permiso se puede pedir en un momento tranquilo,
explicando antes para qué sirve. Eso cambia mucho las probabilidades de que digan que sí.

Regla, entonces: **nunca pedirlo al entrar**. Se pide cuando el alumno está mirando algo que
le da sentido, y después de explicarle qué va a recibir.

### No hay servidor encendido que mande las notificaciones

La app corre en Netlify, que es serverless: no hay un proceso vivo esperando para disparar
avisos a una hora. Dos salidas:

- **Envío a mano desde el panel**, un botón «Avisar a los alumnos». Simple, sin
  infraestructura nueva, y ustedes controlan cuándo.
- **Netlify Scheduled Functions** para lo que sí debe salir solo, como el recordatorio de
  puntos extra por vencer.

La primera alcanza para empezar.

---

## Para qué sirve de verdad

Conviene ser honesto sobre cuáles de estos avisos valen la pena:

| Aviso | ¿Vale la pena? |
|---|---|
| **«Te quedan N puntos extra sin repartir, se pierden el {fecha}»** | **Sí, es el que justifica todo.** La decisión 14 dice que el saldo sin repartir **se pierde**. Hoy el único aviso vive dentro de la app, así que el alumno tiene que entrar para enterarse. Una notificación acá evita que alguien pierda puntos que ya se ganó. |
| «Mañana hay actividad» | Sí, moderado. Recordatorio normal. |
| «Ya podés marcar asistencia» | **Poco.** El alumno está en el evento, con el QR proyectado enfrente. No necesita que le avisen. |

Si solo se hiciera el primero, la función ya se habría pagado sola. Los otros dos son extras.

---

## Plan por etapas

### Etapa 0 — Verificar el prerrequisito (sin código)

Aprovechando el [ensayo en campo](ensayo-campo.md), que ya tiene la instalación de la PWA
como prueba 8:

1. Instalar la app en un **iPhone real** y confirmar que abre sin la barra del navegador.
2. Instalar en un **Android real**.
3. Preguntar a mano a un grupo de alumnos cuántos tienen iPhone.

**Qué sale de acá:** si la instalación en iPhone resulta complicada o la gente no la hace, las
notificaciones le van a llegar a la mitad del curso y conviene saberlo **antes** de
construirlas, no después.

### Etapa 1 — Suscripción y un envío manual

- Claves VAPID (`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`) como variables de entorno. La privada
  nunca sale del servidor, igual que `secreto_qr`.
- Tabla `suscripcion_push`: `alumno_id`, `endpoint` (único), `p256dh`, `auth`, `creada_en`,
  `ultimo_error_en`. Un alumno puede tener varias — teléfono y computadora son suscripciones
  distintas.
- Manejadores `push` y `notificationclick` en `public/sw.js`. El segundo abre la app en la
  pantalla que corresponda.
- Un componente que **pide el permiso explicándolo antes**, ubicado en la pantalla de puntos
  extra, que es donde el aviso tiene sentido. Nunca al entrar.
- En el panel, un botón para mandar un aviso a los alumnos de una actividad.
- **Limpieza automática:** si el servicio responde `404` o `410`, esa suscripción murió
  (desinstalaron la app, limpiaron datos) y se borra. Sin esto la tabla se llena de
  direcciones muertas y cada envío tarda más.

**Riesgo:** bajo. Nada de esto toca el marcaje ni los puntos.

### Etapa 2 — El recordatorio que importa

El aviso automático de puntos extra por vencer, con Netlify Scheduled Functions. Una vez al
día, a los alumnos con saldo sin repartir y con la fecha de corte cerca.

**Condición para hacerlo:** que la etapa 1 muestre que una cantidad razonable de alumnos
aceptó el permiso. Si solo se suscribieron cinco, no vale la pena el trabajo del programador.

### Etapa 3 — Decidir si se queda

Medir cuántos avisos se entregaron y cuántos alumnos abrieron la app desde uno. Si nadie los
abre, son ruido y se quitan.

---

## Lo que hay que decidir antes de empezar

- **¿Se acepta que no les llegue a todos?** Es la pregunta de fondo. Si la respuesta es que
  las notificaciones tienen que llegarle a todo el curso sí o sí, **la Web Push no sirve** y
  habría que hablar de correo o WhatsApp, que son otra conversación.
- **¿Qué avisos se mandan?** Mi recomendación: solo el de puntos extra al principio. Es el
  único que evita un daño real.
- **¿Quién decide cuándo se manda?** Manual en la etapa 1.

## Lo que este plan no propone

- **Reemplazar los avisos dentro de la app.** Siguen siendo el canal principal, porque son los
  únicos que les llegan a todos. La notificación es un recordatorio extra encima.
- **Mandar notificaciones de cada cosa que pasa.** Un aviso que no evita un daño concreto es
  ruido, y el costo de equivocarse es alto: el alumno bloquea el permiso y no vuelve.
- **Notificaciones a los catedráticos.** Ellos no tienen cuenta (§3).

## Antes de escribir código

Esto reabre la §2, que lista las notificaciones push en «No entra». Igual que con la
geolocalización y con la cuenta del catedrático: **primero se actualiza
[`PLANIFICACION.md`](../PLANIFICACION.md), después el código.** Hay que dejar anotado el
límite del iPhone, porque es la clase de cosa que se olvida y después aparece como sorpresa
en medio de un evento.
