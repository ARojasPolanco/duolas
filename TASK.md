# TASK.md — Duo LAS

Tablero vivo del proyecto. Se actualiza al empezar y al terminar cada tarea. Si algo no está acá, no está planificado.

## Estado actual

- **Fase:** Fase 0 (scaffold) completada. Siguiente: Fase 1 (cuenta y perfil).
- **Código:** monorepo base con API, web y migración inicial.
- **Git:** `dev` es la rama principal y default en `origin`; `main` se reserva para el release final.
- **Decisiones abiertas:** ninguna. Ver `docs/DECISIONS.md`.
- **Riesgo principal:** arranque en frío. Se mitiga con lanzamiento solo en LAS y siembra por tandas.
- **Última actualización:** 2026-10-25.

## Leyenda

- `[ ]` pendiente
- `[x]` terminado
- `[~]` en curso
- `[!]` bloqueado

## Documentación inicial

- [x] Relevar la propuesta original en PDF.
- [x] Relevar el stack y las convenciones reales de Market Design.
- [x] Cerrar alcance del MVP (match y duo; coaching fuera).
- [x] Cerrar decisiones de producto y técnicas.
- [x] Crear `README.md`.
- [x] Crear `AGENTS.md`.
- [x] Crear `docs/SPEC.md`.
- [x] Crear `docs/ARCHITECTURE.md`.
- [x] Crear `docs/DATA-MODEL.md`.
- [x] Crear `docs/API.md`.
- [x] Crear `docs/MATCHING.md`.
- [x] Crear `docs/METRICS.md`.
- [x] Crear `docs/TESTING.md`.
- [x] Crear `docs/DECISIONS.md`.
- [x] Crear `docs/UI.md`.

## Fase 0 — Scaffold

**Objetivo:** monorepo que levanta API y web, con configuración, errores base y tests vacíos.

- [x] `package.json` raíz con workspaces y scripts.
- [x] `.nvmrc`, `.prettierrc.json`, `eslint.config.js`, `commitlint.config.js`.
- [x] Husky + lint-staged.
- [x] `.gitignore` y `.dockerignore`.
- [x] `docker-compose.yml` con PostgreSQL 16 en `localhost:5433`.
- [x] `docker/initdb/01-create-test-db.sql` con `duo_lol_test`.
- [x] `apps/api`: package.json, envs Zod, logger, database, migrator.
- [x] `apps/api/src/errors/*` completo.
- [x] `apps/api/src/modules/logs/*` y tabla `errors` completa.
- [x] `apps/api/src/app.js`, `index.js`, `routes/routes.js`, `/health`.
- [x] Request id, access log mínimo y cierre ordenado.
- [x] Migración `001_initial` (users + errors).
- [x] `apps/api/vitest.config.js` y test base de health.
- [x] `packages/shared` con package.json, constantes y schemas base.
- [x] `apps/web`: package.json, Vite, Tailwind 4, `index.css`, `main.jsx`, `App.jsx` base.
- [x] `apps/web/src/config/api.js` con interceptor 401 sin loops.
- [x] `AuthContext`, `ToastContext`, `ProtectedRoute`, `ErrorBoundary`.
- [x] `.env.example` de API y web.

**DoD cumplido:** `npm run docker:up` levanta Postgres, `npm run dev` responde `/health`, `npm run dev:web` carga la app, `npm run lint` y `npm test` pasan. También se verificó `npm run build` y el ciclo down/up de la migración.

## Fase 1 — Cuenta y perfil

**Objetivo:** registro +18, verificación de email y onboarding completo.

