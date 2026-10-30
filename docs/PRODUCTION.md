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
- [ ] Dominio real de web y API
- [ ] URLs públicas de términos, privacidad y aviso de Riot
- [ ] Producto registrado en el Developer Portal de Riot
- [ ] Boilerplate legal exacto de Riot publicado

Además, antes de producción hay que reemplazar los valores de desarrollo:

- [ ] `NODE_ENV` a `production`
- [ ] `DB_URI` por la URL de Neon con SSL
- [ ] `CORS_ORIGIN` por el dominio real de la web
- [ ] `APP_URL` por el dominio real de la web
- [ ] `SECRET_JWT_SEED` por un secreto nuevo y aleatorio
- [ ] `VITE_API_URL` por la URL real de la API, incluyendo `/api`
- [ ] `TEST_DB_URI` no se configura en producción

## 2. Variables de la API

| Variable               | ¿Obligatoria?           | Ejemplo                                           | Dónde se obtiene             | Notas                                            |
| ---------------------- | ----------------------- | ------------------------------------------------- | ---------------------------- | ------------------------------------------------ |
| `PORT`                 | La define la plataforma | `3000`                                            | Render/Railway               | No hace falta fijarla si el proveedor la inyecta |
| `NODE_ENV`             | Sí                      | `production`                                      | Manual                       | Activa errores genéricos y rate limits estrictos |
| `TRUST_PROXY`          | No                      | `1`                                               | Render/Railway               | 1 proxy; subir si agregás Cloudflare             |
| `CORS_ORIGIN`          | Sí                      | `https://duolas.online,https://www.duolas.online` | Dominio de la web            | HTTPS obligatorio; sin wildcard                  |
| `APP_URL`              | Sí                      | `https://duolas.online`                           | Dominio de la web            | Se usa en links de email                         |
| `DB_URI`               | Sí                      | `postgresql://user:pass@host/db?sslmode=require`  | Neon                         | Usar la cadena con SSL                           |
| `TEST_DB_URI`          | No                      | —                                                 | —                            | Solo test/local; no va en producción             |
| `SECRET_JWT_SEED`      | Sí                      | `REPLACE_WITH_RANDOM_64_CHARS`                    | Generar                      | No reutilizar el de desarrollo                   |
| `JWT_EXPIRE_IN`        | No                      | `1d`                                              | Manual                       | Default `1d`                                     |
| `HCAPTCHA_SECRET`      | Sí                      | `REPLACE_WITH_HCAPTCHA_SECRET`                    | Dashboard de hCaptcha        | Si falta, el captcha se salta                    |
| `RESEND_API_KEY`       | Sí                      | `re_REPLACE_ME`                                   | Dashboard de Resend          | Si falta, no se envían emails                    |
| `OWNER_EMAIL`          | Sí                      | `noreply@duolas.online`                           | Dominio verificado en Resend | Debe ser un remitente verificado                 |
| `SUPPORT_EMAIL`        | Recomendada             | `soporte@duolas.online`                           | Dominio de la web            | Reply-to y textos de soporte                     |
| `VAPID_PUBLIC_KEY`     | Sí antes de push        | `REPLACE_WITH_VAPID_PUBLIC`                       | Generar                      | Fase 5                                           |
| `VAPID_PRIVATE_KEY`    | Sí antes de push        | `REPLACE_WITH_VAPID_PRIVATE`                      | Generar                      | Secreto, nunca exponer                           |
| `VAPID_SUBJECT`        | Sí antes de push        | `mailto:soporte@duolas.online`                    | Dominio de la web            | Formato `mailto:`                                |
| `RIOT_API_KEY`         | Solo integración futura | `RGAPI-REPLACE_ME`                                | Developer Portal             | Solo backend; personal key no va a producción    |
| `RIOT_PLATFORM`        | Solo integración futura | `la2`                                             | Manual                       | LAS                                              |
| `RIOT_REGION`          | Solo integración futura | `americas`                                        | Manual                       | Routing regional                                 |
| `RIOT_API_TIMEOUT_MS`  | No                      | `8000`                                            | Manual                       | Timeout de llamadas                              |
| `RATE_LIMIT_WINDOW_MS` | No                      | `900000`                                          | Manual                       | Default 15 minutos                               |
| `RATE_LIMIT_MAX`       | No                      | `600`                                             | Manual                       | Por IP; default 600                              |
| `RATE_LIMIT_USER_MAX`  | No                      | `600`                                             | Manual                       | Por usuario autenticado; default 600             |
| `LOG_LEVEL`            | No                      | `info`                                            | Manual                       | Usar `info` en producción                        |
| `ADMIN_EMAIL`          | Solo seed               | `admin@duolas.online`                             | Manual                       | Se usa al correr `npm run seed:admin`            |
| `ADMIN_PASSWORD`       | Solo seed               | `REPLACE_WITH_STRONG_PASSWORD`                    | Manual                       | Quitarla después del seed                        |

## 3. Variables de la web

| Variable                 | ¿Obligatoria? | Ejemplo                         | Dónde se configura | Notas                              |
| ------------------------ | ------------- | ------------------------------- | ------------------ | ---------------------------------- |
| `VITE_API_URL`           | Sí            | `https://api.duolas.online/api` | Vercel             | **Incluye `/api`**; es build-time  |
| `VITE_HCAPTCHA_SITE_KEY` | Sí            | `REPLACE_WITH_SITE_KEY`         | Vercel             | Es pública; el secret va en la API |

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
| Riot Developer   | Producto registrado y production key    | Integración futura, no MVP               |
| Dominio y DNS    | Dominio de web y API                    | `APP_URL`, `CORS_ORIGIN`, `VITE_API_URL` |

