# SPEC — Duo LAS

Especificación de producto del MVP. Define qué se construye, qué queda afuera y qué reglas no se pueden romper. Si el código contradice este documento, el código está mal.

## 1. Resumen

Duo LAS es una web mobile-first, gratuita y exclusiva para mayores de 18 años, que conecta jugadores de League of Legends del servidor LAS para jugar duo y subir de elo.

El MVP resuelve cuatro necesidades:

1. **Match por afinidad:** encontrar un duo compatible por rango, roles, horarios, estilo e idioma.
2. **Disponibilidad inmediata:** "Disponible ya" para jugar ahora e "Busco 1" para grupos con un lugar libre.
3. **ARAM:** buscar grupo o ponerse disponible sin rango ni roles, con postulaciones y aceptación.
4. **Confianza:** reputación, feedback posterior a la partida, reportes y bloqueos.

## 2. Problema y oportunidad

Hoy los duos se buscan de forma informal en grupos de Facebook, Discord y el chat del juego. No hay filtros por rango, rol, horario o estilo, no hay disponibilidad en tiempo real y no hay forma de saber si alguien miente el elo, abandona o tiene mal trato.

La oportunidad es ordenar esa actividad existente en LAS con match por afinidad, disponibilidad inmediata y reputación.

## 3. Público

Jugadores de League of Legends del servidor LAS, mayores de 18 años, que quieren subir de elo con compañeros compatibles. Dos perfiles:

- Quien busca un duo estable, casual o frecuente.
- Quien busca jugar ahora, como jugador suelto o como parte de un grupo con un lugar libre.

## 4. Alcance del MVP

### Incluido

- Registro con confirmación de mayoría de edad y verificación de email.
- Perfil de jugador con Riot ID, país, rango declarado, roles, horarios, idioma, micrófono y estilo.
- Match de duo por afinidad con interés mutuo.
- "Disponible ya" con vencimiento automático.
- "Busco 1" para grupos.
- Búsqueda ARAM para grupos o jugadores disponibles, sin rango ni roles.
- Invitaciones y postulaciones.
- Contacto revelado solo después de una conexión: Riot ID y Discord/WhatsApp opcionales.
- Notificaciones en la app, SSE, polling de respaldo y web push.
- Feedback posterior a la partida, reputación simple, reportes y bloqueos.
- Moderación mínima con advertencias y suspensiones.
- Métricas de los cuatro KPIs del MVP.

### Fuera del MVP

- Coaching y marketplace.
- Pagos, Mercado Pago, comisiones y reembolsos.
- Chat interno.
- Equipos, clanes y roster de grupo.
- Otros juegos competitivos.
- Otros servidores además de LAS.
- App móvil nativa.
- API de Riot, RSO y verificación automática de rango.
- Duo boost y boost de cuentas.
- Uploads de imágenes y avatares personalizados.

## 5. Principios de producto

- **Mobile-first:** todas las pantallas se diseñan primero para 360-430 px.
- **Bajo roce:** un jugador debe poder publicar disponibilidad en menos de 30 segundos.
- **Consentimiento:** el contacto se revela solo con interés mutuo o aceptación explícita.
- **Seguridad:** reportar bloquea de inmediato; el feedback es doble ciego.
- **Transparencia:** el rango es declarado y así se muestra; la reputación ayuda a filtrar mentiras.
- **Sin fricción comercial:** todo el MVP es gratis.

## 6. Flujos principales

### 6.1 Alta

1. Registro con username, email, contraseña, confirmación +18 y términos.
2. Verificación de email.
3. Onboarding: Riot ID, país, roles, rango, horarios, idioma, micrófono y estilo.
4. Perfil completo: aparece en candidatos y puede interactuar.

Sin email verificado o sin perfil completo no se puede matchear, invitar, postular ni publicar.

### 6.2 Match de duo

1. El jugador entra a Match y ve candidatos ordenados por afinidad.
2. Puede dar like o descartar.
3. Si el otro también dio like, se crea una conexión y se revela el contacto.
4. Ambos reciben notificación y push.
5. Después de jugar, cada uno puede dejar feedback.

