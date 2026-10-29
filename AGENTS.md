# AGENTS.md — Duo LAS

Documento operativo para cualquier persona o agente que trabaje en este repositorio. Si una regla de este archivo choca con una decisión nueva, primero se actualiza la documentación y luego el código.

## 1. Contexto del producto

Duo LAS es una web mobile-first, gratuita y solo para mayores de 18 años, que conecta jugadores de League of Legends del servidor LAS para jugar duo y subir de elo. El alcance de este repositorio es el servicio de match y duo: perfil, match por afinidad, "Disponible ya", "Busco 1", invitaciones, notificaciones, reputación, reportes y bloqueos.

Quedan fuera del alcance: coaching, pagos, Mercado Pago, chat interno, equipos/clanes, otros juegos, otros servidores, app nativa, Riot API/RSO y duo boost.

La propuesta original está en `Propuesta plataforma de duos para League of Legends.pdf`. La fuente de verdad a partir de ahora es la documentación de `docs/`.

## 2. Estado del repositorio

- Fase actual: MVP completo en producción, con ARAM, rango Flex, Comodín y Perú dentro de LAS.
- Código: monorepo con auth, perfiles, matching, disponibilidad, invitaciones, Busco 1, ARAM, confianza, SSE, push, PWA, métricas, conexiones, bloqueos y notificaciones persistidas.
- No hay credenciales, claves ni secretos en el repositorio.
- Toda decisión de producto y técnica está registrada en `docs/DECISIONS.md`.

## 3. Orden de lectura obligatorio

1. `README.md`
2. `docs/SPEC.md`
3. `docs/ARCHITECTURE.md`
4. `docs/DATA-MODEL.md`
5. `docs/API.md`
6. `docs/ROUTES.md`
7. `docs/MATCHING.md`
8. `docs/METRICS.md`
9. `docs/TESTING.md`
10. `docs/PRODUCTION.md`
11. `docs/RIOT-INTEGRATION.md`
12. `docs/UI.md`
13. `docs/DECISIONS.md`
14. `TASK.md`

## 4. Stack

| Capa          | Tecnología                                                             |
| ------------- | ---------------------------------------------------------------------- |
| Monorepo      | npm workspaces (`apps/api`, `apps/web`, `packages/shared`)             |
| Lenguaje      | JavaScript puro con ESM. No TypeScript.                                |
| Backend       | Node.js 20 + Express 4 + Sequelize 6                                   |
| Migraciones   | Umzug con SQL crudo y migraciones numeradas                            |
| Base de datos | PostgreSQL 16                                                          |
| Validación    | Zod en cada módulo + constantes compartidas                            |
| Auth          | JWT (1 día, sin refresh) + bcrypt (12 rounds) + verificación por email |
| Email         | Resend (opcional en desarrollo)                                        |
| CAPTCHA       | hCaptcha (opcional en desarrollo y test)                               |
| Realtime      | SSE en memoria + polling de respaldo. Sin Redis.                       |
| Push          | `web-push` + VAPID + service worker + PWA                              |
| Frontend      | React 19 + Vite 6 + Tailwind CSS 4 + Axios + React Router 7            |
| UI auxiliar   | Sonner, Lucide React, Framer Motion                                    |
| Tests         | Vitest + Supertest                                                     |
| Deploy        | API persistente (Render/Railway), web en Vercel, PostgreSQL en Neon    |

Se espejan las convenciones reales de Market Design, con las correcciones documentadas en `docs/DECISIONS.md`.

## 5. Estructura planificada

```text
duo-lol-fullstack/
├─ apps/
│  ├─ api/
│  │  ├─ migrations/            # SQL crudo numerado
│  │  ├─ seeders/               # seed de desarrollo y admin
│  │  ├─ src/
│  │  │  ├─ config/             # envs, database, matching, push, resend
│  │  │  ├─ errors/             # AppError, catchAsync, matchers, handler
│  │  │  ├─ middlewares/        # auth gates, rate limits, validación
│  │  │  ├─ modules/            # auth, profiles, matching, availability,
│  │  │  │                      # duoPosts, aram, invites, trust, notifications,
│  │  │  │                      # push, events, admin, metrics
│  │  │  ├─ routes/
│  │  │  ├─ app.js
│  │  │  └─ index.js
│  │  └─ vitest.config.js
│  └─ web/
│     ├─ public/                # manifest, sw.js, iconos propios
│     └─ src/
│        ├─ components/
│        ├─ config/
│        ├─ context/
│        ├─ hooks/
│        ├─ pages/
│        └─ utils/
├─ packages/
│  └─ shared/                   # constantes y schemas compartidos
├─ docker/
│  └─ initdb/
├─ docs/
├─ docker-compose.yml
├─ AGENTS.md
├─ TASK.md
└─ README.md
```

