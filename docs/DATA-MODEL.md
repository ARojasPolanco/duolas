# DATA-MODEL — Duo LAS

Fuente de verdad del esquema. Las migraciones deben reflejar exactamente este documento. Si cambia una tabla, se actualiza este archivo y se agrega una migración nueva.

## 1. Convenciones

- PostgreSQL 16.
- PK `${tabla}_id` con `UUID DEFAULT gen_random_uuid()`.
- Fechas con `TIMESTAMPTZ` en UTC.
- `created_at` y `updated_at` en entidades mutables.
- `is_deleted` para soft delete en entidades persistentes.
- Enums como `VARCHAR + CHECK`, no tipos ENUM de PostgreSQL.
- Arrays `TEXT[]` para listas cortas y filtrables.
- `JSONB` para metadata y payloads.
- Nombres de tablas y columnas en `snake_case`.
- Sequelize con `underscored: true`; el atributo del modelo es `camelCase` y `field` apunta a la columna.
- Los IDs de autor, target, owner y admin salen de la sesión, nunca del body.

## 2. Enums canónicos

| Enum                         | Valores                                                                                                                                |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `user_role`                  | `player`, `admin`                                                                                                                      |
| `user_status`                | `active`, `suspended`                                                                                                                  |
| `role`                       | `top`, `jungle`, `mid`, `adc`, `support`                                                                                               |
| `rank_tier`                  | `iron`, `bronze`, `silver`, `gold`, `platinum`, `emerald`, `diamond`, `master`, `grandmaster`, `challenger`                            |
| `rank_division`              | `iv`, `iii`, `ii`, `i`                                                                                                                 |
| `rank_source`                | `declared`, `riot`                                                                                                                     |
| `queue`                      | `solo_duo`, `flex`                                                                                                                     |
| `play_style`                 | `casual`, `ranked`, `tryhard`                                                                                                          |
| `language`                   | `es`, `en`, `pt`                                                                                                                       |
| `availability_status`        | `active`, `closed`                                                                                                                     |
| `availability_closed_reason` | `expired`, `manual`, `matched`                                                                                                         |
| `like_status`                | `pending`, `matched`, `cancelled`                                                                                                      |
| `connection_source`          | `like`, `availability`, `post`                                                                                                         |
| `connection_status`          | `active`, `archived`                                                                                                                   |
| `post_status`                | `active`, `filled`, `expired`, `cancelled`                                                                                             |
| `application_status`         | `pending`, `accepted`, `rejected`, `withdrawn`                                                                                         |
| `invite_status`              | `pending`, `accepted`, `declined`, `cancelled`, `expired`                                                                              |
| `report_reason`              | `toxicity`, `fake_rank`, `abandonment`, `spam`, `underage`, `other`                                                                    |
| `report_status`              | `open`, `reviewing`, `resolved`, `dismissed`                                                                                           |
| `sentiment`                  | `positive`, `negative`                                                                                                                 |
| `feedback_tag`               | `good_vibes`, `communicative`, `tryhard`, `punctual`, `good_game`, `toxicity`, `abandonment`, `fake_rank`, `no_communication`, `other` |

### Bloques horarios

28 valores: `{mon,tue,wed,thu,fri,sat,sun}_{early,morning,afternoon,night}`.

| Bloque      | Horario ART   |
| ----------- | ------------- |
| `early`     | 00:00 a 05:59 |
| `morning`   | 06:00 a 11:59 |
| `afternoon` | 12:00 a 17:59 |
| `night`     | 18:00 a 23:59 |

Zona canónica: `America/Argentina/Buenos_Aires`. No hay horario de verano.

### Notificaciones

`match_created`, `invite_received`, `invite_accepted`, `invite_declined`, `invite_cancelled`, `application_received`, `application_accepted`, `application_rejected`, `application_withdrawn`, `post_suggested`, `feedback_revealed`, `warning_received`, `account_suspended`.

### Métricas

`user_registered`, `email_verified`, `profile_completed`, `availability_opened`, `availability_closed`, `like_sent`, `match_created`, `contact_revealed`, `invite_sent`, `invite_accepted`, `post_created`, `application_sent`, `application_accepted`, `feedback_submitted`, `feedback_revealed`, `report_created`, `user_suspended`, `push_subscribed`.

## 3. Tablas

### 3.1 `users`

