# ROUTES — Duo LAS

Mapa de rutas disponibles para probar la app y la API. Estado al cierre de F6.

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

| Ruta                | Estado | Qué probar                                                |
| ------------------- | ------ | --------------------------------------------------------- |
| `/`                 | Lista  | Hero, carrusel de 4 slides, cards de ejemplo y CTAs       |
| `/como-funciona`    | Lista  | Guía de Match, Disponible, Busco 1, Flex y push           |
| `/login`            | Lista  | Login, toggle de contraseña y link de recuperación        |
| `/register`         | Lista  | Registro, +18, términos y campos de contraseña con toggle |
| `/verify-email`     | Lista  | Verificación con `?token=...`                             |
| `/forgot-password`  | Lista  | Pedido de reset                                           |
| `/reset-password`   | Lista  | Reset con `?token=...`                                    |
| `/terminos`         | Lista  | Términos de uso                                           |
| `/privacidad`       | Lista  | Política de privacidad                                    |
| `/aviso-riot`       | Lista  | Aviso de no afiliación con Riot                           |
| `/cuenta-eliminada` | Lista  | Baja programada, recuperación y cierre de sesión          |

### Protegidas

| Ruta                  | Estado | Qué probar                                               |
| --------------------- | ------ | -------------------------------------------------------- |
| `/onboarding`         | Lista  | Perfil completo, edición y guardado                      |
| `/solicitud-username` | Lista  | Solicitud de cambio de nombre y propuesta del usuario    |
| `/inicio`             | Lista  | Perfil propio, carrusel, jugadores compatibles y matches |
| `/match`              | Lista  | Filtros, candidatos, like, pasar y bloquear              |
| `/aram`               | Lista  | Publicar grupo, ponerse disponible, postular y aceptar   |
| `/disponible`         | Lista  | Abrir/cerrar disponibilidad, TTL, filtros e invitar      |
| `/invitaciones`       | Lista  | Recibidas/enviadas, aceptar, rechazar y cancelar         |
| `/busco-1`            | Lista  | Publicar, explorar, postularse y gestionar postulaciones |
| `/matches`            | Lista  | Contacto, feedback doble ciego, reportar, archivar       |
| `/notificaciones`     | Lista  | Lista, contador, SSE, push y marcar leídas               |
| `/admin`              | Admin  | Resumen operativo                                        |
| `/admin/usuarios`     | Admin  | Buscador y listado de cuentas                            |
| `/admin/usuarios/:id` | Admin  | Detalle de cuenta, perfil y moderación                   |
| `/admin/reportes`     | Admin  | Reportes abiertos, advertencias y suspensiones           |
| `/admin/metrics`      | Admin  | Los 4 KPIs con filtro de fechas                          |
| `*`                   | Lista  | Página 404                                               |

### Todavía no implementadas

Estas rutas están en el plan pero hoy caen en 404:

- `/perfil`
- `/perfil/:id`

La API de perfiles públicos y bloqueos ya existe; las pantallas de perfil quedan para una fase posterior.

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

| Método | Ruta                          | Descripción                     |
| ------ | ----------------------------- | ------------------------------- |
| GET    | `/auth/profile`               | Cuenta autenticada              |
| PATCH  | `/auth/change-password`       | Cambio de contraseña            |
| DELETE | `/auth/account`               | Programar eliminación de cuenta |
| POST   | `/auth/resend-verification`   | Reenvío de verificación         |
| GET    | `/profiles/me`                | Perfil propio                   |
| PATCH  | `/profiles/me`                | Crear o editar perfil           |
| GET    | `/profiles/:id`               | Perfil público de otro jugador  |
| GET    | `/notifications`              | Notificaciones y no leídas      |
| GET    | `/notifications/unread-count` | Contador de no leídas           |
| PATCH  | `/notifications/read-all`     | Marcar todas como leídas        |
| PATCH  | `/notifications/:id/read`     | Marcar una como leída           |
| DELETE | `/notifications/:id`          | Borrar una notificación propia  |

