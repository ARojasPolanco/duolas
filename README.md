# Duo LAS

Web mobile-first, gratuita y solo para mayores de 18 años, que conecta jugadores de League of Legends del servidor LAS para jugar duo y subir de elo.

El alcance de este repositorio es el servicio de match y duo: perfil, match por afinidad, "Disponible ya", "Busco 1", búsqueda ARAM, invitaciones, notificaciones, reputación, reportes y bloqueos. El coaching, los pagos y el chat interno quedan fuera del MVP.

## Estado

- **Fase actual:** MVP implementado; preparando release público sin Riot API y solicitud futura de production key.
- **Código:** monorepo con auth, perfiles, matching, disponibilidad, invitaciones, Busco 1, ARAM, confianza, SSE, push, PWA, métricas, rate limits, conexiones, bloqueos y notificaciones persistidas.
- **Rama principal:** `dev`. `main` se reserva para el release final.
- **Fuente de verdad:** los documentos de `docs/`.
- **Propuesta original:** `Propuesta plataforma de duos para League of Legends.pdf`.

## Stack

| Capa          | Tecnología                                                          |
| ------------- | ------------------------------------------------------------------- |
| Monorepo      | npm workspaces (`apps/api`, `apps/web`, `packages/shared`)          |
| Lenguaje      | JavaScript puro con ESM. No TypeScript.                             |
| Backend       | Node.js 20 + Express 4 + Sequelize 6                                |
| Migraciones   | Umzug con SQL crudo                                                 |
| Base de datos | PostgreSQL 16                                                       |
| Validación    | Zod                                                                 |
| Auth          | JWT 1 día + bcrypt 12 + verificación por email                      |
| Realtime      | SSE en memoria + polling. Sin Redis.                                |
| Push          | web-push + VAPID + service worker + PWA                             |
| Frontend      | React 19 + Vite 6 + Tailwind CSS 4 + React Router 7                 |
| Tests         | Vitest + Supertest                                                  |
| Deploy        | API persistente (Render/Railway), web en Vercel, PostgreSQL en Neon |

## Documentación

| Documento                  | Contenido                                                 |
| -------------------------- | --------------------------------------------------------- |
| `AGENTS.md`                | Convenciones obligatorias y reglas críticas               |
| `TASK.md`                  | Tablero vivo y plan por fases                             |
| `docs/SPEC.md`             | Producto, alcance, flujos y reglas de negocio             |
| `docs/ARCHITECTURE.md`     | Arquitectura técnica, errores, realtime, push y operación |
| `docs/DATA-MODEL.md`       | Tablas, enums, índices y migraciones                      |
| `docs/API.md`              | Contrato de endpoints y catálogo de errores               |
| `docs/ROUTES.md`           | Rutas web/API y flujos de prueba                          |
| `docs/MATCHING.md`         | Fórmulas, filtros y pesos del match                       |
| `docs/METRICS.md`          | Eventos, KPIs y consultas SQL                             |
| `docs/TESTING.md`          | Plan de pruebas y smoke manual                            |
| `docs/PRODUCTION.md`       | Checklist de envs, claves y deploy a producción           |
| `docs/RIOT-INTEGRATION.md` | Preparación de Riot API, key y revisión                   |
| `docs/UI.md`               | Rutas, pantallas, componentes y copy                      |
| `docs/DECISIONS.md`        | Registro de decisiones (ADR)                              |

## Estructura planificada

```text
duo-lol-fullstack/
├─ apps/
│  ├─ api/          # Express + Sequelize + Umzug
│  └─ web/          # React + Vite + Tailwind
├─ packages/
│  └─ shared/       # Constantes y schemas compartidos
├─ docker/
│  └─ initdb/       # Base de test
├─ docs/
├─ docker-compose.yml
├─ AGENTS.md
├─ TASK.md
└─ README.md
```

## Quick start

```bash
npm install
npm run docker:up
cp apps/api/.env.example apps/api/.env
npm run dev
npm run dev:web
```

La API queda en `http://localhost:3000` y la web en `http://localhost:5173`. PostgreSQL escucha en `localhost:5433`.

