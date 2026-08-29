# Estado del proyecto

Dónde estamos, qué existe, qué sigue. **Actualizá este archivo al terminar cada fase.**

- **Última actualización:** 29 de agosto de 2026
- **Fase actual:** 1 casi cerrada (falta la tarea 7, el despliegue) y **Fase 2 arrancada**:
  la librería del código QR está construida y probada. Ver [`docs/fase-2.md`](docs/fase-2.md).

---

## Qué existe

| | |
|---|---|
| Documentación | Completa. Diseño cerrado, 14 decisiones tomadas. |
| Repositorio | `developerumg3-dotcom/asistencia-actividades-umg`, privado, rama `main` |
| Neon | Proyecto `app_asistencia_actividades` (`hidden-art-98202594`), org DeveloperUMG (`org-dawn-math-42337202`), región `us-east-2` |
| Vercel | Proyecto `asistencia-umg` → `https://asistencia-umg.vercel.app` (todavía no conectado) |
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
| Cuentas de prueba | 7 en `.test`, `pnpm db:sembrar-usuarios`. **Borrar antes de usar el sistema de verdad** |

## Qué NO existe todavía

- Nada desplegado en Vercel (tarea 7 de la Fase 1, pendiente a propósito — ver más abajo)
- De la Fase 2 falta todo lo que toca la base y la pantalla: B4 actividades, la validación
  del marcaje contra la base, A6/A7, el kiosco B5 y B6 en vivo. La librería del código está,
  pero no la usa nadie todavía
- Puntos, Excel, PWA: fases 3 a 5
- La dependencia `qrcode` todavía no está en `package.json`
- **Ningún catedrático cargado.** Las 50 clases tienen `docente_id` en NULL. Sin eso no se
  puede exportar el Excel, que es el entregable final del sistema.

---

## Qué sigue

**Terminar la Fase 1.** Falta:

1. **Desplegar** (tarea 7 de [`docs/fase-1.md`](docs/fase-1.md)): conectar el repo a Vercel,
   cargar las 6 variables de entorno allá y confirmar el recorrido completo en
   `asistencia-umg.vercel.app`. No se hizo todavía porque implica push y una acción visible en
   un servicio externo — se espera pedido explícito.
2. **Asignar los catedráticos** (nombre, correo y sección) a las clases que tengan alumnos
   inscritos, desde `/admin/catedraticos` y `/admin/clases`. El catálogo ya está cargado; lo
   que falta es quién imparte cada curso.

La **Fase 2** ya arrancó por la librería del código. Lo que sigue ahí es la tarea 1 de
[`docs/fase-2.md`](docs/fase-2.md): B4, la pantalla de actividades, que es la que genera el
`secreto_qr`. La fase cierra con **ensayo de campo obligatorio**, y el despliegue lo bloquea:
la URL del QR sale de `NEXT_PUBLIC_APP_URL` y hay que probarla con el dominio real.

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
despliegue, hospedaje gratuito en Vercel, y la pantalla del QR es JavaScript de todos modos.

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

- Nombre y correo de los catedráticos, y la sección de cada curso. El catálogo de cursos ya
  entró desde el pensum oficial (PDF `Pensum 0908 2014`), pero el pensum no trae catedráticos
- Fechas, horas y lugares de las 5 actividades globales y de la actividad extra
- Confirmación de que el catedrático acepta un Excel como comprobante