### 6.3 Disponible ya

1. El jugador abre disponibilidad con rol(es), cola y TTL de 30 o 60 minutos.
2. Aparece en el listado de disponibles.
3. Otro jugador le envía una invitación indicando el rol que necesita.
4. Si acepta, se crea la conexión y se revela el contacto.
5. La disponibilidad se cierra automáticamente al expirar, al cerrarla o al concretar un match.

### 6.4 Busco 1

1. El dueño de un grupo publica el lugar libre: cola, roles, rango y nota.
2. Se notifica a jugadores disponibles compatibles.
3. Los interesados postulan con un mensaje corto.
4. El dueño acepta una postulación.
5. Se crea la conexión, el post se cierra y las demás postulaciones se rechazan.

### 6.4.1 ARAM

1. Un jugador publica un grupo de 2-4 personas que busca completar los 5, o se pone disponible individualmente.
2. Elige ventana `Ahora` o `Esta noche`, micrófono y una nota.
3. Otros jugadores se postulan o invitan según el tipo de publicación.
4. El dueño acepta una solicitud, se descuenta un lugar y se crea la conexión `aram`.
5. El contacto se revela en Matches. Una publicación activa por usuario.

### 6.5 Feedback y reputación

1. Al concretarse una conexión, ambos pueden dejar feedback dentro de 7 días.
2. El feedback es invisible hasta que ambos lo envían o vence el plazo.
3. Al revelarse, se recalcula la reputación de ambos.
4. Un feedback negativo exige al menos un motivo.

### 6.6 Reporte y bloqueo

1. Cualquier usuario puede reportar o bloquear a otro.
2. Reportar bloquea automáticamente al reportado.
3. El admin revisa el reporte y puede descartar, advertir o suspender.
4. La suspensión impide iniciar sesión y operar.

## 7. Reglas de cuenta

- Solo mayores de 18 años. Se confirma con un checkbox obligatorio y se guarda `age_confirmed_at`.
- Se aceptan términos y privacidad al registrarse; se guarda `terms_accepted_at`.
- Username de 3 a 20 caracteres, letras, números y guión bajo. Único sin distinguir mayúsculas.
- Email único, normalizado a minúsculas.
- El email no se puede cambiar en el MVP.
- El username solo cambia mediante una solicitud asistida por un admin. No hay autoservicio.
- Nombres reservados: `duolas`, `duo_las`, `admin`, `soporte`, `staff`, `oficial` y variantes de la marca.
- Contraseña de 10 a 128 caracteres, hasheada con bcrypt 12.
- Verificación de email obligatoria para interactuar. Token de 24 horas.
- Reset de contraseña con token de 1 hora, un solo uso y respuesta genérica.
- JWT de 1 día. Sin refresh token.
- Suspensión temporal o permanente. El login y `protect` responden 403 con motivo.

## 8. Reglas de perfil

| Campo          | Regla                                                                                            |
| -------------- | ------------------------------------------------------------------------------------------------ |
| Riot ID        | Formato `nombre#TAG`; nombre 3-16, tag 3-5 alfanumérico; único sin distinguir mayúsculas         |
| Servidor       | Fijo `LAS` en el MVP                                                                             |
| País           | Opcional: Argentina, Chile, Bolivia, Paraguay, Uruguay o Perú; se usa para mostrar la hora local |
| Rol principal  | Obligatorio: top, jungle, mid, adc, support o fill (Comodín)                                     |
| Rol secundario | Obligatorio; distinto del principal salvo cuando alguno es Comodín                               |
| Rango Solo/Dúo | Tier + división obligatorios hasta Diamante; Maestro, Gran Maestro y Challenger sin división     |
| Rango Flex     | Opcional; si se declara, se usa para el matching de la cola Flex                                 |
| LP             | Opcional, entero mayor o igual a 0; hay LP separado para Solo/Dúo y Flex                         |
| Horarios       | Mínimo 1 de 28 bloques semanales, en hora Argentina                                              |
| Idioma         | 1 a 3 de español, inglés y portugués; el primero es principal                                    |
| Estilo         | casual, ranked o tryhard                                                                         |
| Micrófono      | Sí o no                                                                                          |
| Bio            | Hasta 280 caracteres                                                                             |
| Discord        | Opcional, 2-32 caracteres alfanuméricos, punto o guión bajo; nunca obligatorio                   |
| WhatsApp       | Opcional, 8-15 dígitos con código de país; nunca obligatorio                                     |

