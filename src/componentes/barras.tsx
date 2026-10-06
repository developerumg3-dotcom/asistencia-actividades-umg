import { BarraInferior } from "@/componentes/ui/barra-inferior";

/** Barra del alumno. `saldoExtra` enciende el globo dorado sobre "Extra". */
export function BarraAlumno({ saldoExtra }: { saldoExtra: number }) {
  return (
    <BarraInferior
      pestanas={[
        { href: "/inicio", icono: "puntos", etiqueta: "Puntos" },
        { href: "/actividades", icono: "calendario", etiqueta: "Actividades" },
        { href: "/puntos-extra", icono: "regalo", etiqueta: "Extra", globo: saldoExtra },
        { href: "/clases", icono: "libro", etiqueta: "Cursos" },
        { href: "/cuenta", icono: "usuario", etiqueta: "Yo" },
      ]}
    />
  );
}

/** Barra del panel. Catedraticos, Clases y Bitacora cuelgan de "Más". */
export function BarraAdmin() {
  return (
    <BarraInferior
      pestanas={[
        { href: "/admin", icono: "tablero", etiqueta: "Tablero", exacta: true },
        { href: "/admin/actividades", icono: "calendario", etiqueta: "Actividades" },
        { href: "/admin/alumnos", icono: "usuarios", etiqueta: "Alumnos" },
        { href: "/admin/notificaciones", icono: "campana", etiqueta: "Avisos" },
        {
          href: "/admin/mas",
          icono: "mas",
          etiqueta: "Más",
          tambien: ["/admin/catedraticos", "/admin/clases", "/admin/bitacora"],
        },
      ]}
    />
  );
}
