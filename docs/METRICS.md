# METRICS — Duo LAS

Definiciones y consultas de los cuatro KPIs del MVP. Todo se calcula server-side desde `metrics_events`, sin tracking de terceros.

## 1. Principios

- Un evento por acción de negocio, no por request.
- `user_id` siempre que exista; nunca email, Riot ID, Discord ni texto libre.
- `metadata` solo con IDs y enums.
- El registro es fire-and-forget: si falla, no rompe la acción principal.
- Fechas en UTC; los reportes se muestran en ART.
- Los eventos son inmutables.

## 2. Taxonomía

| Evento                      | Cuándo                            | Metadata                                  |
| --------------------------- | --------------------------------- | ----------------------------------------- |
| `user_registered`           | Registro exitoso                  | `{}`                                      |
| `email_verified`            | Primer verificado de email        | `{}`                                      |
| `profile_completed`         | Transición a perfil completo      | `{ rankTier }`                            |
| `availability_opened`       | Nueva disponibilidad              | `{ queue, roles, ttlMinutes }`            |
| `availability_closed`       | Cierre manual, expiración o match | `{ reason, queue }`                       |
| `like_sent`                 | Like nuevo, no idempotente        | `{ targetUserId }`                        |
| `match_created`             | Nueva fila de conexión            | `{ connectionId, source, otherUserId }`   |
| `contact_revealed`          | Se revela contacto                | `{ connectionId, reactivated }`           |
| `invite_sent`               | Invitación nueva                  | `{ inviteId, targetUserId, role }`        |
| `invite_accepted`           | Invitación aceptada               | `{ inviteId, connectionId }`              |
| `post_created`              | Post de Busco 1                   | `{ postId, queue, rolesNeeded }`          |
| `application_sent`          | Postulación                       | `{ postId, applicationId }`               |
| `application_accepted`      | Postulación aceptada              | `{ postId, applicationId, connectionId }` |
| `aram_post_created`         | Publicación ARAM creada           | `{ mode, playersPresent, slotsNeeded }`   |
| `aram_application_sent`     | Solicitud ARAM enviada            | `{ postId, applicationId }`               |
| `aram_application_accepted` | Solicitud ARAM aceptada           | `{ postId, applicationId, connectionId }` |
| `feedback_submitted`        | Feedback enviado                  | `{ connectionId, sentiment }`             |
| `feedback_revealed`         | Feedback visible                  | `{ connectionId }`                        |
| `report_created`            | Reporte                           | `{ reportId, reason, priority }`          |
| `user_suspended`            | Sanción aplicada                  | `{ days, permanent }`                     |
| `push_subscribed`           | Suscripción push                  | `{ endpointHash }`                        |

`match_created` se emite solo cuando se crea la fila. Una reactivación de conexión archivada no cuenta como match nuevo para los KPIs; emite `contact_revealed` con `reactivated: true`.

## 3. KPI 1 — Tiempo hasta el primer duo

**Definición:** mediana de horas entre el alta del jugador y su primera conexión.

```sql
WITH first_connection AS (
  SELECT
    u.users_id,
    u.created_at,
    MIN(c.created_at) AS first_connection_at
  FROM users u
  JOIN duo_connections c
    ON u.users_id IN (c.user_low_id, c.user_high_id)
  WHERE u.role = 'player'
    AND u.is_deleted = false
  GROUP BY u.users_id, u.created_at
  HAVING MIN(c.created_at) >= $1
    AND MIN(c.created_at) < $2
)
SELECT
  percentile_cont(0.5) WITHIN GROUP (
    ORDER BY EXTRACT(EPOCH FROM (first_connection_at - created_at)) / 3600
  ) AS median_hours,
  count(*) AS players
FROM first_connection;
```

## 4. KPI 2 — Match que termina en partida

**Definición:** proporción de conexiones con al menos 48 horas de antigüedad que tienen al menos un feedback.

```sql
WITH eligible AS (
  SELECT
    dc.duo_connections_id,
    EXISTS (
      SELECT 1
      FROM feedbacks f
      WHERE f.connection_id = dc.duo_connections_id
    ) AS played
  FROM duo_connections dc
  WHERE dc.created_at >= $1
    AND dc.created_at < $2
    AND dc.created_at <= now() - interval '48 hours'
)
SELECT
  count(*) FILTER (WHERE played)::numeric / NULLIF(count(*), 0) AS rate,
  count(*) FILTER (WHERE played) AS played,
  count(*) AS eligible
FROM eligible;
```