- [ ] Modelo `User` con edad, términos, suspensión y actividad.
- [ ] Modelo `PlayerProfile` con `rank_index`, Riot ID normalizado y Discord.
- [ ] Migración `002_player_profiles`.
- [ ] Registro con hCaptcha opcional y validación +18.
- [ ] Login, logout del cliente, cambio de contraseña.
- [ ] Verificación de email (24 h) y resend.
- [ ] Forgot/reset password (SHA-256, 1 h, un uso).
- [ ] `protect`, `requireVerifiedEmail`, `requireCompleteProfile`, `restrictTo`.
- [ ] CRUD de perfil propio y perfil público.
- [ ] Cálculo de completitud y `profile_completed_at`.
- [ ] Validaciones Zod de Riot ID, roles, rango, horarios, idiomas y estilo.
- [ ] Páginas login, register, verify, forgot, reset y onboarding.
- [ ] Tests de auth y perfil.

**DoD:** no se puede registrar sin +18; no se matchea sin email verificado y perfil completo; el perfil público no filtra email, Riot ID ni Discord.

## Fase 2 — Match de duo

**Objetivo:** candidatos por afinidad, likes y conexión con contacto revelado.

- [ ] `config/matching.js` con tolerancias y pesos.
- [ ] Funciones puras de rango, roles, horarios y score.
- [ ] Migraciones `003_matching` y `004_notifications`.
- [ ] Modelo `Notification` y endpoints básicos del centro de notificaciones.
- [ ] Modelo `Block` y endpoints de bloquear/desbloquear.
- [ ] Endpoint de candidatos con filtros duros y orden por score.
- [ ] Like, retiro e idempotencia.
- [ ] Like mutuo transaccional y creación de conexión.
- [ ] Notificación al crear un match.
- [ ] Listado y detalle de matches con contacto.
- [ ] Archivar y reactivar conexión.
- [ ] Bloqueo básico excluyente de candidatos.
- [ ] Pantallas Match y Matches.
- [ ] Tests unitarios de matching y de integración de likes.

**DoD:** los filtros duros se respetan; el like mutuo es idempotente; el contacto solo se ve entre los dos; un bloqueo corta el match.

## Fase 3 — Disponible ya y Busco 1

**Objetivo:** disponibilidad inmediata, invitaciones y publicaciones de grupo.

- [ ] Modelo y servicio de `AvailabilitySession` con TTL 30/60.
- [ ] Migraciones `005_availability_invites` y `006_duo_posts_applications`.
- [ ] Una sola sesión activa por usuario y cierre por expiración/manual/match.
- [ ] Cierre perezoso de disponibilidades vencidas.
- [ ] Listado de disponibles con `nowScore`.
- [ ] Invitaciones con TTL 10 min, aceptar/rechazar/cancelar.
- [ ] Aceptar invitación crea conexión y cierra disponibilidades.
- [ ] Modelos `DuoPost` y `PostApplication`.
- [ ] Crear, listar, cancelar y postular.
- [ ] Notificar a disponibles compatibles al publicar.
- [ ] Notificaciones de invitación y postulación.
- [ ] Aceptar postulación crea conexión y cierra el post.
- [ ] Pantallas Disponible, Invitaciones y Busco 1.
- [ ] Tests de TTL, invitaciones y postulaciones.

**DoD:** la disponibilidad expira sola; no hay dos sesiones activas; aceptar invitación o postulación crea conexión y revela contacto; el post se cierra al llenarse.

## Fase 4 — Confianza y moderación

**Objetivo:** feedback, reputación, reportes, bloqueos y sanciones.

- [ ] Modelo `Feedback` con `visible_at` y unique por conexión/autor.
- [ ] Migración `007_trust_safety`.
- [ ] Feedback doble ciego y revelado a los 7 días o cuando ambos envían.
- [ ] Job de revelado vencido cada 5 minutos.
- [ ] Cálculo y cache de reputación (Laplace).
- [ ] Modelo `Report` y auto-bloqueo usando `Block`.
- [ ] Endpoints de reportes y feedback.
- [ ] Sanción: advertencia, suspensión 7/30 días y permanente.
- [ ] Email de suspensión y notificación de advertencia.
- [ ] Notificación de feedback revelado.
- [ ] Admin API y UI mínima de reportes/sanciones.
- [ ] Pantallas de feedback, reputación, reporte y bloqueo.
- [ ] Tests de doble ciego, reputación y autorización admin.