### Matching

Requieren usuario autenticado, email verificado y perfil completo.

| Método | Ruta                                                    | Descripción                      |
| ------ | ------------------------------------------------------- | -------------------------------- |
| GET    | `/matching/candidates?queue=solo_duo&role=mid&limit=20` | Candidatos con score y motivos   |
| GET    | `/matching/reminder`                                    | Estado del recordatorio de likes |
| POST   | `/matching/likes`                                       | Dar like con `{ targetUserId }`  |
| DELETE | `/matching/likes/:targetUserId`                         | Retirar like pendiente           |
| GET    | `/matching/likes`                                       | Likes salientes                  |
| GET    | `/matching/matches`                                     | Matches activos                  |
| GET    | `/matching/matches/:id`                                 | Detalle de un match              |
| POST   | `/matching/matches/:id/archive`                         | Archivar match                   |

### Bloqueos

Requieren usuario autenticado y email verificado.

| Método | Ruta              | Descripción               |
| ------ | ----------------- | ------------------------- |
| GET    | `/blocks`         | Usuarios bloqueados       |
| POST   | `/blocks`         | Bloquear con `{ userId }` |
| DELETE | `/blocks/:userId` | Desbloquear               |

### Disponible ya e invitaciones

Requieren usuario autenticado, email verificado y perfil completo.

| Método | Ruta                         | Descripción                              |
| ------ | ---------------------------- | ---------------------------------------- |
| GET    | `/availability?queue=&role=` | Jugadores disponibles con score          |
| GET    | `/availability/me`           | Sesión activa propia o `null`            |
| POST   | `/availability`              | Abrir sesión con `roles`, `queue` y TTL  |
| DELETE | `/availability`              | Cerrar la sesión activa                  |
| POST   | `/availability/:id/invite`   | Invitar con `{ role, message }`          |
| GET    | `/invites?box=incoming       | outgoing`                                | Invitaciones recibidas o enviadas |
| POST   | `/invites/:id/accept`        | Aceptar; crea conexión y revela contacto |
| POST   | `/invites/:id/decline`       | Rechazar una invitación recibida         |
| POST   | `/invites/:id/cancel`        | Cancelar una invitación enviada          |

### Busco 1

Requieren usuario autenticado, email verificado y perfil completo.

| Método | Ruta                                                | Descripción                             |
| ------ | --------------------------------------------------- | --------------------------------------- |
| GET    | `/duo-posts?queue=&role=`                           | Publicaciones activas y vigentes        |
| GET    | `/duo-posts/mine`                                   | Propias, con postulaciones y estados    |
| POST   | `/duo-posts`                                        | Publicar cola, roles y rango            |
| GET    | `/duo-posts/:id`                                    | Detalle con perfil público del dueño    |
| DELETE | `/duo-posts/:id`                                    | Cancelar publicación propia             |
| POST   | `/duo-posts/:id/apply`                              | Postularse con `{ message }`            |
| GET    | `/duo-posts/:id/applications`                       | Postulaciones, solo dueño               |
| POST   | `/duo-posts/:id/applications/:applicationId/accept` | Aceptar; crea conexión y cierra el post |
| POST   | `/duo-posts/:id/applications/:applicationId/reject` | Rechazar postulación, solo dueño        |
| DELETE | `/duo-posts/:id/applications/:applicationId`        | Retirar postulación propia              |

### Feedback y reportes

Requieren usuario autenticado y email verificado.

| Método | Ruta                                 | Descripción                                    |
| ------ | ------------------------------------ | ---------------------------------------------- |
| GET    | `/feedback/pending`                  | Conexiones pendientes de feedback propio       |
| GET    | `/feedback/connection/:connectionId` | Feedback propio, del otro y estado de revelado |
| POST   | `/feedback`                          | Enviar feedback doble ciego                    |
| POST   | `/reports`                           | Reportar y auto-bloquear                       |

