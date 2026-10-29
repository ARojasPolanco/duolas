# DECISIONS — Duo LAS

Registro de decisiones de producto y técnica. Cada decisión nueva se agrega como ADR. No se cambia una decisión sin dejar la anterior marcada como reemplazada.

## ADR-001 — Alcance centrado en match y duo

**Contexto:** la propuesta original incluye coaching y pagos en fase 2.

**Decisión:** este repositorio implementa solo match y duo: perfil, afinidad, Disponible ya, Busco 1, invitaciones, notificaciones, reputación, reportes y bloqueos.

**Consecuencias:** no se crean tablas, endpoints ni pantallas de coaching, pagos, Mercado Pago, chat, equipos u otros juegos.

## ADR-002 — Nombre Duo LAS

**Contexto:** el producto necesita nombre para manifest, emails, copy y dominio.

**Decisión:** el nombre es **Duo LAS**.

**Consecuencias:** se usa en README, manifest, service worker, emails y UI. El repositorio sigue siendo `duo-lol-fullstack`.

## ADR-003 — Stack espejo de Market Design

**Contexto:** se busca reutilizar convenciones, patrones y experiencia del proyecto Market Design.

**Decisión:** JavaScript puro con ESM, npm workspaces, Express 4, Sequelize 6, PostgreSQL 16, Zod, JWT, React 19, Vite 6, Tailwind 4, Vitest y Supertest.

**Consecuencias:** no se usa TypeScript. Las convenciones reales del código de Market Design prevalecen sobre su AGENTS.md desactualizado.

## ADR-004 — Sequelize y Umzug, no Prisma

**Contexto:** Prisma se había considerado, pero Market Design usa Sequelize con migraciones SQL crudas.

**Decisión:** Sequelize 6 + Umzug con migraciones SQL numeradas.

**Consecuencias:** los modelos usan `underscored`, PK `${tabla}_id`, y las migraciones se escriben a mano.

## ADR-005 — Sin Redis

**Contexto:** la propuesta sugiere Redis para disponibilidad en tiempo real, pero el MVP tiene una sola instancia y bajo volumen.

**Decisión:** la disponibilidad usa `expires_at` en PostgreSQL con limpieza perezosa. Los tickets SSE viven en memoria.

**Consecuencias:** una sola instancia de API. Si se escala, se agrega Redis pub/sub y store compartido.

## ADR-006 — SSE + polling + web push

**Contexto:** se necesita inmediatez para invitaciones y avisos, incluso con la app cerrada.

**Decisión:** SSE con ticket efímero, polling de respaldo cada 20 segundos y web push con VAPID.

**Consecuencias:** el proveedor de API debe mantener procesos y conexiones largas. El service worker solo gestiona push y click.

## ADR-007 — Auth con email y contraseña, JWT de 1 día sin refresh

**Contexto:** se quiere baja fricción y consistencia con Market Design.

**Decisión:** registro con email, contraseña y verificación; JWT de 1 día sin refresh token.

**Consecuencias:** el usuario debe volver a loguearse al día. No hay endpoint de refresh. La seguridad depende de HTTPS y de evitar XSS.

## ADR-008 — Rango declarado en el MVP

**Contexto:** la verificación con Riot depende de una key de producción y RSO, que pueden rechazarse o demorar.

**Decisión:** el rango es declarado por el usuario y se muestra como tal. El esquema queda preparado para verificación futura (`rank_source`, `rank_verified_at`).

**Consecuencias:** la confianza se apoya en reputación, feedback y reportes. No se llama a la API de Riot.

## ADR-009 — Tolerancia de rango ±1 tier y ±2 tiers

**Contexto:** el PDF exige rango compatible sin definirlo.

**Decisión:** Solo/Dúo permite distancia de hasta 4 índices (±1 tier). Flex permite hasta 8 (±2 tiers).

**Consecuencias:** menos candidatos en Solo/Dúo, partidas más parejas. Configurable en `config/matching.js`.

## ADR-010 — Horarios en 4 bloques y hora Argentina

**Contexto:** LAS abarca varios países y zonas horarias.