| Columna                      | Tipo         | Restricciones                                 |
| ---------------------------- | ------------ | --------------------------------------------- |
| `users_id`                   | UUID         | PK, default `gen_random_uuid()`               |
| `username`                   | VARCHAR(20)  | NOT NULL, único case-insensitive              |
| `email`                      | VARCHAR(255) | NOT NULL, único, guardado en minúsculas       |
| `password`                   | VARCHAR(255) | NOT NULL, hash bcrypt                         |
| `role`                       | VARCHAR(10)  | NOT NULL, default `player`, check             |
| `email_verified`             | BOOLEAN      | NOT NULL, default false                       |
| `email_verification_token`   | VARCHAR(255) | NULL                                          |
| `email_verification_expires` | TIMESTAMPTZ  | NULL                                          |
| `password_reset_token`       | VARCHAR(64)  | NULL, hash SHA-256                            |
| `password_reset_expires`     | TIMESTAMPTZ  | NULL                                          |
| `changed_password_at`        | TIMESTAMPTZ  | NULL; invalida JWT emitidos antes             |
| `age_confirmed_at`           | TIMESTAMPTZ  | NOT NULL                                      |
| `terms_accepted_at`          | TIMESTAMPTZ  | NOT NULL                                      |
| `status`                     | VARCHAR(10)  | NOT NULL, default `active`, check             |
| `suspended_until`            | TIMESTAMPTZ  | NULL; NULL con status suspendido = permanente |
| `suspension_reason`          | TEXT         | NULL                                          |
| `warning_count`              | INTEGER      | NOT NULL, default 0, check >= 0               |
| `last_login_at`              | TIMESTAMPTZ  | NULL                                          |
| `last_active_at`             | TIMESTAMPTZ  | NULL                                          |
| `is_deleted`                 | BOOLEAN      | NOT NULL, default false                       |
| `created_at`                 | TIMESTAMPTZ  | NOT NULL, default now                         |
| `updated_at`                 | TIMESTAMPTZ  | NOT NULL, default now                         |

Índices:

- Único `lower(username)`.
- Único `email`.
- `(status)`.
- `(last_active_at)`.

### 3.2 `errors`

| Columna          | Tipo         | Restricciones         |
| ---------------- | ------------ | --------------------- |
| `errors_id`      | BIGSERIAL    | PK                    |
| `status`         | VARCHAR(10)  | NOT NULL              |
| `status_code`    | INTEGER      | NULL                  |
| `message`        | TEXT         | NOT NULL              |
| `stack`          | TEXT         | NULL                  |
| `method`         | VARCHAR(10)  | NULL                  |
| `path`           | VARCHAR(255) | NULL                  |
| `user_id`        | UUID         | NULL                  |
| `ip`             | VARCHAR(45)  | NULL                  |
| `user_agent`     | TEXT         | NULL                  |
| `is_operational` | BOOLEAN      | NULL                  |
| `created_at`     | TIMESTAMPTZ  | NOT NULL, default now |

Sin `updated_at`.

### 3.3 `player_profiles`

| Columna                    | Tipo         | Restricciones                                 |
| -------------------------- | ------------ | --------------------------------------------- |
| `player_profiles_id`       | UUID         | PK                                            |
| `user_id`                  | UUID         | NOT NULL, único, FK `users` ON DELETE CASCADE |
| `riot_id`                  | VARCHAR(30)  | NOT NULL, texto visible                       |
| `riot_id_normalized`       | VARCHAR(30)  | NOT NULL, único, minúsculas                   |
| `server`                   | VARCHAR(10)  | NOT NULL, default `LAS`, check `LAS`          |
| `primary_role`             | VARCHAR(10)  | NOT NULL, check                               |
| `secondary_role`           | VARCHAR(10)  | NOT NULL, check, distinto del principal       |
| `rank_tier`                | VARCHAR(12)  | NOT NULL, check                               |
| `rank_division`            | VARCHAR(3)   | NULL, check; obligatorio hasta Diamante       |
| `rank_lp`                  | INTEGER      | NULL, check >= 0                              |
| `rank_index`               | SMALLINT     | NOT NULL, check >= 0                          |
| `play_style`               | VARCHAR(10)  | NOT NULL, check                               |
| `languages`                | TEXT[]       | NOT NULL, cardinalidad 1-3                    |
| `has_mic`                  | BOOLEAN      | NOT NULL                                      |
| `schedule_blocks`          | TEXT[]       | NOT NULL, cardinalidad 1-28                   |
| `bio`                      | VARCHAR(280) | NULL                                          |
| `discord_tag`              | VARCHAR(32)  | NULL                                          |
| `rank_source`              | VARCHAR(10)  | NOT NULL, default `declared`, check           |
| `rank_verified_at`         | TIMESTAMPTZ  | NULL                                          |
| `reputation_positive`      | INTEGER      | NOT NULL, default 0, check >= 0               |
| `reputation_negative`      | INTEGER      | NOT NULL, default 0, check >= 0               |
| `reputation_score`         | SMALLINT     | NOT NULL, default 50, check 0-100             |
| `reputation_calculated_at` | TIMESTAMPTZ  | NULL                                          |
| `profile_completed_at`     | TIMESTAMPTZ  | NULL                                          |
| `is_deleted`               | BOOLEAN      | NOT NULL, default false                       |
| `created_at`               | TIMESTAMPTZ  | NOT NULL                                      |
| `updated_at`               | TIMESTAMPTZ  | NOT NULL                                      |

