"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import {
  actualizarDocente,
  crearDocente,
  type EstadoFormulario,
} from "@/app/(protegido)/(con-perfil)/admin/catedraticos/acciones";
import { Avatar } from "@/componentes/ui/avatar";
import { Boton, clasesDeBoton, EnlaceBoton } from "@/componentes/ui/boton";
import { Etiqueta } from "@/componentes/ui/etiqueta";
import { Hoja } from "@/componentes/ui/hoja";
import { Icono } from "@/componentes/ui/icono";
import { Campo } from "@/componentes/ui/campo";
import { MensajeFormulario } from "@/componentes/ui/mensaje-formulario";

const estadoInicial: EstadoFormulario = { error: null };

export function FormularioNuevoCatedratico() {
  const [estado, accion, enviando] = useActionState(crearDocente, estadoInicial);
  const [abierto, setAbierto] = useState(false);
  // `crearDocente` devuelve siempre un objeto nuevo: si llego sin error, se guardo.
  const [vistoAlAbrir, setVistoAlAbrir] = useState(estado);
  useEffect(() => {
    if (abierto && estado !== vistoAlAbrir && !estado.error) setAbierto(false);
  }, [abierto, estado, vistoAlAbrir]);

  return (
    <>
      <Boton
        tamano="chico"
        onClick={() => {
          setVistoAlAbrir(estado);
          setAbierto(true);
        }}
      >
        <Icono nombre="sumar" className="size-[17px]" />
        Nuevo
      </Boton>
      <Hoja abierta={abierto} alCerrar={() => setAbierto(false)} titulo="Nuevo catedrático">
        <p className="text-[13px] text-neutral-500">
          No tiene cuenta: es solo el nombre que agrupa sus clases en el Excel.
        </p>
        <form action={accion} className="flex flex-col gap-3">
          <Campo id="nombre-nuevo" name="nombre" etiqueta="Nombre" required />
          <Campo
            id="email-nuevo"
            name="email"
            type="email"
            etiqueta="Correo (opcional)"
            ayuda="No hace falta para asignar cursos ni para descargar el Excel."
          />
          {estado.error && <MensajeFormulario tipo="error">{estado.error}</MensajeFormulario>}
          <Boton type="submit" disabled={enviando} className="w-full">
            {enviando ? "Agregando…" : "Agregar catedrático"}
          </Boton>
        </form>
      </Hoja>
    </>
  );
}

export function FilaCatedratico({
  id,
  nombre,
  email,
  clases,
  nombresDeClases,
}: {
  id: string;
  nombre: string;
  email: string | null;
  clases: number;
  nombresDeClases: string[];
}) {
  const [estado, accion, enviando] = useActionState(actualizarDocente, estadoInicial);
  const [abierto, setAbierto] = useState(false);

  return (
    <article className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-tarjeta">
      <div className="flex items-center gap-3">
        <Avatar nombre={nombre.replace(/^(Ing|Inga|Lic|Licda|Dr|Dra|Msc|M\.A)\.?\s+/i, "")} />
        <Link href={`/admin/catedraticos/${id}`} className="min-w-0 flex-1">
          <h2 className="font-bold leading-snug">{nombre}</h2>
          <p className="truncate text-xs text-neutral-400">
            {clases === 0 ? "Sin clases asignadas" : `${clases} ${clases === 1 ? "clase" : "clases"}`}
            {email && ` · ${email}`}
          </p>
        </Link>
        {/* Un catedratico sin clases no recibe Excel: es un dato huerfano y conviene verlo. */}
        {clases === 0 && <Etiqueta tono="oro">Sin clases</Etiqueta>}
      </div>

      {nombresDeClases.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {nombresDeClases.map((c, indice) => (
            <Etiqueta key={`${c}-${indice}`} tono="celeste" className="h-auto min-h-[23px] whitespace-normal py-0.5">
              {c}
            </Etiqueta>
          ))}
        </div>
      )}

      {abierto ? (
        <form action={accion} className="flex flex-col gap-3 border-t border-linea pt-3">
          <input type="hidden" name="id" value={id} />
          <Campo id={`nombre-${id}`} name="nombre" etiqueta="Nombre" defaultValue={nombre} required />
          <Campo id={`email-${id}`} name="email" type="email" etiqueta="Correo (opcional)" defaultValue={email ?? ""} />
          {estado.error && <MensajeFormulario tipo="error">{estado.error}</MensajeFormulario>}
          <div className="grid grid-cols-2 gap-2.5">
            <Boton variante="secundario" type="button" onClick={() => setAbierto(false)}>
              Cerrar
            </Boton>
            <Boton type="submit" disabled={enviando}>
              {enviando ? "Guardando…" : "Guardar"}
            </Boton>
          </div>
        </form>
      ) : (
        <div className="flex gap-2.5">
          {clases > 0 ? (
            <a href={`/api/reportes/catedratico/${id}`} className={clasesDeBoton("secundario", "flex-1", "chico")}>
              <Icono nombre="bajar" className="size-[17px]" />
              Descargar su Excel
            </a>
          ) : (
            <EnlaceBoton href="/admin/clases" variante="secundario" tamano="chico" className="flex-1">
              Asignarle clases
            </EnlaceBoton>
          )}
          <Boton variante="secundario" tamano="chico" onClick={() => setAbierto(true)}>
            Editar
          </Boton>
        </div>
      )}
    </article>
  );
}
