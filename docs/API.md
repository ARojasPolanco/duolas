# API — Duo LAS

Contrato HTTP del MVP. Base: `/api/v1`. Si el código contradice este documento, el código está mal.

## 1. Convenciones

- Respuesta exitosa: `{ "status": "success", ... }`.
- Respuesta de error: `{ "status": "fail" | "error", "message": "..." }`.
- Autenticación: `Authorization: Bearer <jwt>`.
- Fechas: ISO 8601 UTC (`2026-10-25T18:30:00.000Z`).
- IDs: UUID.
- Listados con `limit` (máximo 50, default 20) y sin cursor en el MVP.
- Escrituras con Zod `.strict()`: campos desconocidos devuelven 422.
- Mensajes en español rioplatense.
- Ningún endpoint público devuelve email, Riot ID ni Discord.

## 2. Códigos de estado

| Código | Uso                                                               |
| ------ | ----------------------------------------------------------------- |
| 200    | Lectura o actualización correcta                                  |
| 201    | Recurso creado                                                    |
| 400    | Entrada inválida no esquemática o token inválido                  |
| 401    | Sin token, token inválido/expirado o credenciales incorrectas     |
| 403    | Suspendido, email sin verificar, rol insuficiente o sin ownership |
| 404    | Recurso inexistente o ajeno oculto                                |
| 409    | Conflicto de estado o duplicado de negocio                        |
| 422    | Validación Zod                                                    |
| 429    | Rate limit                                                        |
| 500    | Error inesperado                                                  |

## 3. Rate limits

| Ámbito                        | Límite                                           |
| ----------------------------- | ------------------------------------------------ |
| API global                    | 600 por 15 min por IP (5.000 en desarrollo)      |
| API autenticada               | 600 por 15 min por usuario (5.000 en desarrollo) |
| Auth                          | 60 por 15 min por IP (1.000 en desarrollo)       |
| Login por email/username      | 10 fallos por 15 min por credencial              |
| Recuperación por email        | 5 por 15 min por email+IP                        |
| Likes                         | 30 por hora por usuario                          |
| Invitaciones                  | 20 por hora por usuario                          |
| Invitación a la misma persona | 1 cada 10 min                                    |
| Posts activos                 | 3 por usuario                                    |
| Posts creados                 | 5 por día                                        |
| Postulaciones                 | 20 por día                                       |
| Reportes                      | 10 por día                                       |
| Tickets SSE                   | 30 por hora                                      |
| Suscripciones push            | 10 por hora                                      |

Al exceder: 429 con mensaje claro.

## 4. Auth

### `POST /auth/register`

Público. hCaptcha opcional.

```json
{
  "username": "faker",
  "email": "faker@example.com",
  "password": "password123",
  "ageConfirmed": true,
  "termsAccepted": true,
  "captchaToken": "opcional"
}
```

`201`:

```json
{
  "status": "success",
  "token": "jwt...",
  "user": {
    "id": "uuid",
    "username": "faker",
    "email": "faker@example.com",
    "role": "player",
    "emailVerified": false,
    "status": "active",
    "ageConfirmedAt": "2026-10-25T...",
    "termsAcceptedAt": "2026-10-25T...",
    "warningCount": 0,
    "profileCompleted": false
  }
}
```

Errores: 422 si falta +18 o términos; 409 si email o username existen; 422 si el captcha falla.

### `POST /auth/login`

```json
{ "identifier": "faker@example.com", "password": "password123" }
```

`identifier` acepta email o username. `200` con token y usuario. 401 si las credenciales son incorrectas. 403 si la suspensión está vigente; si la suspensión temporal venció, se permite el login y el estado se corrige. El email no se puede modificar en el MVP. El username solo cambia con una solicitud asistida por admin.

### `GET /auth/verify-email?token=...`

`200` con mensaje. 400 si el token es inválido, falta o expiró. El token viaja en query para que no quede en el path ni en los logs.

### `POST /auth/resend-verification`

Protegido. `200`. Regenera el token y vence en 24 horas.

### `POST /auth/forgot-password`

```json
{ "email": "faker@example.com" }
```

`200` siempre con mensaje genérico.

### `POST /auth/reset-password`

