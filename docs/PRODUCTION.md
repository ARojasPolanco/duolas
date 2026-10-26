# PRODUCTION — Duo LAS

Checklist de variables de entorno, claves y servicios externos para el deploy. Nunca se commitean valores reales: los ejemplos usan `REPLACE_ME` o dominios placeholder.

Los ejemplos listos para copiar están en:

- `apps/api/.env.production.example`
- `apps/web/.env.production.example`

## 1. Faltantes actuales

En el `.env` de desarrollo local hoy faltan o están vacías:

- [ ] `HCAPTCHA_SECRET`
- [ ] `RESEND_API_KEY`
- [ ] `OWNER_EMAIL`
- [ ] `VAPID_PUBLIC_KEY`
- [ ] `VAPID_PRIVATE_KEY`
- [ ] `ADMIN_EMAIL` (solo para el seed de admin)
- [ ] `ADMIN_PASSWORD` (solo para el seed de admin)
- [ ] `VITE_API_URL` en la web
- [ ] `VITE_HCAPTCHA_SITE_KEY` en la web

Además, antes de producción hay que reemplazar los valores de desarrollo:

- [ ] `NODE_ENV` a `production`
- [ ] `DB_URI` por la URL de Neon con SSL
- [ ] `CORS_ORIGIN` por el dominio real de la web
- [ ] `APP_URL` por el dominio real de la web
- [ ] `SECRET_JWT_SEED` por un secreto nuevo y aleatorio
- [ ] `VITE_API_URL` por la URL real de la API, incluyendo `/api`
- [ ] `TEST_DB_URI` no se configura en producción

## 2. Variables de la API

| Variable               | ¿Obligatoria?           | Ejemplo                                          | Dónde se obtiene             | Notas                                            |
| ---------------------- | ----------------------- | ------------------------------------------------ | ---------------------------- | ------------------------------------------------ |
| `PORT`                 | La define la plataforma | `3000`                                           | Render/Railway               | No hace falta fijarla si el proveedor la inyecta |
| `NODE_ENV`             | Sí                      | `production`                                     | Manual                       | Activa errores genéricos y rate limits estrictos |
| `CORS_ORIGIN`          | Sí                      | `https://duolas.app,https://www.duolas.app`      | Dominio de la web            | Sin barra final; separar por coma                |
| `APP_URL`              | Sí                      | `https://duolas.app`                             | Dominio de la web            | Se usa en links de email                         |
| `DB_URI`               | Sí                      | `postgresql://user:pass@host/db?sslmode=require` | Neon                         | Usar la cadena con SSL                           |
| `TEST_DB_URI`          | No                      | —                                                | —                            | Solo test/local; no va en producción             |
| `SECRET_JWT_SEED`      | Sí                      | `REPLACE_WITH_RANDOM_64_CHARS`                   | Generar                      | No reutilizar el de desarrollo                   |
| `JWT_EXPIRE_IN`        | No                      | `1d`                                             | Manual                       | Default `1d`                                     |
| `HCAPTCHA_SECRET`      | Sí                      | `REPLACE_WITH_HCAPTCHA_SECRET`                   | Dashboard de hCaptcha        | Si falta, el captcha se salta                    |
| `RESEND_API_KEY`       | Sí                      | `re_REPLACE_ME`                                  | Dashboard de Resend          | Si falta, no se envían emails                    |
| `OWNER_EMAIL`          | Sí                      | `noreply@duolas.app`                             | Dominio verificado en Resend | Debe ser un remitente verificado                 |
| `SUPPORT_EMAIL`        | Recomendada             | `soporte@duolas.app`                             | Dominio de la web            | Reply-to y textos de soporte                     |
| `VAPID_PUBLIC_KEY`     | Sí antes de push        | `REPLACE_WITH_VAPID_PUBLIC`                      | Generar                      | Fase 5                                           |
| `VAPID_PRIVATE_KEY`    | Sí antes de push        | `REPLACE_WITH_VAPID_PRIVATE`                     | Generar                      | Secreto, nunca exponer                           |
| `VAPID_SUBJECT`        | Sí antes de push        | `mailto:soporte@duolas.app`                      | Dominio de la web            | Formato `mailto:`                                |
| `RATE_LIMIT_WINDOW_MS` | No                      | `900000`                                         | Manual                       | Default 15 minutos                               |
| `RATE_LIMIT_MAX`       | No                      | `100`                                            | Manual                       | Default 100                                      |
| `LOG_LEVEL`            | No                      | `info`                                           | Manual                       | Usar `info` en producción                        |
| `ADMIN_EMAIL`          | Solo seed               | `admin@duolas.app`                               | Manual                       | Se usa al correr `npm run seed:admin`            |
| `ADMIN_PASSWORD`       | Solo seed               | `REPLACE_WITH_STRONG_PASSWORD`                   | Manual                       | Quitarla después del seed                        |

## 3. Variables de la web