Checks:

- `secondary_role <> primary_role`.
- `(rank_tier IN ('master','grandmaster','challenger') AND rank_division IS NULL)` o `(rank_tier NOT IN (...) AND rank_division IS NOT NULL)`.

Índices:

- Único `user_id`.
- Único `riot_id_normalized`.
- `(server, rank_index)`.
- `(primary_role)`.
- GIN `(schedule_blocks)`.
- `(reputation_score)`.

### 3.4 `availability_sessions`

| Columna                    | Tipo         | Restricciones                     |
| -------------------------- | ------------ | --------------------------------- |
| `availability_sessions_id` | UUID         | PK                                |
| `user_id`                  | UUID         | NOT NULL, FK `users`              |
| `roles`                    | TEXT[]       | NOT NULL, cardinalidad 1-2        |
| `queue`                    | VARCHAR(10)  | NOT NULL, check                   |
| `note`                     | VARCHAR(140) | NULL                              |
| `status`                   | VARCHAR(10)  | NOT NULL, default `active`, check |
| `started_at`               | TIMESTAMPTZ  | NOT NULL, default now             |
| `expires_at`               | TIMESTAMPTZ  | NOT NULL                          |
| `ended_at`                 | TIMESTAMPTZ  | NULL                              |
| `closed_reason`            | VARCHAR(10)  | NULL, check                       |
| `created_at`               | TIMESTAMPTZ  | NOT NULL                          |
| `updated_at`               | TIMESTAMPTZ  | NOT NULL                          |

Checks:

- Si `status = 'closed'`, `ended_at` y `closed_reason` no son NULL.

Índices:

- Único parcial `(user_id) WHERE status = 'active'`.
- `(status, expires_at)`.
- `(queue, status)`.
- `(started_at, ended_at)`.

### 3.5 `duo_likes`

| Columna        | Tipo        | Restricciones                      |
| -------------- | ----------- | ---------------------------------- |
| `duo_likes_id` | UUID        | PK                                 |
| `from_user_id` | UUID        | NOT NULL, FK `users`               |
| `to_user_id`   | UUID        | NOT NULL, FK `users`               |
| `status`       | VARCHAR(10) | NOT NULL, default `pending`, check |
| `created_at`   | TIMESTAMPTZ | NOT NULL                           |
| `updated_at`   | TIMESTAMPTZ | NOT NULL                           |

Índices:

- Único `(from_user_id, to_user_id)`.
- `(to_user_id, status)`.
- `(from_user_id, status)`.
- Check `from_user_id <> to_user_id`.

### 3.6 `duo_connections`

| Columna               | Tipo        | Restricciones                       |
| --------------------- | ----------- | ----------------------------------- |
| `duo_connections_id`  | UUID        | PK                                  |
| `user_low_id`         | UUID        | NOT NULL, FK `users`                |
| `user_high_id`        | UUID        | NOT NULL, FK `users`                |
| `source`              | VARCHAR(12) | NOT NULL, check                     |
| `status`              | VARCHAR(10) | NOT NULL, default `active`, check   |
| `contact_revealed_at` | TIMESTAMPTZ | NOT NULL, default now               |
| `archived_at`         | TIMESTAMPTZ | NULL                                |
| `archived_by`         | UUID        | NULL, FK `users` ON DELETE SET NULL |
| `created_at`          | TIMESTAMPTZ | NOT NULL                            |
| `updated_at`          | TIMESTAMPTZ | NOT NULL                            |

