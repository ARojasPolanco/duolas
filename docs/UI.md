# UI — Duo LAS

Mapa de rutas, pantallas, componentes y reglas de interacción. Mobile-first, tema oscuro y copy en español rioplatense.

## 1. Rutas

### Públicas

| Ruta                | Pantalla               |
| ------------------- | ---------------------- |
| `/`                 | Landing                |
| `/como-funciona`    | Guía de uso            |
| `/login`            | Iniciar sesión         |
| `/register`         | Registro               |
| `/verify-email`     | Verificación de email  |
| `/forgot-password`  | Pedir reset            |
| `/reset-password`   | Nueva contraseña       |
| `/terminos`         | Términos de uso        |
| `/privacidad`       | Política de privacidad |
| `/cuenta-eliminada` | Baja programada        |

### Protegidas

| Ruta                  | Pantalla                           |
| --------------------- | ---------------------------------- |
| `/inicio`             | Hub del jugador                    |
| `/onboarding`         | Completar perfil                   |
| `/match`              | Candidatos y likes                 |
| `/aram`               | Buscar grupo y disponibilidad ARAM |
| `/disponible`         | Disponibilidad inmediata           |
| `/busco-1`            | Posts de grupo                     |
| `/matches`            | Conexiones y contacto              |
| `/invitaciones`       | Invitaciones recibidas y enviadas  |
| `/notificaciones`     | Centro de notificaciones           |
| `/perfil`             | Perfil propio                      |
| `/solicitud-username` | Solicitud de cambio de username    |
| `/perfil/:id`         | Perfil público                     |
| `/admin`              | Resumen admin                      |
| `/admin/usuarios`     | Buscador de cuentas                |
| `/admin/usuarios/:id` | Detalle de usuario                 |
| `/admin/reportes`     | Moderación                         |
| `/admin/metrics`      | KPIs                               |

Reglas:

- Sin sesión, una ruta protegida redirige a `/login` sin loops.
- Con sesión y perfil incompleto, `/match`, `/disponible` y `/busco-1` redirigen a `/onboarding`.
- `/admin/*` requiere rol admin.
- Un admin que abre una ruta de jugador es redirigido a `/admin`.
- El admin no necesita completar perfil de jugador.
- La landing redirige a `/inicio` si hay sesión.

## 2. Navegación

Todas las pantallas protegidas de jugador usan `AppShell`, salvo onboarding, que mantiene un layout enfocado. Las pantallas admin usan `AdminShell`.

El logo `Duo LAS` muestra un badge `Beta` en landing, auth, onboarding, app y admin. El footer de la app y el hero de la landing aclaran que el servicio está en fase beta y puede cambiar.

### Mobile

- Top bar fija con logo + badge `Beta`, campana y avatar.
- Bottom nav fija con seis ítems: Inicio, Match, ARAM, Disponible, Busco 1 y Matches.
- Match muestra un badge con la cantidad de candidatos disponibles para likear.
- El avatar abre el menú de cuenta: Mi perfil, Invitaciones, Notificaciones, Eliminar cuenta y Cerrar sesión.
- Los accesos admin viven fuera del shell de jugador, en `AdminShell`.
- El pie de las pantallas protegidas incluye Términos, Privacidad, Aviso de Riot y el disclaimer legal de Riot.

### Desktop

Top nav con logo, Inicio, Match, ARAM, Disponible, Busco 1, Matches e Invitaciones. Match muestra un badge con la cantidad de candidatos disponibles. A la derecha viven la campana y el menú de avatar con perfil, notificaciones y logout. Los admins usan un top nav propio con Resumen, Usuarios, Reportes y Métricas.

## 3. Pantallas

### 3.1 Landing `/`

- Hero: "Encontrá tu duo en LAS y subí de elo".
- Badge `Beta` junto al logo y aviso de beta abierta en el hero.
- Dos CTAs: "Crear cuenta" y "Ya tengo cuenta".
- Carrusel de 4 slides con ilustraciones propias: match por afinidad, Disponible ya, Busco 1 y confianza.
- Vista previa de 3 cards de jugadores de ejemplo, sin Riot ID ni Discord.
- Tres bloques: match por afinidad, Disponible ya, Busco 1.
- Aviso +18 y aviso de no afiliación con Riot.
- Footer con términos y privacidad.