### Admin

Requiere rol `admin`.

| Método | Ruta                                       | Descripción                        |
| ------ | ------------------------------------------ | ---------------------------------- |
| GET    | `/admin/overview`                          | Resumen operativo                  |
| GET    | `/admin/users?search=&role=&account=`      | Listado paginado de cuentas        |
| GET    | `/admin/users/:id`                         | Detalle de cuenta y moderación     |
| GET    | `/admin/reports?status=&reason=&priority=` | Reportes con reportero y reportado |
| POST   | `/admin/reports/:id/resolve`               | Descartar, advertir o suspender    |
| POST   | `/admin/users/:id/warn`                    | Advertencia directa                |
| POST   | `/admin/users/:id/suspend`                 | Suspensión 7/30 días o permanente  |

### Realtime y push

| Método | Ruta                        | Descripción                      |
| ------ | --------------------------- | -------------------------------- |
| POST   | `/events/ticket`            | Ticket SSE de 60 s, requiere JWT |
| GET    | `/events/stream?ticket=...` | Stream SSE con heartbeat         |
| GET    | `/events/stats`             | Conexiones activas, solo admin   |
| GET    | `/push/public-key`          | Clave pública VAPID y estado     |
| POST   | `/push/subscribe`           | Registrar suscripción push       |
| DELETE | `/push/unsubscribe`         | Desactivar suscripción propia    |

### Métricas

Requiere rol `admin`.

| Método | Ruta                               | Descripción          |
| ------ | ---------------------------------- | -------------------- |
| GET    | `/admin/metrics/summary?from=&to=` | Los 4 KPIs del rango |

## 3. Flujos para testear

### Flujo 1 — Público

1. Abrir `/`.
2. Ver el carrusel, cambiar de slide con flechas y dots.
3. Abrir `/como-funciona` y revisar Match, Disponible, Busco 1, Flex y push.
4. Abrir `/terminos` y `/privacidad`.
5. Abrir una ruta inexistente y ver el 404.

### Flujo 2 — Cuenta y login

1. Abrir `/register` y probar el toggle de contraseña.
2. Confirmar que el username aclara que no es el Riot ID.
3. Crear una cuenta con +18 y términos.
4. Verificar el email con el token o usar una cuenta demo ya verificada.
5. Cerrar sesión y entrar desde `/login`.
6. Probar el ojo para mostrar/ocultar contraseña.
7. Probar el link "¿Has olvidado tu contraseña?".
8. Abrir una ruta protegida sin sesión y confirmar un solo redirect a `/login`.

### Flujo 3 — Perfil

1. Entrar con una cuenta sin perfil y abrir `/onboarding`.
2. Completar Riot ID, país, roles, rango, horarios, idioma, mic y estilo.
3. Confirmar que el país muestra la equivalencia local de los bloques ART.
4. Guardar y confirmar `/inicio`.
5. Editar un campo y guardar.
6. Abrir `/profiles/me` por API y confirmar Riot ID, país, Discord y WhatsApp propios.
7. Abrir `/profiles/:id` por API y confirmar que no expone email, Riot ID, Discord ni WhatsApp.

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
3. Sin Resend configurado no llega email; usar el token de prueba de la sección 6.
4. Abrir `/reset-password?token=...`, cambiar la contraseña y entrar con la nueva.
5. Correr `npm run seed` para restaurar la contraseña demo.

### Flujo 8 — API directa

1. Hacer login con `POST /api/v1/auth/login`.
2. Usar el token para `GET /api/v1/profiles/me`.
3. Probar `GET /api/v1/matching/candidates`.
4. Probar `POST /api/v1/matching/likes`.
5. Probar `GET /api/v1/matching/matches`.
6. Probar notificaciones y bloqueos.

### Flujo 9 — Disponible ya e invitaciones