**Decisión:** 28 bloques semanales (7 días × 4 bloques) y todos se interpretan en `America/Argentina/Buenos_Aires`.

**Consecuencias:** simplicidad y consistencia. Jugadores de otras zonas deben adaptar su disponibilidad a ART. No hay horario de verano. La UI muestra la equivalencia local desde ADR-033.

## ADR-011 — Rol principal y secundario obligatorios

**Contexto:** el PDF pide roles complementarios.

**Decisión:** cada perfil declara principal y secundario, distintos. El match exige que exista un par de roles distintos.

**Consecuencias:** dos jugadores que solo juegan el mismo rol no matchean. Se reduce el volumen, se mejora la complementariedad.

## ADR-012 — Likes doble ciego

**Contexto:** mostrar quién te likeó aumenta conversión, pero incentiva likes masivos y presión social.

**Decisión:** no se revela quién te dio like hasta que el interés es mutuo.

**Consecuencias:** el usuario solo ve sus likes salientes y sus matches. No hay lista de "me gusta recibidos".

## ADR-013 — Feedback doble ciego por 7 días

**Contexto:** el feedback inmediato puede generar represalias.

**Decisión:** el feedback se revela cuando ambos lo envían o cuando vencen 7 días.

**Consecuencias:** la reputación tarda en actualizarse. Se implementa un job liviano cada 5 minutos más revelado perezoso en los endpoints de feedback.

## ADR-014 — Contacto solo tras conexión

**Contexto:** Riot exige no exponer Riot IDs históricos y el producto necesita proteger el contacto.

**Decisión:** el Riot ID y el Discord se revelan solo a los dos integrantes de una conexión. El perfil público no los muestra.

**Consecuencias:** no se puede contactar a alguien sin match o aceptación. Se guarda solo el Riot ID actual.

## ADR-015 — Sin chat interno

**Contexto:** Market Design tiene chat, pero sumarlo acá agranda la superficie de moderación.

**Decisión:** no hay chat. El contacto es Riot ID para copiar y Discord opcional.

**Consecuencias:** menos moderación y menos complejidad. La conversación sigue fuera de la plataforma.

## ADR-016 — Avatares con iniciales, sin uploads

**Contexto:** el PDF no exige fotos y los uploads agregan storage, moderación y costos.

**Decisión:** avatar generado con iniciales y color determinístico. Sin uploads de imágenes.

**Consecuencias:** no se usan R2, Sharp ni Cloudinary. Menos superficie de abuso.

## ADR-017 — Reportar bloquea automáticamente

**Contexto:** reportar sin bloquear deja expuesto al reportante.

**Decisión:** reportar crea un bloqueo inmediato. Se puede desbloquear.

**Consecuencias:** protección inmediata. Un reporte falso puede aislar temporalmente a alguien, pero es reversible y el admin lo revisa.

## ADR-018 — Admin mínimo con UI

**Contexto:** el equipo necesita moderar sin acceso a SQL.

**Decisión:** endpoints admin y una UI mínima de reportes, sanciones y KPIs.

**Consecuencias:** no hay panel completo de usuarios ni configuración. El admin se crea por seed desde envs.

## ADR-019 — Unranked excluido del MVP

**Contexto:** un jugador sin clasificar no tiene un rango comparable.

**Decisión:** el perfil exige tier y división. No se admite "sin clasificar".

**Consecuencias:** se pierden cuentas nuevas, pero el match mantiene sentido. Se puede sumar después con una cola separada.

## ADR-020 — Busco 1 en ambas colas y sin roster

**Contexto:** el PDF habla de grupos con un lugar libre sin detallar composición.

**Decisión:** el post aplica a Solo/Dúo y Flex, y representa al grupo. No se modela el roster.

**Consecuencias:** la conexión es entre el dueño del post y el postulante aceptado. El resto del grupo no tiene cuentas ni roles en el MVP.

## ADR-021 — Una sola instancia de API

**Contexto:** SSE y rate limit viven en memoria.

**Decisión:** el MVP se despliega en una sola instancia persistente.

**Consecuencias:** no hay escalado horizontal. Si se necesita, se agrega Redis pub/sub y un store compartido.

## ADR-022 — Soft delete y retención