También podés levantar API y web en contenedores separados, sin depender de dos terminales:

```bash
npm run docker:app
```

Eso construye y levanta `postgres`, `api` y `web`. Para bajar todo: `npm run docker:down`.

## Datos de prueba

El seed de desarrollo crea cuentas ya verificadas, perfiles completos y un match activo. Solo funciona fuera de producción.

```bash
npm run docker:up
npm run seed
npm run dev
npm run dev:web
```

| Cuenta                       | Contraseña   | Uso                                           |
| ---------------------------- | ------------ | --------------------------------------------- |
| `demo_mid@duolas.online`     | `Demo12345!` | Cuenta principal para probar Match y Matches  |
| `demo_jungle@duolas.online`  | `Demo12345!` | Tiene un match activo con `demo_mid`          |
| `demo_adc@duolas.online`     | `Demo12345!` | Candidato con like pendiente hacia `demo_mid` |
| `demo_support@duolas.online` | `Demo12345!` | Candidato compatible adicional                |
| `demo_admin@duolas.online`   | `Demo12345!` | Admin de reportes y sanciones                 |

Flujo rápido:

1. Abrí `http://localhost:5173/login` e iniciá sesión con `demo_mid@duolas.online`.
2. En `/match` vas a ver `demo_adc` y `demo_support`.
3. Si le das like a `demo_adc`, como ya existe un like pendiente suyo, el match se concreta al instante y aparece en `/matches`.
4. En `/matches` vas a ver el contacto de `demo_jungle` y podés probar feedback, reportar, copiar, archivar y bloquear.
5. Con `demo_admin@duolas.online` entrás directo a `/admin/reportes`; también podés abrir `/admin/metrics`.
6. El seed completo crea 12 jugadores con perfiles variados y el admin.
7. Si querés reiniciar el escenario, volvé a correr `npm run seed`.

> Las cuentas demo son solo para desarrollo local. No usarlas en producción.

## Scripts

| Comando               | Descripción                             |
| --------------------- | --------------------------------------- |
| `npm run docker:up`   | Levanta PostgreSQL                      |
| `npm run docker:down` | Baja PostgreSQL                         |
| `npm run docker:app`  | Levanta PostgreSQL, API y web en Docker |
| `npm run dev`         | API con recarga                         |
| `npm run dev:web`     | Web en modo desarrollo                  |
| `npm test`            | Vitest + Supertest                      |
| `npm run lint`        | ESLint                                  |
| `npm run format`      | Prettier                                |
| `npm run seed`        | Datos de desarrollo                     |
| `npm run seed:admin`  | Crea el admin desde envs                |

## Reglas del MVP

- Solo servidor LAS.
- Solo mayores de 18 años.
- Sin Riot API ni RSO en el MVP: el rango es declarado. La preparación para una production key está en `docs/RIOT-INTEGRATION.md`.
- El Riot ID y el Discord se revelan únicamente después de una conexión.
- Sin chat interno: el contacto es Riot ID y Discord opcional.
- Sin uploads de imágenes: avatares con iniciales.
- Sin coaching, pagos, equipos, otros juegos ni app nativa.
- Likes y feedback doble ciego.
- Disponibilidad "Disponible ya" con vencimiento de 30 o 60 minutos.
- Reportar bloquea automáticamente al reportado.

## Release público

El MVP sale sin Riot API, con rango declarado y escudos SVG propios. El checklist de deploy está en `docs/PRODUCTION.md` y la preparación de la production key en `docs/RIOT-INTEGRATION.md`.

- No usar una personal key en el sitio público.
- No usar crests ni logos oficiales de Riot.
- Registrar el producto en el Developer Portal.
- Mantener el boilerplate legal exacto visible.

## Aviso legal

Duo LAS isn't endorsed by Riot Games and doesn't reflect the views or opinions of Riot Games or anyone officially involved in producing or managing Riot Games properties. Riot Games, and all associated properties are trademarks or registered trademarks of Riot Games, Inc.

## Licencia

Sin licencia definida todavía.
