import { enGuatemala } from "@/lib/fechas";
import { marcajeAbierto, type ActividadDelAlumno } from "@/lib/actividades";

/**
 * Barra compacta de estado, no la tarjeta grande que tenia A5 antes: la tabla de puntos es la
 * protagonista de la pantalla ahora, esto es solo el aviso de "que hacer ahora mismo".
 */
export function AvisoActividadAbierta({ actividades }: { actividades: ActividadDelAlumno[] }) {
  const ahora = new Date();
  const abierta = actividades.find((a) => marcajeAbierto(a, ahora));
  const proxima = actividades.find((a) => a.marcajeAbreEn > ahora);

  if (abierta) {
    if (abierta.marcadaEn) {
      return (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <span className="font-medium">Ya marcaste {abierta.nombre}</span>, a las{" "}
          {enGuatemala(abierta.marcadaEn)}.
        </div>
      );
    }
    return (
      <div className="rounded-md border border-primary-600 bg-primary-50 px-4 py-3 text-sm text-primary-900">
        <p>
          <span className="font-semibold">Marcaje abierto: {abierta.nombre}.</span> Apuntá la
          cámara de tu teléfono al QR de la pantalla.
        </p>
      </div>
    );
  }

  if (proxima) {
    return (
      <div className="rounded-md border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700">
        <span className="font-medium text-neutral-900">Próxima actividad:</span> {proxima.nombre},{" "}
        {enGuatemala(proxima.iniciaEn)}
        {proxima.lugar && <> · {proxima.lugar}</>}
      </div>
    );
  }

  return (
    <div className="rounded-md border border-dashed border-neutral-300 px-4 py-3 text-sm text-neutral-500">
      No hay actividades abiertas.
    </div>
  );
}
