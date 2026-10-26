# ROUTES — Duo LAS

Mapa de rutas disponibles para probar la app y la API. Estado al cierre de F2.

## URLs

| Servicio   | URL                            |
| ---------- | ------------------------------ |
| Web        | `http://localhost:5173`        |
| API        | `http://localhost:3000`        |
| Health     | `http://localhost:3000/health` |
| PostgreSQL | `localhost:5433`               |

Levantar todo:

```bash
npm run docker:app
npm run seed
```

## 1. Rutas de la web

### Públicas

| Ruta               | Estado      | Qué probar                                                |
| ------------------ | ----------- | --------------------------------------------------------- |
| `/`                | Lista       | Hero, carrusel de 4 slides, cards de ejemplo y CTAs       |
| `/login`           | Lista       | Login, toggle de contraseña y link de recuperación        |
| `/register`        | Lista       | Registro, +18, términos y campos de contraseña con toggle |
| `/verify-email`    | Lista       | Verificación con `?token=...`                             |
| `/forgot-password` | Lista       | Pedido de reset                                           |
| `/reset-password`  | Lista       | Reset con `?token=...`                                    |
| `/terminos`        | Placeholder | Página legal provisoria                                   |
| `/privacidad`      | Placeholder | Página legal provisoria                                   |

### Protegidas

| Ruta          | Estado | Qué probar                                               |
| ------------- | ------ | -------------------------------------------------------- |
| `/onboarding` | Lista  | Perfil completo, edición y guardado                      |
| `/inicio`     | Lista  | Perfil propio, carrusel, jugadores compatibles y matches |
| `/match`      | Lista  | Filtros, candidatos, like, pasar y bloquear              |
| `/matches`    | Lista  | Contacto Riot ID/Discord, copiar, archivar y bloquear    |
| `*`           | Lista  | Página 404                                               |

### Todavía no implementadas

Estas rutas están en el plan pero hoy caen en 404:

- `/disponible`
- `/busco-1`
- `/invitaciones`
- `/notificaciones`
- `/perfil`
- `/perfil/:id`
- `/admin/reportes`
- `/admin/metrics`

Las funcionalidades de la API para notificaciones, bloqueos y perfiles públicos ya existen, pero no todas tienen pantalla propia.

## 2. API

Base: `http://localhost:3000/api/v1`. Las rutas protegidas usan `Authorization: Bearer <token>`.

### Públicas

| Método | Ruta                           | Descripción                |
| ------ | ------------------------------ | -------------------------- |
| GET    | `/health`                      | Estado de la API y la base |
| GET    | `/api/v1`                      | Mensaje de la API          |
| POST   | `/auth/register`               | Registro +18 con términos  |
| POST   | `/auth/login`                  | Login por email o username |
| POST   | `/auth/forgot-password`        | Pedido de reset genérico   |
| POST   | `/auth/reset-password`         | Reset con token            |
| GET    | `/auth/verify-email?token=...` | Verificación de email      |

### Autenticadas

| Método | Ruta                          | Descripción                    |
| ------ | ----------------------------- | ------------------------------ |
| GET    | `/auth/profile`               | Cuenta autenticada             |
| PATCH  | `/auth/change-password`       | Cambio de contraseña           |
| POST   | `/auth/resend-verification`   | Reenvío de verificación        |
| GET    | `/profiles/me`                | Perfil propio                  |
| PATCH  | `/profiles/me`                | Crear o editar perfil          |
| GET    | `/profiles/:id`               | Perfil público de otro jugador |
| GET    | `/notifications`              | Notificaciones y no leídas     |
| GET    | `/notifications/unread-count` | Contador de no leídas          |
| PATCH  | `/notifications/read-all`     | Marcar todas como leídas       |
| PATCH  | `/notifications/:id/read`     | Marcar una como leída          |
| DELETE | `/notifications/:id`          | Borrar una notificación propia |

### Matching

Requieren usuario autenticado, email verificado y perfil completo.

| Método | Ruta                                                    | Descripción                     |
| ------ | ------------------------------------------------------- | ------------------------------- |
| GET    | `/matching/candidates?queue=solo_duo&role=mid&limit=20` | Candidatos con score y motivos  |
| POST   | `/matching/likes`                                       | Dar like con `{ targetUserId }` |
| DELETE | `/matching/likes/:targetUserId`                         | Retirar like pendiente          |
| GET    | `/matching/likes`                                       | Likes salientes                 |
| GET    | `/matching/matches`                                     | Matches activos                 |
| GET    | `/matching/matches/:id`                                 | Detalle de un match             |
| POST   | `/matching/matches/:id/archive`                         | Archivar match                  |

### Bloqueos

Requieren usuario autenticado y email verificado.

| Método | Ruta              | Descripción               |
| ------ | ----------------- | ------------------------- |
| GET    | `/blocks`         | Usuarios bloqueados       |
| POST   | `/blocks`         | Bloquear con `{ userId }` |
| DELETE | `/blocks/:userId` | Desbloquear               |

