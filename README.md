# Duo LAS

Web mobile-first, gratuita y solo para mayores de 18 años, que conecta jugadores de League of Legends del servidor LAS para jugar duo y subir de elo.

El alcance de este repositorio es el servicio de match y duo: perfil, match por afinidad, "Disponible ya", "Busco 1", invitaciones, notificaciones, reputación, reportes y bloqueos. El coaching, los pagos y el chat interno quedan fuera del MVP.

## Estado

- **Fase actual:** Fase 1 (cuenta y perfil) completada. Siguiente: Fase 2 (match de duo).
- **Código:** monorepo con auth, verificación de email, reset, perfiles y onboarding.
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

| Documento              | Contenido                                                 |
| ---------------------- | --------------------------------------------------------- |
| `AGENTS.md`            | Convenciones obligatorias y reglas críticas               |
| `TASK.md`              | Tablero vivo y plan por fases                             |
| `docs/SPEC.md`         | Producto, alcance, flujos y reglas de negocio             |
| `docs/ARCHITECTURE.md` | Arquitectura técnica, errores, realtime, push y operación |
| `docs/DATA-MODEL.md`   | Tablas, enums, índices y migraciones                      |
| `docs/API.md`          | Contrato de endpoints y catálogo de errores               |
| `docs/MATCHING.md`     | Fórmulas, filtros y pesos del match                       |
| `docs/METRICS.md`      | Eventos, KPIs y consultas SQL                             |
| `docs/TESTING.md`      | Plan de pruebas y smoke manual                            |
| `docs/PRODUCTION.md`   | Checklist de envs, claves y deploy a producción           |
| `docs/UI.md`           | Rutas, pantallas, componentes y copy                      |
| `docs/DECISIONS.md`    | Registro de decisiones (ADR)                              |

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

## Scripts

| Comando               | Descripción              |
| --------------------- | ------------------------ |
| `npm run docker:up`   | Levanta PostgreSQL       |
| `npm run docker:down` | Baja PostgreSQL          |
| `npm run dev`         | API con recarga          |
| `npm run dev:web`     | Web en modo desarrollo   |
| `npm test`            | Vitest + Supertest       |
| `npm run lint`        | ESLint                   |
| `npm run format`      | Prettier                 |
| `npm run seed`        | Datos de desarrollo      |
| `npm run seed:admin`  | Crea el admin desde envs |

## Reglas del MVP

- Solo servidor LAS.
- Solo mayores de 18 años.
- Sin Riot API ni RSO: el rango es declarado.
- El Riot ID y el Discord se revelan únicamente después de una conexión.
- Sin chat interno: el contacto es Riot ID y Discord opcional.
- Sin uploads de imágenes: avatares con iniciales.
- Sin coaching, pagos, equipos, otros juegos ni app nativa.
- Likes y feedback doble ciego.
- Disponibilidad "Disponible ya" con vencimiento de 30 o 60 minutos.
- Reportar bloquea automáticamente al reportado.

## Aviso legal

Duo LAS no está avalado por Riot Games. League of Legends es una marca de Riot Games, Inc.

## Licencia

Sin licencia definida todavía.