**Contexto:** se quiere conservar historial y reputación.

**Decisión:** soft delete en usuarios, perfiles y bloques; estados terminales en disponibilidades, likes, conexiones, posts e invitaciones; feedbacks, reportes y métricas son inmutables.

**Consecuencias:** las consultas filtran `is_deleted` y estados. Los feedbacks y las métricas son inmutables; los reportes se resuelven sin borrarse. El email y username de una cuenta borrada quedan reservados.

## ADR-023 — Errores y validación estandarizados

**Contexto:** se necesita un contrato claro y no filtrar detalles técnicos.

**Decisión:** `AppError`, `catchAsync`, `globalErrorHandler`, matchers, tabla `errors` completa desde la 001, Zod `.strict()` y 422 para validación.

**Consecuencias:** todos los módulos siguen el mismo patrón. Los 4xx esperados no se persisten.

## ADR-024 — Sin tests E2E automatizados

**Contexto:** Market Design no tiene E2E y el equipo es chico.

**Decisión:** unitarios e integración con Vitest + Supertest, más smoke manual obligatorio.

**Consecuencias:** auth, SSE y push dependen de checklist manual antes de deployar.

## ADR-025 — Deploy API persistente, web en Vercel

**Contexto:** SSE necesita un proceso vivo; la web es estática.

**Decisión:** API en Render o Railway, web en Vercel, PostgreSQL en Neon.

**Consecuencias:** hay que configurar CORS, `trust proxy`, HTTPS y variables en ambos paneles. Vercel solo sirve la SPA.

## ADR-026 — Métricas como eventos de producto

**Contexto:** hay que medir los cuatro KPIs sin depender de una herramienta externa.

**Decisión:** tabla `metrics_events` y resumen admin con consultas SQL.

**Consecuencias:** se registran eventos en los flujos. No hay tracking de terceros en el MVP.

## ADR-027 — +18 y legales desde el día uno

**Contexto:** el producto es solo para mayores y Riot revisa el sitio al pedir la key.

**Decisión:** confirmación +18 al registrarse, términos, privacidad y aviso de no afiliación con Riot.

**Consecuencias:** se guardan timestamps de aceptación. No se implementa verificación de identidad.

## ADR-028 — `dev` como rama principal

**Contexto:** el proyecto se desarrolla por fases y `main` se reserva para el release final.

**Decisión:** todo el desarrollo vive en `dev`, que es la rama default del repositorio. `main` se crea y actualiza recién cuando el producto esté al 100%.

**Consecuencias:** los pushes diarios van a `dev`. `main` queda limpia para el release y no se toca durante el desarrollo.

## ADR-029 — Token de verificación en query, no en path

**Contexto:** el access log y la tabla de errores guardan el path de cada request. Un token en el path quedaría persistido.

**Decisión:** la verificación usa `GET /auth/verify-email?token=...`. El access log y el log de errores eliminan la query string.

**Consecuencias:** el token no aparece en logs ni en la tabla `errors`. El link del email apunta a la web con el token en query.

## ADR-030 — Perfil completo antes de crearlo

**Contexto:** el esquema exige campos obligatorios y el match necesita perfiles completos.

**Decisión:** `PATCH /profiles/me` exige que el estado final quede completo; el onboarding envía todos los campos juntos. Las ediciones posteriores también validan el estado final.

**Consecuencias:** no existen perfiles parciales. `profile_completed_at` se setea al crear o actualizar un perfil completo y la UI valida cada paso antes de guardar.

## ADR-031 - Lanzamiento sin Riot API y preparación de production key

**Contexto:** el producto puede salir con rango declarado y assets propios mientras se tramita una production key que puede demorar meses.

**Decisión:** lanzar el MVP público sin Riot API ni RSO, registrar el producto en el Developer Portal, mantener `RankIcon` como SVG original y dejar la integración documentada en `docs/RIOT-INTEGRATION.md`. La production key se solicita en paralelo.

**Consecuencias:** el release no depende de Riot. El rango sigue siendo declarado y no se usan crests ni logos oficiales. Cuando haya key aprobada, la integración se prueba primero en desarrollo y la verificación de titularidad requiere RSO.

