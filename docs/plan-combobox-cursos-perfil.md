# Plan — Combobox de cursos en el perfil (A3)

Decisiones cerradas con Daniel el 2026-08-29, antes de tocar código.

## Contexto

Hoy A3 (`/perfil/completar`) pide carné, nombre y `ciclo` (select 1..10). El `ciclo` **no
determina** qué cursos lleva el alumno (PLANIFICACION.md §4, nota de `alumno.ciclo`); solo
sirve para que A4 (`/clases`) arranque filtrada ahí. La selección real de cursos vive aparte,
en A4, con buscador + grilla de checkboxes agrupada por ciclo (`SelectorClases`).

Daniel quiere que A3 pida además, directamente, los cursos reales — con un combobox estilo
select2 (click abre dropdown, escribe para filtrar, click para marcar, sin límite) — en vez de
mandar al alumno a A4 para eso.

## Decisiones

1. **`ciclo` se mantiene tal cual.** Sigue siendo un campo obligatorio aparte en A3, sin
   cambios de comportamiento ni de esquema. No se deriva de los cursos elegidos.
2. **Nuevo campo obligatorio en A3: "Cursos en donde estás".** Combobox multi-select, mínimo
   un curso para poder completar el perfil (bloquea igual que carné/nombre/ciclo).
3. **A4 (`/clases`) se mantiene sin cambios de UI ni de componente.** Pasa a ser la pantalla
   de "editar mis cursos" después del perfil: misma tabla `inscripcion`, misma grilla
   (`SelectorClases`) ya construida. Lo elegido en A3 aparece ahí ya marcado.
4. **El combobox es un componente nuevo**, usado solo en A3. No reemplaza la grilla de A4:
   son casos de uso distintos (A3 = elegir rápido al completar perfil obligatorio; A4 =
   navegar/editar con calma, agrupado por ciclo).

## Diseño del combobox

Nuevo componente `src/componentes/ui/combobox-multiple.tsx`:

- Input de texto. Al hacer click se abre un dropdown con las opciones (filtradas si ya hay
  texto escrito). Filtra en vivo por substring, insensible a mayúsculas, sobre nombre + código.
- Click en una opción: se agrega a los seleccionados (se marca con check), el dropdown **sigue
  abierto** para seguir eligiendo. El query no se limpia solo, así se puede seguir tipeando
  variantes ("programac" → Programación I, II, III) y marcar varias sin recargar el filtro.
- Los seleccionados se muestran como chips removibles debajo del input (click en la "x" quita).
- Sin límite de selecciones.
- Cierra el dropdown al hacer click afuera.
- Envía los ids elegidos al formulario como múltiples `<input type="hidden" name="cursos">`,
  para que el server action los lea con `formData.getAll("cursos")` — mismo patrón de
  formularios con Server Actions que ya usa el resto de la app (`useActionState`).
- Reusa las convenciones visuales existentes (`rounded-md`, `border-neutral-300`,
  `focus-visible:ring-primary-500`, chips con la estética de `Chip`), sin duplicar clases
  sueltas (docs/diseno-visual.md).

## Cambios de datos y servidor

- `src/app/(protegido)/perfil/completar/page.tsx`: además de `requireAlumno()`, consulta el
  catálogo de clases activas y las inscripciones ya existentes del alumno — la misma consulta
  que hoy vive en `src/app/(protegido)/(con-perfil)/clases/page.tsx`. Se extrae a un helper
  compartido (p. ej. `src/lib/clases.ts`) para no duplicar la query en dos páginas.
- `formulario-perfil.tsx`: recibe `cursosDisponibles` e `idsInscritoInicial`, renderiza el
  combobox después del campo de ciclo, etiqueta "Cursos en donde estás", ayuda "Poné todos los
  cursos en donde estás."
- `completarPerfil` (Server Action): lee `formData.getAll("cursos")`, valida que no esté vacío
  ("Elegí al menos un curso.") y que cada id corresponda a una clase activa real (no confiar en
  el cliente, mismo criterio que ya se aplica a `ciclo`). Si todo es válido:
  1. Actualiza `alumno` (carné, nombre, ciclo, `perfilCompleto=true`) — igual que hoy.
  2. Inserta una fila en `inscripcion` por cada curso elegido, `onConflictDoNothing` (mismo
     patrón que `inscribirse()` en `clases/acciones.ts`).
  3. `revalidatePath("/clases")` para que A4 ya muestre lo inscrito.
  - Sin transacción real: el driver `neon-http` no la soporta y el resto del código tampoco la
    usa para escrituras relacionadas (ver `desinscribirse()`).
- Texto de introducción de la página ya menciona el ciclo; se agrega una frase sobre los
  cursos.
- Se actualiza la fila de A3 en `PLANIFICACION.md` §11 (tabla de pantallas) para reflejar el
  campo nuevo y obligatorio.

## Fuera de alcance

- No se toca `SelectorClases` ni la grilla/chips de A4.
- No se quita ni se deriva el campo `ciclo`.
- No hay límite de cursos seleccionables en el combobox.