Índices:

- Único `(user_low_id, user_high_id)`.
- `(user_low_id, status)`.
- `(user_high_id, status)`.
- Check `user_low_id < user_high_id`; el servicio ordena los UUID antes de insertar.

### 3.7 `duo_posts`

| Columna          | Tipo         | Restricciones                     |
| ---------------- | ------------ | --------------------------------- |
| `duo_posts_id`   | UUID         | PK                                |
| `owner_id`       | UUID         | NOT NULL, FK `users`              |
| `queue`          | VARCHAR(10)  | NOT NULL, check                   |
| `roles_needed`   | TEXT[]       | NOT NULL, cardinalidad 1-2        |
| `rank_min_tier`  | VARCHAR(12)  | NOT NULL, check                   |
| `rank_max_tier`  | VARCHAR(12)  | NOT NULL, check                   |
| `rank_min_index` | SMALLINT     | NOT NULL, check >= 0              |
| `rank_max_index` | SMALLINT     | NOT NULL, check >= 0              |
| `note`           | VARCHAR(140) | NULL                              |
| `status`         | VARCHAR(10)  | NOT NULL, default `active`, check |
| `expires_at`     | TIMESTAMPTZ  | NOT NULL                          |
| `created_at`     | TIMESTAMPTZ  | NOT NULL                          |
| `updated_at`     | TIMESTAMPTZ  | NOT NULL                          |

Índices:

- Único parcial `(owner_id, queue) WHERE status = 'active'`.
- `(status, expires_at)`.
- `(queue, status)`.
- `(owner_id, status)`.
- Check `rank_min_index <= rank_max_index`.

`rank_min_tier` y `rank_max_tier` son para mostrar; los índices son para filtrar.

### 3.8 `post_applications`

| Columna                | Tipo         | Restricciones                              |
| ---------------------- | ------------ | ------------------------------------------ |
| `post_applications_id` | UUID         | PK                                         |
| `post_id`              | UUID         | NOT NULL, FK `duo_posts` ON DELETE CASCADE |
| `applicant_id`         | UUID         | NOT NULL, FK `users`                       |
| `message`              | VARCHAR(140) | NULL                                       |
| `status`               | VARCHAR(10)  | NOT NULL, default `pending`, check         |
| `created_at`           | TIMESTAMPTZ  | NOT NULL                                   |
| `updated_at`           | TIMESTAMPTZ  | NOT NULL                                   |

Índices:

- Único `(post_id, applicant_id)`.
- `(post_id, status)`.
- `(applicant_id, status)`.

### 3.9 `invites`

| Columna           | Tipo         | Restricciones                                          |
| ----------------- | ------------ | ------------------------------------------------------ |
| `invites_id`      | UUID         | PK                                                     |
| `from_user_id`    | UUID         | NOT NULL, FK `users`                                   |
| `to_user_id`      | UUID         | NOT NULL, FK `users`                                   |
| `availability_id` | UUID         | NOT NULL, FK `availability_sessions` ON DELETE CASCADE |
| `role`            | VARCHAR(10)  | NOT NULL, check                                        |
| `message`         | VARCHAR(140) | NULL                                                   |
| `status`          | VARCHAR(10)  | NOT NULL, default `pending`, check                     |
| `expires_at`      | TIMESTAMPTZ  | NOT NULL                                               |
| `responded_at`    | TIMESTAMPTZ  | NULL                                                   |
| `created_at`      | TIMESTAMPTZ  | NOT NULL                                               |
| `updated_at`      | TIMESTAMPTZ  | NOT NULL                                               |

Índices:

- Único parcial `(from_user_id, to_user_id) WHERE status = 'pending'`.
- `(to_user_id, status)`.
- `(expires_at)`.
- Check `from_user_id <> to_user_id`.

En el MVP las invitaciones nacen solo de una disponibilidad. Las postulaciones de Busco 1 usan `post_applications`.

### 3.10 `blocks`

| Columna      | Tipo        | Restricciones           |
| ------------ | ----------- | ----------------------- |
| `blocks_id`  | UUID        | PK                      |
| `blocker_id` | UUID        | NOT NULL, FK `users`    |
| `blocked_id` | UUID        | NOT NULL, FK `users`    |
| `is_deleted` | BOOLEAN     | NOT NULL, default false |
| `created_at` | TIMESTAMPTZ | NOT NULL                |
| `updated_at` | TIMESTAMPTZ | NOT NULL                |