```json
{ "token": "token-plano", "password": "nuevaPassword123" }
```

`200`. 400 si el token es inválido, expiró o ya se usó.

### `GET /auth/profile`

Protegido. Devuelve la cuenta:

```json
{
  "status": "success",
  "user": {
    "id": "uuid",
    "username": "faker",
    "email": "faker@example.com",
    "role": "player",
    "emailVerified": true,
    "status": "active",
    "ageConfirmedAt": "2026-10-25T...",
    "country": "AR",
    "profileCompleted": true,
    "warningCount": 0
  }
}
```

### `PATCH /auth/change-password`

```json
{ "currentPassword": "actual", "newPassword": "nuevaPassword123" }
```

`200`. 401 si la actual es incorrecta. Invalida tokens previos vía `changedPasswordAt` y devuelve un token nuevo.

### `DELETE /auth/account`

Protegido. Programa la eliminación con recuperación durante 30 días.

```json
{ "password": "contraseña-actual" }
```

`200`:

```json
{ "status": "success", "deletionScheduledFor": "2026-11-25T..." }
```

- 401 si la contraseña es incorrecta.
- Invalida la sesión actual.
- Desactiva perfil, disponibilidad, invitaciones, posts y notificaciones.
- Login dentro del plazo recupera la cuenta y cancela la baja.
- Al vencer, se purgan datos personales y el perfil; reportes, feedback y sanciones quedan anonimizados.

## 5. Perfiles

### `GET /profiles/me`

Protegido. Si el usuario todavía no empezó el onboarding, `profile` es `null` y `completeness` lista los campos faltantes.

```json
{
  "status": "success",
  "profile": {
    "id": "uuid",
    "username": "faker",
    "riotId": "Faker#LAS",
    "server": "LAS",
    "country": "AR",
    "primaryRole": "mid",
    "secondaryRole": "jungle",
    "rankTier": "diamond",
    "rankDivision": "ii",
    "rankLp": 42,
    "rankSource": "declared",
    "flexRankTier": "platinum",
    "flexRankDivision": "ii",
    "flexRankLp": 50,
    "flexRankSource": "declared",
    "playStyle": "ranked",
    "languages": ["es", "en"],
    "hasMic": true,
    "scheduleBlocks": ["mon_night", "tue_night", "sat_afternoon"],
    "bio": "Mid main, busco duo para ranked.",
    "discordTag": "faker",
    "reputation": {
      "score": 70,
      "positive": 5,
      "negative": 1,
      "total": 6,
      "label": "70%"
    },
    "availabilityActive": false,
    "profileCompletedAt": "2026-10-25T...",
    "createdAt": "2026-10-25T..."
  },
  "completeness": {
    "completed": true,
    "missing": []
  }
}
```

### `PATCH /profiles/me`

Protegido. Acepta actualización parcial de:

`riotId`, `country`, `primaryRole`, `secondaryRole`, `rankTier`, `rankDivision`, `rankLp`, `flexRankTier`, `flexRankDivision`, `flexRankLp`, `playStyle`, `languages`, `hasMic`, `scheduleBlocks`, `bio`, `discordTag`.

El servicio exige que el estado final quede completo. Para crear el perfil hay que enviar todos los campos obligatorios; si falta alguno responde 422 con la lista. Una vez creado, acepta actualizaciones parciales que mantengan el perfil completo. `profile_completed_at` se setea al completar. `200` con perfil y completitud.

Reglas:

- Riot ID único case-insensitive.
- `country` opcional: `AR`, `CL`, `BO`, `PY`, `UY` o `PE`.
- Roles `top`, `jungle`, `mid`, `adc`, `support` o `fill`; distintos salvo Comodín.
- Rango Solo/Dúo obligatorio; Flex opcional y separado.
- Hasta Diamante con división; Maestro+ sin división.
- 1-3 idiomas.
- 1-28 bloques.
- Discord 2-32, alfanumérico, punto o guión bajo.
- No se permite cambiar `server`.

### `GET /profiles/:id`

Protegido. Perfil público:

```json
{
  "status": "success",
  "profile": {
    "id": "uuid",
    "username": "faker",
    "country": "AR",
    "primaryRole": "mid",
    "secondaryRole": "jungle",
    "rankTier": "diamond",
    "rankDivision": "ii",
    "rankLp": 42,
    "rankSource": "declared",
    "flexRankTier": "platinum",
    "flexRankDivision": "ii",
    "flexRankLp": 50,
    "flexRankSource": "declared",
    "playStyle": "ranked",
    "languages": ["es", "en"],
    "hasMic": true,
    "scheduleBlocks": ["mon_night"],
    "bio": "Mid main.",
    "reputation": { "score": 70, "positive": 5, "negative": 1, "total": 6, "label": "70%" },
    "availabilityActive": true,
    "stats": { "connections": 4 },
    "createdAt": "2026-10-25T..."
  }
}
```

Nunca incluye email, Riot ID ni Discord.

### `GET /username-changes/mine`

Protegido. Devuelve la última solicitud de cambio de username del usuario y su username actual.

### `POST /username-changes/:id/suggest`

Protegido. Solo el dueño de la solicitud. Body: `{ "username": "nuevo_nombre" }`. Valida formato, nombres reservados y disponibilidad. Pasa la solicitud a `pending_admin`. `422` si el nombre no es válido, `409` si ya está en uso.

## 6. Matching

### `GET /matching/candidates`

Protegido + email verificado + perfil completo.

Query: `queue` (`solo_duo` default, `flex`), `role` opcional, `limit` máximo 50.

```json
{
  "status": "success",
  "candidates": [
    {
      "profile": {
        "id": "uuid",
        "username": "pepe",
        "rankTier": "diamond",
        "rankDivision": "iii",
        "primaryRole": "jungle",
        "secondaryRole": "top",
        "...": "..."
      },
      "score": 95,
      "breakdown": {
        "schedule": 36,
        "style": 25,
        "language": 15,
        "roles": 10,
        "mic": 5,
        "rank": 4
      },
      "reasons": ["3 horarios en común", "Mismo estilo", "Hablan español"],
      "availabilityActive": false
    }
  ],
  "total": 12
}
```

### `POST /matching/likes`

```json
{ "targetUserId": "uuid" }
```

`201` si es nuevo. `200` si ya existía. Si el like es mutuo:

```json
{
  "status": "success",
  "like": { "id": "uuid", "status": "matched", "createdAt": "..." },
  "matched": true,
  "connection": {
    "id": "uuid",
    "source": "like",
    "createdAt": "...",
    "contact": { "riotId": "Faker#LAS", "discordTag": "faker" }
  }
}
```

Errores: 400 auto-like, 403 bloqueado, 404 target inexistente, 409 conexión ya activa.

### `DELETE /matching/likes/:targetUserId`

`200`. 409 si ya es match.

### `GET /matching/likes`

Solo salientes. No revela quién te likeó.

```json
{
  "status": "success",
  "outgoing": [
    {
      "id": "uuid",
      "createdAt": "...",
      "target": {
        "id": "uuid",
        "username": "pepe",
        "rankTier": "diamond",
        "primaryRole": "jungle",
        "reputation": { "...": "..." }
      }
    }
  ]
}
```

### `GET /matching/matches`

```json
{
  "status": "success",
  "matches": [
    {
      "id": "uuid",
      "source": "like",
      "createdAt": "...",
      "contact": { "riotId": "Pepe#LAS", "discordTag": "pepe" },
      "other": {
        "id": "uuid",
        "username": "pepe",
        "rankTier": "diamond",
        "primaryRole": "jungle",
        "reputation": { "...": "..." }
      },
      "feedback": { "mine": "pending", "theirs": "submitted", "revealed": false }
    }
  ]
}
```

### `GET /matching/matches/:id`

Mismo shape. 404 si no es participante.

### `POST /matching/matches/:id/archive`

`200`. Solo participante. Oculta la conexión de ambos listados.

## 7. Disponible ya

### `POST /availability`

```json
{
  "roles": ["mid", "support"],
  "queue": "solo_duo",
  "note": "Ranked, no toxico.",
  "ttlMinutes": 30
}
```

`201` con la sesión. Cierra la disponibilidad activa anterior del usuario. `ttlMinutes` solo acepta 30 o 60.

### `DELETE /availability`

`200`. Cierra la sesión activa con motivo `manual`.