- El rango es declarado (`rank_source = declared`). Se muestra como declarado.
- `fill` representa a quien juega todas las líneas y es compatible con cualquier rol.
- Si un perfil no declara Flex, el matching de Flex usa su rango Solo/Dúo como respaldo.
- El nombre de usuario es el identificador de Duo LAS y no debe ser el Riot ID.
- No se admiten jugadores sin clasificar en el MVP.
- El Riot ID, el Discord y el WhatsApp no se muestran en el perfil público.
- El Discord y el WhatsApp son contactos opcionales: si el usuario no los carga, sus matches solo ven el Riot ID.
- Solo se guarda el Riot ID actual. No se almacenan históricos.
- El avatar se genera con iniciales y color determinístico. No hay uploads.
- El país es informativo y no filtra candidatos. Los horarios se guardan en ART; la UI muestra la equivalencia local cuando corresponde.

## 9. Reglas de match

Detalle completo en `docs/MATCHING.md`.

- **Filtros duros:** LAS, rango compatible, roles complementarios, al menos un bloque horario en común, email verificado, perfil completo, cuenta activa, sin bloqueo, sin conexión activa y sin like previo.
- **Rango compatible:** ±1 tier en Solo/Dúo y ±2 tiers en Flex. Flex compara el rango Flex; si falta, usa Solo/Dúo.
- **Roles complementarios:** debe existir un par de roles distintos entre principal y secundario de ambos. `fill` es comodín y es compatible con cualquier rol.
- **Interés mutuo:** el like es doble ciego; no se revela quién likeó hasta que sea recíproco.
- **Contacto:** se revela Riot ID y Discord/WhatsApp opcionales solo a los dos integrantes de la conexión.
- **Likes:** máximo 30 por hora, idempotentes y retirables.
- **Conexión:** única por par; archivar la oculta; un nuevo like mutuo la reactiva.

## 10. Reglas de Disponible ya

- Una sola disponibilidad activa por usuario.
- TTL exacto de 30 o 60 minutos.
- Campos: roles (1-2), cola, nota de hasta 140 caracteres.
- Se muestra un aviso de "no entres a cola" mientras está activa.
- El listado solo incluye disponibilidades vigentes y excluye bloqueados.
- Invitación con rol requerido y mensaje de hasta 140 caracteres.
- La invitación vence en 10 minutos.
- Aceptar crea la conexión y cierra ambas disponibilidades.
- Rechazar o cancelar notifica a la otra parte.
- Límites: 20 invitaciones por hora y 1 cada 10 minutos a la misma persona.

## 11. Reglas de Busco 1

- El post representa al grupo; no se modela el roster en el MVP.
- Campos: cola, roles necesarios (1-2), rango mínimo y máximo, nota de hasta 140 caracteres.
- Vence en 2 horas.
- Máximo 3 posts activos por usuario y 1 por cola.
- Al publicar se notifica a hasta 20 disponibles compatibles.
- Postulación con mensaje de hasta 140 caracteres.
- El postulante debe cumplir el rango del post y tener un rol compatible.
- Máximo 10 postulaciones pendientes por post.
- El dueño puede aceptar o rechazar; el postulante puede retirarse.
- Aceptar crea la conexión, cierra el post y rechaza el resto.
- Aplica a Solo/Dúo y Flex.

## 11.1 Reglas de ARAM

- No usa rango, roles, horarios ni score de afinidad.
- `solo`: 1 jugador disponible, 1 lugar.
- `group`: 2-4 jugadores presentes y hasta completar 5.
- Ventana `now` (1 hora) o `tonight` (6 horas).
- Una publicación activa por usuario.
- Postulación con mensaje de hasta 140 caracteres; no se permite a uno mismo ni a bloqueados.
- Aceptar crea una conexión `aram` y descuenta un lugar.
- Al llenarse, el post pasa a `filled` y rechaza las solicitudes pendientes.
- El contacto se revela en Matches.

