import { eventoBitacoraEnum, resultadoBitacoraEnum } from "@/db/esquema";
import Link from "next/link";
import { Boton, EnlaceBoton } from "@/componentes/ui/boton";
import { Campo } from "@/componentes/ui/campo";
import { Etiqueta } from "@/componentes/ui/etiqueta";
import { Icono } from "@/componentes/ui/icono";
import { SubBarra, Vacio } from "@/componentes/ui/titular";
import { detectarSenales } from "@/lib/bitacora/senales";
import {
  listarActividadesParaFiltro,
  listarBitacora,
  type EventoBitacora,
  type ResultadoBitacora,
} from "@/lib/bitacora/consulta";
import { enGuatemala } from "@/lib/fechas";

/** "sin_perfil" → "Sin perfil". No hace falta un diccionario: son palabras normales. */
function etiqueta(valor: string): string {
  const texto = valor.replace(/_/g, " ");
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

type BusquedaParams = {
  alumno?: string;
  actividadId?: string;
  evento?: string;
  resultado?: string;
  desde?: string;
  hasta?: string;
};

/** B9 — bitácora consultable. Las señales solo se resaltan: nunca disparan una acción sola. */
export default async function BitacoraAdminPage({ searchParams }: { searchParams: Promise<BusquedaParams> }) {
  const sp = await searchParams;

  const [filas, actividades] = await Promise.all([
    listarBitacora({
      alumnoTexto: sp.alumno?.trim() || undefined,
      actividadId: sp.actividadId || undefined,
      evento: (sp.evento as EventoBitacora) || undefined,
      resultado: (sp.resultado as ResultadoBitacora) || undefined,
      desde: sp.desde ? new Date(`${sp.desde}T00:00`) : undefined,
      hasta: sp.hasta ? new Date(`${sp.hasta}T23:59:59`) : undefined,
    }),
    listarActividadesParaFiltro(),
  ]);

  const senales = detectarSenales(filas);
  const haySenales = senales.porIntentosFallidos.size > 0 || senales.porDispositivoCompartido.size > 0;

  const hayFiltro = Boolean(sp.alumno || sp.actividadId || sp.evento || sp.resultado || sp.desde || sp.hasta);

  return (
    <>
      <SubBarra titulo="Bitácora" volverA="/admin/mas" />
      <p className="text-[13px] text-neutral-500">
        Todo intento de marcaje, válido o no, y los cambios de inscripción y carné. Las tarjetas con
        franja roja son señales para revisar: nada se bloquea solo.
      </p>

      {/* Los filtros arrancan plegados: lo que se viene a ver es la lista. */}
      <details open={hayFiltro} className="group rounded-2xl bg-white shadow-tarjeta">
        <summary className="flex cursor-pointer list-none items-center gap-2.5 px-4 py-3 font-bold [&::-webkit-details-marker]:hidden">
          <Icono nombre="filtro" />
          <span className="flex-1">Filtros{hayFiltro && " · activos"}</span>
          <Icono nombre="der" className="text-neutral-400 transition-transform group-open:rotate-90" />
        </summary>
        <form action="/admin/bitacora" className="flex flex-col gap-3 border-t border-linea p-4">
          <Campo id="alumno" name="alumno" etiqueta="Alumno" defaultValue={sp.alumno} placeholder="Carné, nombre o correo" />
          <Campo id="actividadId" name="actividadId" etiqueta="Actividad" as="select" defaultValue={sp.actividadId ?? ""}>
            <option value="">Todas las actividades</option>
            {actividades.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nombre}
              </option>
            ))}
          </Campo>
          <div className="grid grid-cols-2 gap-2.5">
            <Campo id="evento" name="evento" etiqueta="Evento" as="select" defaultValue={sp.evento ?? ""}>
              <option value="">Todos</option>
              {eventoBitacoraEnum.enumValues.map((v) => (
                <option key={v} value={v}>
                  {etiqueta(v)}
                </option>
              ))}
            </Campo>
            <Campo id="resultado" name="resultado" etiqueta="Resultado" as="select" defaultValue={sp.resultado ?? ""}>
              <option value="">Todos</option>
              {resultadoBitacoraEnum.enumValues.map((v) => (
                <option key={v} value={v}>
                  {etiqueta(v)}
                </option>
              ))}
            </Campo>
            <Campo id="desde" name="desde" type="date" etiqueta="Desde" defaultValue={sp.desde} />
            <Campo id="hasta" name="hasta" type="date" etiqueta="Hasta" defaultValue={sp.hasta} />
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <EnlaceBoton href="/admin/bitacora" variante="secundario">
              Limpiar
            </EnlaceBoton>
            <Boton type="submit">Filtrar</Boton>
          </div>
        </form>
      </details>

      {haySenales && (
        <div className="flex items-start gap-3 rounded-2xl bg-danger-50 px-4 py-3.5 text-[13.5px] text-danger-800">
          <Icono nombre="alerta" />
          <p>
            Hay señales: un mismo alumno con varios intentos fallidos seguidos, o un mismo dispositivo
            detrás de varios alumnos. Revisalas antes de decidir algo en{" "}
            <Link href="/admin/alumnos" className="font-bold underline">
              Alumnos
            </Link>
            .
          </p>
        </div>
      )}

      {filas.length === 0 ? (
        <Vacio>No hay entradas con ese filtro.</Vacio>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {filas.map((fila) => {
            const porFallos = senales.porIntentosFallidos.has(fila.id);
            const porDispositivo = senales.porDispositivoCompartido.has(fila.id);
            const resaltada = porFallos || porDispositivo;
            const ok = fila.resultado === "ok";
            return (
              <li
                key={fila.id}
                className={`flex flex-col gap-2 rounded-2xl bg-white p-4 ${
                  // La franja roja a la izquierda: se ve cual es señal sin teñir toda la tarjeta.
                  resaltada ? "shadow-[inset_3px_0_0_var(--color-danger-600),var(--shadow-tarjeta)]" : "shadow-tarjeta"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14.5px] font-bold leading-snug">
                      {fila.alumnoNombre ?? fila.alumnoEmail}
                    </p>
                    <p className="text-xs text-neutral-400">{enGuatemala(fila.ocurrioEn)}</p>
                  </div>
                  {fila.resultado ? (
                    <Etiqueta tono={ok ? "verde" : "rojo"}>{ok ? "Registrado" : etiqueta(fila.resultado)}</Etiqueta>
                  ) : (
                    <Etiqueta>{etiqueta(fila.evento)}</Etiqueta>
                  )}
                </div>
                <p className="text-[13px] text-neutral-500">
                  {[
                    fila.actividadNombre,
                    fila.resultado ? etiqueta(fila.evento) : null,
                    fila.origenAsistencia ? (fila.origenAsistencia === "manual" ? "Manual" : "QR") : null,
                    fila.detalle,
                    fila.notaManual,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "—"}
                </p>
                {resaltada && (
                  <p className="flex items-center gap-1.5 text-[13px] font-semibold text-danger-600">
                    <Icono nombre="alerta" className="size-[17px]" />
                    {porFallos ? "Varios intentos fallidos seguidos" : "Mismo dispositivo que otro alumno"}
                  </p>
                )}
                <p className="break-all font-mono text-[11px] text-neutral-400">
                  {fila.dispositivoId ?? "sin dispositivo"}
                  {fila.ip ? ` · ${fila.ip}` : ""}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
