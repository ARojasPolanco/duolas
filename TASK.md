# TASK.md — Duo LAS

Tablero vivo del proyecto. Se actualiza al empezar y al terminar cada tarea. Si algo no está acá, no está planificado.

## Estado actual

- **Fase:** MVP completo, ARAM y Perú implementados. Release aprobado para `main`.
- **Código:** monorepo con auth, perfiles, matching, disponibilidad, invitaciones, Busco 1, ARAM, confianza, SSE, push, PWA, métricas, rate limits, conexiones, bloqueos y notificaciones persistidas.
- **Demo:** `npm run seed` crea 12 jugadores demo, una cuenta admin, un match activo, likes pendientes, disponibilidad, invitación, Busco 1, feedback pendiente y un reporte abierto.
- **Dev:** `npm run docker:app` levanta PostgreSQL, API y web en contenedores persistentes.
- **Git:** `dev` es la rama de desarrollo; `main` es producción y recibe releases aprobados.
- **Decisiones abiertas:** ninguna. Ver `docs/DECISIONS.md`.
- **Riesgo principal:** arranque en frío. Se mitiga con lanzamiento solo en LAS y siembra por tandas.
- **Última actualización:** 2026-10-29.

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
- [x] Crear `docs/ROUTES.md`.
- [x] Crear `docs/MATCHING.md`.
- [x] Crear `docs/METRICS.md`.
- [x] Crear `docs/TESTING.md`.
- [x] Crear `docs/PRODUCTION.md`.
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

- [x] Modelo `User` con edad, términos, suspensión y actividad.
- [x] Modelo `PlayerProfile` con `rank_index`, Riot ID normalizado y Discord.
- [x] Migración `002_auth_hardening`.
- [x] Migración `003_player_profiles`.
- [x] Registro con hCaptcha opcional y validación +18.
- [x] Login, logout del cliente, cambio de contraseña.
- [x] Verificación de email (24 h) y resend.
- [x] Forgot/reset password (SHA-256, 1 h, un uso).
- [x] `protect`, `requireVerifiedEmail`, `requireCompleteProfile`, `restrictTo`.
- [x] CRUD de perfil propio y perfil público.
- [x] Cálculo de completitud y `profile_completed_at`.
- [x] Validaciones Zod de Riot ID, roles, rango, horarios, idiomas y estilo.
- [x] Páginas login, register, verify, forgot, reset y onboarding.
- [x] Tests de auth y perfil.

**DoD técnico cumplido:** 48 tests pasando (auth, perfiles y health), lint y build verdes, flujo API de registro/login/perfil verificado contra PostgreSQL y rutas web respondiendo 200. El smoke visual interactivo en navegador queda pendiente para la revisión manual antes del release.

## Fase 2 — Match de duo

**Objetivo:** candidatos por afinidad, likes y conexión con contacto revelado.

- [x] `config/matching.js` con tolerancias y pesos.
- [x] Funciones puras de rango, roles, horarios y score.
- [x] Migraciones `004_matching`, `005_notifications` y `006_fix_rank_division_length`.
- [x] Modelo `Notification` y endpoints básicos del centro de notificaciones.
- [x] Modelo `Block` y endpoints de bloquear/desbloquear.
- [x] Endpoint de candidatos con filtros duros y orden por score.
- [x] Like, retiro e idempotencia.
- [x] Like mutuo transaccional y creación de conexión.
- [x] Notificación al crear un match.
- [x] Listado y detalle de matches con contacto.
- [x] Archivar y reactivar conexión.
- [x] Bloqueo básico excluyente de candidatos.
- [x] Pantallas Match y Matches.
- [x] Home interactivo con carrusel, perfil propio, jugadores compatibles y matches.
- [x] Docker de desarrollo para API y web.
- [x] Toggle de contraseña y enlace de recuperación en el login.
- [x] Tests unitarios de matching y de integración de likes.

**DoD técnico cumplido:** 74 tests pasando, lint y build verdes, migración 006 down/up verificado y flujo API de candidatos, like mutuo, contacto, archivo, bloqueo y notificaciones verificado. El smoke visual interactivo en navegador queda pendiente para la revisión manual antes del release.

## Fase 3 — Disponible ya y Busco 1

**Objetivo:** disponibilidad inmediata, invitaciones y publicaciones de grupo.

- [x] Modelo y servicio de `AvailabilitySession` con TTL 30/60.
- [x] Migraciones `007_availability_invites` y `008_duo_posts_applications`.
- [x] Una sola sesión activa por usuario y cierre por expiración/manual/match.
- [x] Cierre perezoso de disponibilidades vencidas.
- [x] Listado de disponibles con `nowScore`.
- [x] Invitaciones con TTL 10 min, aceptar/rechazar/cancelar.
- [x] Aceptar invitación crea conexión y cierra disponibilidades.
- [x] Modelos `DuoPost` y `PostApplication`.
- [x] Crear, listar, cancelar y postular.
- [x] Notificar a disponibles compatibles al publicar.
- [x] Notificaciones de invitación y postulación.
- [x] Aceptar postulación crea conexión y cierra el post.
- [x] Pantallas Disponible, Invitaciones y Busco 1.
- [x] Tests de TTL, invitaciones y postulaciones.