Índices:

- Único parcial `(blocker_id, blocked_id) WHERE is_deleted = false`.
- `(blocked_id)`.
- Check `blocker_id <> blocked_id`.

### 3.11 `reports`

| Columna       | Tipo         | Restricciones                       |
| ------------- | ------------ | ----------------------------------- |
| `reports_id`  | UUID         | PK                                  |
| `reporter_id` | UUID         | NOT NULL, FK `users`                |
| `reported_id` | UUID         | NOT NULL, FK `users`                |
| `reason`      | VARCHAR(20)  | NOT NULL, check                     |
| `details`     | VARCHAR(500) | NULL                                |
| `status`      | VARCHAR(10)  | NOT NULL, default `open`, check     |
| `priority`    | BOOLEAN      | NOT NULL, default false             |
| `admin_id`    | UUID         | NULL, FK `users` ON DELETE SET NULL |
| `admin_note`  | VARCHAR(500) | NULL                                |
| `resolved_at` | TIMESTAMPTZ  | NULL                                |
| `created_at`  | TIMESTAMPTZ  | NOT NULL                            |
| `updated_at`  | TIMESTAMPTZ  | NOT NULL                            |

Checks:

- `reporter_id <> reported_id`.
- `reason <> 'other' OR details IS NOT NULL`.

Índices:

- Único parcial `(reporter_id, reported_id) WHERE status IN ('open','reviewing')`.
- `(status, created_at)`.
- `(reported_id)`.

### 3.12 `feedbacks`

| Columna         | Tipo         | Restricciones                            |
| --------------- | ------------ | ---------------------------------------- |
| `feedbacks_id`  | UUID         | PK                                       |
| `connection_id` | UUID         | NOT NULL, FK `duo_connections`           |
| `author_id`     | UUID         | NOT NULL, FK `users`                     |
| `target_id`     | UUID         | NOT NULL, FK `users`                     |
| `sentiment`     | VARCHAR(8)   | NOT NULL, check                          |
| `tags`          | TEXT[]       | NOT NULL, default `{}`, cardinalidad 0-3 |
| `comment`       | VARCHAR(280) | NULL                                     |
| `visible_at`    | TIMESTAMPTZ  | NULL                                     |
| `created_at`    | TIMESTAMPTZ  | NOT NULL                                 |

Checks:

- `author_id <> target_id`.
- `sentiment <> 'negative' OR array_length(tags, 1) >= 1`.

Índices:

- Único `(connection_id, author_id)`.
- `(target_id, visible_at)`.
- `(connection_id)`.

Sin `updated_at`: es inmutable.

### 3.13 `notifications`

| Columna            | Tipo         | Restricciones           |
| ------------------ | ------------ | ----------------------- |
| `notifications_id` | UUID         | PK                      |
| `user_id`          | UUID         | NOT NULL, FK `users`    |
| `type`             | VARCHAR(40)  | NOT NULL                |
| `title`            | VARCHAR(200) | NOT NULL                |
| `message`          | TEXT         | NULL                    |
| `data`             | JSONB        | NOT NULL, default `{}`  |
| `is_read`          | BOOLEAN      | NOT NULL, default false |
| `created_at`       | TIMESTAMPTZ  | NOT NULL                |
| `updated_at`       | TIMESTAMPTZ  | NOT NULL                |

Índices:

- `(user_id, is_read)`.
- `(user_id, created_at)`.

### 3.14 `push_subscriptions`

| Columna                 | Tipo         | Restricciones          |
| ----------------------- | ------------ | ---------------------- |
| `push_subscriptions_id` | UUID         | PK                     |
| `user_id`               | UUID         | NOT NULL, FK `users`   |
| `endpoint`              | TEXT         | NOT NULL, único        |
| `p256dh`                | TEXT         | NOT NULL               |
| `auth`                  | TEXT         | NOT NULL               |
| `user_agent`            | VARCHAR(255) | NULL                   |
| `is_active`             | BOOLEAN      | NOT NULL, default true |
| `last_used_at`          | TIMESTAMPTZ  | NULL                   |
| `created_at`            | TIMESTAMPTZ  | NOT NULL               |
| `updated_at`            | TIMESTAMPTZ  | NOT NULL               |

Índices:

- Único `(endpoint)`.
- `(user_id, is_active)`.

### 3.15 `metrics_events`