## ADR-032 - Eliminación de cuenta con recuperación de 30 días

**Contexto:** los usuarios necesitan ejercer la eliminación de sus datos sin depender de soporte, pero los reportes, feedback y sanciones deben conservarse para moderación.

**Decisión:** `DELETE /auth/account` exige contraseña, programa la baja a 30 días e invalida la sesión. Iniciar sesión dentro del plazo recupera la cuenta. Un job horario purga los datos personales y el perfil, anonimiza el usuario y conserva registros de moderación no identificables.

**Consecuencias:** la cuenta se oculta de inmediato y puede recuperarse antes de la fecha de purga. El borrado permanente es una anonimización con retención mínima de moderación, no un `DELETE` físico que arrastre feedbacks o reportes.

## ADR-033 - País de residencia y equivalencia horaria local

**Contexto:** LAS incluye Argentina, Chile, Bolivia, Paraguay y Uruguay. Los bloques horarios se guardan en ART, pero un jugador de otro país puede interpretar mal la hora local.

**Decisión:** `country` es opcional en `player_profiles` y solo acepta los cinco países de LAS. Se usa para mostrar la equivalencia local de los bloques y una diferencia contra ART en cards, matches y perfil. No es filtro duro ni altera el matching: todos los bloques siguen siendo ART.

**Consecuencias:** el matching se mantiene simple y compatible. La UI calcula la diferencia con la zona IANA del país y `Intl`, contemplando horario de verano. Si el país no está cargado, la UI muestra solo ART. Perú y Ecuador quedan fuera porque pertenecen a LAN.

## ADR-034 - Hardening de producción antes del release

**Contexto:** el MVP ya tenía auth, validación y rate limits básicos, pero faltaban ajustes para tráfico real, proxies y exposición web.

**Decisión:** subir el límite global a 600/15 min por IP y agregar un límite por usuario autenticado; agregar límite por credencial en login (10 fallos/15 min) y por email+IP en recuperación; comparar un hash dummy cuando el login no encuentra usuario; guardar hasheados los tokens de verificación y reset; exigir HTTPS y prohibir wildcard en CORS de producción; hacer configurable `TRUST_PROXY`; aplicar CSP y headers de seguridad en Vercel; actualizar Zod 4.

**Consecuencias:** menos falsos 429 detrás de NAT, mejor resistencia a fuerza bruta distribuida y enumeración por timing. Los rate limits siguen en memoria y asumen una instancia. Queda una vulnerabilidad moderada conocida de `uuid` vía Sequelize que no afecta la ruta usada (v1/v4 sin buffer).

## ADR-035 - Panel admin separado del flujo de jugador

**Contexto:** las cuentas admin no representan jugadores y no necesitan completar perfil ni entrar al matching. La información de usuarios estaba dispersa en reportes y métricas.

**Decisión:** crear un `AdminShell` propio con Resumen, Usuarios, Reportes y Métricas. El admin es redirigido desde rutas de jugador a `/admin`. `GET /admin/users` expone búsqueda, filtros y paginación; `GET /admin/users/:id` concentra cuenta, perfil, reportes, sanciones y disponibilidad. Los datos sensibles como contraseña y tokens nunca se devuelven.

**Consecuencias:** los admins operan sin perfil de jugador y no aparecen en el flujo social. El panel queda read-only en esta fase; las acciones de moderación siguen viviendo en reportes y en los endpoints existentes de warn/suspend.

## ADR-036 - ARAM como búsqueda separada

**Contexto:** ARAM no usa rango, roles ni score de afinidad. Meterlo como una cola más de Match, Disponible ya y Busco 1 habría contaminado esos flujos y cargado sus opciones.

**Decisión:** crear una sección /aram con publicaciones propias de dos tipos: solo (disponibilidad individual) y group (grupo de 2-4 que busca completar 5). Una solicitud aceptada descuenta un lugar y crea una conexión con source = 'aram', visible en Matches. No usa rango ni roles.

**Consecuencias:** el flujo de duo queda intacto y ARAM se puede medir por separado. El MVP no modela el roster completo del grupo: el dueño acepta solicitudes y coordina el resto. Una publicación activa por usuario.
