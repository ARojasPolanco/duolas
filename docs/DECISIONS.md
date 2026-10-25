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

**Consecuencias:** simplicidad y consistencia. Jugadores de otras zonas deben adaptar su disponibilidad a ART. No hay horario de verano.

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
