"use client";

import { useActionState, useState } from "react";
import { liberarCarne, type EstadoFormulario } from "@/app/(protegido)/(con-perfil)/admin/alumnos/acciones";
import { Boton } from "@/componentes/ui/boton";
import { MensajeFormulario } from "@/componentes/ui/mensaje-formulario";

const estadoInicial: EstadoFormulario = { error: null };

/**
 * Liberar un carné afecta a quien lo tenía cargado: pide confirmación explícita antes de
 * enviar. Confirmación en dos pasos dentro de la propia interfaz, no `window.confirm()` —
 * mismo criterio que el resto de la app, que no usa dialogos nativos del navegador.
 */
export function FormularioLiberarCarne({ alumnoId, carne }: { alumnoId: string; carne: string }) {
  const [estado, accion, enviando] = useActionState(liberarCarne, estadoInicial);
  const [confirmando, setConfirmando] = useState(false);

  if (!confirmando) {
    return (
      <Boton type="button" variante="secundario" onClick={() => setConfirmando(true)}>
        Liberar carné
      </Boton>
    );
  }

  return (
    <form action={accion} className="flex flex-col items-start gap-2">
      <input type="hidden" name="alumnoId" value={alumnoId} />
      <p className="text-sm text-neutral-700">
        ¿Liberar el carné <span className="font-mono">{carne}</span>? Otra cuenta podrá usarlo después de esto.
      </p>
      <div className="flex items-center gap-3">
        <Boton type="submit" disabled={enviando}>
          {enviando ? "Liberando…" : "Sí, liberar"}
        </Boton>
        <Boton type="button" variante="enlace" onClick={() => setConfirmando(false)} disabled={enviando}>
          Cancelar
        </Boton>
      </div>
      {estado.error && <MensajeFormulario tipo="error">{estado.error}</MensajeFormulario>}
      {estado.mensaje && <MensajeFormulario tipo="exito">{estado.mensaje}</MensajeFormulario>}
    </form>
  );
}
