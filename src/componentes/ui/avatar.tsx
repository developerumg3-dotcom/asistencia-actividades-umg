type Tono = "azul" | "celeste" | "oro";

const clasesPorTono: Record<Tono, string> = {
  azul: "bg-primary-600 text-white",
  celeste: "bg-primary-50 text-primary-700",
  oro: "bg-accent-100 text-accent-700",
};

/** Las iniciales de un nombre: "Ana Lucía López" → "AL". */
export function iniciales(nombre: string | null | undefined): string {
  const partes = (nombre ?? "").trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  return partes
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toLocaleUpperCase("es");
}

export function Avatar({
  nombre,
  tono = "celeste",
  className,
}: {
  nombre: string | null | undefined;
  tono?: Tono;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={`grid size-[42px] shrink-0 place-items-center rounded-full text-sm font-bold ${clasesPorTono[tono]} ${className ?? ""}`}
    >
      {iniciales(nombre)}
    </span>
  );
}
