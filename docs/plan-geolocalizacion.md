# Plan — Geolocalización del marcaje

Propuesta del Ing. Fonseca al presentar el sistema al director: declarar un punto y un radio,
y que el QR solo acredite dentro de esa distancia.

**Estado al 4/10/2026:** etapas 1 y 2 implementadas y verificadas en el despliegue de
producción. Bloqueo opcional por actividad, apagado por defecto. ASI2-1 sigue En pruebas.
La propuesta inicial que sigue se conserva como contexto; no describe trabajo sin empezar.

## Pruebas reales del 4 de octubre de 2026

Se crearon dos actividades desde el panel, con QR rotativo de 60 s, radio 200 m y rechazo
fuera activado. El alumno usó `juliocesarticaspalencia@gmail.com`, diferente de la cuenta admin.

| Caso | Evidencia independiente en el panel | Resultado |
|---|---|---|
| Fuera de zona de Enchulados, 23:17 GT | Bitácora `fuera_de_zona`; pantalla en vivo con 0 asistencias | Rechazado, sin puntos de esa actividad |
| Dentro de zona de prueba, 23:26 GT | Bitácora `ok`; 1 asistencia QR, distancia 12 m, precisión ±9 m | Aceptado con una lectura precisa dentro del radio |

No se simularon coordenadas ni se ejecutaron migraciones. El segundo caso se preparó para
teléfono con datos móviles; la interfaz no demuestra por sí sola el tipo de red. No guardar
coordenadas domiciliarias en documentación o kanban. Los IDs, límites y pendientes están en
[el registro de traspaso](registro-2026-10-04.md).

Faltan pruebas de permiso denegado, ubicación imprecisa, reuso/expiración del QR y ensayo de
varios teléfonos en el evento. El éxito de estos dos casos no verifica esos otros caminos.
La red/IP no decide el rechazo. Sin lectura o con precisión mayor que el radio se permite
marcar; una lectura fuera y precisa produce `fuera_de_zona` y no crea asistencia.

Para dejar solo la señal, desactivar «Rechazar a quien marque fuera de la zona» conservando
centro y radio. Vaciar la zona elimina además el cálculo de distancia. No borrar las
actividades de prueba ni su evidencia sin autorización.

---

## Respuesta corta

**Sí es posible, y en el caso de ustedes tiene sentido.** Los eventos son en Enchulados, un
área abierta y grande. Eso cambia el análisis por completo: al aire libre el GPS de un
teléfono da entre 5 y 15 metros de precisión, y con eso un radio de 100 m es una medida real.

Si los eventos fueran dentro de un aula, la recomendación sería la contraria. Bajo techo el
GPS suele no engancharse y el navegador cae a triangulación por WiFi y antenas, con errores de
50 a 2000 metros. Un radio de 100 m con un error de 500 m no filtra nada: o se rechaza a
alumnos que sí están, o se acepta a todos.

**Al aire libre funciona. Ese es el punto a favor.** Ahora los tres peros, que son reales.

## Los tres peros

### 1. La ubicación la reporta el teléfono, no se puede verificar

El servidor recibe unas coordenadas y no tiene forma de comprobar que sean ciertas. Falsearlas
es fácil: Chrome trae un simulador de ubicación en sus herramientas de desarrollo, y en
Android hay aplicaciones de «ubicación simulada» que se activan desde opciones de
desarrollador en dos minutos.

Conviene ver cómo se compara con lo que ya tenemos:

| Defensa | Qué hace falta para saltarla |
|---|---|
| **Ventana de 60 s** | Dos personas coordinadas en tiempo real, en el mismo minuto |
| **Geolocalización** | Una sola persona, y veinte segundos de configuración |

Es decir: **la geolocalización es más fácil de saltar que lo que ya tenemos.** No la
reemplaza, se le suma.

**Decisión del 31 de agosto de 2026: se acepta ese límite y se avanza igual.** El razonamiento
es correcto y conviene dejarlo escrito: el fraude que se quiere frenar es el casual —
fotografiar el QR y mandarlo por WhatsApp cuesta diez segundos y no requiere saber nada.
Instalar y configurar una aplicación de ubicación simulada ya es proponérselo, y son contados
los que lo harían. Nadie promete que sea infalible; la medida vale por lo que encarece el caso
común, no por el caso extremo. Y la ventana de 60 s sigue siendo la defensa principal.

### 2. El permiso de ubicación es la fricción que este proyecto evitó a propósito

La decisión 10 descartó el escáner dentro de la app con este argumento textual: «cero permisos
de cámara, que es donde más usuarios se pierden». El permiso de ubicación reintroduce
exactamente ese problema, y en el peor momento: el alumno tiene **60 segundos** y el navegador
le pregunta si permite acceder a su ubicación.