**DoD:** el feedback no se ve antes de tiempo; el reporte bloquea; la suspensión se aplica en `protect`; el admin opera sin SQL.

## Fase 5 — Realtime y push

**Objetivo:** notificaciones en vivo y push con la app cerrada.

- [ ] Modelo `PushSubscription` y endpoints.
- [ ] Migración `008_push_subscriptions`.
- [ ] Ticket SSE de 60 s y stream con heartbeat.
- [ ] Bus de eventos interno y máximo de conexiones.
- [ ] Limpieza periódica de tickets vencidos.
- [ ] Integrar SSE con las notificaciones ya persistidas.
- [ ] Persistir notificación antes de emitir y pushear.
- [ ] Fallback de polling a 20 s.
- [ ] web-push con VAPID y poda 404/410.
- [ ] `manifest.json`, `sw.js`, iconos e instalación PWA.
- [ ] Hook `useSSE`, `useNotifications`, `usePush`.
- [ ] Tests de ownership y suscripción; smoke manual de SSE y push.

**DoD:** el evento llega en vivo; si el cliente estaba offline lo recupera por API; el push llega con la pestaña cerrada; si SSE falla, cae a polling sin loops.

## Fase 6 — Métricas, hardening y cierre

**Objetivo:** medir los KPIs, endurecer abuso y dejar documentación final.

- [ ] Modelo `MetricsEvent` y registro en los flujos.
- [ ] Migración `009_metrics_events`.
- [ ] Resumen admin de los 4 KPIs.
- [ ] Rate limits por usuario en likes, invitaciones, posts, postulaciones, reportes y tickets.
- [ ] Seeds idempotentes: 12 jugadores LAS + admin.
- [ ] `seed:admin` desde envs.
- [ ] Páginas de términos, privacidad y aviso de Riot.
- [ ] README final con comandos y deploy.
- [ ] Actualizar docs y `TASK.md`.
- [ ] Smoke completo desktop/mobile.

**DoD:** los 4 KPIs se consultan; los límites funcionan; los seeds corren dos veces sin duplicar; lint y tests verdes; checklist manual completo.

## Decisiones cerradas

Todas en `docs/DECISIONS.md`. Resumen:

- Nombre Duo LAS; solo LAS; +18; sin coaching ni pagos.
- JavaScript + Express + Sequelize + PostgreSQL, espejo de Market Design.
- Sin Redis: TTL en PostgreSQL y SSE en memoria.
- SSE + polling + web push en el MVP.
- Likes y feedback doble ciego.
- Rango ±1 tier en Solo/Dúo y ±2 en Flex.
- Horarios en 4 bloques, hora Argentina.
- Avatares con iniciales, sin uploads.
- Reportar auto-bloquea.
- Admin mínimo con UI.
- Unranked excluido.
- Busco 1 en ambas colas, sin roster de grupo en el MVP.
- JWT de 1 día sin refresh.

## Limitaciones conocidas

- Arranque en frío: no se resuelve con código.
- SSE y rate limit en memoria: una sola instancia.
- Push en iOS requiere PWA instalada.
- Rango declarado hasta que exista verificación con Riot.
- Sin roster de grupo en Busco 1: el post representa al grupo.
- Sin chat interno: el contacto es Riot ID + Discord tras la conexión.
- `npm audit` reporta una vulnerabilidad alta en Zod 3 (DoS con colecciones gigantes) y una moderada en `uuid` 8 vía Sequelize. El body limit de 100 KB mitiga; no se aplicó `audit fix --force` porque rompería Zod y degradaría Sequelize. Revisar al actualizar majors.

## Próxima acción

1. Iniciar Fase 1 (cuenta y perfil).
2. Implementar auth, verificación de email y onboarding.
3. Actualizar `TASK.md` al cerrar cada tarea.