### 3.1.1 Guía `/como-funciona`

- Página pública y compartible, con CTA a registro o a la app si hay sesión.
- Explica las tres formas de buscar: Match por afinidad, Disponible ya y Busco 1.
- Aclara que Flex funciona en Match, Disponible ya y Busco 1, con tolerancia de ±2 tiers donde aplica.
- Mini tutorial de Disponible ya, Busco 1 y ARAM, pasos del recorrido completo y activación de push.
- Accesos desde landing, footer de la app, menú de cuenta y Match.

### 3.2 Login `/login`

- Email o username + contraseña.
- Toggle para mostrar u ocultar la contraseña.
- Link "¿Has olvidado tu contraseña?" junto al campo, hacia `/forgot-password`.
- Link a registro.
- Mensaje de suspensión si corresponde.
- Sin redirect loop.

### 3.3 Registro `/register`

- Username, email, contraseña.
- El campo username aclara que es el nombre dentro de Duo LAS y no el Riot ID; el Riot ID se pide en onboarding.
- Checkbox obligatorio +18.
- Checkbox obligatorio de términos y privacidad.
- hCaptcha si está configurado.
- Link a login.

### 3.4 Verificación `/verify-email`

- Estado: verificando, verificado, inválido o expirado.
- Botón para reenviar si hay sesión.
- CTA a onboarding si se verificó.

### 3.5 Onboarding `/onboarding`

Siete pasos con barra de progreso:

1. Riot ID y servidor LAS. Se aclara que el Riot ID no es el nombre de usuario de Duo LAS.
2. Rol principal y secundario, con Comodín para quien juega todas las líneas.
3. Rango Solo/Dúo con LP y rango Flex opcional con LP separado.
4. Horarios por día con bloques de 6 horas, atajos y selección múltiple. Incluye país opcional y equivalencia local de cada bloque.
5. Estilo, idiomas y micrófono.
6. Contacto: bio y Discord recomendado, con aviso de que sin Discord solo queda el Riot ID.
7. Resumen y guardado final.

Reglas:

- Validación por paso.
- Se puede volver.
- Al terminar, `profile_completed_at` y CTA a Match.
- Si se edita después y queda incompleto, se avisa y se bloquean las acciones sociales.

### 3.5.1 Solicitud de username `/solicitud-username`

- Muestra el username actual y el estado de la solicitud.
- Si está pendiente del usuario, incluye un campo para proponer un nombre nuevo.
- Valida formato, nombres reservados y disponibilidad antes de enviar.
- Si está pendiente del admin, muestra el nombre propuesto.
- Si fue aprobada, muestra el nuevo username; si fue rechazada, muestra la nota.
- El admin crea la solicitud y aprueba o rechaza desde `/admin/usuarios/:id`.

### 3.6 Inicio `/inicio`

- Hero con saludo, email, país y perfil propio.
- Stats de rango Solo/Dúo y Flex, roles, reputación y estado de cuenta.
- Card de perfil propio con Riot ID y Discord visibles solo para el dueño.
- Accesos rápidos a Match, Matches y edición de perfil.
- Carrusel compacto "Cómo funciona".
- Sección "Jugadores para vos" con hasta 3 cards de candidatos, score, motivos, like y bloqueo.
- Sección "Tus matches" con hasta 2 conexiones y contacto disponible para copiar.
- Banner de email sin verificar y CTA de onboarding si falta perfil.
- Estados de carga, vacío y error.

### 3.7 Match `/match`

- Filtros: cola (Solo/Dúo, Flex) y rol opcional.
- Card de candidato:
  - Iniciales, `@username`, aviso “Usuario de Duo LAS, no Riot ID”, rango, roles, país, diferencia horaria contra ART, estilo, idiomas, mic.
  - Score con anillo y motivos.
  - Botón "Me interesa" y "Pasar".
  - Indicador de disponibilidad activa.
- Lista de likes enviados.
- El badge de navegación cuenta candidatos disponibles, se actualiza al likear, bloquear, editar el perfil y cada 60 segundos.
- Estado vacío: "No encontramos duos compatibles todavía. Probá ampliar horarios o volver más tarde."
- Optimistic UI al likear con rollback.
- El badge de país y diferencia contra ART se reutiliza en todas las cards de jugador.

