import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import sequelize from '../config/database/database.js';
import { runMigrations } from '../config/database/migrator.js';
import ErrorLog from '../modules/logs/errorLog.model.js';
import { errorLogService } from '../modules/logs/errorLog.service.js';

beforeAll(async () => {
  try {
    await sequelize.authenticate();
  } catch (_error) {
    throw new Error(
      'La base de datos de test no está disponible. Levantá PostgreSQL con npm run docker:up.'
    );
  }

  await runMigrations();
});

describe('Health', () => {
  it('GET /health responde ok con la base conectada', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.database).toBe('connected');
    expect(res.headers['x-request-id']).toBeTruthy();
  });

  it('GET /api/v1 responde con el mensaje de la API', async () => {
    const res = await request(app).get('/api/v1');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
  });

  it('una ruta inexistente devuelve el envelope de error', async () => {
    const res = await request(app).get('/ruta-inexistente');

    expect(res.status).toBe(404);
    expect(res.body.status).toBe('fail');
    expect(res.body.message).toContain('/ruta-inexistente');
  });

  it('persiste errores con redacción de datos sensibles', async () => {
    const error = new Error('Falló para test@example.com con Bearer abc.def.ghi');

    await errorLogService.log(error, {
      method: 'GET',
      originalUrl: '/ruta?token=secreto',
      ip: '127.0.0.1',
      get: () => 'test-agent',
    });

    const log = await ErrorLog.findOne({ order: [['createdAt', 'DESC']] });

    expect(log).toBeTruthy();
    expect(log.message).toContain('[email]');
    expect(log.message).not.toContain('test@example.com');
    expect(log.message).not.toContain('abc.def.ghi');
    expect(log.path).toBe('/ruta');
  });
});
