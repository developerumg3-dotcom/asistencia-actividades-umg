import type { ReactNode } from "react";
import { NavAdmin } from "@/componentes/nav-admin";
import { requireAdmin } from "@/lib/sesion";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdmin();

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col gap-6 p-6">
      <NavAdmin />
      {children}
    </div>
  );
}
