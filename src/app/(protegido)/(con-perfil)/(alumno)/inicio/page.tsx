import Link from "next/link";
import { AvisoActividadAbierta } from "@/componentes/aviso-actividad-abierta";
import { PuntosPorClase, type ClaseConPuntos } from "@/componentes/puntos-por-clase";
import { Avatar } from "@/componentes/ui/avatar";
import { EnlaceBoton } from "@/componentes/ui/boton";
import { Icono } from "@/componentes/ui/icono";
import { Pantalla } from "@/componentes/ui/pantalla";
import { Titular, TituloSeccion, Vacio } from "@/componentes/ui/titular";
import { marcajeAbierto, obtenerActividadesDelAlumno } from "@/lib/actividades";
import { enGuatemala, fechaCortaEnGuatemala, horaEnGuatemala } from "@/lib/fechas";
import { avisoEsUrgente } from "@/lib/puntos/calculo";
import { obtenerEstadoPuntosExtra, obtenerParticipaciones } from "@/lib/puntos/consulta";
import { requireAlumno } from "@/lib/sesion";
import { enTitulo } from "@/lib/texto";

export const dynamic = "force-dynamic";

function Dato({ numero, de, texto, dorado }: { numero: number; de?: number; texto: string; dorado?: boolean }) {
  return (
    <div className="rounded-[14px] bg-white p-3 shadow-tarjeta">
      <b className={`block text-[22px] font-extrabold tabular-nums tracking-tight ${dorado ? "text-accent-700" : ""}`}>
        {numero}
        {de !== undefined && <span className="text-[13px] font-semibold text-neutral-400"> de {de}</span>}
      </b>
      <span className="text-[11.5px] font-medium leading-tight text-neutral-500">{texto}</span>
    </div>
  );
}

/**
 * A5 + A9 — Puntos. La pantalla de entrada del alumno: lo que mas le importa es cuantos
 * puntos lleva en cada clase, asi que eso manda. El marcaje abierto es un aviso arriba, y el
 * reparto de puntos extra vive en su propia pestaña (/puntos-extra).
 */
export default async function InicioPage() {
  const alumnoActual = await requireAlumno();
  const [actividades, tabla, estadoExtra] = await Promise.all([
    obtenerActividadesDelAlumno(alumnoActual.id, { incluirCerradas: true }),
    obtenerParticipaciones(alumnoActual.id),
    obtenerEstadoPuntosExtra(alumnoActual.id),
  ]);
  const ahora = new Date();
  const urgente = estadoExtra.fechaDeCorte ? avisoEsUrgente(ahora, estadoExtra.fechaDeCorte) : false;
  const hayExtraPorRepartir = estadoExtra.saldoDisponible > 0 && estadoExtra.repartoAbierto;

  // Las fechas se arman aca, en el servidor: el componente cliente solo las muestra.
  const porId = new Map(actividades.map((a) => [a.id, a]));
  const detalleDe = (actividadId: string, asistio: boolean) => {
    const a = porId.get(actividadId);
    if (!a) return asistio ? "asististe" : "no asististe";
    const dia = fechaCortaEnGuatemala(a.iniciaEn);
    if (a.marcadaEn) return `${dia} · marcaste ${horaEnGuatemala(a.marcadaEn)}`;
    if (marcajeAbierto(a, ahora)) return `${dia} · abierta ahora`;
    return a.marcajeAbreEn > ahora ? `${dia} · todavía no empieza` : `${dia} · no asististe`;
  };
  const asistidas = new Set(actividades.filter((a) => a.tipo === "global" && a.marcadaEn).map((a) => a.id));

  const clases: ClaseConPuntos[] = tabla.filas.map((fila) => ({
    id: fila.claseId,
    codigo: fila.claseCodigo,
    nombre: enTitulo(fila.claseNombre),
    total: fila.total,
    extra: fila.extra,
    actividades: tabla.columnas.map((columna) => ({
      id: columna.id,
      nombre: columna.nombre,
      asistio: fila.marcas[columna.id] === 1,
      detalle: detalleDe(columna.id, fila.marcas[columna.id] === 1),
    })),
  }));

  return (
    <Pantalla>
      <Titular
        sobre={`Hola${alumnoActual.nombre ? `, ${alumnoActual.nombre.split(" ")[0]}` : ""}`}
        titulo="Tus puntos"
      >
        <Link href="/cuenta" aria-label="Mi cuenta">
          <Avatar nombre={alumnoActual.nombre} tono="azul" />
        </Link>
      </Titular>

      <AvisoActividadAbierta actividades={actividades} />

      {hayExtraPorRepartir && (
        <Link
          href="/puntos-extra"
          className={`flex items-center gap-3 rounded-2xl border px-4 py-3.5 ${
            urgente ? "border-danger-200 bg-danger-50 text-danger-800" : "border-accent-100 bg-accent-50 text-accent-700"
          }`}
        >
          <Icono nombre="regalo" />
          <div className="min-w-0 flex-1">
            <p className="font-bold leading-snug">
              Tenés {estadoExtra.saldoDisponible}{" "}
              {estadoExtra.saldoDisponible === 1 ? "punto extra" : "puntos extra"} sin repartir
            </p>
            {estadoExtra.fechaDeCorte && (
              <p className="text-[13px]">
                {urgente ? "¡Se pierden si no los repartís antes del " : "Elegí a qué clase sumarlos antes del "}
                {enGuatemala(estadoExtra.fechaDeCorte)}
                {/* La fecha ya termina en "a. m." o "p. m.": no lleva otro punto. */}
                {urgente && "!"}
              </p>
            )}
          </div>
          <Icono nombre="der" />
        </Link>
      )}

      <div className="grid grid-cols-3 gap-2.5">
        <Dato numero={asistidas.size} de={tabla.columnas.length} texto="actividades asistidas" />
        <Dato numero={tabla.filas.length} texto="cursos inscritos" />
        <Dato numero={hayExtraPorRepartir ? estadoExtra.saldoDisponible : 0} texto="extra por repartir" dorado />
      </div>

      <TituloSeccion
        lado={
          <Link href="/clases" className="text-primary-700">
            Editar cursos
          </Link>
        }
      >
        Puntos por clase
      </TituloSeccion>

      {clases.length === 0 ? (
        <Vacio>
          <p className="font-bold text-tinta">Todavía no elegiste tus cursos</p>
          <p className="mt-1">
            Tus asistencias ya están guardadas: los puntos aparecen solos cuando te inscribas.
          </p>
          <EnlaceBoton href="/clases" tamano="chico" className="mt-3">
            Elegir mis cursos
          </EnlaceBoton>
        </Vacio>
      ) : (
        <PuntosPorClase clases={clases} />
      )}
    </Pantalla>
  );
}