### 3.7.1 ARAM `/aram`

- Pestañas `Busco grupo` y `Disponible ahora`.
- Publicar grupo con 2-4 jugadores presentes y lugares libres hasta completar 5.
- Publicar disponibilidad individual para que un grupo invite.
- Ventana `Ahora` o `Esta noche`, micrófono y nota.
- Postulaciones e invitaciones en la misma pantalla; aceptar crea conexión `aram`.
- El contacto se revela en `/matches` después de aceptar.
- Una publicación activa por usuario.

### 3.8 Disponible ya `/disponible`

- Formulario inline para abrir disponibilidad.
- Selector de TTL 30 o 60, roles (1-2), cola y nota.
- Panel de sesión activa con vencimiento, roles y botón cerrar.
- Lista de jugadores disponibles con score, filtros y minutos restantes.
- Invitación inline con rol requerido y mensaje.
- Las invitaciones se responden en `/invitaciones`.

### 3.9 Busco 1 `/busco-1`

- Tabs: Explorar y Mis publicaciones.
- Explorar:
  - Filtros por cola y rol.
  - Cards con dueño, rango requerido, roles, nota y vencimiento.
  - Postulación inline con mensaje y estado propio.
- Mis publicaciones:
  - Crear publicación con cola, roles, rango y nota.
  - Estado, vencimiento y contadores de postulaciones.
  - Postulaciones con perfil, score y acciones aceptar/rechazar.
  - Cancelar publicación.

### 3.10 Matches `/matches`

- Lista de conexiones con la otra persona.
- Card con rango, roles, reputación y fecha.
- Panel de contacto: Riot ID con botón copiar y Discord con link.
- Feedback inline doble ciego: formulario, estado propio y del otro, revelado.
- Reportar con motivo y detalle; auto-bloquea y elimina el match.
- Archivar conexión.
- Estado vacío con CTA a Match.

### 3.11 Invitaciones `/invitaciones`

- Tabs Recibidas y Enviadas.
- Card con contraparte, rol, mensaje, vencimiento y estado.
- Acciones: aceptar/rechazar (recibidas) o cancelar (enviadas).
- Al aceptar se muestra el contacto Riot ID/Discord con botón copiar.
- Expiradas en gris.

### 3.12 Notificaciones `/notificaciones`

- Lista con icono por tipo, título, mensaje, fecha y estado leído.
- Indicador de conexión SSE: en vivo, reconectando o polling.
- Toggle de push con permiso explícito y aviso para iOS.
- Marcar todas como leídas y eliminar.
- Click navega a `data.url`.
- Estado vacío.

### 3.13 Perfil `/perfil`

- Edición directa en una sola pantalla, sin repetir el wizard de onboarding.
- Prefill con el perfil actual y los mismos campos del onboarding, incluido país, horarios, bio y Discord.
- Username y email son de solo lectura en el MVP.
- Banner de verificación de email.
- Guardar cambios sin salir de la pantalla y volver al inicio.

### 3.14 Perfil público `/perfil/:id`

- Iniciales, username, rango, roles, país, diferencia horaria contra ART, estilo, idiomas, mic, bio.
- Reputación y cantidad de conexiones.
- Badge "Disponible ahora".
- Botón reportar y bloquear.
- Nunca muestra email, Riot ID ni Discord.

### 3.15 Admin resumen `/admin`

- `AdminShell` con logo, badge Admin, navegación y logout.
- Cards de usuarios activos, altas de 7 días, email verificado, perfiles completos, suspendidos, reportes abiertos, matches activos, likes enviados, likes pendientes, disponibilidad y bajas pendientes.
- Actividad reciente: últimos 8 likes y últimos 8 matches con usuarios, estado y fecha.
- Cada card enlaza al listado o sección correspondiente.

### 3.16 Admin usuarios `/admin/usuarios`

- Buscador por username o email.
- Filtros por rol, estado, tipo de cuenta, email verificado y perfil completo.
- Tabla desktop y cards mobile con usuario, email, rol, estado, perfil, reportes y último acceso.
- Paginación de 20 por página.
- Click abre el detalle.

