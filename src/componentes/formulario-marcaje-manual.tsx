"use client";

import { useActionState, useState } from "react";
import {
  marcarAsistenciaManual,
  type EstadoFormulario,
} from "@/app/(protegido)/(con-perfil)/admin/actividades/[id]/en-vivo/acciones";
import { Boton } from "@/componentes/ui/boton";
import { BotonAccion } from "@/componentes/ui/boton-accion";
import { Campo } from "@/componentes/ui/campo";
import { Hoja } from "@/componentes/ui/hoja";
import { MensajeFormulario } from "@/componentes/ui/mensaje-formulario";

const estadoInicial: EstadoFormulario = { error: null };

/** B8 — para quien no tiene teléfono. Sin restricción de horario: ver docs/fase-4.md. */
export function FormularioMarcajeManual({ actividadId }: { actividadId: string }) {
  const [estado, accion, enviando] = useActionState(marcarAsistenciaManual, estadoInicial);
  const [abierto, setAbierto] = useState(false);

  return (
    <>
      <BotonAccion icono="editar" onClick={() => setAbierto(true)}>
        Marcaje manual
      </BotonAccion>
      <Hoja abierta={abierto} alCerrar={() => setAbierto(false)} titulo="Marcaje manual">
        <p className="text-[13px] text-neutral-500">
          Para quien sí estuvo y no pudo escanear. Queda en la bitácora, con la justificación.
        </p>
        <form action={accion} className="flex flex-col gap-3">
          <input type="hidden" name="actividadId" value={actividadId} />
          <Campo id="identificadorAlumno" name="identificadorAlumno" etiqueta="Carné o correo del alumno" required />
          <Campo
            id="justificacion"
            name="justificacion"
            as="textarea"
            rows={2}
            etiqueta="Justificación"
            ayuda="Obligatoria."
            required
          />
          {estado.error && <MensajeFormulario tipo="error">{estado.error}</MensajeFormulario>}
          {estado.mensaje && <MensajeFormulario tipo="exito">{estado.mensaje}</MensajeFormulario>}
          <Boton type="submit" disabled={enviando} className="w-full">
            {enviando ? "Registrando…" : "Registrar asistencia"}
          </Boton>
        </form>
      </Hoja>
    </>
  );
}
