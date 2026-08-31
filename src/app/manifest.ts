import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ronda — Asistencia UMG",
    short_name: "Ronda",
    description: "Registro de participación en actividades de la UMG",
    start_url: "/inicio",
    display: "standalone",
    background_color: "#FFFFFF",
    theme_color: "#1C72A5",
    icons: [
      { src: "/iconos/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/iconos/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
