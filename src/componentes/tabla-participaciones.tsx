import type { TablaParticipaciones } from "@/lib/puntos/calculo";

export function TablaParticipacionesAlumno({ tabla }: { tabla: TablaParticipaciones }) {
  if (tabla.filas.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-neutral-300 px-4 py-10 text-center">
        <p className="text-sm text-neutral-600">Todavía no estás inscrito en ninguna clase.</p>
      </div>
    );
  }

  return (
    <div className="-mx-6 overflow-x-auto px-6 sm:mx-0 sm:px-0">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-neutral-200 text-left text-neutral-500">
            <th className="py-2 pr-4 font-medium">Clase</th>
            {tabla.columnas.map((actividad) => (
              <th key={actividad.id} className="px-2 py-2 text-center font-medium">
                {actividad.nombre}
              </th>
            ))}
            <th className="px-2 py-2 text-center font-medium">Extra</th>
            <th className="pl-2 py-2 text-center font-medium">Total</th>
          </tr>
        </thead>
        <tbody>
          {tabla.filas.map((fila) => (
            <tr key={fila.claseId} className="border-b border-neutral-100">
              <td className="py-2 pr-4">
                <p className="font-medium text-neutral-900">{fila.claseNombre}</p>
                <p className="text-xs text-neutral-500">{fila.claseCodigo}</p>
              </td>
              {tabla.columnas.map((actividad) => (
                <td key={actividad.id} className="px-2 py-2 text-center tabular-nums text-neutral-700">
                  {fila.marcas[actividad.id]}
                </td>
              ))}
              <td className="px-2 py-2 text-center tabular-nums text-neutral-700">{fila.extra}</td>
              <td className="pl-2 py-2 text-center text-base font-semibold tabular-nums text-primary-700">
                {fila.total}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