Qué puede salir mal ahí: que lo rechace por reflejo; que el diálogo aparezca mientras corre el
reloj; que el iPhone tarde en fijar posición; que tenga la ubicación desactivada en el
sistema. En todos esos casos, **un alumno que sí fue pierde su punto**.

Perder una asistencia real es, según la propia planificación, el peor error posible del
sistema.

### 3. ¿Contra quién protege de verdad?

El escenario que se quiere frenar es: alguien fotografía el QR y se lo manda a un compañero
que no fue. Pero si ese compañero está en el mismo predio —llegó tarde, está afuera, está en
otra parte del evento—, cien metros lo cubren igual. La geolocalización frena al que está
lejos; a ese ya lo frena la ventana de 60 segundos.

---

## Lo que propongo

Que la ubicación entre **como señal, no como bloqueo** — al menos al principio.

No es una salida por lo bajo: es exactamente el criterio que el proyecto ya aplica a las otras
señales. La §7 lista «Huella de dispositivo» como **señal, no bloqueo**, y la §7 dice de la IP
que es «dato de bitácora, no criterio». La ubicación tiene la misma naturaleza: **excelente
para investigar después, peligrosa para decidir en el momento.**

Con eso, un marcaje a tres kilómetros queda registrado y se ve en la bitácora. El
administrador puede anularlo a mano. Y nadie que sí fue pierde su punto por un diálogo de
permisos.

---

## Plan por etapas

Cada etapa se puede parar sin haber roto nada. Ninguna exige ir al lugar antes de tiempo.

### Etapa 0 — El centro, sin ir al lugar

Ir a medir se descartó: cuesta demasiado organizarlo. No hace falta.

Conviene separar las dos cosas que una visita habría dado, porque solo una necesita estar ahí:

| Qué | Cómo se consigue sin ir |
|---|---|
| **El centro del lugar** | Google Maps, en diez segundos |
| **La precisión real de los teléfonos** | La recoge sola la etapa 1, de los alumnos reales, en el primer evento |

O sea que la medición no se salta: **se hace sola durante el primer evento**, y con muchos más
teléfonos de los que llevaríamos a una visita.

**Sacar el centro:** clic derecho sobre «Restaurante Enchulados» en Google Maps. Las
coordenadas salen arriba del menú y se copian con un clic. Eso da el punto exacto que Google
tiene registrado para el local.

Como referencia, estimado contando píxeles sobre una captura del mapa:
**14.308584, -90.786289**. Sirve para tener una idea, pero tiene unos ±30 m de error — usar
siempre el valor del clic derecho, que es exacto.

**El radio: 200 m** (decidido con el usuario el 4 de octubre de 2026). Cubre el local, su
estacionamiento y los alrededores inmediatos, más el error del GPS. Es amplio a propósito, y
aun así deja fuera a quien esté en su casa o en la universidad, que es el caso que se quiere
frenar. **Un radio de más solo pierde un poco de filtro; un radio de menos rechaza a alumnos
que sí fueron**, y eso es el peor error posible del sistema.

Los datos de la etapa 1 respaldan que alcanza: las lecturas reales dieron **19 m y 33 m de
precisión**, un orden de magnitud por debajo del radio.

200 es el valor **sugerido**, no un límite: el rango aceptado va de 20 a 5000 m.

### Las actividades no son siempre en el mismo lugar

Enchulados es el habitual, pero habrá otras sedes. Por eso la zona **se declara por
actividad** y no hay un lugar fijo en el código: el administrador pega el punto que saca de
Google Maps en cada actividad que crea. Enchulados aparece solo como ejemplo en el campo.

### Etapa 1 — Registrar sin bloquear

- `actividad`: `lat` (doble precisión), `lon`, `radio_m` (entero). **Los tres admiten nulo**;
  nulo significa «esta actividad no usa ubicación», que es el comportamiento de hoy.
- `asistencia`: `lat`, `lon`, `precision_m`, `distancia_m`. Todos nulos permitidos —
  el alumno pudo negar el permiso, y eso no puede impedirle marcar.
- La página de marcaje pide la ubicación **en paralelo**, no antes del botón: si a los 5
  segundos no la tiene, marca igual y se guarda sin ubicación. **El botón nunca espera.**
- El servidor calcula la distancia (fórmula del haversine, ~15 líneas) y la guarda.
- En B4 se declara el punto y el radio; en `/admin/bitacora` y en la vista en vivo se muestra
  la distancia, resaltando lo que quede fuera del radio.

**Riesgo:** ninguno. Nadie deja de marcar por esto.

