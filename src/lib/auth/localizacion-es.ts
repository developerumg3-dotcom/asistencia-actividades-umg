// Traducción parcial de los textos que usan <ForgotPasswordForm> y <ResetPasswordForm> de
// @neondatabase/auth-ui. El resto de la interfaz (registro, ingreso, perfil) se construye a
// mano en español; estos dos son los únicos puntos donde se usa la librería de componentes,
// porque el SDK todavía no soporta un flujo de reset de contraseña a medida.
export const localizacionEs = {
  EMAIL: "Correo electrónico",
  FORGOT_PASSWORD: "Recuperar contraseña",
  FORGOT_PASSWORD_ACTION: "Enviar enlace",
  FORGOT_PASSWORD_DESCRIPTION: "Escribí tu correo y te mandamos un enlace para restablecerla.",
  FORGOT_PASSWORD_EMAIL: "Revisá tu correo: te enviamos un enlace para restablecer la contraseña.",
  FORGOT_PASSWORD_LINK: "¿Olvidaste tu contraseña?",
  NEW_PASSWORD: "Contraseña nueva",
  CONFIRM_PASSWORD: "Confirmar contraseña",
  RESET_PASSWORD: "Restablecer contraseña",
  RESET_PASSWORD_ACTION: "Guardar contraseña nueva",
  RESET_PASSWORD_DESCRIPTION: "Escribí tu contraseña nueva.",
  RESET_PASSWORD_SUCCESS: "Contraseña restablecida. Ya podés iniciar sesión.",
  REQUEST_FAILED: "No se pudo procesar la solicitud. Probá de nuevo.",
  GO_BACK: "Volver",
};
