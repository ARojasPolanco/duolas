# ARCHITECTURE — Duo LAS

Arquitectura técnica del MVP. Espeja las convenciones reales de Market Design y agrega lo necesario para match en tiempo real y push.

## 1. Stack

| Capa          | Tecnología                                          |
| ------------- | --------------------------------------------------- |
| Runtime       | Node.js 20                                          |
| Backend       | Express 4 + Sequelize 6                             |
| Migraciones   | Umzug con SQL crudo                                 |
| Base de datos | PostgreSQL 16                                       |
| Validación    | Zod                                                 |
| Auth          | JWT + bcrypt                                        |
| Email         | Resend (opcional en desarrollo)                     |
| CAPTCHA       | hCaptcha (opcional en desarrollo y test)            |
| Realtime      | SSE en memoria + polling                            |
| Push          | web-push + VAPID + service worker                   |
| Frontend      | React 19 + Vite 6 + Tailwind CSS 4 + React Router 7 |
| HTTP client   | Axios                                               |
| UI            | Sonner, Lucide React, Framer Motion                 |
| Tests         | Vitest + Supertest                                  |
| Monorepo      | npm workspaces                                      |

Sin Redis, sin TypeScript, sin Prisma y sin chat en el MVP.

## 2. Estructura del monorepo

```text
duo-lol-fullstack/
├─ apps/
│  ├─ api/
│  │  ├─ migrations/
│  │  ├─ seeders/
│  │  ├─ src/
│  │  │  ├─ config/
│  │  │  ├─ errors/
│  │  │  ├─ middlewares/
│  │  │  ├─ modules/
│  │  │  ├─ routes/
│  │  │  ├─ utils/
│  │  │  ├─ app.js
│  │  │  └─ index.js
│  │  └─ vitest.config.js
│  └─ web/
│     ├─ public/
│     │  ├─ manifest.json
│     │  ├─ sw.js
│     │  └─ icons/
│     └─ src/
│        ├─ components/
│        ├─ config/
│        ├─ context/
│        ├─ hooks/
│        ├─ pages/
│        └─ utils/
├─ packages/
│  └─ shared/
│     └─ src/
├─ docker/
│  └─ initdb/
├─ docs/
├─ docker-compose.yml
├─ package.json
└─ README.md
```

## 3. Capas del backend

```text
Route → Controller (catchAsync) → Service → Model
                  ↘ Validación Zod → 422
                  ↘ AppError → globalErrorHandler
```

- **Route:** define método, path y middlewares.
- **Controller:** valida, arma la respuesta y delega. No accede a modelos.
- **Service:** reglas de negocio, acceso a datos y transacciones.
- **Model:** Sequelize.
- **Schema:** Zod + `validateX()` con `{ hasError, errorMessages, data }`.

## 4. Orden de middleware

```text
app.set('trust proxy', 1)
requestId()
accessLog()
helmet()
express.json({ limit: '100kb' })
cors({ origin: whitelist, methods, headers })
rateLimit(auth) en /api/v1/auth
rateLimit(api) en /api
rateLimit(login por credencial) en POST /auth/login
rateLimit(recuperación por email+IP) en POST /auth/forgot-password
rateLimit(autenticado) dentro de protect
GET /health
/api/v1 → routes
app.all('*') → AppError 404
globalErrorHandler
```

Reglas:

- `trust proxy` habilitado para Render/Railway/Vercel.
- CORS con lista separada por comas desde `CORS_ORIGIN`; en producción exige HTTPS y sin wildcard.
- Sin `cookie-parser`: el token viaja en `Authorization`.
- Sin compresión global: SSE necesita flush inmediato.
- Body JSON limitado a 100 KB.
- `TRUST_PROXY` configurable; por defecto 1 detrás de Render/Railway.
- La web se sirve desde Vercel con CSP, HSTS, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy` y `X-Content-Type-Options`.

## 5. Manejo de errores

### Piezas

| Archivo                            | Responsabilidad                                                     |
| ---------------------------------- | ------------------------------------------------------------------- |
| `errors/appError.js`               | Error operativo con `statusCode`, `status`, `isOperational` y stack |
| `errors/catchAsync.js`             | Envuelve handlers async y deriva a `next()`                         |
| `errors/error.controller.js`       | Respuesta dev/prod y persistencia selectiva                         |
| `errors/errorMatchers.js`          | Traduce Sequelize, JWT, PostgreSQL y body-parser                    |
| `errors/index.js`                  | Barrel de exportaciones                                             |
| `modules/logs/errorLog.model.js`   | Modelo de la tabla `errors`                                         |
| `modules/logs/errorLog.service.js` | Redacción, truncado y persistencia                                  |

### Respuesta

- Desarrollo: `status`, `message`, `stack` y `error`.
- Producción: solo `status` y `message` para errores operativos.
- Error no operativo: mensaje genérico 500.

### Persistencia

- Solo se persisten 5xx y errores no operativos.
- Los 4xx esperados no se guardan.
- Se redactan emails, `Bearer` y JWT.
- Se truncan mensaje (2.000) y stack (10.000).
- Se guarda método, ruta, user id, IP y user-agent.

### Catálogo

| Código | Uso                                                          |
| ------ | ------------------------------------------------------------ |
| 400    | Token inválido, entrada inválida no esquemática              |
| 401    | Sin token, token inválido/expirado, credenciales incorrectas |
| 403    | Suspendido, email sin verificar, rol insuficiente, ownership |
| 404    | Recurso inexistente o ajeno oculto                           |
| 409    | Conflicto de estado o duplicado de negocio                   |
| 422    | Validación Zod                                               |
| 429    | Rate limit                                                   |
| 500    | Error inesperado                                             |

### Reglas especiales

- Las transacciones mapean unicidad a 409 sin exponer detalles de PostgreSQL.
- En SSE, después de enviar headers solo se puede cerrar el stream y loguear.
- Los errores de push se capturan y no rompen la request.
- `index.js` registra `unhandledRejection` y `uncaughtException`.
- El cierre ordenado espera al servidor HTTP, cierra SSE y luego Sequelize.

## 6. Logging y observabilidad

- Winston en JSON a consola, nivel configurable por `LOG_LEVEL`.
- `errorLogService` persiste errores inesperados en `errors`.
- `x-request-id` generado o propagado por request.
- Access log mínimo: método, ruta sin query, status, duración y user id.
- Nunca se loguean tokens, tickets SSE, contraseñas ni emails completos.
- Las métricas de producto van a `metrics_events`, no al log.

## 7. Configuración y envs

`config/enviroments.js` valida con Zod al arrancar. Si falta una variable requerida, el proceso no inicia.

| Variable               | Uso                                       |
| ---------------------- | ----------------------------------------- |
| `PORT`                 | Puerto de la API, default 3000            |
| `NODE_ENV`             | development, production o test            |
| `TRUST_PROXY`          | Proxies confiables, default 1             |
| `CORS_ORIGIN`          | Lista de orígenes permitidos              |
| `APP_URL`              | URL pública de la web para emails y links |
| `DB_URI`               | PostgreSQL de desarrollo                  |
| `TEST_DB_URI`          | PostgreSQL de test                        |
| `SECRET_JWT_SEED`      | Firma JWT, mínimo 32 caracteres           |
| `JWT_EXPIRE_IN`        | Default 1d                                |
| `HCAPTCHA_SECRET`      | Opcional; sin secret se salta             |
| `RESEND_API_KEY`       | Opcional en desarrollo                    |
| `OWNER_EMAIL`          | Remitente de emails                       |
| `SUPPORT_EMAIL`        | Reply-to y soporte                        |
| `VAPID_PUBLIC_KEY`     | Push                                      |
| `VAPID_PRIVATE_KEY`    | Push                                      |
| `VAPID_SUBJECT`        | `mailto:` de contacto push                |
| `RATE_LIMIT_WINDOW_MS` | Default 900000                            |
| `RATE_LIMIT_MAX`       | Default 600, por IP                       |
| `RATE_LIMIT_USER_MAX`  | Default 600, por usuario autenticado      |
| `LOG_LEVEL`            | Nivel de Winston                          |
| `ADMIN_EMAIL`          | Email del admin para el seed              |
| `ADMIN_PASSWORD`       | Password del admin para el seed           |

El checklist completo de variables de producción está en `docs/PRODUCTION.md`.

Frontend:

| Variable                 | Uso                                              |
| ------------------------ | ------------------------------------------------ |
| `VITE_API_URL`           | URL de API en producción; en dev se usa el proxy |
| `VITE_HCAPTCHA_SITE_KEY` | Site key de hCaptcha                             |

`appUrl` cae al primer origen de CORS si `APP_URL` no está definido.

## 8. Base de datos

- Sequelize con `underscored: true`, `timestamps: true`, pool 10/2, acquire 30 s, idle 10 s y retry 3.
- En `NODE_ENV=test` se usa `TEST_DB_URI`; nunca la base de desarrollo.
- Umzug lee `migrations/*.js` desde el cwd del workspace de API.
- Migraciones SQL crudas, numeradas y reversibles.
- PK `${tabla}_id` con `gen_random_uuid()`. Excepción: `errors` y `metrics_events` usan `BIGSERIAL`.
- Enums como `VARCHAR + CHECK` para facilitar migraciones.
- Arrays `TEXT[]` con GIN cuando se filtran.
- `JSONB` para metadata y payloads.
- Soft delete con `is_deleted` en entidades persistentes.

### Transacciones y concurrencia

Se usan transacciones con bloqueo de fila en:

- Like mutuo: crear conexión una sola vez.
- Aceptar invitación: evitar doble aceptación.
- Aceptar postulación: cerrar post y rechazar el resto.
- Aceptar postulación ARAM: descontar lugar y crear conexión.
- Revelar feedback: actualizar visibilidad y reputación.

Además, índices únicos y parciales como última barrera:

- Una disponibilidad activa por usuario.
- Una invitación pendiente por par.
- Una postulación por post y usuario.
- Una publicación ARAM activa por usuario.
- Una postulación ARAM por publicación y usuario.
- Un feedback por conexión y autor.
- Una conexión por par ordenado.
- Un reporte abierto por par.

### Migraciones planificadas

| Migración                      | Contenido                                   |
| ------------------------------ | ------------------------------------------- |
| `001_initial`                  | `users` completa + `errors` completa        |
| `002_auth_hardening`           | `changed_password_at` para invalidar JWT    |
| `003_player_profiles`          | Perfiles, `rank_index`, Riot ID normalizado |
| `004_matching`                 | Likes, conexiones y bloqueos                |
| `005_notifications`            | Notificaciones                              |
| `006_fix_rank_division_length` | `rank_division` a VARCHAR(3)                |
| `007_availability_invites`     | Disponibilidades e invitaciones             |
| `008_duo_posts_applications`   | Posts y postulaciones                       |
| `009_trust_safety`             | Reportes y feedbacks                        |
| `010_push_subscriptions`       | Suscripciones push                          |
| `011_metrics_events`           | Eventos de métricas                         |
| `012_account_deletion`         | Baja programada y purga de cuentas          |
| `013_profile_country`          | País de residencia LAS                      |
| `014_aram`                     | Publicaciones y postulaciones ARAM          |
| `015_profile_country_peru`     | Perú dentro del check de países LAS         |

### Jobs internos

- **Feedback vencido:** cada 5 minutos, revelar feedback con 7 días cumplidos y recalcular reputación. También se ejecuta de forma perezosa en los endpoints de feedback.
- **Disponibilidad vencida:** cierre perezoso al leer; no se depende de un cron.
- **Tickets SSE:** limpieza de tickets vencidos cada 30 segundos.
- **Actividad:** `last_active_at` se actualiza como máximo una vez cada 5 minutos por usuario.
- **Push:** las suscripciones 404/410 se marcan inactivas al intentar enviar.
- **Cuentas vencidas:** cada hora se purgan las bajas cuyo plazo de 30 días venció.

Todos los intervalos usan `unref()` para no impedir el cierre ordenado.

## 9. Auth y seguridad

- Registro con bcrypt 12 y hCaptcha opcional.
- JWT de 1 día, payload `{ id, role }`.
- `protect` valida: token, usuario, no borrado, suspensión vigente y `changedPasswordAt`.
- Si `suspended_until` ya pasó, la suspensión se considera vencida y `protect` deja pasar; el estado se corrige de forma perezosa.
- `requireVerifiedEmail` para interacciones sociales.
- `requireCompleteProfile` para match, disponibilidad, postulaciones e invitaciones.
- `restrictTo('admin')` para moderación.
- El panel admin usa `AdminShell` y `/admin`; no requiere perfil de jugador y no entra al matching.
- Ownership explícito en conexiones, invitaciones, postulaciones y feedback.
- Reset con SHA-256, 1 hora y un uso.
- Verificación de email con token de 24 horas, guardado hasheado.
- Contraseñas de 10 a 128 caracteres; bcrypt 12. Login compara un hash dummy cuando el usuario no existe para evitar enumeración por timing.
- Rate limits por IP, por credencial de login y por usuario autenticado.
- CORS restringido, helmet, body limitado y headers de seguridad en la web.
- Token en `localStorage`: riesgo de XSS aceptado para el MVP. Se mitiga con React sin HTML crudo, sin `dangerouslySetInnerHTML` y CSP restrictiva.

### Rate limits

| Ámbito                        | Límite                                              |
| ----------------------------- | --------------------------------------------------- |
| API global                    | 600 por 15 min por IP (5.000 en desarrollo)         |
| API autenticada               | 600 por 15 min por usuario (5.000 en desarrollo)    |
| Auth                          | 60 por 15 min por IP (1.000 en desarrollo)          |
| Login por email/username      | 10 fallos por 15 min por credencial (1.000 en test) |
| Recuperación por email        | 5 por 15 min por email+IP (1.000 en desarrollo)     |
| Likes                         | 30 por hora por usuario                             |
| Invitaciones                  | 20 por hora por usuario                             |
| Invitación a la misma persona | 1 cada 10 min                                       |
| Posts activos                 | 3 por usuario                                       |
| Posts creados                 | 5 por día                                           |
| Postulaciones                 | 20 por día                                          |
| Reportes                      | 10 por día                                          |
| Tickets SSE                   | 30 por hora                                         |
| Suscripciones push            | 10 por hora                                         |

## 10. Realtime con SSE

### Ticket

1. `POST /api/v1/events/ticket` con JWT.
2. Se genera un ticket random de 60 segundos y se guarda en memoria con `userId`.
3. `GET /api/v1/events/stream?ticket=...` abre el stream.
4. El ticket se consume al conectar.

No se acepta JWT en query.

### Stream

- Headers: `Content-Type: text/event-stream`, `Cache-Control: no-cache, no-transform`, `Connection: keep-alive`, `X-Accel-Buffering: no`.
- `res.flushHeaders()`.
- Heartbeat cada 25 segundos con comentario `: ping`.
- Máximo 5 conexiones por usuario y 1.000 globales.
- Se elimina la conexión al cerrar.
- Sin replay: al reconectar, el cliente refetchea por API.

### Eventos

```json
{
  "type": "notification.created",
  "data": { "notificationId": "...", "notificationType": "match_created", "url": "/matches" }
}
```

Tipos emitidos: `notification.created`, `match.created`, `invite.updated`, `application.updated`.

### Flujo

1. El servicio persiste la notificación.
2. Emite el evento al bus interno.
3. Envía push si corresponde.
4. Si el cliente estaba offline, la ve por API.

### Fallback

- Si `EventSource` falla dos veces, el frontend activa polling cada 20 segundos.
- El polling consulta notificaciones no leídas y refresca la pantalla activa.

### Límite de instancia

SSE y rate limit viven en memoria, por lo que el MVP asume **una sola instancia de API**. Si se escala horizontalmente, se debe agregar Redis pub/sub y un store compartido. No se hace ahora.

## 11. Web push y PWA

- VAPID configurado con `web-push`.
- `GET /push/public-key` entrega la clave pública.
- `POST /push/subscribe` guarda endpoint y claves.
- Permiso pedido solo con gesto explícito: activar "Disponible ya" o botón en perfil.
- Payload máximo 4 KB:

```json
{
  "title": "Es un match",
  "body": "Ya pueden coordinar su duo.",
  "url": "/matches",
  "tag": "match-<id>"
}
```

- `sw.js` maneja `push` y `notificationclick`; abre o enfoca la URL.
- Suscripciones 404/410 se marcan inactivas y se podan.
- HTTPS obligatorio salvo localhost.
- `manifest.json` con nombre, iconos 192/512, `display: standalone` y `start_url`.
- iOS requiere instalar la PWA para recibir push.
- El service worker no cachea la app en el MVP.

## 12. Frontend

- Vite con proxy `/api` a `http://localhost:3000`.
- Axios con base URL desde `VITE_API_URL` o `/api`.
- Interceptor de request agrega el token.
- Interceptor de response maneja 401 sin loops y excluye endpoints de auth.
- `ProtectedRoute` y `restrictTo` en backend.
- Contexts: `AuthContext` y `ToastContext`.
- Hooks por dominio con guard de token.
- `ErrorBoundary` global.
- Sonner para toasts.
- Fechas y countdowns con `Intl` en `America/Argentina/Buenos_Aires`.
- Optimistic UI en likes e invitaciones con rollback.
- Sin `dangerouslySetInnerHTML`.
- `vercel.json` con rewrite SPA.

## 13. Deploy y operación

| Componente | Destino                                  |
| ---------- | ---------------------------------------- |
| API        | Render o Railway con proceso persistente |
| Web        | Vercel                                   |
| PostgreSQL | Neon                                     |
| Push       | Web Push estándar con VAPID              |

- `GET /health` verifica la conexión a la base.
- Migraciones al iniciar, en una sola instancia.
- Seeds idempotentes.
- Cierre ordenado: dejar de aceptar requests, cerrar SSE, cerrar Sequelize y salir.
- Variables de entorno cargadas en el panel del proveedor.
- Sin secretos en el repositorio.
- SSE requiere que el proveedor no corte conexiones largas; el heartbeat de 25 s lo mantiene vivo.

## 14. Performance

- Candidatos: filtros SQL por servidor, rango, horario, bloqueo, conexión y like; luego scoring en memoria sobre un máximo de 200 perfiles y top 20.
- Índices en `rank_index`, `schedule_blocks`, `status`, `expires_at`, `user_id` y pares únicos.
- Listados con `limit` máximo 50.
- Sin N+1: `include` explícito y atributos acotados.
- Respuestas públicas sin campos sensibles ni columnas innecesarias.

## 15. Restricciones conocidas

- Una sola instancia por SSE y rate limit en memoria.
- JWT en localStorage.
- Sin verificación real de rango.
- Sin roster de grupo en Busco 1.
- Sin chat interno.
- Sin Redis.
- Push limitado en iOS a PWA instalada.
- Sin tests E2E automatizados; smoke manual obligatorio.