### Pendientes de F3+

Todavía no existen endpoints para:

- Disponibilidad y TTL.
- Invitaciones.
- Busco 1 y postulaciones.
- Reportes y feedback.
- SSE y push.
- Admin y métricas.

## 3. Flujos para testear

### Flujo 1 — Público

1. Abrir `/`.
2. Ver el carrusel, cambiar de slide con flechas y dots.
3. Abrir `/terminos` y `/privacidad`.
4. Abrir una ruta inexistente y ver el 404.

### Flujo 2 — Cuenta y login

1. Abrir `/register` y probar el toggle de contraseña.
2. Crear una cuenta con +18 y términos.
3. Verificar el email con el token o usar una cuenta demo ya verificada.
4. Cerrar sesión y entrar desde `/login`.
5. Probar el ojo para mostrar/ocultar contraseña.
6. Probar el link “¿Has olvidado tu contraseña?”.
7. Abrir una ruta protegida sin sesión y confirmar un solo redirect a `/login`.

### Flujo 3 — Perfil

1. Entrar con una cuenta sin perfil y abrir `/onboarding`.
2. Completar Riot ID, roles, rango, horarios, idioma, mic y estilo.
3. Guardar y confirmar `/inicio`.
4. Editar un campo y guardar.
5. Abrir `/profiles/me` por API y confirmar Riot ID y Discord propios.
6. Abrir `/profiles/:id` por API y confirmar que no expone email, Riot ID ni Discord.

### Flujo 4 — Match

1. Entrar con `demo_mid`.
2. Abrir `/match` y ver `demo_adc` y `demo_support`.
3. Cambiar la cola y el filtro de rol.
4. Dar like a `demo_adc`: hay un like pendiente, así que el match se concreta.
5. Confirmar que aparece en `/matches`.
6. Probar like a `demo_support` y retirarlo.
7. Probar bloquear y desbloquear.

### Flujo 5 — Contacto y matches

1. Abrir `/matches` con `demo_mid`.
2. Copiar el Riot ID de `demo_jungle`.
3. Archivar el match y confirmar que desaparece.
4. Volver a dar like desde `/match` para reactivarlo.
5. Bloquear al contacto y confirmar que desaparece.
6. Correr `npm run seed` para reiniciar el escenario.

### Flujo 6 — Multiusuario

1. Abrir `http://localhost:5173` en una ventana normal con `demo_mid`.
2. Abrir una ventana incógnita con `demo_jungle` y ver el mismo match desde el otro lado.
3. Abrir otra incógnita con `demo_adc` y probar su flujo.
4. Confirmar que cada uno ve solo sus matches y contactos.

### Flujo 7 — Recuperación de contraseña

1. Abrir `/forgot-password` con el email de una cuenta.
2. Confirmar la respuesta genérica.
3. Sin Resend configurado no llega email; usar el token de prueba de la sección 5.
4. Abrir `/reset-password?token=...`, cambiar la contraseña y entrar con la nueva.
5. Correr `npm run seed` para restaurar la contraseña demo.

### Flujo 8 — API directa

1. Hacer login con `POST /api/v1/auth/login`.
2. Usar el token para `GET /api/v1/profiles/me`.
3. Probar `GET /api/v1/matching/candidates`.
4. Probar `POST /api/v1/matching/likes`.
5. Probar `GET /api/v1/matching/matches`.
6. Probar notificaciones y bloqueos.

## 4. Cuentas demo

| Cuenta                    | Contraseña   | Rol en la demo                  |
| ------------------------- | ------------ | ------------------------------- |
| `demo_mid@duolas.app`     | `Demo12345!` | Cuenta principal                |
| `demo_jungle@duolas.app`  | `Demo12345!` | Match activo con `demo_mid`     |
| `demo_adc@duolas.app`     | `Demo12345!` | Like pendiente hacia `demo_mid` |
| `demo_support@duolas.app` | `Demo12345!` | Candidato adicional             |

`npm run seed` reinicia perfiles, likes, matches, bloqueos y notificaciones de estas cuentas.

## 5. Tokens sin Resend

Verificación de email de una cuenta registrada:

```bash
docker exec duo-lol-fullstack-postgres-1 psql -U duo_lol -d duo_lol -tAc \
  "SELECT email_verification_token FROM users WHERE email='tu@email.com';"
```

Luego abrir:

```text
http://localhost:5173/verify-email?token=TOKEN
```

Reset de contraseña de prueba:

```bash
node -e "console.log(require('node:crypto').createHash('sha256').update('demoreset123').digest('hex'))"
```

```bash
docker exec duo-lol-fullstack-postgres-1 psql -U duo_lol -d duo_lol -c \
  "UPDATE users SET password_reset_token='HASH', password_reset_expires=now()+interval '1 hour' WHERE email='demo_mid@duolas.app';"
```

Abrir:

```text
http://localhost:5173/reset-password?token=demoreset123
```

El token de reset se guarda hasheado; el valor plano es el que va en el link. `npm run seed` restaura la contraseña demo.