### 6.7 Cambio de username

1. Un admin detecta un username problemático y crea una solicitud desde el detalle del usuario.
2. El usuario recibe una notificación in-app y puede proponer un nombre nuevo.
3. La propuesta no se aplica automáticamente: queda pendiente de revisión.
4. El admin puede aprobar el nombre sugerido o rechazar la solicitud con una nota.
5. Al aprobar, se actualiza el username y se notifica al usuario.
6. Solo puede haber una solicitud abierta por usuario. Los nombres reservados y ya usados se rechazan.

## 12. Reglas de feedback y reputación

- Solo se puede dejar feedback sobre una conexión existente.
- Ventana de 7 días desde la creación o reactivación de la conexión.
- Un feedback por usuario por conexión. No se edita ni se borra.
- Sentimiento positivo o negativo, hasta 3 tags y comentario de hasta 280 caracteres.
- Un feedback negativo exige al menos un tag.
- Doble ciego: el feedback no se muestra hasta que ambos lo envían o vence el plazo.
- Al revelarse, ambos se muestran a la vez.
- Reputación con suavizado de Laplace: `(positivos + 2) / (positivos + negativos + 4) * 100`.
- La reputación arranca en 50.
- Con menos de 3 feedbacks visibles se muestra "Nuevo" sin porcentaje.
- La reputación se cachea en el perfil y se recalcula al revelar feedback.

## 13. Reglas de reportes, bloqueos y sanciones

- Motivos: toxicidad, rango falso, abandono, spam, menor de edad y otro.
- "Otro" exige detalle de hasta 500 caracteres.
- Un reporte abierto por par reportero-reportado.
- Reportar bloquea automáticamente al reportado.
- El bloqueo es bidireccional a efectos de match, invitaciones y postulaciones.
- Bloquear archiva la conexión activa y oculta el contacto.
- Se puede desbloquear; la conexión archivada no se restaura sola.
- Reporte de menor de edad se marca prioritario.
- El admin puede descartar, advertir, suspender 7 días, 30 días o permanentemente.
- Toda sanción queda registrada con motivo, admin y fecha.
- La suspensión envía email y notificación.

### 13.1 Panel admin

- El admin es un operador: no necesita perfil de jugador ni participa del matching.
- `AdminShell` separa Resumen, Usuarios, Reportes y Métricas del flujo de jugador.
- El resumen muestra cuentas activas, altas, verificación, perfiles, sanciones, reportes, matches y disponibilidad.
- El listado de usuarios permite buscar por username/email y filtrar por rol, estado, verificación, perfil y baja.
- El detalle concentra cuenta, perfil, reportes, sanciones, disponibilidad y conexiones.
- Nunca se exponen contraseñas ni tokens.

## 14. Notificaciones

| Tipo                         | Cuándo                           | Push          |
| ---------------------------- | -------------------------------- | ------------- |
| `match_created`              | Like mutuo                       | Sí            |
| `invite_received`            | Llega una invitación             | Sí            |
| `invite_accepted`            | Aceptan una invitación enviada   | Sí            |
| `invite_declined`            | Rechazan una invitación enviada  | Sí            |
| `invite_cancelled`           | Cancelan una invitación recibida | No            |
| `application_received`       | Llega una postulación            | Sí            |
| `application_accepted`       | Aceptan una postulación          | Sí            |
| `application_rejected`       | Rechazan una postulación         | Sí            |
| `application_withdrawn`      | Un postulante se retira          | No            |
| `aram_application_received`  | Llega una solicitud ARAM         | Sí            |
| `aram_application_accepted`  | Aceptan una solicitud ARAM       | Sí            |
| `aram_application_rejected`  | Rechazan una solicitud ARAM      | Sí            |
| `aram_application_withdrawn` | Retiran una solicitud ARAM       | No            |
| `post_suggested`             | Hay un Busco 1 compatible        | Sí            |
| `feedback_revealed`          | Se revela feedback               | No            |
| `warning_received`           | Advertencia del admin            | Sí            |
| `account_suspended`          | Suspensión                       | Sí, más email |
| `match_reminder`             | Like recibido pendiente          | Sí            |