## 5. KPI 3 — Retención a 7 días

**Definición:** de los jugadores registrados en la cohorte, cuántos tuvieron actividad entre el día 7 y el 13 inclusive. Solo se incluyen cohortes que ya completaron la ventana de 14 días.

```sql
WITH cohort AS (
  SELECT users_id, created_at
  FROM users
  WHERE role = 'player'
    AND is_deleted = false
    AND created_at >= $1
    AND created_at < $2
    AND created_at <= now() - interval '14 days'
),
active AS (
  SELECT DISTINCT c.users_id
  FROM cohort c
  JOIN metrics_events e ON e.user_id = c.users_id
  WHERE e.created_at >= c.created_at + interval '7 days'
    AND e.created_at < c.created_at + interval '14 days'
)
SELECT
  count(a.users_id)::numeric / NULLIF(count(c.users_id), 0) AS rate,
  count(a.users_id) AS retained,
  count(c.users_id) AS cohort_size
FROM cohort c
LEFT JOIN active a ON a.users_id = c.users_id;
```

## 6. KPI 4 — Usuarios simultáneos en Disponible ya

**Definición:** máximo y p95 de disponibilidades activas simultáneamente en el rango. Se calcula con los intervalos `started_at` / `ended_at`; las sesiones abiertas se cierran a `now()`.

```sql
WITH events AS (
  SELECT started_at AS ts, 1 AS delta
  FROM availability_sessions
  WHERE started_at < $2
    AND COALESCE(ended_at, now()) > $1
  UNION ALL
  SELECT COALESCE(ended_at, now()) AS ts, -1 AS delta
  FROM availability_sessions
  WHERE started_at < $2
    AND COALESCE(ended_at, now()) > $1
),
running AS (
  SELECT
    ts,
    SUM(delta) OVER (ORDER BY ts, delta DESC) AS concurrent
  FROM events
)
SELECT
  max(concurrent) AS peak,
  percentile_cont(0.95) WITHIN GROUP (ORDER BY concurrent) AS p95
FROM running;
```

Para una serie por hora, se agrupa `running` en buckets de una hora y se toma el máximo de cada bucket.

## 7. Endpoint admin

`GET /api/v1/admin/metrics/summary?from=...&to=...`

```json
{
  "status": "success",
  "range": { "from": "2026-10-01T00:00:00.000Z", "to": "2026-10-31T23:59:59.999Z" },
  "metrics": {
    "timeToFirstDuo": { "medianHours": 6.4, "players": 120 },
    "matchToGame": { "rate": 0.42, "played": 50, "eligible": 119 },
    "retention7d": { "rate": 0.31, "retained": 37, "cohortSize": 120 },
    "concurrentAvailability": { "peak": 48, "p95": 33 }
  }
}
```

## 8. Instrumentación

Puntos de registro:

| Flujo                         | Evento                                                                    |
| ----------------------------- | ------------------------------------------------------------------------- |
| Registro                      | `user_registered`                                                         |
| Verificación                  | `email_verified`                                                          |
| Onboarding completado         | `profile_completed`                                                       |
| Disponibilidad creada/cerrada | `availability_opened`, `availability_closed`                              |
| Like nuevo                    | `like_sent`                                                               |
| Conexión nueva                | `match_created`, `contact_revealed`                                       |
| Invitación                    | `invite_sent`, `invite_accepted`                                          |
| Post                          | `post_created`                                                            |
| Postulación                   | `application_sent`, `application_accepted`                                |
| ARAM                          | `aram_post_created`, `aram_application_sent`, `aram_application_accepted` |
| Feedback                      | `feedback_submitted`, `feedback_revealed`                                 |
| Reporte                       | `report_created`                                                          |
| Sanción                       | `user_suspended`                                                          |
| Push                          | `push_subscribed`                                                         |

Reglas:

- No bloquear la respuesta por el registro del evento.
- No duplicar eventos en reintentos idempotentes.
- No registrar datos personales ni texto libre.
- Un fallo de métricas se loguea y se ignora.

## 9. Retención

- `metrics_events` se conserva para análisis agregado.
- No se expone a usuarios.
- No se usa para decisiones automáticas de sanción.
- Los reportes admin solo muestran agregados, nunca eventos individuales con datos personales.