**Qué se obtiene:** un evento real de datos. Cuántos alumnos conceden el permiso, qué
precisión real dan sus teléfonos, y si alguno aparece lejos. Con eso se decide la etapa 2 con
números en vez de con opiniones.

### Etapa 2 — Bloquear, solo si los datos lo respaldan

Solo si en la etapa 1 se cumple que **la gran mayoría concedió el permiso** y **la precisión
alcanza**. Se agrega `actividad.exige_ubicacion` (booleano, falso por defecto):

- Si la precisión reportada es peor que el radio, **no se rechaza**: la lectura no sirve para
  decidir y se trata como si no hubiera ubicación. Rechazar por una medición mala es castigar
  al alumno por su teléfono.
- Si el permiso fue denegado, **no se rechaza**; queda anotado.
- Solo se rechaza cuando hay una lectura **buena** que cae **fuera** del radio. Resultado
  nuevo `fuera_de_zona`, con su texto: «Parece que no estás en el lugar de la actividad.
  Acercate y probá otra vez.»
- El marcaje manual del administrador (B8) sigue siendo la salida para cualquier caso raro.

### Etapa 3 — Decidir si se queda

Después de un evento con bloqueo: comparar cuántos marcajes se rechazaron por zona contra
cuántos de esos eran alumnos que **sí** estaban. Si se rechazó aunque sea a uno solo que
estaba presente, la función hace más daño que bien y se vuelve a señal.

---

## Lo que hay que decidir antes de empezar

- **El punto de cada actividad.** Clic derecho en Google Maps sobre el lugar; no hace falta
  ir. Se declara por actividad, porque no siempre es en el mismo sitio. Radio sugerido: 200 m.
- **Qué pasa si el alumno niega el permiso.** Mi recomendación: se marca igual y queda
  anotado. Lo contrario convierte un permiso del navegador en un requisito para tener puntos.
- **Si el radio se declara por actividad o hay un valor por defecto.** Como los eventos son
  casi siempre en el mismo lugar, conviene un valor por defecto reutilizable y poder
  cambiarlo por actividad para los eventos que sean en otro lado.

## Lo que este plan no propone

- **Reemplazar la ventana de 60 s.** Sigue siendo la defensa principal, y es más fuerte.
- **Bloquear desde el primer día.** Sin datos de la etapa 1 sería adivinar, y el riesgo de
  equivocarse lo paga un alumno que sí fue.
- **Perseguir al que falsea la ubicación.** Quien quiera saltarla va a poder, y está aceptado
  (ver §1). El objetivo es subir el costo del fraude casual, no cerrar la puerta.

## Cómo volver atrás si no funciona

Hay tres niveles, del más barato al más caro. **El primero alcanza casi siempre.**

### 1. Apagarlo sin tocar código (segundos)

La función es **inerte por defecto**: solo hace algo si la actividad declara latitud, longitud
y radio. Para desactivarla, se vacían esos tres campos en `/admin/actividades` y el sistema
vuelve exactamente al comportamiento anterior. La página de marcaje deja de pedir la
ubicación, no se calcula ninguna distancia, y nadie se entera.

Esto se puede hacer **en medio de un evento**, desde el teléfono, si algo saliera mal.

### 2. Quitar la interfaz, dejando los datos (un commit)

Si molestara el bloque «Dónde» del formulario o la columna de distancia, se revierte el
commit de la etapa 1 y se dejan las columnas donde están:

```bash
git revert fdfa944
```

Las columnas de la migración `0005` admiten nulo, así que quedarse ahí no rompe nada: son
columnas vacías que nadie consulta.

### 3. Quitar las columnas (no hace falta)

No se recomienda. Borrar columnas es la única operación de esta función que puede perder
datos, y no gana nada: unas columnas nulas no cuestan ni rendimiento ni corrección.

### Lo que nunca hay que hacer

Revertir la migración `0005` mientras `main` esté desplegado con el código de la etapa 1.
Quedaría el código pidiendo columnas que ya no existen. Si alguna vez se quitan las columnas,
primero se revierte el código y después la base.

---

## Ramas y alcance

- Rama `feature/geolocalizacion`, desde `main`.
- Las etapas 0 y 1 no tocan nada de lo que ya funciona: columnas nuevas que admiten nulo y
  código que solo se activa cuando la actividad declara un punto.
- **Fusionada a `main` el 31 de agosto de 2026**, antes del evento, por decisión del usuario:
  el sistema todavía está en desarrollo y la función es inerte mientras ninguna actividad
  declare zona, así que entra sin riesgo y se puede probar desplegada.
- **Antes de escribir código**, esto se lleva a `PLANIFICACION.md`: la §7 gana una fila en la
  tabla de antifraude, y queda registrado que la ubicación es señal y no criterio, igual que
  la IP.
