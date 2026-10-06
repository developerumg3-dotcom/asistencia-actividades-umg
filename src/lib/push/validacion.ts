/** Politica del transporte: los endpoints son opacos, solo se permiten proveedores conocidos. */
export function esEndpointPush(valor: unknown): valor is string {
  if (typeof valor !== "string" || valor.length > 2048 || /[\s\\]/.test(valor)) return false;
  try {
    const u = new URL(valor);
    if (u.protocol !== "https:" || u.username || u.password || u.hash || u.port || u.pathname === "/") return false;
    return u.hostname === "fcm.googleapis.com" ||
      u.hostname === "updates.push.services.mozilla.com" ||
      /^[a-z0-9-]+\.push\.apple\.com$/.test(u.hostname);
  } catch { return false; }
}

export function esSuscripcionPush(valor: unknown): valor is { endpoint: string; p256dh: string; auth: string } {
  if (!valor || typeof valor !== "object") return false;
  const v = valor as Record<string, unknown>;
  if (!esEndpointPush(v.endpoint) || typeof v.p256dh !== "string" || typeof v.auth !== "string") return false;
  if (!/^[A-Za-z0-9_-]{87}=?$/.test(v.p256dh) || !/^[A-Za-z0-9_-]{22}(==)?$/.test(v.auth)) return false;
  const publica = Buffer.from(v.p256dh, "base64url");
  return publica.length === 65 && publica[0] === 4 && Buffer.from(v.auth, "base64url").length === 16;
}

export function esUuid(valor: unknown): valor is string {
  return typeof valor === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(valor);
}

export function clasificarFalloPush(codigo: number | undefined): "descartada" | "fallida" | "incierta" {
  if (codigo === 404 || codigo === 410) return "descartada";
  // Sin respuesta no sabemos si el proveedor acepto antes del corte. No repetir a ciegas.
  if (codigo === undefined) return "incierta";
  return "fallida";
}

export function esFalloReintentable(codigo: number | undefined): boolean {
  return codigo === 429 || (codigo !== undefined && codigo >= 500 && codigo <= 599);
}
