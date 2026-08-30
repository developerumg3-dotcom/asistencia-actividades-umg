# Fase 1 — Cuentas y clases

Objetivo: que un alumno pueda registrarse, completar su perfil y elegir sus clases, y que el
administrador pueda cargar catedráticos y clases. **Sin actividades ni QR todavía.**

Contexto obligatorio antes de empezar: [`AGENTS.md`](../AGENTS.md) →
[`PLANIFICACION.md`](../PLANIFICACION.md) → [`ESTRUCTURA.md`](../ESTRUCTURA.md) →
[`ESTADO.md`](../ESTADO.md).

---

## Pantallas que entran

| ID | Pantalla | Ruta |
|---|---|---|
| A1 | Registro | `/registro` |
| A2 | Ingreso | `/ingreso` |
| A3 | Completar perfil | `/perfil/completar` |
| A4 | Elegí tus clases | `/clases` |
| A8 | Mis clases | `/clases` |
| B2 | Catedráticos | `/admin/catedraticos` |
| B3 | Clases | `/admin/clases` |

A4 y A8 comparten ruta: es la misma pantalla, con o sin clases ya elegidas.

## Qué NO entra en esta fase

Actividades, QR, kiosco, marcaje, puntos, participaciones, saldo extra, Excel, bitácora,
tablero, PWA. Todo eso es de las fases 2 a 5.

---

## Tareas, en orden

### 1. Andamiaje del proyecto

- `package.json` con Next.js 15 (App Router), TypeScript y Tailwind CSS
- Estructura de `src/` según [`ESTRUCTURA.md`](../ESTRUCTURA.md)
- `next.config`, `tsconfig`, configuración de Tailwind
- Verificar que `npm run dev` levanta

**Listo cuando:** `npm run dev` sirve una página en `localhost:3000` sin errores de consola.

### 2. Base de datos

- Drizzle configurado contra Neon
- Esquema de las **9 tablas** de la §4 de la planificación, en `src/db/esquema/`
- Primera migración generada y aplicada

Cuidado con dos cosas:

- Las migraciones usan `DATABASE_URL_UNPOOLED`. La aplicación en ejecución usa `DATABASE_URL`.
- Aunque esta fase solo toca 4 tablas, **creá las 9 desde el principio**. Migrar después es
  más caro que crear columnas que todavía no se usan.

**Listo cuando:** las 9 tablas existen en Neon y la migración está versionada en
`src/db/migraciones/`.

### 3. Autenticación

- Neon Auth (**Managed Better Auth**, no Stack Auth) con `NEON_AUTH_BASE_URL` y
  `NEON_AUTH_COOKIE_SECRET`
- Registro (A1) y ingreso (A2), abiertos a cualquiera
- Recuperación de contraseña
- Sesión del lado del servidor. **Ninguna variable de autenticación lleva `NEXT_PUBLIC_`**
- Al crear la cuenta, si el correo está en `ADMIN_EMAILS`, el `rol` arranca en `admin`

**Listo cuando:** se puede crear una cuenta, cerrar sesión, volver a entrar y recuperar la
contraseña.

### 4. Perfil obligatorio (A3)

- Carné y nombre completo
- **Bloquea la navegación** hasta llenarse: cualquier ruta que no sea el propio perfil
  redirige acá
- El carné es único. Si ya está ocupado, el mensaje explica qué hacer, no solo que falló

**Listo cuando:** una cuenta recién creada no puede llegar a ninguna otra pantalla sin
completar carné y nombre.

### 5. Catedráticos y clases (B2, B3)

- Alta y edición de catedráticos: nombre y correo
- Alta y edición de clases, cada una asociada a un catedrático
- Importación por CSV de clases
- Solo accesible con `rol = admin`

**Listo cuando:** se pueden cargar las clases reales de Daniel y cada una muestra su
catedrático.

### 6. Autoinscripción (A4, A8)

- Buscador de clases con selección múltiple
- Agregar y quitar clases libremente
- Quitar **borra la fila** de `inscripcion` y deja constancia en `bitacora`
- La pantalla muestra las clases elegidas; los puntos quedan en 0 hasta la Fase 3

**Listo cuando:** un alumno puede elegir tres clases, quitar una, y el cambio persiste al
recargar.

### 7. Despliegue

- Proyecto conectado en Netlify al repositorio (era Vercel en el plan original; se cambió a
  Netlify el 30 de agosto de 2026, sin ningún efecto sobre el resto de esta tarea)
- Las 6 variables cargadas en Netlify, con `NEXT_PUBLIC_APP_URL` apuntando a
  `https://app-asist-actividades-umg.netlify.app`
- Despliegue automático desde `main`

**Listo cuando:** el recorrido completo funciona en `app-asist-actividades-umg.netlify.app`,
no solo en local.

---

## Criterio de aceptación de la fase

Daniel entra a `app-asist-actividades-umg.netlify.app` desde su teléfono, crea su cuenta,
completa carné y nombre, ve sus clases reales ya cargadas, elige las suyas, y al volver a
entrar siguen ahí.

---

## Al terminar

1. Actualizar [`ESTADO.md`](../ESTADO.md): mover la Fase 1 a «qué existe», apuntar a la Fase 2.
2. Anotar en la bitácora de `ESTADO.md` cualquier diseño que se haya descartado en el camino.
3. Si algo del código terminó contradiciendo la planificación, **actualizar
   [`PLANIFICACION.md`](../PLANIFICACION.md)**, no dejar la contradicción.
