# UI — Duo LAS

Mapa de rutas, pantallas, componentes y reglas de interacción. Mobile-first, tema oscuro y copy en español rioplatense.

## 1. Rutas

### Públicas

| Ruta               | Pantalla               |
| ------------------ | ---------------------- |
| `/`                | Landing                |
| `/login`           | Iniciar sesión         |
| `/register`        | Registro               |
| `/verify-email`    | Verificación de email  |
| `/forgot-password` | Pedir reset            |
| `/reset-password`  | Nueva contraseña       |
| `/terminos`        | Términos de uso        |
| `/privacidad`      | Política de privacidad |

### Protegidas

| Ruta              | Pantalla                          |
| ----------------- | --------------------------------- |
| `/inicio`         | Hub del jugador                   |
| `/onboarding`     | Completar perfil                  |
| `/match`          | Candidatos y likes                |
| `/disponible`     | Disponibilidad inmediata          |
| `/busco-1`        | Posts de grupo                    |
| `/matches`        | Conexiones y contacto             |
| `/invitaciones`   | Invitaciones recibidas y enviadas |
| `/notificaciones` | Centro de notificaciones          |
| `/perfil`         | Perfil propio                     |
| `/perfil/:id`     | Perfil público                    |
| `/admin/reportes` | Moderación                        |
| `/admin/metrics`  | KPIs                              |

Reglas:

- Sin sesión, una ruta protegida redirige a `/login` sin loops.
- Con sesión y perfil incompleto, `/match`, `/disponible` y `/busco-1` redirigen a `/onboarding`.
- `/admin/*` requiere rol admin.
- La landing redirige a `/inicio` si hay sesión.

## 2. Navegación

Todas las pantallas protegidas usan `AppShell`, salvo onboarding, que mantiene un layout enfocado.

### Mobile

- Top bar fija con logo, campana y avatar.
- Bottom nav fija con cinco ítems: Inicio, Match, Disponible, Busco 1 y Matches.
- El avatar abre el menú de cuenta: Mi perfil, Invitaciones, Notificaciones, accesos admin y Cerrar sesión.
- Los ítems de admin no se muestran en la bottom nav.

### Desktop

Top nav con logo, Inicio, Match, Disponible, Busco 1, Matches e Invitaciones. A la derecha viven la campana y el menú de avatar con perfil, notificaciones, accesos admin y logout.

## 3. Pantallas

### 3.1 Landing `/`

- Hero: "Encontrá tu duo en LAS y subí de elo".
- Dos CTAs: "Crear cuenta" y "Ya tengo cuenta".
- Carrusel de 4 slides con ilustraciones propias: match por afinidad, Disponible ya, Busco 1 y confianza.
- Vista previa de 3 cards de jugadores de ejemplo, sin Riot ID ni Discord.
- Tres bloques: match por afinidad, Disponible ya, Busco 1.
- Aviso +18 y aviso de no afiliación con Riot.
- Footer con términos y privacidad.

### 3.2 Login `/login`

- Email o username + contraseña.
- Toggle para mostrar u ocultar la contraseña.
- Link "¿Has olvidado tu contraseña?" junto al campo, hacia `/forgot-password`.
- Link a registro.
- Mensaje de suspensión si corresponde.
- Sin redirect loop.

### 3.3 Registro `/register`

- Username, email, contraseña.
- Checkbox obligatorio +18.
- Checkbox obligatorio de términos y privacidad.
- hCaptcha si está configurado.
- Link a login.

### 3.4 Verificación `/verify-email`

- Estado: verificando, verificado, inválido o expirado.
- Botón para reenviar si hay sesión.
- CTA a onboarding si se verificó.

### 3.5 Onboarding `/onboarding`

Seis pasos con barra de progreso:

1. Riot ID y servidor LAS.
2. Rol principal y secundario.
3. Rango y LP.
4. Horarios por día con bloques de 6 horas, atajos y selección múltiple.
5. Estilo, idiomas y micrófono.
6. Bio, Discord opcional y resumen.

Reglas:

- Validación por paso.
- Se puede volver.
- Al terminar, `profile_completed_at` y CTA a Match.
- Si se edita después y queda incompleto, se avisa y se bloquean las acciones sociales.

### 3.6 Inicio `/inicio`

- Hero con saludo, email y perfil propio.
- Stats de rango, roles, reputación y estado de cuenta.
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
  - Iniciales, username, rango, roles, estilo, idiomas, mic.
  - Score con anillo y motivos.
  - Botón "Me interesa" y "Pasar".
  - Indicador de disponibilidad activa.
- Lista de likes enviados.
- Estado vacío: "No encontramos duos compatibles todavía. Probá ampliar horarios o volver más tarde."
- Optimistic UI al likear con rollback.

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

- Editar perfil con los mismos campos del onboarding. Username y email no son editables en el MVP.
- Reputación con porcentaje y conteos.
- Estado de verificación de email.
- Lista de bloqueados con desbloquear.
- Links a términos y privacidad.
- Cerrar sesión.

### 3.14 Perfil público `/perfil/:id`

- Iniciales, username, rango, roles, estilo, idiomas, mic, bio.
- Reputación y cantidad de conexiones.
- Badge "Disponible ahora".
- Botón reportar y bloquear.
- Nunca muestra email, Riot ID ni Discord.

### 3.15 Admin reportes `/admin/reportes`

- Tabla con fecha, reportero, reportado, motivo, prioridad y estado.
- Filtros por estado, motivo y prioridad.
- Detalle con contexto y estado del reportado.
- Acciones: descartar, advertir, suspender 7 días, 30 días o permanente.
- Nota interna opcional; se usa como motivo de la sanción.

### 3.16 Admin métricas `/admin/metrics`

- Cuatro cards: tiempo al primer duo, match a partida, retención 7d, simultáneos.
- Selector de rango de fechas en ART, con formato numérico es-AR.
- Estado vacío si no hay datos.

### 3.17 Legales `/terminos`, `/privacidad`, `/aviso-riot`

- Header con logo y volver al inicio.
- Tabs para cambiar entre documentos, con estado activo.
- Contenido numerado, última actualización y contacto de soporte.

## 4. Componentes

| Componente           | Uso                                   |
| -------------------- | ------------------------------------- |
| `AppShell`           | Shell responsive con nav y menú       |
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
