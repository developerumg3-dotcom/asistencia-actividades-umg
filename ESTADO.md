# Estado del proyecto

Dónde estamos, qué existe, qué sigue. **Actualizá este archivo al terminar cada fase.**

- **Última actualización:** 29 de agosto de 2026
- **Fase actual:** 0 cerrada. Lista para arrancar la Fase 1.

---

## Qué existe

| | |
|---|---|
| Documentación | Completa. Diseño cerrado, 14 decisiones tomadas. |
| Repositorio | `developerumg3-dotcom/asistencia-actividades-umg`, privado, rama `main` |
| Neon | Proyecto `app_asistencia_actividades` (`hidden-art-98202594`), org DeveloperUMG (`org-dawn-math-42337202`), región `us-east-2` |
| Vercel | Proyecto `asistencia-umg` → `https://asistencia-umg.vercel.app` |
| `.env.local` | Las 6 variables llenas y verificadas |
| Carpetas | Esqueleto de `src/` creado, con `.gitkeep` |

## Qué NO existe todavía

- `package.json`, `node_modules`, ninguna dependencia instalada
- Next.js, Drizzle, Tailwind: nada configurado
- Esquema de base de datos: ninguna tabla creada en Neon
- Ninguna línea de código de aplicación
- Nada desplegado en Vercel

**La base de datos de Neon está vacía.** No se ha corrido ninguna migración.

---

## Qué sigue

**Fase 1 — Cuentas y clases.** El plan detallado, con criterios de aceptación, está en
[`docs/fase-1.md`](docs/fase-1.md).

Al terminarla, Daniel tiene que poder crear su cuenta, completar su perfil, cargar sus
clases reales y ver que la autoinscripción funciona, todo desplegado.

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

---

## Pendientes de Daniel

Ninguno bloquea la Fase 1. Hacen falta antes del primer evento.

- Listado real de clases: nombre, código, sección, jornada, ciclo, y nombre y correo del catedrático
- Fechas, horas y lugares de las 5 actividades globales y de la actividad extra
- Confirmación de que el catedrático acepta un Excel como comprobante
