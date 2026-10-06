import "./globals.css";
import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import type { ReactNode } from "react";
import { NeonAuthUIProvider } from "@neondatabase/auth-ui";
import { authClient } from "@/lib/auth/client";
import { RegistrarServiceWorker } from "@/componentes/registrar-service-worker";

export const metadata: Metadata = {
  title: "Actividades UMG",
  description: "Registro de participación en actividades de la UMG",
};

export const viewport = {
  themeColor: "#1C72A5",
  // Deja que el contenido llegue hasta el borde en telefonos con muesca; la barra inferior
  // compensa con `env(safe-area-inset-bottom)`.
  viewportFit: "cover" as const,
};

// Se sirve desde el propio sitio (next/font), no desde Google en cada visita.
const fuente = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--fuente", display: "swap" });

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" className={fuente.variable} suppressHydrationWarning>
      <body className="bg-fondo font-sans text-tinta antialiased">
        <RegistrarServiceWorker />
        <NeonAuthUIProvider authClient={authClient} defaultTheme="light">
          {children}
        </NeonAuthUIProvider>
      </body>
    </html>
  );
}