### `GET /availability`

Query: `queue`, `role`, `limit`. Solo sesiones vigentes, sin uno mismo, bloqueados ni conexiones activas.

```json
{
  "status": "success",
  "players": [
    {
      "profile": {
        "id": "uuid",
        "username": "pepe",
        "rankTier": "diamond",
        "primaryRole": "jungle",
        "...": "..."
      },
      "session": {
        "id": "uuid",
        "roles": ["jungle"],
        "queue": "solo_duo",
        "note": "Voy jungle.",
        "expiresAt": "2026-10-25T19:00:00.000Z"
      },
      "score": 78,
      "breakdown": { "rank": 24, "style": 25, "language": 12, "mic": 10, "reputation": 7 }
    }
  ],
  "total": 8
}
```

### `GET /availability/me`

`200` con `{ session: {...} | null }`.

### `POST /availability/:id/invite`

```json
{ "role": "jungle", "message": "Te necesitamos para flex." }
```

`201` con la invitación. Reglas: el receptor debe estar activo, ofrecer el rol, no estar bloqueado y no tener una conexión activa. Vence en 10 minutos.

## 8. Invitaciones

### `GET /invites?box=incoming|outgoing`

`box` default `incoming`.

`200` con `invites`:

```json
{
  "id": "uuid",
  "status": "pending",
  "role": "jungle",
  "message": "Te necesitamos.",
  "expiresAt": "...",
  "createdAt": "...",
  "counterpart": {
    "id": "uuid",
    "username": "pepe",
    "country": "CL",
    "rankTier": "diamond",
    "primaryRole": "mid",
    "reputation": { "...": "..." }
  },
  "availability": { "roles": ["mid"], "queue": "solo_duo" }
}
```

### `POST /invites/:id/accept`

`200`:

```json
{
  "status": "success",
  "connection": { "id": "uuid", "source": "availability", "createdAt": "..." },
  "contact": { "riotId": "Pepe#LAS", "discordTag": "pepe" }
}
```

Cierra ambas disponibilidades. 409 si ya fue resuelta o expiró.

### `POST /invites/:id/decline`

Solo el receptor. `200`. 409 si ya fue resuelta.

### `POST /invites/:id/cancel`

Solo el emisor. `200`. 409 si ya fue resuelta.

## 9. Busco 1

### `POST /duo-posts`

```json
{
  "queue": "flex",
  "rolesNeeded": ["support"],
  "rankMinTier": "gold",
  "rankMaxTier": "platinum",
  "note": "Somos 4, falta support."
}
```

`201`. Vence en 2 horas. Máximo 3 activos y 1 por cola. Al crear, notifica a hasta 20 disponibles compatibles.

### `GET /duo-posts`

Query: `queue`, `role`, `limit`. Solo activos y vigentes.

### `GET /duo-posts/mine`

Incluye `applicationsCount` y estados.

### `GET /duo-posts/:id`

Detalle con perfil público del dueño y rango.

### `DELETE /duo-posts/:id`

Dueño. `200`. Pasa a `cancelled`.

### `POST /duo-posts/:id/apply`

```json
{ "message": "Puedo support." }
```

`201`. Requiere rango dentro del rango del post y rol compatible. 409 si ya postuló, si el post no está activo o si se llenó. Máximo 10 postulaciones pendientes por post.

### `GET /duo-posts/:id/applications`

Solo dueño.

```json
{
  "status": "success",
  "applications": [
    {
      "id": "uuid",
      "message": "Puedo support.",
      "status": "pending",
      "createdAt": "...",
      "applicant": { "id": "uuid", "username": "pepe", "rankTier": "gold", "...": "..." },
      "score": 82
    }
  ]
}
```

### `POST /duo-posts/:id/applications/:applicationId/accept`

Solo dueño. `200` con conexión y contacto. Cierra el post, rechaza el resto y notifica.

### `POST /duo-posts/:id/applications/:applicationId/reject`

Solo dueño. `200`.

### `DELETE /duo-posts/:id/applications/:applicationId`

Solo el postulante. Retira la postulación. `200`.

## 9.1 ARAM

Protegido + email verificado + perfil completo. ARAM no usa rango, roles ni score de afinidad.

