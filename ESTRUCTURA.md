# Estructura del proyecto

Mapa de carpetas y variables de entorno. Las rutas concretas se crean en la Fase 1; acá
queda definido dónde va cada cosa para que nadie improvise después.

Ver [PLANIFICACION.md](PLANIFICACION.md) para el diseño completo, y [AGENTS.md](AGENTS.md)
para las reglas de trabajo.

---

## Carpetas

```
.
├── PLANIFICACION.md        Fuente de verdad del diseño
├── AGENTS.md               Contexto y reglas para agentes
├── ESTRUCTURA.md           Este archivo
├── README.md
├── .env.example            Plantilla de variables (SÍ se versiona)
├── .env.local              Secretos reales (NO se versiona)
│
├── src/
│   ├── app/                Rutas de Next.js (App Router)
│   ├── componentes/        Componentes de interfaz compartidos
│   ├── db/
│   │   ├── esquema/        Definición de tablas con Drizzle
│   │   └── migraciones/    SQL generado por Drizzle. Se versiona.
│   └── lib/
│       ├── qr/             Derivación HMAC del código, validación de ventana
│       ├── puntos/         Cálculo de puntos por alumno y clase
│       └── excel/          Generación de los libros por catedrático
│
├── public/                 Iconos de la PWA, manifiesto, imágenes
└── docs/                   Notas de apoyo, capturas del ensayo de campo
```

### Por qué `lib/qr`, `lib/puntos` y `lib/excel` están separados

Son las tres piezas con lógica de negocio real y las tres tienen que poder probarse sin
levantar la aplicación:

- **`qr`** decide si una asistencia es válida. Un error acá arruina un evento entero.
- **`puntos`** produce el número que ve el catedrático. Un error acá arruina una nota.
- **`excel`** es el entregable final.

Todo lo demás es interfaz y puede cambiar sin romper nada.

---

## Rutas previstas

La correspondencia entre rutas y las pantallas de la §8 del documento de planificación.

| Ruta | Pantalla | Notas |
|---|---|---|
| `/registro` | A1 | Abierto a cualquiera |
| `/ingreso` | A2 | |
| `/perfil/completar` | A3 | Bloquea el resto de la app hasta llenarse |
| `/clases` | A4, A8 | Elegir y administrar clases |
| `/` | A5 | Inicio del alumno |
| `/a/{actividad}/{codigo}` | A6, A7 | **Destino del QR.** Ingreso en línea y resultado |
| `/participaciones` | A9 | |
| `/puntos-extra` | A10 | |
| `/admin` | B1 | |
| `/admin/catedraticos` | B2 | Incluye la descarga del libro por docente |
| `/admin/clases` | B3 | |
| `/admin/actividades` | B4 | |
| `/pantalla/{clave}` | B5 | **Kiosco.** Sin sesión de administrador |
| `/admin/actividades/{id}/vivo` | B6 | |
| `/admin/alumnos` | B7, B8 | |
| `/admin/bitacora` | B9 | |
| `/admin/exportar` | B10 | |

La ruta del QR se mantiene deliberadamente corta: cada carácter que se le agrega hace el
código más denso y más difícil de leer desde el fondo del salón.

---

## Variables de entorno

Todas están documentadas en [`.env.example`](.env.example). Resumen:

| Variable | Dónde se consigue | Pública |
|---|---|---|
| `DATABASE_URL` | Neon → Connect. Host **con** `-pooler` | No |
| `DATABASE_URL_UNPOOLED` | Neon → Connect. Host **sin** `-pooler`. Solo migraciones | No |
| `NEON_AUTH_BASE_URL` | Neon → Auth → Configuration, campo «Auth URL» | No |
| `NEON_AUTH_COOKIE_SECRET` | Se genera local: `openssl rand -base64 32` | **No** |
| `NEXT_PUBLIC_APP_URL` | Se fija a mano | Sí |
| `ADMIN_EMAILS` | Se fija a mano | No |

### Sobre la autenticación

Neon migró de **Stack Auth** a **Managed Better Auth** en enero de 2026. La documentación y
los tutoriales que mencionan `NEXT_PUBLIC_STACK_PROJECT_ID`,
`NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY` o `STACK_SECRET_SERVER_KEY` están
**desactualizados**: esas variables ya no existen.

El esquema actual son dos valores: el `Auth URL` que da la consola y un secreto de cookies
que se genera localmente.

El `JWKS URL` que también muestra la consola **no es una variable de entorno**: se deriva
solo, como `${NEON_AUTH_BASE_URL}/.well-known/jwks.json`. Sirve para verificar la firma de
los tokens y la biblioteca lo resuelve sin configuración.

No hay ninguna variable de autenticación con prefijo `NEXT_PUBLIC_`: todo el manejo de
sesión es del lado del servidor, que es justo lo que queremos según la §10 del documento de
planificación.

### Cómo llenarlas

```bash
cp .env.example .env.local
```

Y editar `.env.local` con los valores reales. Ese archivo está en `.gitignore` y nunca se
sube al repositorio.

### Reglas

1. **`.env.local` nunca se versiona.** Si alguna vez aparece en un `git status`, algo se
   rompió en el `.gitignore` y hay que arreglarlo antes de hacer commit.
2. **Solo lo que puede ver el mundo lleva `NEXT_PUBLIC_`.** Ese prefijo mete la variable en
   el JavaScript que se descarga al navegador. `STACK_SECRET_SERVER_KEY` y las cadenas de
   base de datos nunca lo llevan.
3. **Los nombres que manda son los de la consola de Neon.** Si Neon muestra un nombre
   distinto al de esta tabla, se usa el de Neon y se actualiza este archivo.
4. **El secreto del QR no es una variable de entorno.** Vive en la columna `secreto_qr` de
   cada actividad, se genera al crearla y nunca sale del servidor.

### Producción

Las mismas variables se cargan en Vercel → Settings → Environment Variables, con dos
diferencias:

- `NEXT_PUBLIC_APP_URL` pasa a ser `https://asistencia-umg.vercel.app`.
- El resto se copia igual desde Neon.