### 3.17 Admin detalle de usuario `/admin/usuarios/:id`

- Cabecera con username, email, rol, estado y contadores.
- Cuenta: ID, verificación, alta, último login, última actividad, suspensión y baja.
- Perfil de jugador: Riot ID, Discord, rango Solo/Dúo, rango Flex, roles, país, estilo, idiomas, micrófono, reputación, horarios y bio.
- Solicitud de cambio de username: crear, ver propuesta y aprobar/rechazar.
- Reportes recibidos y sanciones recientes.
- Disponibilidad activa y conexiones históricas.
- Si la cuenta no tiene perfil, se muestra un aviso; es esperable en admins.

### 3.18 Admin reportes `/admin/reportes`

- Tabla con fecha, reportero, reportado, motivo, prioridad y estado.
- Filtros por estado, motivo y prioridad.
- Detalle con contexto y estado del reportado.
- Acciones: descartar, advertir, suspender 7 días, 30 días o permanente.
- Nota interna opcional; se usa como motivo de la sanción.

### 3.19 Admin métricas `/admin/metrics`

- Cuatro cards: tiempo al primer duo, match a partida, retención 7d, simultáneos.
- Selector de rango de fechas en ART, con formato numérico es-AR.
- Estado vacío si no hay datos.

### 3.20 Legales `/terminos`, `/privacidad`, `/aviso-riot`

- Header con logo y volver al inicio.
- Tabs para cambiar entre documentos, con estado activo.
- Contenido numerado, última actualización, contacto de soporte y disclaimer legal de Riot.

### 3.21 Baja de cuenta

- Opción “Eliminar cuenta” dentro del menú de avatar.
- Doble confirmación: aviso de 30 días y luego contraseña actual.
- Al confirmar se cierra la sesión y se muestra `/cuenta-eliminada`.
- La cuenta se recupera iniciando sesión antes de la fecha de purga.
- Al vencer el plazo se eliminan datos personales y el perfil; quedan registros anonimizados de moderación.

## 4. Componentes

| Componente           | Uso                                   |
| -------------------- | ------------------------------------- |
| `AppShell`           | Shell responsive de jugador           |
| `AdminShell`         | Shell interno con navegación admin    |
| `RankIcon`           | Escudo SVG propio por tier            |
| `RiotDisclaimer`     | Boilerplate legal exigido por Riot    |
| `RankBadge`          | Tier, división y color                |
| `RoleIcon`           | Icono SVG propio por rol              |
| `PlayerAvatar`       | Iniciales con color determinístico    |
| `PlayerPreviewCard`  | Card de jugador compatible            |
| `HowItWorksCarousel` | Carrusel ilustrado de cómo funciona   |
| `PasswordField`      | Input de contraseña con toggle        |
| `AffinityCard`       | Card de candidato con score y motivos |
| `ScoreRing`          | Anillo de afinidad                    |
| `ScheduleGrid`       | Grilla semanal de bloques             |
| `AvailabilityToggle` | Activar/desactivar con countdown      |
| `InviteSheet`        | Modal de invitación                   |
| `PostCard`           | Post de Busco 1                       |
| `ApplicationCard`    | Postulación                           |
| `FeedbackDialog`     | Feedback positivo/negativo con tags   |
| `ReportDialog`       | Motivo y detalle                      |
| `BlockButton`        | Bloquear/desbloquear                  |
| `PushPrompt`         | Pedir permiso con gesto explícito     |
| `NotificationBell`   | Campana con contador                  |
| `EmptyState`         | Estado vacío con CTA                  |
| `ErrorState`         | Error con reintento                   |
| `LoadingSkeleton`    | Carga                                 |
| `ProtectedRoute`     | Guard de sesión                       |
| `AdminRoute`         | Guard de rol                          |
| `ErrorBoundary`      | Evitar pantalla blanca                |

## 5. Hooks