### `GET /aram`

Query: `mode` (`solo` o `group`) y `limit` máximo 50. Devuelve publicaciones activas y vigentes.

### `POST /aram`

```json
{
  "mode": "group",
  "playersPresent": 3,
  "slotsNeeded": 2,
  "window": "now",
  "hasMic": true,
  "note": "Buscamos support."
}
```

`mode: "solo"` exige `playersPresent: 1` y `slotsNeeded: 1`. Un grupo permite 2-4 jugadores presentes y hasta `5 - playersPresent` lugares. Vence en 1 hora para `now` y 6 horas para `tonight`. Una publicación activa por usuario.

### `GET /aram/mine`

Devuelve la publicación propia, solicitudes recibidas y postulaciones enviadas.

### `DELETE /aram/:id`

Dueño. Cancela la publicación y rechaza solicitudes pendientes. `200`.

### `POST /aram/:id/applications`

```json
{ "message": "Juego support." }
```

`201`. No permite postularse a la propia publicación ni a un usuario bloqueado. 409 si ya existe una postulación.

### `POST /aram/:postId/applications/:applicationId/accept`

Solo dueño. Acepta una solicitud, descuenta un lugar y crea una conexión con `source: "aram"`. Si el grupo se llena, pasa a `filled` y rechaza las demás solicitudes. El contacto queda disponible en `/matches`.

### `POST /aram/:postId/applications/:applicationId/reject`

Solo dueño. Rechaza una solicitud pendiente. `200`.

### `DELETE /aram/:postId/applications/:applicationId`

Solo postulante. Retira una solicitud pendiente. `200`.

## 10. Confianza

### `POST /reports`

```json
{
  "reportedUserId": "uuid",
  "reason": "toxicity",
  "details": "Insultó en el chat de voz."
}
```

`201`:

```json
{
  "status": "success",
  "report": { "id": "uuid", "status": "open", "reason": "toxicity", "priority": false },
  "blocked": true
}
```

Auto-bloquea. 409 si ya hay un reporte abierto del mismo par. 400 si se reporta a sí mismo. `underage` marca prioridad.

### `GET /blocks`

`200` con usuarios bloqueados.

### `POST /blocks`

```json
{ "userId": "uuid" }
```

`201`. Archiva la conexión activa si existe y oculta el contacto. 400 si intenta bloquearse a sí mismo.

### `DELETE /blocks/:userId`

`200`. Desbloquea.

### `POST /feedback`

```json
{
  "connectionId": "uuid",
  "sentiment": "positive",
  "tags": ["good_vibes", "communicative"],
  "comment": "Muy buena onda."
}
```

`201` con `{ feedback, revealed }`. Reglas: participante de la conexión, dentro de 7 días, uno por autor, negativo exige al menos un tag. 409 si ya existe o si la ventana cerró.

### `GET /feedback/pending`

Conexiones activas o recientes sin feedback propio y dentro de la ventana.

### `GET /feedback/connection/:connectionId`

```json
{
  "status": "success",
  "revealed": false,
  "mine": { "sentiment": "positive", "tags": ["good_vibes"], "comment": "...", "createdAt": "..." },
  "theirs": null
}
```

También devuelve `windowOpen` y `expiresAt`. Si está revelado, `theirs` incluye el feedback de la otra persona.

## 11. Notificaciones

### `GET /notifications`

`200`:

```json
{
  "status": "success",
  "notifications": [
    {
      "id": "uuid",
      "type": "match_created",
      "title": "Es un match",
      "message": "Ya pueden coordinar su duo.",
      "data": { "url": "/matches", "connectionId": "uuid" },
      "isRead": false,
      "createdAt": "..."
    }
  ],
  "unreadCount": 3
}
```

### `GET /notifications/unread-count`

`200` con `{ unreadCount }`.

### `PATCH /notifications/:id/read`

Solo el dueño. `200`.

### `PATCH /notifications/read-all`

`200`.

### `DELETE /notifications/:id`

Solo el dueño. `200`.

## 12. Realtime

### `POST /events/ticket`

Protegido.

```json
{ "status": "success", "ticket": "random", "expiresIn": 60 }
```

### `GET /events/stream?ticket=...`