## 6. Convenciones de código

- JavaScript puro, ESM, `"type": "module"`.
- Imports con extensión `.js` explícita.
- Comillas simples, punto y coma, `trailingComma: "es5"`, `printWidth: 100`, 2 espacios.
- Backend: archivos `camelCase.js`; modelos Sequelize en `PascalCase.js`.
- Frontend: componentes `PascalCase.jsx`; hooks `useX.js`; utilidades `camelCase.js`.
- Env: `SCREAMING_SNAKE_CASE`.
- Fechas en DB en UTC (`TIMESTAMPTZ`). La UI y los horarios de disponibilidad se muestran en `America/Argentina/Buenos_Aires` (ART).
- Mensajes de error y copy de API en español rioplatense.
- Código autodescriptivo. Comentarios solo para decisiones no obvias, invariantes o riesgos.
- No hardcodear valores configurables: van a `config/` o a la tabla `config` cuando exista panel admin.
- Soft delete: `is_deleted` en entidades persistentes. Likes, invitaciones vencidas y tickets efímeros pueden borrarse físicamente.
- Prohibido `process.env.X` directo: usar `envs.X`.

## 7. Patrón backend

```text
Route → Controller (catchAsync) → Service → Model
                  ↘ Validación Zod → 422
                  ↘ AppError → globalErrorHandler
```

Cada módulo contiene:

- `*.model.js`: modelo Sequelize.
- `*.service.js`: clase con acceso a datos y reglas.
- `*.controller.js`: handlers HTTP envueltos en `catchAsync`.
- `*.route.js`: rutas y middlewares del módulo.
- `*.schema.js`: schemas Zod + `validateX()` que devuelve `{ hasError, errorMessages, data }`.

Los controllers no acceden a modelos directamente. Las transacciones viven en servicios.

## 8. Manejo de errores

Piezas obligatorias:

- `errors/appError.js`: `statusCode`, `status` (`fail`/`error`), `isOperational`, `captureStackTrace`.
- `errors/catchAsync.js`: envuelve handlers async y deriva a `next()`.
- `errors/error.controller.js`: respuesta distinta en desarrollo y producción; persiste solo 5xx y errores no operativos.
- `errors/errorMatchers.js`: traduce errores de Sequelize, JWT, PostgreSQL y body-parser a `AppError`. No se incluyen matchers de Multer porque no hay uploads.
- `modules/logs/errorLog.*`: persiste en la tabla `errors` con truncado y redacción de emails/tokens.
- `app.js`: `GET /health`, `/api/v1`, catch-all 404 y `globalErrorHandler` al final.
- `index.js`: handlers de `unhandledRejection` y `uncaughtException`, y cierre ordenado.

Reglas:

- 422 para validación Zod.
- 400 para entradas inválidas que no son de esquema (por ejemplo, token de verificación inválido).
- 401 para falta de token, token inválido/expirado o credenciales incorrectas.
- 403 para suspendido, email sin verificar, rol insuficiente o falta de ownership.
- 404 para recurso inexistente o ajeno cuando corresponda ocultarlo.
- 409 para conflictos de estado (invitación ya resuelta, post lleno, feedback duplicado, reporte abierto duplicado).
- 429 para rate limit.
- 500 para errores inesperados; se persisten con redacción.
- Las transacciones deben mapear violaciones de unicidad a 409 sin exponer detalles de PostgreSQL.
- Los errores de SSE se manejan después de enviar headers: cerrar el stream y loguear, nunca intentar escribir JSON.
- Los errores de push no deben romper la request que los origina: se loguean y se poda la suscripción si corresponde.

## 9. Validación

- Zod por módulo, con `.strict()` en escrituras para rechazar campos desconocidos.
- `validateX()` devuelve `{ hasError, errorMessages, data }` y el controller responde 422 con los mensajes unidos.
- Normalización: email a minúsculas, trim en textos, Riot ID normalizado, username único y no reservado.
- El username solo se cambia con una solicitud in-app aprobada por un admin.
- Los enums viven en `packages/shared` y se reutilizan en API y web.
- No se confía en datos del cliente para IDs de autor, target, owner ni admin: siempre salen de la sesión o se validan por ownership.

## 10. Auth y seguridad

