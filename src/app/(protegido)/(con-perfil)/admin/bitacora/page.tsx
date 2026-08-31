import { eventoBitacoraEnum, resultadoBitacoraEnum } from "@/db/esquema";
import { Boton } from "@/componentes/ui/boton";
import { Campo } from "@/componentes/ui/campo";
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

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Bitácora</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Todo intento de marcaje, válido o no, y los cambios de inscripción y carné. Las filas
          resaltadas son señales para revisar — nada se bloquea solo.
        </p>
      </div>

      <form action="/admin/bitacora" className="grid gap-3 sm:grid-cols-3">
        <Campo id="alumno" name="alumno" defaultValue={sp.alumno} placeholder="Carné, nombre o correo…" />
        <Campo id="actividadId" name="actividadId" as="select" defaultValue={sp.actividadId ?? ""}>
          <option value="">Todas las actividades</option>
          {actividades.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nombre}
            </option>
          ))}
        </Campo>
        <Campo id="evento" name="evento" as="select" defaultValue={sp.evento ?? ""}>
          <option value="">Todos los eventos</option>
          {eventoBitacoraEnum.enumValues.map((v) => (
            <option key={v} value={v}>
              {etiqueta(v)}
            </option>
          ))}
        </Campo>
        <Campo id="resultado" name="resultado" as="select" defaultValue={sp.resultado ?? ""}>
          <option value="">Todos los resultados</option>
          {resultadoBitacoraEnum.enumValues.map((v) => (
            <option key={v} value={v}>
              {etiqueta(v)}
            </option>
          ))}
        </Campo>
        <Campo id="desde" name="desde" type="date" etiqueta="Desde" defaultValue={sp.desde} />
        <Campo id="hasta" name="hasta" type="date" etiqueta="Hasta" defaultValue={sp.hasta} />
        <div className="flex items-end">
          <Boton type="submit">Filtrar</Boton>
        </div>
      </form>

      {haySenales && (
        <p className="rounded-md border border-danger-300 bg-danger-50 px-4 py-3 text-sm text-danger-900">
          Hay filas resaltadas: mismo alumno con varios intentos fallidos seguidos, o mismo
          dispositivo detrás de varios alumnos. Revisalas antes de decidir algo en{" "}
          <a href="/admin/alumnos" className="font-medium underline">
            Alumnos
          </a>
          .
        </p>
      )}

      {filas.length === 0 ? (
        <div className="rounded-md border border-dashed border-neutral-300 px-4 py-10 text-center">
          <p className="text-sm text-neutral-600">No hay entradas con ese filtro.</p>
        </div>
      ) : (
        <div className="-mx-6 overflow-x-auto px-6">
          <table className="w-full min-w-[900px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-neutral-500">
                <th className="py-2 pr-3 font-medium">Cuándo</th>
                <th className="py-2 pr-3 font-medium">Alumno</th>
                <th className="py-2 pr-3 font-medium">Actividad</th>
                <th className="py-2 pr-3 font-medium">Evento</th>
                <th className="py-2 pr-3 font-medium">Resultado</th>
                <th className="py-2 pr-3 font-medium">Origen</th>
                <th className="py-2 pr-3 font-medium">Dispositivo / IP</th>
                <th className="py-2 font-medium">Detalle</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((fila) => {
                const resaltada = senales.porIntentosFallidos.has(fila.id) || senales.porDispositivoCompartido.has(fila.id);
                return (
                  <tr
                    key={fila.id}
                    className={`border-b border-neutral-100 ${resaltada ? "bg-danger-50" : ""}`}
                  >
                    <td className="py-2 pr-3 whitespace-nowrap text-neutral-600">{enGuatemala(fila.ocurrioEn)}</td>
                    <td className="py-2 pr-3">
                      <p className="font-medium text-neutral-900">{fila.alumnoNombre ?? fila.alumnoEmail}</p>
                      <p className="text-xs text-neutral-500">{fila.alumnoEmail}</p>
                    </td>
                    <td className="py-2 pr-3 text-neutral-700">{fila.actividadNombre ?? "—"}</td>
                    <td className="py-2 pr-3 text-neutral-700">{etiqueta(fila.evento)}</td>
                    <td className="py-2 pr-3 text-neutral-700">{fila.resultado ? etiqueta(fila.resultado) : "—"}</td>
                    <td className="py-2 pr-3 text-neutral-700">
                      {fila.origenAsistencia ? (
                        <span title={fila.notaManual ?? undefined}>
                          {fila.origenAsistencia === "manual" ? "Manual" : "QR"}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-2 pr-3 font-mono text-xs text-neutral-500">
                      {fila.dispositivoId ?? "—"} {fila.ip ? `· ${fila.ip}` : ""}
                    </td>
                    <td className="py-2 text-neutral-600">{fila.detalle ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
