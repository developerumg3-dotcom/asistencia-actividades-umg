# AGENTS.md

Instrucciones para cualquier agente o asistente que trabaje en este repositorio.

## Antes de hacer nada: leé PLANIFICACION.md

[`PLANIFICACION.md`](PLANIFICACION.md) es la **fuente de verdad** del proyecto. Contiene el
alcance, el modelo de datos, las reglas de negocio, las pantallas, la arquitectura y las
decisiones ya cerradas.

Reglas sobre ese documento:

- **No propongas ni escribas código que lo contradiga.** Si algo hay que cambiar, se
  actualiza el documento primero y luego el código.
- Las decisiones de la sección 14 están **cerradas**. No las reabras a menos que el usuario
  lo pida explícitamente.
- Los pendientes de la sección 15 están **abiertos**. Ahí sí hace falta preguntar.

## Estado actual del proyecto

**Fase 0 — definición. No hay código escrito todavía.**

El repositorio contiene únicamente documentación. No hay `package.json`, ni esquema, ni
dependencias instaladas. Git **no está inicializado** por decisión del usuario.

No empieces a implementar por iniciativa propia. El usuario dirá cuándo arranca la Fase 1.

## Qué es este proyecto

App web para registrar la participación de alumnos de la UMG en actividades. El alumno se
registra, declara su carné y sus clases, y marca asistencia escaneando un **código QR que
rota cada 60 segundos** proyectado en el evento. Al final, el administrador exporta un Excel
por catedrático con los puntos de cada alumno.

Nombre de trabajo: **Ronda**.

Dos roles con cuenta: **alumno** y **administrador**. Los catedráticos **no tienen cuenta**;
son un registro de datos que agrupa clases y reciben el Excel por fuera de la app.

## Stack previsto

| Pieza | Elección |
|---|---|
| Aplicación | Next.js 15 (App Router) + TypeScript |
| Base de datos | Neon (PostgreSQL serverless) |
| ORM | Drizzle, con migraciones versionadas en el repo |
| Autenticación | Neon Auth (respaldo: Auth.js) |
| Hospedaje | Vercel |
| Estilos | Tailwind CSS |
| QR | `qrcode` para generar. **No se implementa lector**: se usa la cámara nativa del teléfono. |
| Excel | `exceljs` en rutas de servidor |

El backend en .NET sigue sobre la mesa como alternativa (ver §10 del documento). Si el
usuario lo elige, el modelo de datos y las reglas no cambian.

## Reglas técnicas que no se negocian

Estas salen de decisiones de diseño ya tomadas y romperlas rompe el sistema:

1. **El `secreto_qr` nunca sale del servidor.** Si llega al navegador, cualquiera fabrica
   códigos válidos. La pantalla del kiosco pide códigos ya derivados a la API.
2. **La validación del código se hace contra la hora en que llega el botón**, no contra la
   hora del escaneo. Es lo que hace inútil compartir la foto del QR.
3. **Los puntos no se almacenan, se calculan.** A partir de `asistencia` e
   `asignacion_extra`, contra las inscripciones vigentes.
4. **Nunca se rechaza un marcaje por dirección IP.** Todo el campus sale por la misma IP. La
   IP es dato de bitácora, no criterio.
5. **Todo el acceso a la base pasa por el servidor.** No hay cliente de base de datos en el
   navegador.
6. **Fechas en UTC** en la base; se muestran en `America/Guatemala` (UTC−6, sin horario de
   verano).
7. **La asistencia se guarda aunque el alumno no esté inscrito a ninguna clase.** Los puntos
   aparecen solos cuando se inscriba. Perder una asistencia real es el peor error posible.
8. **Todo intento de marcaje, válido o no, va a `bitacora`.**

## Convenciones

- **Idioma:** todo en español. Interfaz, mensajes de error, nombres de tablas y columnas,
  comentarios y mensajes de commit. Sin tildes ni ñ en los identificadores de código
  (`carne`, `bitacora`, `asignacion_extra`).
- **Móvil primero.** La única pantalla pensada para escritorio es el kiosco del QR (B5).
- **Mensajes de error accionables.** Dicen qué pasó y qué hacer. Los textos exactos están en
  §7 del documento; usalos tal cual.
- **Las pantallas tienen identificador** (A1–A10 para alumno, B1–B10 para administrador).
  Referilas por su ID en commits y conversación.

## Cómo trabajar acá

- El usuario pidió **planificar antes de implementar**. Cuando algo no esté definido,
  preguntá en vez de asumir y seguir.
- Si detectás un problema real en el diseño, decilo con claridad y proponé la alternativa.
  Ya pasó una vez: el diseño original con fotos y revisión de profesores se descartó entero a
  favor del QR, y el proyecto mejoró.
- No inicialices git ni hagas commits salvo que el usuario lo pida.