SSE. No usa JWT en query. Headers: `text/event-stream`, `no-cache`, `no-transform`, `X-Accel-Buffering: no`. Heartbeat cada 25 s.
Eventos:

```text
event: notification.created
data:
{"type":"notification.created","data":{"notificationId":"uuid","notificationType":"match_created","title":"Es un match","message":"Ya pueden coordinar su duo.","url":"/matches"}}
```

También emite eventos específicos: `match.created`, `invite.updated` y `application.updated`.

### `GET /events/stats`

Solo admin. `200` con `{ users, connections, tickets }`.

## 13. Push

### `GET /push/public-key`

`200` con `{ publicKey, enabled }`. Si VAPID no está configurado, `publicKey` es `null` y `enabled` es `false`.

### `POST /push/subscribe`

```json
{
  "endpoint": "https://...",
  "keys": { "p256dh": "...", "auth": "..." },
  "userAgent": "Mozilla/5.0..."
}
```

`201`. Endpoint único; si existe, se reactiva.

### `DELETE /push/unsubscribe`

```json
{ "endpoint": "https://..." }
```

`200`. Marca la suscripción inactiva.

## 14. Admin

Requiere rol `admin`.

### `GET /admin/overview`

Resumen operativo: usuarios activos, jugadores, admins, altas de 7 días, emails verificados,
perfiles completos, suspendidos, bajas pendientes, reportes abiertos, matches activos y
disponibilidades activas.

Incluye actividad de matching: `likesTotal`, `likesPending`, `likes24h`, `matchesTotal`,
`matches24h`, `recentLikes` y `recentMatches` (últimos 8, sin emails ni datos de contacto).
También incluye `pendingUsernameChanges` y `recentUsernameChanges`.

### `GET /admin/users`

Query:

- `search`: username o email, máximo 100 caracteres.
- `role`: `player` o `admin`.
- `status`: `active` o `suspended`.
- `account`: `active` (default), `pending_deletion`, `deleted` o `all`.
- `emailVerified`: `true` o `false`.
- `profileCompleted`: `true` o `false`.
- `page` y `limit` (máximo 50).

Devuelve usuarios con email, perfil resumido y conteos de reportes abiertos, conexiones
activas y sanciones.

### `GET /admin/users/:id`

Detalle de cuenta, perfil, reportes recibidos, sanciones, disponibilidad y conexiones.
Nunca incluye contraseña ni tokens.

### `GET /admin/reports`

Query: `status`, `reason`, `priority`, `limit`. Devuelve reportes con reportero, reportado y contexto, sin emails.

### `POST /admin/reports/:id/resolve`

```json
{
  "resolution": "suspended_7d",
  "note": "Insultos reiterados."
}
```

Valores: `dismissed`, `warned`, `suspended_7d`, `suspended_30d`, `suspended_permanent`. `200`. Registra admin, nota y fecha.

### `POST /admin/users/:id/warn`

```json
{ "reason": "Lenguaje agresivo." }
```

`200`. Notifica al usuario y suma `warning_count`.

### `POST /admin/users/:id/suspend`

```json
{ "days": 30, "reason": "Conducta reiterada." }
```

### `POST /admin/users/:id/username-request`

Solo admin. Crea una solicitud de cambio de username y notifica al usuario. Body opcional: `{ "note": "..." }`. Solo puede haber una solicitud abierta por usuario.

### `POST /admin/username-changes/:id/approve`

Solo admin. Aprueba la propuesta pendiente. Body opcional: `{ "username": "...", "note": "..." }`. Actualiza `users.username`, libera el anterior y notifica al usuario.

### `POST /admin/username-changes/:id/reject`

Solo admin. Rechaza o cancela una solicitud abierta. Body opcional: `{ "note": "..." }`.

`days` 7, 30 o `null` para permanente. `200`. Envía email y notificación. 400 si el admin intenta suspenderse a sí mismo.

### `GET /admin/metrics/summary`

Query: `from`, `to`. Devuelve los cuatro KPIs.

## 15. Health

### `GET /health`

Fuera de `/api/v1`, sin auth.

```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2026-10-25T18:30:00.000Z"
}
```

Si la DB falla: 503 con `database: "disconnected"`.
