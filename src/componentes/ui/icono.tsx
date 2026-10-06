/**
 * Juego de iconos de la app: trazo, 24×24. Son pocos y propios para no sumar una libreria
 * (ver docs/diseno-visual.md). Un icono nuevo se agrega aca, no suelto en un componente.
 */
const TRAZOS = {
  puntos: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.500l6.1-.9z"/>',
  calendario: '<rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  qr: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><path d="M14 14h3v3h-3zM20 14v.01M14 20v.01M17 20h4v-3"/>',
  regalo: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M5 12v8h14v-8M12 8v12"/><path d="M12 8S10.5 3 8 3a2.5 2.5 0 0 0 0 5h4zM12 8s1.5-5 4-5a2.5 2.5 0 0 1 0 5h-4z"/>',
  libro: '<path d="M4 5a2 2 0 0 1 2-2h14v15H6a2 2 0 0 0-2 2z"/><path d="M4 20a2 2 0 0 0 2 2h14v-4"/>',
  usuario: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6.5 8-6.500s8 2.5 8 6.5"/>',
  usuarios: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.5 3-5.5 6.5-5.500s6.5 2 6.5 5.5"/><path d="M16 4.800a3.5 3.5 0 0 1 0 6.400M18 14.800c2.1.6 3.5 2.2 3.5 5.2"/>',
  campana: '<path d="M6 16v-5a6 6 0 1 1 12 0v5l1.5 2h-15z"/><path d="M10 21a2 2 0 0 0 4 0"/>',
  tablero: '<rect x="3" y="3" width="8" height="10" rx="2"/><rect x="13" y="3" width="8" height="6" rx="2"/><rect x="13" y="11" width="8" height="10" rx="2"/><rect x="3" y="15" width="8" height="6" rx="2"/>',
  mas: '<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>',
  sumar: '<path d="M12 5v14M5 12h14"/>',
  ok: '<path d="M4.5 12.500l5 5L20 7"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  der: '<path d="M9 5l7 7-7 7"/>',
  izq: '<path d="M15 5l-7 7 7 7"/>',
  buscar: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.8-3.8"/>',
  bajar: '<path d="M12 4v11M7 11l5 5 5-5M5 20h14"/>',
  reloj: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  lugar: '<path d="M12 21s7-6.2 7-11.500a7 7 0 1 0-14 0C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  salir: '<path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4M10 16l-4-4 4-4M6 12h10"/>',
  editar: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.500l4 4"/>',
  pantalla: '<rect x="2.5" y="4" width="19" height="12.5" rx="2"/><path d="M8 20.500h8M12 16.500v4"/>',
  alerta: '<path d="M12 3.5 2.5 20h19z"/><path d="M12 10v4.500M12 17.300v.01"/>',
  enviar: '<path d="M21 3 10 14M21 3l-7 18-4-7-7-4z"/>',
  birrete: '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11.500V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.500M22 9v5"/>',
  lista: '<path d="M8 6h13M8 12h13M8 18h13M3.5 6v.01M3.5 12v.01M3.5 18v.01"/>',
  vivo: '<circle cx="12" cy="12" r="2.5"/><path d="M7.5 7.500a6.4 6.4 0 0 0 0 9M16.5 7.500a6.4 6.4 0 0 1 0 9M4.5 4.500a10.6 10.6 0 0 0 0 15M19.5 4.500a10.6 10.6 0 0 1 0 15"/>',
  celular: '<rect x="6.5" y="2.5" width="11" height="19" rx="2.5"/><path d="M11 18h2"/>',
  escudo: '<path d="M12 3l8 3v6c0 4.5-3.3 8-8 9-4.7-1-8-4.5-8-9V6z"/><path d="M9 12l2.2 2.200L15.5 10"/>',
  cambio: '<path d="M4 8h14l-3.5-3.500M20 16H6l3.5 3.5"/>',
  filtro: '<path d="M4 6h16M7 12h10M10 18h4"/>',
} as const;

export type NombreIcono = keyof typeof TRAZOS;

export function Icono({
  nombre,
  className,
  grosor = 1.9,
}: {
  nombre: NombreIcono;
  className?: string;
  grosor?: number;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={grosor}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`size-[22px] shrink-0 ${className ?? ""}`}
      // Trazos fijos de este mismo archivo: nunca texto que venga de un usuario.
      dangerouslySetInnerHTML={{ __html: TRAZOS[nombre] }}
    />
  );
}
