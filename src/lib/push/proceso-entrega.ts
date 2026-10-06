import { clasificarFalloPush } from "./validacion";

/** Orquestacion sin secretos/red/base; permite comprobar el corte tras la aceptacion. */
export async function procesarEntrega(servicios: {
  vigente(): Promise<boolean>;
  enviar(): Promise<void>;
  codigo(error: unknown): number | undefined;
  anotarFallo(codigo: number | undefined): void;
  guardar(estado: string, codigo?: number): Promise<void>;
  baja(): Promise<void>;
}) {
  if (!(await servicios.vigente())) {
    await servicios.guardar("descartada");
    return;
  }
  let estado: string = "aceptada";
  let codigo: number | undefined;
  try {
    await servicios.enviar();
  } catch (error) {
    codigo = servicios.codigo(error);
    estado = clasificarFalloPush(codigo);
    servicios.anotarFallo(codigo);
  }
  // Un fallo al persistir no es un fallo de red y jamas crea un reintento nuevo.
  await servicios.guardar(estado, codigo);
  if (estado === "descartada") await servicios.baja();
}
