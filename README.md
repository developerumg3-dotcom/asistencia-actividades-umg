# Ronda — Asistencia por QR rotativo

App web para registrar la participación de alumnos de la UMG en actividades.

El alumno se registra, declara su carné y sus clases, y marca asistencia escaneando un
**código QR que cambia cada 60 segundos** proyectado en el evento. Al final, el
administrador exporta un Excel por catedrático con los puntos de cada alumno.

## Estado

Fases 1 y 2 construidas y desplegadas; a la Fase 2 le falta el ensayo en campo, presencial.
Fase 3 adelantada en paralelo. Ver [ESTADO.md](ESTADO.md), que es el que se mantiene al día.

## Documentos

Si sos un agente o asistente, **empezá por [AGENTS.md](AGENTS.md)**.

| Archivo | Para qué |
|---|---|
| [AGENTS.md](AGENTS.md) | **Punto de entrada.** Reglas de trabajo, convenciones y trampas conocidas. |
| [ESTADO.md](ESTADO.md) | Qué existe hoy, qué sigue, y la bitácora de decisiones cerradas. |
| [PLANIFICACION.md](PLANIFICACION.md) | **Fuente de verdad.** Alcance, modelo de datos, reglas de negocio, pantallas, arquitectura y las 14 decisiones. |
| [ESTRUCTURA.md](ESTRUCTURA.md) | Mapa de carpetas, rutas previstas y variables de entorno. |
| [docs/fase-1.md](docs/fase-1.md) | Plan detallado de la fase que sigue, con criterios de aceptación. |

## Stack

Next.js 15 + TypeScript · Neon (PostgreSQL) · Drizzle · Neon Auth · Netlify · Tailwind CSS

Nombre público: `https://app-asist-actividades-umg.netlify.app`

## Configuración local

```bash
cp .env.example .env.local
```

Y llenar `.env.local` con los valores de Neon. Ese archivo nunca se versiona.

## Cómo funciona el QR

Cada actividad tiene un secreto de 32 bytes que vive solo en el servidor. El código visible
se deriva por HMAC del secreto y la ventana de tiempo actual, igual que un token de Google
Authenticator:

```
slot   = floor(unix_time / 60)
codigo = base64url( HMAC_SHA256(secreto, actividad_id ‖ slot) )[0..9]
```

El servidor valida contra la hora en que llega el botón "Marcar asistencia", no contra la
hora del escaneo. Por eso compartir una foto del QR no sirve: el toque tiene que caer dentro
del mismo minuto.