| Columna             | Tipo        | Restricciones                       |
| ------------------- | ----------- | ----------------------------------- |
| `metrics_events_id` | BIGSERIAL   | PK                                  |
| `user_id`           | UUID        | NULL, FK `users` ON DELETE SET NULL |
| `type`              | VARCHAR(40) | NOT NULL                            |
| `metadata`          | JSONB       | NOT NULL, default `{}`              |
| `created_at`        | TIMESTAMPTZ | NOT NULL, default now               |

Índices:

- `(type, created_at)`.
- `(user_id, created_at)`.

Sin `updated_at`: es inmutable.

## 4. Relaciones

```text
users 1─1 player_profiles
users 1─N availability_sessions
users 1─N duo_likes (from / to)
users 1─N duo_connections (low / high)
users 1─N duo_posts
users 1─N post_applications
users 1─N invites (from / to)
users 1─N blocks (blocker / blocked)
users 1─N reports (reporter / reported / admin)
users 1─N feedbacks (author / target)
users 1─N notifications
users 1─N push_subscriptions
users 1─N metrics_events

duo_posts 1─N post_applications
availability_sessions 1─N invites
duo_connections 1─N feedbacks
```

## 5. Derivados e invariantes

### `rank_index`

```text
tierIndex = [iron, bronze, silver, gold, platinum, emerald, diamond, master, grandmaster, challenger].indexOf(tier)
divisionIndex = { iv: 0, iii: 1, ii: 2, i: 3 }
rank_index = tierIndex * 4 + divisionIndex
```

Para Maestro, Gran Maestro y Challenger, `divisionIndex = 0`.

### Rango de un Busco 1

```text
rank_min_index = tierIndex(rank_min_tier) * 4
rank_max_index = tierIndex(rank_max_tier) * 4 + (tier_max es master+ ? 0 : 3)
```

Así, un post de Oro a Platino cubre de Oro IV (12) a Platino I (19). Un post de Maestro a Challenger cubre de 28 a 36.

### `reputation_score`

```text
score = round(((positive + 2) / (positive + negative + 4)) * 100)
```

Se recalcula al revelar feedback. Arranca en 50.

### `profile_completed_at`

Se setea cuando el perfil se crea o actualiza con todos los campos obligatorios. Una edición que intente dejar el perfil incompleto se rechaza con 422; el usuario no aparece en candidatos hasta completarlo.

### Invariantes

- Un usuario tiene como máximo una disponibilidad activa.
- Una conexión es única por par ordenado.
- Un feedback es único por conexión y autor.
- Un reporte abierto es único por par.
- Una postulación es única por post y usuario.
- Un post acepta como máximo 10 postulaciones pendientes.
- Crear una conexión cierra las disponibilidades activas de ambos con motivo `matched`.
- Nunca se expone `email`, `riot_id` ni `discord_tag` en un perfil público.
- Nunca se guardan Riot IDs históricos.

## 6. Soft delete y retención

| Entidad                 | Borrado                                              |
| ----------------------- | ---------------------------------------------------- |
| `users`                 | Soft delete; email y username quedan reservados      |
| `player_profiles`       | Soft delete en cascada lógica con el usuario         |
| `availability_sessions` | Estado `closed`; historial se conserva para métricas |
| `duo_likes`             | Estado `cancelled`; puede purgarse si está vencido   |
| `duo_connections`       | Estado `archived`; no se borra                       |
| `duo_posts`             | Estado `cancelled`, `filled` o `expired`             |
| `post_applications`     | Estado `withdrawn`, `rejected` o `accepted`          |
| `invites`               | Estado `expired`, `declined` o `cancelled`           |
| `blocks`                | `is_deleted = true` al desbloquear                   |
| `reports`               | No se borra; se resuelve                             |
| `feedbacks`             | Inmutable; no se borra                               |
| `notifications`         | Puede borrarse físicamente a pedido del usuario      |
| `metrics_events`        | Inmutable; retención agregada                        |
| `errors`                | Retención operativa; no se expone al cliente         |

## 7. Seeds

- Admin desde `ADMIN_EMAIL` y `ADMIN_PASSWORD`.
- 12 jugadores LAS con distribución de tiers, roles, horarios e idiomas.
- 2 conexiones activas con feedback pendiente.
- 1 invitación pendiente.
- 1 post activo con 2 postulaciones.
- 1 reporte abierto.
- Todos idempotentes por email o username.
