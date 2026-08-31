# Guía del ensayo en campo

Tarea 7 de la [Fase 2](fase-2.md), **obligatoria**: la fase no está terminada sin esto.

Hay cuatro cosas que ninguna prueba automática puede cubrir, porque dependen de la distancia,
de la luz, de teléfonos reales y de personas reales. Esta guía es para salir del ensayo con
respuestas, no con impresiones.

- **Cuándo:** una semana antes de la primera actividad. No el día antes: si algo falla hay
  que tener tiempo de arreglarlo.
- **Dónde:** el lugar real del evento (Enchulados), con la computadora y el proyector reales.
- **Cuánto dura:** una hora, sin apuro.

---

## Qué llevar

| | |
|---|---|
| Computadora del kiosco | La que se va a usar el día del evento, no otra |
| Proyector o pantalla | El real, en su posición real |
| **Cinco teléfonos distintos** | Al menos **un iPhone** y **un Android viejo** |
| Un teléfono con datos móviles | Para probar sin el WiFi del lugar |
| Esta guía impresa o en otro dispositivo | No en uno de los cinco teléfonos de prueba |

**Antes de salir:** creá la actividad de ensayo en `/admin/actividades`, en estado
**publicada**, con la ventana de marcaje abierta durante toda la hora del ensayo. Generá su
pantalla de kiosco y anotá el enlace.

**Calentá la base** entrando a la app unos minutos antes: Neon suspende el proyecto por
inactividad y el primer arranque en frío tarda.

---

## Las pruebas, en orden

Anotá el resultado de cada una. «Funcionó» no es un resultado; el resultado es a qué
distancia, en cuántos segundos, en qué teléfono.

### 1. El QR se lee desde el fondo

Es la prueba que más probablemente falle y la más fácil de arreglar a tiempo.

1. Proyectá el kiosco a pantalla completa.
2. Empezá pegado a la pantalla y alejate en línea recta.
3. Con **cada uno de los cinco teléfonos**, anotá la distancia máxima a la que la cámara
   engancha el código en menos de tres segundos.

**Anotá:** distancia máxima por teléfono · el peor de los cinco · si el lugar tiene reflejos.

**Si falla:** subí el tamaño del QR, apagá luces que reflejen, o acercá la proyección. El
código ya usa corrección de errores nivel M, que tolera reflejos y ángulos.

### 2. El recorrido completo, teléfono por teléfono

Con cada uno de los cinco, **con la sesión ya iniciada**:

1. Escanear con la cámara nativa.
2. Pulsar «Marcar asistencia».
3. Confirmar que sale «Listo, quedó registrada tu asistencia».

**Anotá:** segundos desde el escaneo hasta el mensaje · en cuáles hubo que tocar dos veces.

### 3. El peor caso de iPhone

Esta es la que justifica que la pantalla de marcaje tenga el ingreso adentro.

1. En el iPhone, **cerrá sesión** y cerrá Safari.
2. Escaneá el QR.
3. Debe abrir la página de marcaje **con el formulario de ingreso en la misma pantalla**.
4. Iniciá sesión ahí mismo.
5. Anotá qué pasa: o marca directo, o dice «El código ya cambió. Escaneá otra vez el de la
   pantalla».
6. Si dice eso, escaneá otra vez y confirmá que **la segunda vez es inmediata**.

**Anotá:** cuántos segundos toma iniciar sesión · si el código alcanzó a vencerse.

**Si toma demasiado:** pedirles a los alumnos que inicien sesión **antes** de que empiece la
actividad. Es la mitigación prevista y no cuesta nada.

### 4. La foto por WhatsApp — la prueba antifraude

**La única defensa real del sistema, y nunca se ha probado contra una persona.**

1. Alguien fotografía el QR proyectado.
2. Lo manda por WhatsApp a alguien que **no esté en el lugar**.
3. Esa persona lo abre e intenta marcar.

**Resultado esperado:** «El código ya cambió. Escaneá otra vez el de la pantalla.»

4. Repetilo **una vez más**, esta vez lo más rápido posible: foto, enviar, abrir y pulsar en
   menos de treinta segundos.

**Anotá:** si en el intento rápido logró marcar.

**Si logró marcar en menos de 30 s**, la ventana de 60 s es demasiado holgada para el ritmo
real. Se baja a 30 s desde la propia actividad, sin tocar código. Anotalo y decidilo ahí.

### 5. Sin red en el kiosco

1. Con el kiosco andando, **desconectá el WiFi de la computadora**.
2. Mirá el reloj: el QR tiene que seguir rotando solo.
3. A los dos minutos, intentá marcar con un teléfono que **sí** tenga datos.
4. Volvé a conectar y confirmá que sigue normal.

**Resultado esperado:** rota sin interrupción varios minutos (lleva seis códigos cargados por
adelantado) y el marcaje funciona porque el teléfono va por su cuenta a internet.

**Anotá:** cuántos minutos aguantó antes de mostrar «Sin conexión».

### 6. La pantalla no se bloquea

Dejá el kiosco solo **quince minutos** sin tocar nada.

**Resultado esperado:** sigue encendido y rotando. Usa Wake Lock.

**Si se apaga:** desactivá la suspensión en la configuración de energía de esa computadora.
Anotalo como paso obligatorio del día del evento.

### 7. Cien a la vez, aunque sean cinco

Con los cinco teléfonos, que todos pulsen «Marcar asistencia» **en el mismo segundo**.

**Resultado esperado:** los cinco marcan. La validación es una operación de milisegundos.

### 8. Instalar la PWA

Tarea 9 de la [Fase 5](fase-5.md), pendiente por no haber simulador de iOS.

- **Android:** instalar desde el aviso del navegador.
- **iPhone:** seguir `/ayuda/instalar-ios` (Compartir → Añadir a inicio).

**Anotá:** si la guía de iOS alcanza o le falta un paso.

---

## Después del ensayo

1. **Revisá la bitácora** en `/admin/bitacora`. Tiene que haber una fila por cada intento del
   ensayo, incluidos los fallidos. Si falta alguno, es un defecto grave: significa que hay
   marcajes que no se están registrando.
2. **Compará** las asistencias de `/admin/actividades/{id}/en-vivo` con la gente que
   efectivamente marcó. Deben coincidir exactamente.
3. **Borrá la actividad de ensayo** o dejala en `cerrada`, para que no se mezcle con los
   puntos reales.
4. **Anotá en [`ESTADO.md`](../ESTADO.md)** lo que el ensayo haya obligado a cambiar. Es la
   fase donde más probable es que la realidad corrija al diseño.

## Criterio para dar la fase por cerrada

- Los cinco teléfonos marcaron, incluido el iPhone y el Android viejo.
- La foto compartida **falló** pasado el minuto.
- El kiosco aguantó quince minutos solo, y varios sin red.
- Cada intento del ensayo aparece en la bitácora.

Si alguno de estos cuatro no se cumple, la fase **no** está cerrada.