**DoD técnico cumplido:** 84 tests pasando, lint y build verdes, migraciones 007/008 aplicadas y flujo API de disponibilidad, invitación, aceptación, publicación, postulación y cierre transaccional verificado contra PostgreSQL. El smoke visual interactivo en navegador queda pendiente para la revisión manual antes del release.

## Fase 4 — Confianza y moderación

**Objetivo:** feedback, reputación, reportes, bloqueos y sanciones.

- [x] Modelo `Feedback` con `visible_at` y unique por conexión/autor.
- [x] Migración `009_trust_safety`.
- [x] Feedback doble ciego y revelado a los 7 días o cuando ambos envían.
- [x] Job de revelado vencido cada 5 minutos.
- [x] Cálculo y cache de reputación (Laplace).
- [x] Modelo `Report` y auto-bloqueo usando `Block`.
- [x] Endpoints de reportes y feedback.
- [x] Sanción: advertencia, suspensión 7/30 días y permanente.
- [x] Email de suspensión y notificación de advertencia.
- [x] Notificación de feedback revelado.
- [x] Admin API y UI mínima de reportes/sanciones.
- [x] Pantallas de feedback, reputación, reporte y bloqueo.
- [x] Tests de doble ciego, reputación y autorización admin.

**DoD técnico cumplido:** 91 tests pasando, lint y build verdes, migración 009 aplicada y flujo API de feedback, revelado, reputación, reporte, auto-bloqueo, advertencia y suspensión verificado contra PostgreSQL. El smoke visual interactivo en navegador queda pendiente para la revisión manual antes del release.

## Fase 5 — Realtime y push

**Objetivo:** notificaciones en vivo y push con la app cerrada.

- [x] Modelo `PushSubscription` y endpoints.
- [x] Migración `010_push_subscriptions`.
- [x] Ticket SSE de 60 s y stream con heartbeat.
- [x] Bus de eventos interno y máximo de conexiones.
- [x] Limpieza periódica de tickets vencidos.
- [x] Integrar SSE con las notificaciones ya persistidas.
- [x] Persistir notificación antes de emitir y pushear.
- [x] Fallback de polling a 20 s.
- [x] web-push con VAPID y poda 404/410.
- [x] `manifest.json`, `sw.js`, iconos e instalación PWA.
- [x] Hook `useSSE`, `useNotifications`, `usePush`.
- [x] Tests de ownership y suscripción; smoke manual de SSE y push.

**DoD técnico cumplido:** 100 tests pasando, lint y build verdes, migración 010 down/up verificada, SSE en vivo probado con curl y suscripciones push probadas contra PostgreSQL. El push real con navegador/PWA y el smoke visual completo quedan pendientes para la revisión manual antes del release.

## Fase 6 — Métricas, hardening y cierre

**Objetivo:** medir los KPIs, endurecer abuso y dejar documentación final.

- [x] Modelo `MetricsEvent` y registro en los flujos.
- [x] Migración `011_metrics_events`.
- [x] Resumen admin de los 4 KPIs.
- [x] Rate limits por usuario en likes, invitaciones, posts, postulaciones, reportes y tickets.
- [x] Seeds idempotentes: 12 jugadores LAS + admin.
- [x] `seed:admin` desde envs.
- [x] Páginas de términos, privacidad y aviso de Riot.
- [x] README final con comandos y deploy.
- [x] Actualizar docs y `TASK.md`.
- [ ] Smoke completo desktop/mobile.

**DoD técnico cumplido:** 103 tests pasando, lint y build verdes, migración 011 down/up verificada, KPIs disponibles en API/admin, rate limits activos y seed con 12 jugadores idempotente. Queda el smoke completo desktop/mobile y la pasada visual final antes del release.

## Mejoras visuales post-F6

- [x] Batch 1: `AppShell` responsive, bottom nav mobile, menú de cuenta, campana, logout y headers unificados.
- [x] Batch 2: overflow de Disponible corregido, touch targets de 44 px y filtros mobile sin desbordes.
- [x] Batch 3: cards de candidatos simplificadas, grilla desktop de 3 columnas y tipografía/espaciado unificados.
- [x] Batch 4: admin, métricas y legales pulidos; QA visual 360/390/768/1440 sin overflow.
- [x] Selector de horarios rediseñado con tarjetas por día y atajos.
- [x] Set SVG original de 10 rangos integrado en Home, cards, matches y onboarding.
- [x] País de residencia LAS y equivalencia local de horarios en onboarding y cards.
- [x] Aclaración de que el nombre de usuario no es el Riot ID en registro, onboarding y cards.
- [x] Badge `Beta` en landing, auth, onboarding, app, admin, emails y PWA.
- [x] Onboarding separa contacto y resumen; Discord visible y guardado final protegido contra doble submit.
- [x] `/perfil` permite editar todos los campos directamente sin repetir el onboarding.
- [x] Admin muestra likes enviados/pendientes, matches totales/24 h y actividad reciente.
- [x] Match muestra badge con candidatos disponibles y se refresca al likear/bloquear/editar perfil.
- [x] Guía pública `/como-funciona` con Match, Flex, Disponible ya, Busco 1 y push.
  - Migración 013 con `country` opcional y check de países LAS; migración 015 agrega Perú.
  - Selector en onboarding, badge de país/diferencia horaria en cards, matches, invitaciones, Disponible y Busco 1.
  - 109 tests pasando, lint y build verdes, migración 013 down/up verificada y seed actualizado.