1. Entrar con `demo_support` y confirmar que ya tiene una disponibilidad activa.
2. Entrar con `demo_mid` en otra ventana y abrir `/disponible`.
3. Ver a `demo_support`, elegir el rol, escribir un mensaje e invitar.
4. Volver a `demo_support`, abrir `/invitaciones` y aceptar.
5. Confirmar que se revela el Riot ID de `demo_mid` y que aparece en `/matches`.
6. Correr `npm run seed` para reiniciar el escenario.

### Flujo 10 — Busco 1

1. Entrar con `demo_mid` y abrir `/busco-1`.
2. Ver la publicación de `demo_adc` (Flex, busca jungla) con la postulación ya enviada.
3. Entrar con `demo_adc`, abrir `Mis publicaciones` y ver la postulación de `demo_mid`.
4. Aceptar la postulación y confirmar el contacto revelado.
5. Confirmar que el post pasa a completa y que el match aparece en `/matches`.
6. Correr `npm run seed` para reiniciar el escenario.

### Flujo 10.1 - ARAM

1. Entrar con una cuenta verificada y abrir `/aram`.
2. Publicar un grupo con 2-5 jugadores y lugares libres.
3. Con otra cuenta, abrir `/aram`, pestaña `Busco grupo` y postularse.
4. Aceptar la postulación desde `Tu publicación`.
5. Confirmar que la conexión aparece en `/matches` con badge ARAM.
6. Probar `Disponible ahora` con una publicación individual.

### Flujo 11 - Feedback doble ciego

1. Entrar con `demo_mid` y abrir `/matches`.
2. Ver el match con `demo_jungle` y tocar “Dejar feedback”.
3. Confirmar que `demo_jungle` ya envió el suyo pero el contenido sigue oculto.
4. Enviar un feedback positivo con tags y comentario.
5. Confirmar que se revelan ambos y que la reputación se actualiza.
6. Correr `npm run seed` para reiniciar el escenario.

### Flujo 12 - Reporte y auto-bloqueo

1. Entrar con `demo_mid` y abrir `/matches`.
2. Tocar “Reportar” en el match con `demo_jungle`.
3. Elegir toxicidad, escribir un detalle y confirmar.
4. Verificar que el match desaparece y que el usuario queda bloqueado.
5. Abrir `/admin/reportes` con `demo_admin` y ver el reporte.
6. Resolver con advertencia o suspensión y confirmar el estado del reportado.

### Flujo 13 - Admin

1. Entrar con `demo_admin`; el login redirige a `/admin`.
2. Revisar el resumen y abrir `/admin/usuarios`.
3. Buscar `demo_mid`, filtrar por rol, estado, email, perfil y tipo de cuenta.
4. Abrir el detalle y confirmar perfil, reportes, sanciones y disponibilidad.
5. Ir a `/admin/reportes`, filtrar por estado, motivo y prioridad.
6. Abrir un reporte y agregar una nota.
7. Probar descartar, advertir, suspender 7/30 días y suspensión permanente.
8. Confirmar que el usuario reportado recibe notificación y no puede operar si fue suspendido.
9. Confirmar que un jugador no puede abrir `/admin` y que un admin es redirigido desde `/inicio` a `/admin`.

### Flujo 14 - Notificaciones y SSE

1. Entrar con `demo_mid` y abrir `/notificaciones`.
2. Confirmar el estado “En vivo” y el contador de no leídas.
3. En otra ventana, con `demo_adc`, aceptar o generar una acción que notifique a `demo_mid`.
4. Confirmar que la notificación aparece sin recargar y que el badge se actualiza.
5. Marcar una como leída, marcar todas y eliminar una.
6. Confirmar que el click navega a la URL de la notificación.

### Flujo 15 - Polling de respaldo

1. Abrir DevTools → Network → condiciones offline.
2. Esperar dos fallos de SSE.
3. Confirmar el estado “Polling cada 20 s”.
4. Volver online y confirmar que SSE se recupera.
5. Probar en otra pestaña que el heartbeat mantiene la conexión sin cerrarse.

