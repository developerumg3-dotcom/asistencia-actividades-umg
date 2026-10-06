import type { ReactNode } from "react";
import { BarraAdmin } from "@/componentes/barras";
import { requireAdmin } from "@/lib/sesion";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdmin();

  return (
    <>
      {/* El panel se usa sobre todo desde el telefono: una columna, igual que el alumno. */}
      <div className="mx-auto flex w-full max-w-xl flex-col gap-4 px-4 pb-28 pt-5">{children}</div>
      <BarraAdmin />
    </>
  );
}