- La notificación se persiste antes de emitir SSE y antes de enviar push.
- Si el usuario estaba desconectado, la recupera por API.
- El push se envía solo si hay suscripción activa y el permiso fue concedido.

## 15. Edad, privacidad y legales

- Producto exclusivo para mayores de 18 años, con confirmación explícita.
- Perfil público sin email, Riot ID, Discord ni WhatsApp.
- El Riot ID y los contactos opcionales se revelan solo tras una conexión.
- No se guardan Riot IDs históricos.
- No se muestran emails en perfiles públicos.
- Páginas de términos de uso, política de privacidad y aviso de no afiliación con Riot Games.
- Canal de soporte para bajas y reclamos.
- Moderación de reportes con prioridad para menores de edad.

## 16. Métricas

El MVP mide cuatro KPIs. Las metas numéricas se fijan con los primeros datos reales.

| KPI                                   | Definición                                                                                                    |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Tiempo hasta el primer duo            | Mediana de horas entre el alta y la primera conexión del usuario                                              |
| Match que termina en partida          | Conexiones con al menos 48 horas y al menos un feedback, sobre el total de conexiones con al menos 48 horas   |
| Retención a 7 días                    | Usuarios registrados en una cohorte que tienen actividad entre el día 7 y el 13, sobre el total de la cohorte |
| Usuarios simultáneos en Disponible ya | Máximo y p95 de concurrencia por hora, calculado con `started_at` y `ended_at` de las disponibilidades        |

Eventos registrados en `metrics_events`:

`user_registered`, `email_verified`, `profile_completed`, `availability_opened`, `availability_closed`, `like_sent`, `match_created`, `contact_revealed`, `invite_sent`, `invite_accepted`, `post_created`, `application_sent`, `application_accepted`, `feedback_submitted`, `feedback_revealed`, `report_created`, `user_suspended`, `push_subscribed`, `match_reminder_sent`.

## 17. Criterios de aceptación del MVP

- Un usuario puede registrarse, verificarse y completar su perfil.
- Un usuario puede ver candidatos compatibles y concretar un match mutuo.
- El contacto solo se revela tras el match o la aceptación.
- "Disponible ya" expira correctamente y permite invitar y aceptar.
- "Busco 1" permite publicar, postular y aceptar.
- El feedback es doble ciego y afecta la reputación.
- Reportar bloquea; el admin puede sancionar.
- Las notificaciones se recuperan por API y el push funciona con la app cerrada.
- Los cuatro KPIs se pueden consultar.
- Lint y tests pasan.
- Smoke manual completo en mobile y desktop.

## 18. Riesgos y mitigaciones

| Riesgo                           | Mitigación                                                                  |
| -------------------------------- | --------------------------------------------------------------------------- |
| Arranque en frío                 | Un solo servidor, siembra en la comunidad de Facebook y apertura por tandas |
| Rango falso                      | Reputación, feedback y futura verificación con Riot                         |
| Toxicidad                        | Reportes, bloqueo automático, sanciones y +18                               |
| Fuga de contacto antes del match | Riot ID y Discord solo en respuestas de conexión                            |
| Spam de likes/invitaciones       | Rate limits y doble ciego                                                   |
| Push en iOS                      | Guía de instalación de PWA                                                  |
| SSE en una instancia             | Deploy persistente único; Redis pub/sub queda para escalar                  |
| Busco 1 sin roster               | Post representa al grupo; roster fuera del MVP                              |

## 19. Futuro fuera del MVP

- Verificación de rango con Riot (key de producción y RSO).
- Coaching con comisión.
- Otros juegos y servidores.
- Chat interno.
- Equipos y clanes.
- Métricas y filtros avanzados pagos.
- App nativa.

Nada de esto se implementa sin actualizar este documento y `docs/DECISIONS.md`.