- bcrypt con 12 rounds.
- JWT de 1 día, sin refresh token. Payload mínimo: `{ id, role }`.
- `protect` valida token, usuario existente, no borrado, suspensión vigente y `changedPasswordAt`.
- `restrictTo('admin')` para endpoints de administración.
- `requireVerifiedEmail` para toda interacción social: match, likes, disponibilidad, invitaciones, postulaciones, feedback, reportes y bloqueos.
- `requireCompleteProfile` para match, disponibilidad, postulaciones e invitaciones.
- Ownership obligatorio en matches, invitaciones, postulaciones y feedback.
- Reset de contraseña: token random, hash SHA-256 en DB, vence en 1 hora, un solo uso, respuesta genérica en `forgot-password`.
- Verificación de email: token random, hash SHA-256 en DB, vence en 24 horas y resend lo regenera.
- hCaptcha en registro; se salta en test y en desarrollo sin secret.
- Contraseñas de 10 a 128 caracteres.
- Rate limits por IP, por credencial de login y por usuario autenticado (ver `docs/ARCHITECTURE.md`).
- Nunca loguear tokens, tickets SSE, contraseñas ni emails completos.
- No se guardan Riot IDs históricos. Solo el actual.
- El Riot ID y el Discord se revelan únicamente después de una conexión.
- No usar `dangerouslySetInnerHTML` con contenido de usuario.

## 11. Base de datos y migraciones

- Sequelize con `underscored: true`, `timestamps: true`, pool y retry definidos en `config/database/database.js`.
- En `NODE_ENV=test` se usa `TEST_DB_URI`; nunca la base de desarrollo.
- Umzug con migraciones SQL crudas y numeradas.
- PK `${tabla}_id` con `gen_random_uuid()`. Excepción: `errors` y `metrics_events` usan `BIGSERIAL`.
- Todas las tablas de entidades tienen `created_at` y `updated_at`, salvo tablas inmutables (`feedbacks`, `metrics_events`, `errors`).
- Transacciones con `SELECT ... FOR UPDATE` en like mutuo, aceptar invitación y aceptar postulación.
- Índices únicos y parciales para evitar carreras: una disponibilidad activa por usuario, una invitación pendiente por par, una postulación por post/usuario, un feedback por conexión/autor.
- `rank_index` se persiste y se indexa para filtrar por rango.
- Arrays PostgreSQL (`TEXT[]`) para roles, idiomas, horarios y tags; `JSONB` para payloads y metadata.
- Los seeds deben ser idempotentes.
- No se editan migraciones ya aplicadas en producción; se agrega una nueva.

## 12. Convenciones de API

- Prefijo `/api/v1`.
- Respuesta exitosa: `{ "status": "success", ... }`.
- Respuesta de error: `{ "status": "fail" | "error", "message": "..." }`.
- Listados con `limit` (máximo 50) y sin paginación por cursor en el MVP.
- IDs siempre UUID.
- Fechas en ISO 8601 UTC.
- Nada de datos sensibles en respuestas públicas.
- Endpoints idempotentes donde el negocio lo permite (like repetido devuelve 200).
- Los conflictos de estado devuelven 409 con mensaje claro.
- El contrato completo está en `docs/API.md`.

## 13. Realtime y push

- SSE con ticket efímero en memoria (60 segundos), no JWT en query.
- Máximo 5 conexiones SSE por usuario y 1.000 globales.
- Heartbeat cada 25 segundos. Headers: `text/event-stream`, `no-cache`, `no-transform`, `X-Accel-Buffering: no`.
- No se usa compresión en la ruta SSE.
- Se persiste la notificación antes de emitir el evento y antes de enviar push.
- Si el cliente estaba desconectado, recupera por API.
- Fallback a polling cada 20 segundos si EventSource falla dos veces.
- SSE y rate limit en memoria implican una sola instancia de API. Si se escala, se agrega Redis pub/sub y store compartido; no se hace ahora.
- Push con VAPID, permiso pedido solo con gesto explícito, poda de suscripciones 404/410 y payload menor a 4 KB.
- El service worker solo gestiona push y click; no cachea la app en el MVP.

## 14. Frontend: reglas críticas

Heredadas del incidente real de Market Design:

1. Ningún componente global montado en `App.jsx` puede llamar endpoints autenticados sin token. Todo hook que haga fetch debe chequear `localStorage.getItem('token')` y no llamar a la API si no hay sesión.
2. Hooks no condicionales: si un componente tiene early return por falta de usuario, los hooks de fetch van en un componente interno que solo se monta con sesión.
3. Interceptor 401 en `apps/web/src/config/api.js`: limpiar token y redirigir a `/login` solo si no se está ya en `/login`. Nunca redirigir en bucle.
4. Los endpoints de auth (`/auth/login`, `/auth/register`, `/auth/verify-email`, `/auth/forgot-password`, `/auth/reset-password`) no disparan redirect.
5. Los endpoints protegidos devuelven 401 sin token; nunca 200 vacío ni redirect del servidor.
6. Toda request protegida debe asumir 401 y manejarlo sin depender de que el usuario esté logueado.
7. `ProtectedRoute` para rutas privadas; `restrictTo` en backend para admin. Los admins usan `AdminShell` y son redirigidos a `/admin` desde rutas de jugador.
8. `ErrorBoundary` global para evitar pantallas blancas.
9. Fechas y countdowns con `Intl` y zona ART.
10. Optimistic UI en likes e invitaciones, con rollback en error.

## 15. Tests

- Vitest + Supertest. Comando raíz: `npm test`.
- `NODE_ENV=test`, `fileParallelism: false`, timeout 15 segundos.
- La base de test es `duo_lol_test`; los tests fallan si no está disponible.
- Migraciones en `beforeAll`.
- Fixtures con sufijo único para evitar colisiones.
- Unitarios para lógica pura: rango, roles, horarios, scores, reputación, Riot ID.
- Integración para endpoints y reglas de negocio.
- Sin tests E2E automatizados en el MVP; el smoke manual es obligatorio.
- El plan completo está en `docs/TESTING.md`.

## 16. Git y commits

- Rama de desarrollo: `dev`. Todo el trabajo se integra ahí y es la rama default del repositorio.
- `main` es producción. Solo recibe releases aprobados y testeados desde `dev`.
- Husky + lint-staged en pre-commit (Prettier + ESLint).
- commitlint en commit-msg.
- Formato: `type(scope): descripción`.
- Tipos: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`.
- Ejemplos: `feat(matching): agregar score de afinidad`, `docs(spec): cerrar reglas de Busco 1`.
- No se commitean secretos, `.env`, logs ni `node_modules`.
- No se hace commit sin que lint y tests pasen.

## 17. Prohibiciones explícitas

- No TypeScript.
- No Prisma.
- No Redis en el MVP.
- No chat interno.
- No coaching, pagos ni Mercado Pago.
- No Riot API ni RSO en el MVP.
- No uploads de imágenes ni avatares.
- No mostrar Riot ID o Discord antes de una conexión.
- No guardar Riot IDs históricos.
- No exponer emails en perfiles públicos.
- No desactivar validaciones ni saltar Zod con escapes.
- No hardcodear IDs de usuarios, admins ni owners.
- No borrar datos físicamente salvo entidades efímeras permitidas.
- No cambiar reglas de producto sin actualizar `docs/SPEC.md` y `docs/DECISIONS.md`.

## 18. Definition of Done

Una tarea se considera terminada cuando:

- El código cumple las reglas de este archivo.
- La documentación afectada está actualizada.
- `npm run lint` pasa.
- `npm test` pasa.
- Si toca auth, interceptores o componentes globales, se completó el smoke manual.
- Si toca DB, la migración sube y baja correctamente.
- Si toca UI, funciona en mobile y desktop.
- No se agregaron secretos ni datos personales.
- `TASK.md` refleja el estado real.

## 19. Comandos previstos

```bash
npm run docker:up        # PostgreSQL en localhost:5433
npm run docker:down
npm run docker:app       # PostgreSQL + API + web en Docker
npm run dev              # API en http://localhost:3000
npm run dev:web          # Web en http://localhost:5173
npm test                 # Vitest + Supertest
npm run lint
npm run format
npm run seed             # datos de desarrollo
npm run seed:admin       # admin desde variables de entorno
```

## 20. Mantenimiento de la documentación

- `TASK.md` es el tablero vivo: se actualiza al empezar y terminar cada tarea.
- `docs/DECISIONS.md` es el registro de decisiones; toda decisión nueva se agrega como ADR.
- `docs/SPEC.md` describe el producto; no se implementa nada que lo contradiga.
- `docs/API.md` es el contrato; si cambia un endpoint, se actualiza antes o junto con el código.
- `docs/ROUTES.md` concentra rutas web/API y flujos de prueba.
- `docs/DATA-MODEL.md` es la fuente del esquema; las migraciones deben reflejarlo.
- `docs/MATCHING.md` concentra fórmulas y pesos.
- `docs/METRICS.md` concentra eventos, definiciones de KPIs y consultas SQL.
- `docs/TESTING.md` concentra el plan y el smoke manual.
- `docs/PRODUCTION.md` concentra las envs, claves y checklist de deploy.
- `docs/UI.md` concentra rutas, pantallas y componentes.
