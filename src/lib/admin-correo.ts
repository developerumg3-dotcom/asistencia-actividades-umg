/**
 * Decide si una cuenta tiene derecho a ser administradora por estar en `ADMIN_EMAILS`.
 *
 * Estar en la lista no basta: el correo tiene que estar VERIFICADO. Si no, quien se registre
 * con una dirección de la lista que todavía no tiene perfil (con su propia contraseña y sin
 * demostrar que el buzón es suyo) quedaría como administrador. Solo `true` estricto cuenta:
 * `undefined` o cualquier otro valor se trata como no verificado.
 */
export function correoEsAdmin(
  email: string,
  correoVerificado: unknown,
  listaCruda: string | undefined,
): boolean {
  if (correoVerificado !== true) return false;
  const lista = (listaCruda ?? "")
    .split(",")
    .map((correo) => correo.trim().toLowerCase())
    .filter(Boolean);
  return lista.includes(email.trim().toLowerCase());
}
