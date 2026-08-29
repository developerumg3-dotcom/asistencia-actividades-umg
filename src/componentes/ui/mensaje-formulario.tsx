import type { ReactNode } from "react";

type Tipo = "error" | "exito";

const clasesPorTipo: Record<Tipo, string> = {
  error: "text-danger-600",
  exito: "text-emerald-700",
};

export function MensajeFormulario({
  tipo,
  children,
  className,
}: {
  tipo: Tipo;
  children: ReactNode;
  className?: string;
}) {
  return <p className={`text-sm ${clasesPorTipo[tipo]} ${className ?? ""}`}>{children}</p>;
}