No se necesitan en el MVP: Redis, R2, Cloudinary, Mercado Pago ni RSO. La Riot API queda fuera del MVP; la preparación y el checklist de la key están en `docs/RIOT-INTEGRATION.md`.

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

### Probar emails con el modo test de Resend

Sin un dominio verificado, Resend solo permite enviar desde `onboarding@resend.dev` a la casilla dueña de la cuenta. Para revisar las tres plantillas:

1. En `apps/api/.env` configurar `RESEND_API_KEY`, `OWNER_EMAIL=onboarding@resend.dev` y `TEST_EMAIL_TO` con la casilla dueña de Resend.
2. Mantener `APP_URL=http://localhost:5173` para que los links apunten al entorno local.
3. Correr:

```bash
npm run mail:test --workspace @duo-las/api -- tu-casilla@dominio.com
```

El script envía verificación, reset y suspensión con tokens de prueba. Sirve para validar asunto, diseño, links, textos y reply-to, no para completar el flujo real. Para probar el flujo completo, registrar un usuario local con la misma casilla y usar el link real.

Al pasar a producción: verificar el dominio en Resend, cambiar `OWNER_EMAIL` a `noreply@dominio`, quitar `TEST_EMAIL_TO` y redeployar la API. `SUPPORT_EMAIL` se usa como reply-to y en el pie de los emails.

## 6. Checklist de deploy

- [ ] Definir titular legal, dominio y correo de soporte.
- [ ] Publicar URLs estables de términos, privacidad y aviso de Riot.
- [ ] Confirmar que el boilerplate legal exacto de Riot esté visible.
- [ ] Registrar el producto en el Developer Portal de Riot, aunque no use API.
- [ ] Crear la base en Neon y copiar la connection string con `sslmode=require`.
- [ ] Cargar todas las variables de la API en Render/Railway.
- [ ] Confirmar `NODE_ENV=production`.
- [ ] Confirmar `CORS_ORIGIN` y `APP_URL` con los dominios finales. La API falla al iniciar si falta un secreto obligatorio de producción.
- [ ] Confirmar que `SECRET_JWT_SEED` no sea el de desarrollo.
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
- [ ] Perfil público no muestra email, Riot ID, Discord ni WhatsApp.
- [ ] Forgot/reset envía email y permite cambiar la contraseña.
- [ ] Una request sin token devuelve 401 y no genera loops.
- [ ] La web carga en mobile y desktop.
- [ ] Push llega con la PWA instalada.
- [ ] Términos, privacidad y aviso de Riot cargan por URL directa.
- [ ] El aviso legal exacto de Riot se ve en el footer y en legales.
- [ ] El sitio público no contiene una API key ni un `VITE_RIOT_*`.
- [ ] Eliminar cuenta pide contraseña, cierra la sesión y muestra el plazo de 30 días.
- [ ] Volver a iniciar sesión antes del plazo recupera la cuenta.
- [ ] El barrido de cuentas vencidas está corriendo en la API.

## 8. Notas de seguridad

- La API valida al arrancar que producción tenga `APP_URL`, CORS HTTPS sin localhost ni wildcard, secreto JWT nuevo, `RESEND_API_KEY`, `OWNER_EMAIL`, `HCAPTCHA_SECRET` y VAPID.
- Contraseñas de usuario de 10 a 128 caracteres; admin de 20+.
- Login tiene límite por credencial (10 fallos/15 min) además del límite por IP; un usuario inexistente compara un hash dummy para no filtrar timing.
- Verificación de email y reset guardan solo el SHA-256 del token.
- La web en Vercel aplica CSP, HSTS, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy`, `X-Content-Type-Options` y CORP.
- El CSP permite `connect-src https:` para no hardcodear el dominio de la API. Después del deploy, conviene restringirlo al dominio real en `apps/web/vercel.json`.
- `npm audit --omit=dev` queda con 2 moderadas de `uuid` vía Sequelize. La ruta vulnerable (buffers en v3/v5/v6) no la usa Sequelize; se revisa al actualizar Sequelize 7.
- `SECRET_JWT_SEED`, `DB_URI`, `RESEND_API_KEY`, `HCAPTCHA_SECRET`, `VAPID_PRIVATE_KEY`, `RIOT_API_KEY` y `ADMIN_PASSWORD` son secretos.
- `VITE_HCAPTCHA_SITE_KEY` y `VAPID_PUBLIC_KEY` son públicos.
- Nunca crear variables `VITE_RIOT_*`: expondrían la key en el bundle de la web.
- No commitear `.env`, `.env.production` ni logs.
- No loguear tokens de verificación, reset, tickets SSE ni emails completos.
- Los requests exitosos quedan en nivel `debug`; con `LOG_LEVEL=info` solo se ven fallos, errores y requests de más de 1,5 s.
- Si `HCAPTCHA_SECRET` falta, el captcha se salta: no deployar así.
- Si `RESEND_API_KEY` falta, los emails se omiten: no deployar así.
- Los rate limits en memoria asumen una sola instancia. Si se escala, mover el store a Redis.
- Los headers de seguridad no reemplazan un WAF: usar Cloudflare o el edge del proveedor para DDoS.

## 9. Release público sin Riot API

Duo LAS puede lanzarse con rango declarado y `RankIcon` propio sin esperar la production key.

Reglas del release:

- No usar crests oficiales ni el logo de League.
- No mostrar un check de “verificado por Riot”.
- No usar una personal key en el sitio público.
- Registrar el producto en el Developer Portal.
- Mantener `docs/RIOT-INTEGRATION.md` actualizado.
- Aplicar a production key en paralelo, sin bloquear el lanzamiento.

Cuando Riot apruebe la key, la integración se prueba primero en desarrollo/staging con una key de desarrollo o personal. La production key se usa únicamente en el producto público aprobado.
