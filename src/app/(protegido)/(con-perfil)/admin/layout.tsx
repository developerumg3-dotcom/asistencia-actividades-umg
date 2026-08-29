import type { ReactNode } from "react";
import Link from "next/link";
import { requireAdmin } from "@/lib/sesion";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdmin();

  return (
    <div className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-6 p-6">
      <nav className="flex items-center gap-4 text-sm font-medium">
        <Link href="/admin/catedraticos" className="underline">
          Catedráticos
        </Link>
        <Link href="/admin/clases" className="underline">
          Clases
        </Link>
        <Link href="/clases" className="ml-auto text-neutral-500 underline">
          Mis clases
        </Link>
      </nav>
      {children}
    </div>
  );
}
