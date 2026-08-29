import "@neondatabase/auth-ui/css";
import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { NeonAuthUIProvider } from "@neondatabase/auth-ui";
import { authClient } from "@/lib/auth/client";

export const metadata: Metadata = {
  title: "Ronda — Asistencia UMG",
  description: "Registro de participación en actividades de la UMG",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="bg-white text-neutral-900 antialiased">
        <NeonAuthUIProvider authClient={authClient} defaultTheme="light">
          {children}
        </NeonAuthUIProvider>
      </body>
    </html>
  );
}
