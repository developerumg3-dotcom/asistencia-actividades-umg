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

## Sistema visual vigente (rediseño de octubre de 2026)

El rediseño se decidió sobre prototipos navegables (`prototipos/`, ver «Prototipos» al final):
se compararon dos propuestas pantalla por pantalla y Daniel eligió la **A (tema claro)** con
cuatro piezas de la B. Lo que sigue es la norma que salió de ahí.

Tres ideas mandan sobre todo lo demás:

1. **Lo que más le importa al alumno son sus puntos por clase.** Es lo primero que ve al
   entrar (`/inicio`) y el total de cada clase es el número más grande de la pantalla.
2. **Móvil primero, de verdad.** Ninguna pantalla del alumno ni del panel puede necesitar
   desplazamiento horizontal. Una tabla ancha se convierte en tarjetas o en renglones.
3. **La navegación va abajo, con íconos**, como en cualquier app de teléfono. No hay cinta de
   pestañas arriba ni encabezado con el correo.

## Tokens Tailwind (`src/app/globals.css`)

Declarados en un bloque `@theme`:

- `primary-*` (azul), `accent-*` (dorado), `danger-*` (rojo): las escalas del escudo, sin
  cambios.
- `fondo` (`#f2f5f8`): fondo de toda la app. Las tarjetas son blancas y se separan del fondo
  por contraste y una sombra suave, **no por borde**.
- `tinta` (`#13212d`): texto principal y pastilla de filtro activa.
- `shadow-tarjeta`: la única sombra de tarjeta. No inventar otras.
- `neutral-*` y `emerald-*`: las de Tailwind, para texto secundario y éxito.

**Radios:** `rounded-2xl` (16 px) en tarjetas, `rounded-xl` (12 px) en botones y campos,
`rounded-full` en pastillas y avatares. `rounded-md` ya no se usa.

**Tipografía:** Plus Jakarta Sans, cargada con `next/font/google` en `layout.tsx` (se sirve
desde el propio sitio, subconjunto latino, `display: swap`). Títulos de pantalla en
`text-2xl font-extrabold tracking-tight`; números protagonistas en `font-extrabold
tabular-nums`.

**Iconografía:** `src/componentes/ui/icono.tsx`, un juego propio de íconos de trazo en SVG.
No se instaló ninguna librería de íconos: son una veintena y no justifican la dependencia. Un
ícono nuevo se agrega ahí, no suelto en un componente.

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

No crear clases sueltas repetidas en un componente nuevo: usar estos primitivos. Si hace
falta una variante que no existe, se agrega acá.

| Componente | Cuándo usarlo |
|---|---|
| `Boton` / `EnlaceBoton` (`boton.tsx`) | `primario` para la acción principal; `secundario` (blanco con contorno) para acciones de apoyo; `suave` (azul muy claro) para una acción secundaria dentro de una tarjeta; `enlace` para texto azul sin fondo. `tamano="chico"` dentro de filas. `EnlaceBoton` cuando se **navega**. |
| `Campo` (`campo.tsx`) | Inputs, `<select>` (`as="select"`) y `<textarea>` (`as="textarea"`), con etiqueta y ayuda. |
| `Tarjeta` (`tarjeta.tsx`) | Superficie blanca con sombra. `<Tarjeta as="li">` etc. no existe: es un `div`. |
| `Chip` (`chip.tsx`) | Filtro en pastilla, en fila horizontal desplazable. `EnlaceChip` cuando el filtro vive en la URL. |
| `Etiqueta` (`etiqueta.tsx`) | Pastilla de estado, no interactiva: `azul` (abierta ahora), `celeste`, `verde` (asististe), `gris`, `oro` (puntos), `rojo` (solo errores). |
| `Icono` (`icono.tsx`) | Todos los íconos. |
| `Avatar` (`avatar.tsx`) | Iniciales en círculo. |
| `Titular` (`titular.tsx`) | Encabezado de pantalla: título grande, bajada y un hueco a la derecha. `SubBarra` para pantallas hijas, con el botón de volver. |
| `Fechita` (`fechita.tsx`) | Bloque de día y mes al lado de una actividad. |
| `Hoja` (`hoja.tsx`) | Panel que sube desde abajo para un detalle o un formulario corto. Cliente. |
| `BarraInferior` (`barra-inferior.tsx`) | La navegación. Solo la montan los layouts. |
| `MensajeFormulario` (`mensaje-formulario.tsx`) | Texto de error o éxito de un formulario. |

