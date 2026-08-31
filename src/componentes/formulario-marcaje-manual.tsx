"use client";

import { useActionState } from "react";
import {
  marcarAsistenciaManual,
  type EstadoFormulario,
} from "@/app/(protegido)/(con-perfil)/admin/actividades/[id]/en-vivo/acciones";
import { Boton } from "@/componentes/ui/boton";
import { Campo } from "@/componentes/ui/campo";
import { MensajeFormulario } from "@/componentes/ui/mensaje-formulario";

const estadoInicial: EstadoFormulario = { error: null };

/** B8 — para quien no tiene teléfono. Sin restricción de horario: ver docs/fase-4.md. */
export function FormularioMarcajeManual({ actividadId }: { actividadId: string }) {
  const [estado, accion, enviando] = useActionState(marcarAsistenciaManual, estadoInicial);

  return (
    <form action={accion} className="flex flex-col gap-3 rounded-md border border-neutral-200 bg-white p-4">
      <input type="hidden" name="actividadId" value={actividadId} />
      <h2 className="font-medium text-neutral-900">Marcar asistencia manual</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <Campo id="identificadorAlumno" name="identificadorAlumno" etiqueta="Carné o correo del alumno" required />
        <Campo id="justificacion" name="justificacion" etiqueta="Justificación" required />
      </div>
      {estado.error && <MensajeFormulario tipo="error">{estado.error}</MensajeFormulario>}
      {estado.mensaje && <MensajeFormulario tipo="exito">{estado.mensaje}</MensajeFormulario>}
      <div>
        <Boton type="submit" variante="secundario" disabled={enviando}>
          {enviando ? "Registrando…" : "Registrar asistencia manual"}
        </Boton>
      </div>
    </form>
  );
}
