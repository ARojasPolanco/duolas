import crypto from 'node:crypto';
import { QueryTypes } from 'sequelize';
import sequelize from '../../config/database/database.js';
import logger from '../../config/logger.js';
import MetricsEvent from './metricsEvent.model.js';

const toNumber = (value) => {
  if (value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const round = (value, digits = 4) => {
  const number = toNumber(value);
  if (number === null) return null;
  return Number(number.toFixed(digits));
};

export const hashEndpoint = (endpoint) =>
  crypto.createHash('sha256').update(endpoint).digest('hex').slice(0, 16);

export class MetricsService {
  async track(type, userId = null, metadata = {}, transaction) {
    try {
      await MetricsEvent.create({ type, userId, metadata }, { transaction });
    } catch (error) {
      logger.warn('No se pudo registrar la métrica', {
        type,
        message: error.message,
      });
    }
  }

  async summary(from, to) {
    const bind = [from, to];

    const [firstDuo] = await sequelize.query(
      `
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
        FROM first_connection
      `,
      { bind, type: QueryTypes.SELECT }
    );

    const [matchToGame] = await sequelize.query(
      `
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
        FROM eligible
      `,
      { bind, type: QueryTypes.SELECT }
    );

    const [retention] = await sequelize.query(
      `
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
        LEFT JOIN active a ON a.users_id = c.users_id
      `,
      { bind, type: QueryTypes.SELECT }
    );

    const [concurrent] = await sequelize.query(
      `
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
        FROM running
      `,
      { bind, type: QueryTypes.SELECT }
    );

    return {
      timeToFirstDuo: {
        medianHours: round(firstDuo?.median_hours, 2),
        players: Number(firstDuo?.players || 0),
      },
      matchToGame: {
        rate: round(matchToGame?.rate),
        played: Number(matchToGame?.played || 0),
        eligible: Number(matchToGame?.eligible || 0),
      },
      retention7d: {
        rate: round(retention?.rate),
        retained: Number(retention?.retained || 0),
        cohortSize: Number(retention?.cohort_size || 0),
      },
      concurrentAvailability: {
        peak: toNumber(concurrent?.peak) || 0,
        p95: round(concurrent?.p95, 2) || 0,
      },
    };
  }
}

export const metricsService = new MetricsService();