## Navegación

- **Alumno** (`BarraAlumno`): Puntos (`/inicio`), Actividades (`/actividades`), Extra
  (`/puntos-extra`, con el saldo como globo dorado), Cursos (`/clases`), Yo (`/cuenta`).
- **Administración** (`BarraAdmin`): Tablero (`/admin`), Actividades, Alumnos, Avisos
  (`/admin/notificaciones`), Más (`/admin/mas`: Catedráticos, Clases, Bitácora, Mis puntos,
  cerrar sesión).
- Quien administra también cursa. «Mis puntos» lo lleva a `/inicio` con la barra del alumno y
  una cinta arriba para volver al panel. Por eso `/admin/mis-puntos` y `/admin/mis-clases`
  ahora solo redirigen.
- Las pantallas hijas (ficha de alumno, detalle de actividad, catedráticos, clases,
  bitácora) llevan `SubBarra` con volver; la barra inferior sigue visible.

## Decisiones de pantalla que no hay que deshacer

- **Puntos por clase:** una tarjeta por clase con el total grande a la derecha y una bolita
  por actividad (azul asistió, hueca no, dorada punto extra). Al tocarla se abre el detalle
  actividad por actividad. Nunca una tabla clase × actividad en el teléfono.
- **Actividades del alumno:** secciones «Ahora», «Próximas» y «Ya pasaron». Las dos primeras
  son tarjetas; las pasadas van compactas, como línea de tiempo con nodos.
- **Resultado del marcaje:** a pantalla completa, verde o rojo. Es deliberadamente lo menos
  sutil de la app: tiene que ser imposible dudar de si el punto quedó o no. Los textos son los
  de la §7 de la planificación.
- **Puntos extra:** saldo en un aro dorado y un botón «+1» por clase. Un toque, un punto.
- **Bitácora:** tarjetas, con una franja roja a la izquierda en las que son señal.
- **En vivo:** se actualiza sola (`refresco-automatico.tsx`); no se le pide al admin recargar.

## Convenciones

- **Sin tildes ni ñ en nombres de archivo/identificador**, igual que el resto del proyecto.
- **Móvil primero.** La única pantalla pensada para escritorio es el kiosco (B5).
- **El rojo no es un color de acción.** Rojo es error, y la pantalla roja del marcaje fallido
  es exactamente eso. Una acción delicada se resuelve con texto claro y confirmación.
- **El dorado es de los puntos.** Números de puntos extra, insignias de puntos y el botón
  «+1» de repartir, que es la única acción dorada de la app (excepción decidida por Daniel al
  elegir el prototipo: ese botón *es* un punto).
- **El escudo** vive en `public/escudo-umg.webp` y aparece en las pantallas de entrada, en la
  de marcar y en el kiosco. Ya no hay encabezado autenticado.
- **Vocabulario:** «cursos» de cara al alumno (lo que él lleva), «clases» en el panel (el
  catálogo que administra). «Puntos», nunca «punteo» ni «nota».

## Pendientes explícitos

- **Modo oscuro.** Se evaluó (propuesta B) y se descartó: la app es clara.
- **Vista de escritorio del panel.** Funciona, centrada en una columna; no se diseñó una
  disposición propia para pantallas grandes porque casi todo el uso es desde el teléfono.

## Prototipos

`prototipos/` tiene los prototipos estáticos (HTML, CSS y JS, datos simulados) con los que se
tomó la decisión: `propuesta-a/`, `propuesta-b/`, `final/` (la elegida) y `comparar.html`.
No forman parte de la app ni se despliegan; son la referencia visual de este documento.