| Variable                 | ¿Obligatoria? | Ejemplo                      | Dónde se configura | Notas                              |
| ------------------------ | ------------- | ---------------------------- | ------------------ | ---------------------------------- |
| `VITE_API_URL`           | Sí            | `https://api.duolas.app/api` | Vercel             | **Incluye `/api`**; es build-time  |
| `VITE_HCAPTCHA_SITE_KEY` | Sí            | `REPLACE_WITH_SITE_KEY`      | Vercel             | Es pública; el secret va en la API |

`VITE_*` se inyecta al construir. Después de cambiarlas hay que redeployar la web.

## 4. Servicios externos y credenciales

| Servicio         | Qué se necesita                         | Dónde se usa                             |
| ---------------- | --------------------------------------- | ---------------------------------------- |
| GitHub           | Remoto `ARojasPolanco/duolas`           | Ya conectado                             |
| Neon             | Connection string de PostgreSQL con SSL | `DB_URI`                                 |
| Render o Railway | Host de la API y variables de entorno   | API                                      |
| Vercel           | Proyecto de la web y variables `VITE_*` | Web                                      |
| Resend           | API key y dominio verificado            | Verificación y reset                     |
| hCaptcha         | Site key y secret                       | Registro                                 |
| Web Push VAPID   | Par de claves y subject                 | Push de Fase 5                           |
| Dominio y DNS    | Dominio de web y API                    | `APP_URL`, `CORS_ORIGIN`, `VITE_API_URL` |

No se necesitan en el MVP: Redis, R2, Cloudinary, Mercado Pago, Riot API/RSO ni credenciales de Riot.

## 5. Cómo generar los secretos

JWT:

```bash
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

VAPID:

```bash
npx web-push generate-vapid-keys
```

La API key de Resend y las claves de hCaptcha se copian desde sus dashboards. El password del admin se genera con un gestor de contraseñas y debe tener 20+ caracteres.

## 6. Checklist de deploy

- [ ] Crear la base en Neon y copiar la connection string con `sslmode=require`.
- [ ] Cargar todas las variables de la API en Render/Railway.
- [ ] Confirmar `NODE_ENV=production`.
- [ ] Confirmar `CORS_ORIGIN` y `APP_URL` con los dominios finales.
- [ ] Generar un `SECRET_JWT_SEED` nuevo.
- [ ] Verificar el dominio en Resend y configurar `OWNER_EMAIL`.
- [ ] Cargar `RESEND_API_KEY` y `SUPPORT_EMAIL`.
- [ ] Cargar `HCAPTCHA_SECRET`.
- [ ] Generar y cargar `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` y `VAPID_SUBJECT`.
- [ ] Deployar la API y confirmar que las migraciones corren.
- [ ] Verificar `GET /health` con `database: connected`.
- [ ] Correr `npm run seed:admin` con `ADMIN_EMAIL` y `ADMIN_PASSWORD`.
- [ ] Quitar `ADMIN_PASSWORD` del entorno después del seed.
- [ ] Cargar `VITE_API_URL` y `VITE_HCAPTCHA_SITE_KEY` en Vercel.
- [ ] Redeployar la web.
- [ ] Confirmar que `VITE_API_URL` termina en `/api`.
- [ ] Probar registro, verificación de email, login, onboarding y perfil público.
- [ ] Probar forgot/reset y confirmar que el email llega.
- [ ] Confirmar que hCaptcha aparece en producción.
- [ ] Confirmar CORS desde la web real.
- [ ] Revisar que no haya `.env` ni secretos en el repositorio.
- [ ] Rotar cualquier secreto que se haya pegado en un chat o log.

## 7. Smoke post-deploy

- [ ] `GET /health` responde 200.
- [ ] Registro con +18 y captcha.
- [ ] Llega el email de verificación y el link funciona.
- [ ] Login y refresh de página mantienen la sesión.
- [ ] Onboarding guarda el perfil y `profileCompleted` pasa a true.
- [ ] Perfil público no muestra email, Riot ID ni Discord.
- [ ] Forgot/reset envía email y permite cambiar la contraseña.
- [ ] Una request sin token devuelve 401 y no genera loops.
- [ ] La web carga en mobile y desktop.
- [ ] Push llega con la PWA instalada.

## 8. Notas de seguridad

- `SECRET_JWT_SEED`, `DB_URI`, `RESEND_API_KEY`, `HCAPTCHA_SECRET`, `VAPID_PRIVATE_KEY` y `ADMIN_PASSWORD` son secretos.
- `VITE_HCAPTCHA_SITE_KEY` y `VAPID_PUBLIC_KEY` son públicos.
- No commitear `.env`, `.env.production` ni logs.
- No loguear tokens de verificación, reset, tickets SSE ni emails completos.
- Si `HCAPTCHA_SECRET` falta, el captcha se salta: no deployar así.
- Si `RESEND_API_KEY` falta, los emails se omiten: no deployar así.
