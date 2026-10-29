# TESTING — Duo LAS

Plan de pruebas del MVP. Sin tests E2E automatizados: el smoke manual es obligatorio para auth, SSE y push.

## 1. Estrategia

| Nivel       | Herramienta        | Qué cubre                                                             |
| ----------- | ------------------ | --------------------------------------------------------------------- |
| Unitario    | Vitest             | Lógica pura: rango, roles, horarios, scores, reputación, validaciones |
| Integración | Vitest + Supertest | Endpoints, permisos, transacciones y reglas de negocio                |
| Manual      | Checklist          | Auth sin loops, SSE, push, PWA, mobile y desktop                      |

### Estado actual

- F0 a F6 cerrados técnicamente con **118 tests pasando**.
- Cubierto: health, envelope 404, redacción de errores, registro, login, suspensión, verificación de email, resend, forgot/reset, cambio de contraseña, eliminación y recuperación de cuenta, perfiles, país de residencia, Riot ID, roles, rango Solo/Dúo, rango Flex, Comodín, completitud, middlewares, candidatos, likes, match mutuo, contacto, archivo/reactivación, bloqueos, notificaciones, disponibilidad con TTL, invitaciones, Busco 1, postulaciones, feedback doble ciego, reputación, reportes, auto-bloqueo, advertencias, suspensiones, tickets SSE, bus de eventos, suscripciones push, métricas, panel admin de usuarios, autorización admin de KPIs y ARAM (grupo, disponibilidad individual, postulación y conexión).
- Smoke técnico: flujo API contra PostgreSQL y rutas web respondiendo 200.
- Pendiente: smoke visual interactivo en navegador antes del release.

- `NODE_ENV=test`.
- Rate limits altos en test (1.000) para no interferir; los valores productivos se validan en smoke.
- `fileParallelism: false`.
- Timeout 15 segundos.
- Base `duo_lol_test`; los tests fallan si no está disponible.
- Migraciones en `beforeAll`.
- Fixtures con sufijo único.
- Sin mocks de base de datos: se prueba PostgreSQL real.

## 2. Preparación

```bash
npm run docker:up
cp apps/api/.env.example apps/api/.env
```

Variables relevantes:

```env
DB_URI=postgresql://duo_lol:duo_lol123@localhost:5433/duo_lol
TEST_DB_URI=postgresql://duo_lol:duo_lol123@localhost:5433/duo_lol_test
```

`docker/initdb/01-create-test-db.sql` crea `duo_lol_test` en el primer arranque del volumen.

## 3. Comandos

```bash
npm test                 # suite completa
npm run test:watch -w apps/api
npm run lint
npm run format
```

Cuando exista CI, los mismos comandos deben pasar sin servicios externos: Resend, hCaptcha y push se saltean o mockean en test.

## 4. Tests unitarios

### Rangos

- `rankIndex` para todos los tiers y divisiones.
- Maestro, Gran Maestro y Challenger sin división.
- Distancias de borde: 0, 4, 5, 8, 9.
- Compatibilidad Solo/Dúo y Flex.
- Rango inválido o división faltante.

### Roles

- Complementarios: principal distinto.
- Complementarios: uno principal y otro secundario.
- No complementarios: ambos solo mid.
- Filtro por rol con principal y secundario.
- Roles inválidos.

### Horarios

- Intersección total.
- Intersección parcial.
- Sin intersección.
- Subconjunto.
- 1 bloque contra 28.
- Bloques inválidos.

### Scores

- Pesos suman 100 en `DUO_WEIGHTS`, `NOW_WEIGHTS` y `POST_WEIGHTS`.
- Score máximo 100.
- Score mínimo.
- Determinismo con los mismos inputs.
- Redondeo.
- Reputación nueva en `nowScore`.
- `postFitScore` con rango en el borde y en el centro.

### Reputación

- 0/0 = 50.
- 5/0 = 78.
- 5/1 = 70.
- 0/5 = 22.
- Etiqueta "Nuevo" con menos de 3.
- Recalculo al revelar.

### Validaciones

- Riot ID válido e inválido.
- Riot ID normalizado y único.
- Discord válido e inválido.
- Username y email.
- Edad y términos obligatorios.
- Contraseña de 10 a 128 caracteres.
- Tokens de verificación y reset guardados hasheados.
- Idiomas 1-3.
- País `AR`, `CL`, `BO`, `PY` o `UY`; `PE` rechazado; vacío permitido.
- Horarios 1-28.
- Bio y notas con longitud máxima.
- Feedback negativo sin tag.

### Estados

- Disponibilidad: activa → cerrada por expiración, manual o match.
- Invitación: pending → accepted, declined, cancelled o expired.
- Postulación: pending → accepted, rejected o withdrawn.
- Post: active → filled, cancelled o expired.
- Feedback: oculto → visible por ambos o por tiempo.
- Bloqueo: activo → desbloqueado.

