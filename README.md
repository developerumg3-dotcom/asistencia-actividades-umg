# Ronda — Asistencia por QR rotativo

App web para registrar la participación de alumnos de la UMG en actividades.

El alumno se registra, declara su carné y sus clases, y marca asistencia escaneando un
**código QR que cambia cada 60 segundos** proyectado en el evento. Al final, el
administrador exporta un Excel por catedrático con los puntos de cada alumno.

## Estado

**Fase 0 — definición.** No hay código todavía. El repositorio contiene únicamente la
planificación.

## Documentos

| Archivo | Para qué |
|---|---|
| [PLANIFICACION.md](PLANIFICACION.md) | **Fuente de verdad.** Alcance, modelo de datos, reglas de negocio, pantallas, arquitectura y decisiones cerradas. |
| [AGENTS.md](AGENTS.md) | Contexto e instrucciones para agentes y asistentes que trabajen en este repo. |

## Stack previsto

Next.js 15 + TypeScript · Neon (PostgreSQL) · Drizzle · Neon Auth · Vercel · Tailwind CSS

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
