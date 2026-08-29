# Diseño visual — paleta y componentes

Norma de estilo del frontend. Los módulos de las próximas fases (actividades, QR, kiosco,
puntos, Excel — ver [`PLANIFICACION.md`](../PLANIFICACION.md)) se construyen sobre esto, no
reinventan estilos sueltos.

Contexto obligatorio antes de tocar interfaz: [`AGENTS.md`](../AGENTS.md).

---

## Origen de la paleta

Los tres colores salen del escudo de la UMG (muestreados por píxel de
`public/escudo-umg.webp`):

| Color | Hex | Rol |
|---|---|---|
| Azul | `#1C72A5` | **Primario.** Botones de acción, enlaces, foco de campos. |
| Dorado | `#B0863A` | **Acento secundario.** Insignias, puntos, detalles de marca. No para botones de acción. |
| Rojo | `#CB3332` | **Semántico.** Exclusivamente errores. Nunca color de acción, para no confundir "hacer algo" con "algo salió mal". |

Decisión del usuario (2026-08-29): liderar con azul, no con rojo — un color de acción rojo se
sentiría como alerta permanente.

## Tokens Tailwind (`src/app/globals.css`)

Declarados en un bloque `@theme`, generan las utilidades `bg-primary-600`, `text-accent-700`,
`border-danger-600`, etc. Cada color tiene escala 50→900 (tinte hacia blanco en los pasos
claros, hacia negro suave en los oscuros):

- `primary-*` — azul, base visual en `600`.
- `accent-*` — dorado, base visual en `500`.
- `danger-*` — rojo, base visual en `600`.
- `neutral-*` y `emerald-*` — las escalas de Tailwind sin modificar, para texto/bordes neutros
  y estados de éxito respectivamente. No crear una escala de marca para "éxito": el verde no
  sale del escudo, así que se usa el neutro de la librería.

**Radio estándar:** `rounded-md` (6px) en inputs, botones y tarjetas.
**Tipografía:** la fuente del sistema (`font-sans` de Tailwind). No se cargó ninguna fuente
custom — ver «Pendientes».

### Theming de `@neondatabase/auth-ui`

Las dos pantallas que usan componentes prearmados de la librería
(`/auth/forgot-password`, `/auth/reset-password` — ver la bitácora de `ESTADO.md` sobre por
qué esas dos son la excepción) exponen su tema vía variables `--neon-*`. Se sobreescriben en
`:root` de `globals.css`: `--neon-primary`, `--neon-ring` → azul de marca; `--neon-destructive`
→ rojo de marca; `--neon-radius` → `0.375rem` para que combine con `rounded-md`.

**Trampa real que esto destapó:** `@neondatabase/auth-ui/css` viene sin `@layer` (su CSS
entero, preflight incluido, es "sin capa"). En CSS, lo sin capa le gana a *cualquier* CSS con
capa, sin importar especificidad. Antes de este cambio, esto rompía **todos** los botones de
la app — no solo los de la librería —: el reset de `<button>` de ese CSS (`background-color:
transparent`) le ganaba a `bg-primary-600`, `bg-neutral-900`, etc. de nuestros propios
componentes. Los botones existían, tenían el texto correcto, pero el fondo era invisible.

La solución fue mover el import de `@neondatabase/auth-ui/css` de `layout.tsx` a un
`@import ... layer(neon-ui)` dentro de `globals.css`, con `neon-ui` declarado como la capa de
**menor** prioridad (`@layer neon-ui, theme, base, components, utilities;`). Así nuestro
`@theme` y nuestras utilidades siempre ganan. El único costo: en sus dos pantallas, el
`.bg-primary`/`.text-primary-foreground` interno de la librería ahora pierde contra nuestro
propio preflight — se corrige con dos reglas puntuales con `!important` después de `@theme` en
`globals.css` (`.bg-primary`, `.bg-destructive`, `.text-primary-foreground`,
`.text-destructive-foreground`). No se reordenan las capas globales por esto: afecta a dos
botones nada más, y forzar el orden global para arreglarlos rompía los tokens de radio de toda
la app (ver el commit/diff de `globals.css` si hace falta el detalle completo del porqué).

## Componentes base (`src/componentes/ui/`)

No crear clases sueltas repetidas (`rounded-md border border-neutral-300 px-3 py-2`, etc.) en
un componente nuevo: usar estos primitivos. Si hace falta una variante que no existe, se
agrega acá, no se improvisa en el componente que la necesita.

| Componente | Cuándo usarlo |
|---|---|
| `Boton` (`boton.tsx`) | `variante="primario"` para el submit principal de un formulario. `variante="secundario"` para acciones secundarias tipo "Guardar" en una fila de edición o "Importar". `variante="enlace"` para una acción con apariencia de texto subrayado (ej. cerrar sesión). |
| `Campo` (`campo.tsx`) | Cualquier input de texto/email/password/search, o un `<select>` con `as="select"`. Incluye label y texto de ayuda opcional (`ayuda`). No cubre checkboxes ni `<input type="file">` — esos se estilizan en el propio componente con `accent-primary-600` para el check y clases de texto consistentes. |
| `Tarjeta` (`tarjeta.tsx`) | Envolver un formulario o sección para darle borde y separación del fondo (pantallas de entrada, bloques de importación). |
| `MensajeFormulario` (`mensaje-formulario.tsx`) | Texto de estado de un formulario: `tipo="error"` (rojo) o `tipo="exito"` (verde). Reemplaza `text-sm text-red-600` / `text-sm text-green-700` sueltos. |

## Convenciones

- **Sin tildes ni ñ en nombres de archivo/identificador**, igual que el resto del proyecto.
- **Móvil primero.** Los primitivos se diseñan para columnas angostas; el único caso pensado
  para escritorio seguirá siendo el kiosco (B5), que no existe todavía.
- **El rojo no es un color de acción.** Si un botón "se siente" urgente o destructivo, no se
  resuelve poniéndolo rojo — se resuelve con texto claro y, si hace falta, confirmación. Hoy
  no hay ninguna acción destructiva en la interfaz.
- **El escudo** vive en `public/escudo-umg.webp`. Se usa como marca en el header autenticado
  y arriba del título en las pantallas de entrada (ingreso, registro, perfil, recuperación de
  contraseña), siempre vía `next/image`.

## Pendientes explícitos

No resueltos todavía, para no fingir que sí:

- **Tipografía custom.** Se quedó en la fuente del sistema a propósito, por simplicidad. Si
  se quiere una fuente de marca, evaluar impacto en rendimiento móvil antes de sumarla.
- **Iconografía.** No hay set de íconos elegido. Hasta ahora la interfaz no los necesitó.
- **PWA / `theme-color`.** El `manifest.json` con el color de tema de la barra del navegador
  es de una fase posterior (ver `PLANIFICACION.md` §11 y `ESTRUCTURA.md`). Cuando se arme, el
  color de tema debe ser `primary-600` (`#1C72A5`), no negro.
- **Kiosco (B5).** Única pantalla pensada para escritorio, no existe todavía. No hay norma de
  diseño para pantallas grandes más allá de lo que ya cubren los primitivos.