### Flujo 16 - Push y PWA

1. Generar claves VAPID y cargarlas en el entorno de la API.
2. Abrir `/notificaciones` en Chrome/Edge por `localhost` o HTTPS.
3. Tocar “Activar push” y aceptar el permiso.
4. Confirmar la suscripción en `push_subscriptions`.
5. Cerrar la pestaña, generar una notificación y confirmar el push.
6. Tocar la notificación y verificar que abre la URL correcta.
7. Instalar la PWA desde el navegador y repetir el push.
8. En iOS, instalar primero la PWA y probar desde ahí.

### Flujo 17 - Eliminación y recuperación de cuenta

1. Entrar con una cuenta demo y abrir el menú de avatar.
2. Tocar “Eliminar cuenta”.
3. Leer el primer cartel y tocar “Continuar”.
4. Ingresar una contraseña incorrecta y confirmar el 401.
5. Ingresar la contraseña correcta y confirmar la baja.
6. Verificar que la sesión se cierra y que `/cuenta-eliminada` muestra la fecha de purga.
7. Confirmar que el token anterior devuelve 401.
8. Volver a iniciar sesión antes de 30 días y confirmar que la cuenta se recupera.
9. Para probar la purga, adelantar `deletion_scheduled_for` en la DB y correr el job o esperar el barrido.
10. Confirmar que el perfil desaparece y que las entradas de moderación quedan anonimizadas.

### Flujo 18 - Métricas admin

1. Entrar con `demo_admin`.
2. Abrir `/admin/metrics`.
3. Confirmar las cuatro cards: tiempo al primer duo, match a partida, retención 7d y simultáneos.
4. Cambiar el rango de fechas y actualizar.
5. Confirmar que un usuario normal recibe `403` en la API y no puede abrir la ruta.
6. Revisar `GET /api/v1/admin/metrics/summary` por API.

## 4. Push en desarrollo

Generar claves VAPID:

```bash
npx web-push generate-vapid-keys
```

Crear un `.env` en la raíz (ignorado por git) con:

```env
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:soporte@duolas.online
```

Recrear la API:

```bash
docker compose up -d --force-recreate api
```

`GET /api/v1/push/public-key` debe devolver `enabled: true`. Si falta VAPID, la app sigue funcionando y el push queda deshabilitado.

## 5. Cuentas demo

| Cuenta                       | Contraseña   | Rol en la demo                  |
| ---------------------------- | ------------ | ------------------------------- |
| `demo_mid@duolas.online`     | `Demo12345!` | Cuenta principal                |
| `demo_jungle@duolas.online`  | `Demo12345!` | Match activo con `demo_mid`     |
| `demo_adc@duolas.online`     | `Demo12345!` | Like pendiente hacia `demo_mid` |
| `demo_support@duolas.online` | `Demo12345!` | Candidato adicional             |
| `demo_admin@duolas.online`   | `Demo12345!` | Admin de reportes y sanciones   |

`npm run seed` reinicia perfiles, likes, matches, bloqueos, notificaciones, suscripciones push, disponibilidades, invitaciones, publicaciones, postulaciones, feedbacks, reportes y sanciones de estas cuentas. También deja una disponibilidad de `demo_support`, una invitación de `demo_adc` a `demo_support`, un Busco 1 de `demo_adc` con postulación de `demo_mid`, un feedback pendiente de `demo_jungle` a `demo_mid` y un reporte abierto de `demo_support` contra `demo_jungle`. El seed completo crea **12 jugadores** con perfiles variados y `demo_admin`.

## 6. Tokens sin Resend

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
  "UPDATE users SET password_reset_token='HASH', password_reset_expires=now()+interval '1 hour' WHERE email='demo_mid@duolas.online';"
```

Abrir:

```text
http://localhost:5173/reset-password?token=demoreset123
```

El token de reset se guarda hasheado; el valor plano es el que va en el link. `npm run seed` restaura la contraseña demo.
