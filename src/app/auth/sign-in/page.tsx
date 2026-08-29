import { redirect } from "next/navigation";

// @neondatabase/auth-ui navega acá por defecto (basePath "/auth" + viewPaths.SIGN_IN) después
// de pedir el reset de contraseña o de restablecerla. El ingreso real de la app es /ingreso.
export default function AuthSignInRedirectPage() {
  redirect("/ingreso");
}