| Hook                 | Responsabilidad                 |
| -------------------- | ------------------------------- |
| `useAuth`            | Sesión, login, registro, logout |
| `useProfile`         | Perfil propio y completitud     |
| `usePublicProfile`   | Perfil ajeno                    |
| `useMatchCandidates` | Candidatos y filtros            |
| `useLikes`           | Like, retiro y salientes        |
| `useMatches`         | Conexiones y archivo            |
| `useAvailability`    | Sesión propia y listado         |
| `useInvites`         | Recibidas, enviadas y acciones  |
| `useDuoPosts`        | Posts, postulaciones y acciones |
| `useFeedback`        | Pendiente y envío               |
| `useNotifications`   | Lista, no leídas y acciones     |
| `useSSE`             | Stream y fallback a polling     |
| `usePush`            | Suscripción y permiso           |
| `useBlocks`          | Lista y acciones                |
| `useReports`         | Crear reporte                   |

Todos los hooks que hacen fetch chequean `localStorage.getItem('token')` antes de llamar a la API.

## 6. Estados

Cada pantalla contempla:

- **Loading:** skeleton, no spinner de pantalla completa.
- **Empty:** mensaje claro y CTA.
- **Error:** mensaje, reintento y sin romper la sesión.
- **Optimistic:** likes, invitaciones y postulaciones con rollback.
- **Offline:** si SSE falla, polling; si la red falla, aviso y reintento.

## 7. Copy

- Español rioplatense, voseo y tono directo.
- Ejemplos:
  - "Encontrá tu duo en LAS".
  - "Me interesa".
  - "No entres a cola mientras estás disponible".
  - "Ya pueden coordinar".
  - "No pudimos cargar esto. Probá de nuevo".
- Evitar tecnicismos de Riot en la UI.
- Mensajes de error claros, sin códigos internos.

## 8. Diseño

### Tokens

```css
--color-bg: #0b1220;
--color-surface: #111a2c;
--color-surface-2: #16213a;
--color-border: #22304d;
--color-text: #e6edf7;
--color-muted: #94a3b8;
--color-accent: #00c2b8;
--color-accent-strong: #22d3ee;
--color-gold: #f5c451;
--color-danger: #f87171;
--color-success: #34d399;
```

- Tipografía: Montserrat, con fallback a system-ui.
- Radios: 12 px en cards, 999 px en chips.
- Sombras suaves, sin exceso de glow.
- Iconos Lucide.
- Animaciones con Framer Motion, respetando `prefers-reduced-motion`.

### Colores de rango

| Tier         | Color     |
| ------------ | --------- |
| Hierro       | `#8b8f98` |
| Bronce       | `#cd7f32` |
| Plata        | `#c0c0c0` |
| Oro          | `#f5c451` |
| Platino      | `#4fd1c5` |
| Esmeralda    | `#34d399` |
| Diamante     | `#60a5fa` |
| Maestro      | `#a855f7` |
| Gran Maestro | `#ef4444` |
| Challenger   | `#f59e0b` |

Los iconos de rango y rol son SVG propios. No se usan assets oficiales de Riot.

## 9. Responsive

- Mobile: 360-430 px, una columna, bottom nav.
- Tablet: 768 px, dos columnas en listados.
- Desktop: 1200-1440 px, contenedor máximo 1200 px, top nav.
- Touch targets de al menos 44 px.
- Modales como bottom sheet en mobile y diálogo centrado en desktop.

## 10. Accesibilidad

- Foco visible en todos los interactivos.
- `aria-label` en iconos y botones sin texto.
- Contraste mínimo AA.
- No se depende solo del color para estado.
- Formularios con label y mensaje de error asociado.
- Navegación por teclado.
- `prefers-reduced-motion`.
- Textos alternativos en iconos decorativos vacíos.

## 11. PWA

- `manifest.json` con nombre Duo LAS, iconos 192/512, `display: standalone`, `start_url: /inicio`, tema `#0b1220`.
- `sw.js` solo para push y click, sin cache de la app.
- Registro del service worker al cargar la app.
- Iconos PNG 192/512 en `/icons`.
- En iOS, aviso de que push requiere instalar la PWA.

## 12. Reglas críticas

- Ningún componente global llama endpoints sin token.
- El interceptor 401 no redirige en bucle.
- No se usa `dangerouslySetInnerHTML`.
- No se muestran datos de contacto antes de una conexión.
- El Riot ID y el Discord propios sí se muestran en `/inicio`; los ajenos, solo en matches.
- No se muestran emails en perfiles.
- Fechas y countdowns en ART con `Intl`.
- Toda acción destructiva pide confirmación.