## 5. Tests de integración

### Auth

- Registro sin +18 → 422.
- Registro sin términos → 422.
- Registro con captcha inválido → 422.
- Email duplicado → 409.
- Username duplicado → 409.
- Login correcto e incorrecto.
- Usuario suspendido → 403.
- Verificación de email válida, inválida y expirada.
- Resend regenera token.
- Forgot responde genérico exista o no el email.
- Reset válido, expirado, usado y token incorrecto.
- Cambio de contraseña invalida tokens previos.

### Perfiles

- Perfil incompleto no aparece en candidatos.
- Completar perfil setea `profile_completed_at`.
- Editar y dejar incompleto lo vuelve a NULL.
- Riot ID duplicado → 409.
- Perfil público no expone email, Riot ID ni Discord.
- `rank_index` se recalcula al cambiar rango.
- No se puede cambiar `server`.

### Matching

- Candidatos respetan rango, roles, horarios y bloqueos.
- Like a sí mismo → 400.
- Like a inexistente → 404.
- Like idempotente.
- Like mutuo crea una sola conexión.
- Like mutuo revela contacto solo a los participantes.
- Tercero no puede ver el match → 404.
- Archivar oculta para ambos.
- Nuevo like mutuo reactiva la conexión archivada.
- Bloqueo excluye candidatos y archiva conexión.
- Sin email verificado → 403.
- Sin perfil completo → 403.

### ARAM

- [ ] Publicar un grupo de 2-4 jugadores y confirmar lugares disponibles.
- [ ] Publicar disponibilidad individual y confirmar que solo permite 1 lugar.
- [ ] Postularse desde otra cuenta y aceptar desde la publicación.
- [ ] Confirmar conexión ARAM en Matches y notificación/push.
- [ ] Confirmar que se descuenta un lugar y el post se llena al completar 5.

### Disponible ya

- Crear cierra la anterior.
- TTL solo 30 o 60.
- Expiración con fake timers.
- Listado excluye vencidas, propias y bloqueadas.
- Invitar a sesión vencida → 409.
- Invitar rol que no ofrece → 422.
- Aceptar crea conexión y cierra ambas disponibilidades.
- Rechazar y cancelar notifican.
- Doble aceptación → 409.
- Límite de invitaciones.

### Busco 1

- Crear post respeta límites de 3 activos y 1 por cola.
- Notifica a disponibles compatibles.
- Postular fuera de rango → 422.
- Postular sin rol compatible → 422.
- Postular dos veces → 409.
- Aceptar crea conexión, cierra post y rechaza el resto.
- Retirar postulación.
- Post vencido no acepta postulaciones.

### Confianza

- Feedback fuera de ventana → 409.
- Feedback duplicado → 409.
- Feedback negativo sin tag → 422.
- Doble ciego antes de ambos.
- Revelado al enviar ambos.
- Revelado por tiempo con fake timers.
- Reputación actualizada.
- Reporte duplicado abierto → 409.
- Reporte a sí mismo → 400.
- Reporte auto-bloquea.
- Bloqueo impide like, invitación y postulación.
- Admin no puede operar sin rol.
- Advertencia suma `warning_count` y notifica.
- Suspensión temporal y permanente bloquean `protect`.

### Notificaciones y push

- Cada evento genera notificación para el destinatario correcto.
- No se puede leer ni borrar notificación ajena → 404.
- Unread count correcto.
- Suscripción push requiere usuario autenticado.
- Endpoint duplicado se reactiva.
- Unsubscribe marca inactiva.
- El envío de push no rompe la request si falla.

### Admin

- `GET /admin/reports` solo admin.
- Resolución registra admin, nota y fecha.
- Suspender a sí mismo → 400.
- KPIs devuelven valores coherentes con fixtures.

## 6. Fixtures

Helpers sugeridos en `apps/api/src/__tests__/helpers/`:

```text
createUser({ email, username, ageConfirmed, termsAccepted })
createProfile(user, { rankTier, rankDivision, roles, scheduleBlocks, ... })
createAvailability(user, { roles, queue, ttlMinutes })
createLike(from, to)
createConnection(a, b, source)
createPost(owner, { rolesNeeded, rankMinTier, rankMaxTier, queue })
createApplication(post, applicant)
createInvite(from, to, availability)
```

Reglas:

- Email y username con sufijo `Date.now()` y random.
- Limpiar datos al final o usar transacciones por test cuando sea posible.
- No depender del orden de archivos.
- No usar datos reales ni emails válidos.

## 7. Smoke manual obligatorio

### Auth y loops

En ventana incógnita, sin sesión:

- [ ] Abrir `/`, `/login`, `/register`, `/terminos` y `/privacidad` sin recargas en loop.
- [ ] Registrar un usuario y verificar el email.
- [ ] Revisar las plantillas de verificación, reset y suspensión con el modo test de Resend.
- [ ] Iniciar sesión.
- [ ] Cerrar sesión sin loop.
- [ ] Ensuciar `localStorage.token` y confirmar un solo redirect a `/login`.
- [ ] Abrir una ruta protegida sin token y confirmar redirect limpio.
- [ ] Confirmar que los endpoints de auth no disparan redirect.

### Perfil y match

- [ ] Completar onboarding en mobile, elegir país y ver la equivalencia local de los bloques.
- [ ] Ver candidatos con score, motivos, país y diferencia horaria contra ART.
- [ ] Confirmar que un candidato sin país no muestra badge y no rompe la card.
- [ ] Dar like y retirarlo.
- [ ] Con dos cuentas, concretar un like mutuo.
- [ ] Confirmar que el contacto aparece solo en ambos matches.
- [ ] Archivar y confirmar que desaparece.
- [ ] Bloquear y confirmar que no vuelve a aparecer.

### ARAM

- [ ] Publicar un grupo de 2-4 jugadores y confirmar lugares disponibles.
- [ ] Publicar disponibilidad individual y confirmar que solo permite 1 lugar.
- [ ] Postularse desde otra cuenta y aceptar desde la publicación.
- [ ] Confirmar conexión ARAM en Matches y notificación/push.
- [ ] Confirmar que se descuenta un lugar y el post se llena al completar 5.

### Disponible ya

- [ ] Activar 30 minutos y ver countdown.
- [ ] Confirmar que no se puede abrir otra sin cerrar la anterior.
- [ ] Invitar desde otra cuenta.
- [ ] Aceptar y confirmar conexión y cierre de ambas.
- [ ] Dejar vencer y confirmar que desaparece.

### Busco 1

- [ ] Publicar post.
- [ ] Confirmar notificación a disponible compatible.
- [ ] Postular desde otra cuenta.
- [ ] Aceptar y confirmar conexión, post cerrado y resto rechazado.

### Feedback

- [ ] Enviar feedback positivo con una cuenta.
- [ ] Confirmar que la otra no lo ve.
- [ ] Enviar feedback desde la otra y confirmar revelado simultáneo.
- [ ] Verificar reputación actualizada.
- [ ] Probar feedback negativo sin tag → error.

### Reportes y admin

- [ ] Reportar y confirmar bloqueo automático.
- [ ] Entrar como admin y resolver el reporte.
- [ ] Advertir y suspender.
- [ ] Confirmar que el suspendido recibe 403.
- [ ] Entrar como admin y confirmar que redirige a `/admin`, no a `/inicio`.
- [ ] Abrir `/admin/usuarios`, buscar una cuenta y filtrar por rol, estado y perfil.
- [ ] Abrir el detalle y confirmar perfil, reportes, sanciones y disponibilidad.
- [ ] Confirmar que un jugador recibe 403 en la API admin y no puede abrir `/admin`.

### Realtime y push

- [ ] Abrir SSE y generar un match desde otra cuenta.
- [ ] Confirmar evento en vivo sin recargar.
- [ ] Cortar SSE y confirmar fallback a polling.
- [ ] Suscribirse a push y recibir con la pestaña cerrada.
- [ ] Confirmar que el click abre la ruta correcta.
- [ ] Instalar la PWA en Android/iOS y repetir.

### UI y demo F2

- [ ] `npm run docker:app` levanta PostgreSQL, API y web.
- [ ] `npm run seed` crea las cuentas demo y el match inicial.
- [ ] Landing muestra el carrusel de 4 slides y las cards de ejemplo.
- [ ] Login muestra el toggle de contraseña y el link "¿Has olvidado tu contraseña?".
- [ ] Home muestra Riot ID propio, jugadores compatibles y el match con `demo_jungle`.
- [ ] Like a `demo_adc` concreta el match y actualiza la sección de matches.
- [ ] Copiar Riot ID, archivar y bloquear funcionan desde `/matches`.
- [ ] `npm run seed` reinicia el escenario demo.

### Mobile y desktop

- [ ] 360 px, 390 px, 768 px y 1440 px.
- [ ] Bottom nav, cards y modales.
- [ ] Teclado y foco visible.
- [ ] Contraste y textos legibles.

## 8. Definition of Done de tests

- Unitarios de lógica pura pasan.
- Integración de cada módulo pasa.
- Lint y formato pasan.
- No hay tests flaky por orden, fechas o emails.
- La suite falla si la DB no está disponible.
- El smoke manual quedó registrado en `TASK.md`.
- Si se tocó auth, interceptores, SSE o push, el smoke correspondiente está completo.