## ARAM

- [x] Migración 014 con publicaciones y postulaciones ARAM.
- [x] Backend para grupo, disponibilidad individual, postulaciones y aceptación.
- [x] Conexiones ARAM visibles en Matches y notificaciones/push.
- [x] Frontend `/aram` con pestañas Busco grupo y Disponible ahora.
- [x] 112 tests pasando y build verde.
- [x] Smoke visual y prueba manual en dev.
- [x] Perú agregado a LAS con zona `America/Lima` y migración 015.

## Hardening previo a producción

- [x] Rate limit global 600/15 min por IP y 600/15 min por usuario autenticado.
- [x] Login limitado por credencial (10 fallos/15 min) y recuperación por email+IP (5/15 min).
- [x] Hash dummy en login para evitar enumeración por timing.
- [x] Tokens de verificación y reset hasheados en DB.
- [x] Contraseñas de 10 a 128 caracteres.
- [x] CORS de producción exige HTTPS y rechaza wildcard.
- [x] `TRUST_PROXY` configurable.
- [x] CSP, HSTS, Referrer-Policy, X-Frame-Options, Permissions-Policy y CORP en Vercel.
- [x] Access log deja los requests normales en `debug`; solo alerta fallos o requests lentos.
- [x] Dominio final `duolas.online` en Vercel, Hostinger, Render y textos públicos.
- [x] Zod actualizado a 4.6.7; audit sin vulnerabilidades high.
- [ ] Revisar las 2 moderadas restantes de `uuid` al migrar a Sequelize 7.

## Panel admin separado

- [x] `AdminShell` con Resumen, Usuarios, Reportes y Métricas.
- [x] `GET /admin/overview` con conteos operativos.
- [x] `GET /admin/users` con búsqueda, filtros y paginación.
- [x] `GET /admin/users/:id` con cuenta, perfil, reportes, sanciones y disponibilidad.
- [x] `/admin`, `/admin/usuarios` y `/admin/usuarios/:id`.
- [x] Admin redirigido fuera de las rutas de jugador; no requiere perfil.
- [x] Tests de permisos, listado y detalle admin.

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

## Release público y Riot

- [x] Términos y privacidad completos.
- [x] Aviso de Riot y boilerplate legal exacto en web/README.
- [x] Guía de producción key, costos, revisión y checklist en `docs/RIOT-INTEGRATION.md`.
- [x] Variables Riot preparadas en envs y Docker para uso futuro.
- [ ] Registrar el producto en el Developer Portal de Riot.
- [~] Dominio definido (`duolas.online`); revisar titular legal.
- [x] Deploy público de web, API y PostgreSQL.
- [x] Verificar URLs legales, CORS, emails, captcha y PWA en producción.
- [x] Correr smoke público desktop/mobile.
- [ ] Solicitar production key y probar integración en desarrollo.
- [ ] Evaluar RSO solo si se va a verificar titularidad de cuenta.

## Pre-producción

Checklist completo en `docs/PRODUCTION.md`. Plantillas: `apps/api/.env.production.example` y `apps/web/.env.production.example`.

- [ ] `HCAPTCHA_SECRET`
- [ ] `RESEND_API_KEY`
- [ ] `OWNER_EMAIL`
- [ ] `VAPID_PUBLIC_KEY`
- [ ] `VAPID_PRIVATE_KEY`
- [ ] `ADMIN_EMAIL` (solo seed)
- [ ] `ADMIN_PASSWORD` (solo seed)
- [ ] `VITE_API_URL` (incluye `/api`)
- [ ] `VITE_HCAPTCHA_SITE_KEY`
- [ ] Reemplazar `DB_URI` por Neon con SSL
- [ ] Reemplazar `CORS_ORIGIN` y `APP_URL` por los dominios reales
- [ ] Generar un `SECRET_JWT_SEED` nuevo
- [ ] Confirmar `NODE_ENV=production`
- [ ] No configurar `TEST_DB_URI` en producción
- [ ] Quitar `ADMIN_PASSWORD` después del seed

## Próxima acción

1. Registrar el producto en el Developer Portal y solicitar la production key.
2. Revisar el titular legal del dominio y completar los datos legales si faltan.
3. Monitorear errores, métricas y feedback de ARAM/Perú en producción.
4. Mantener el lanzamiento sin Riot API y con rango declarado.
