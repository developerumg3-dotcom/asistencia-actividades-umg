import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // `geolocation=(self)`: la propia app puede pedir ubicacion —la etapa 1 registra a
          // que distancia marco cada alumno— y nadie mas, ni un iframe. Con `geolocation=()`
          // el navegador lo bloqueaba antes de ejecutar una linea de codigo, y el fallo era
          // invisible: no hay error, simplemente nunca llega la posicion.
          // La camara sigue cerrada: no hay escaner dentro de la app (decision 10).
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self)",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
