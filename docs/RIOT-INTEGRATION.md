# RIOT INTEGRATION — Duo LAS

Preparación para una futura integración con Riot. **El MVP público no usa Riot API ni RSO**: el rango es declarado y los escudos son SVG propios.

Este documento no reemplaza los términos de Riot. Antes de aplicar hay que releer las políticas oficiales y confirmar que el producto sigue cumpliéndolas.

## 1. Decisión actual

- Lanzar el MVP sin Riot API.
- Registrar el producto en el Developer Portal, aunque todavía no use la API.
- Mantener rango declarado y escudos originales.
- Pedir una **personal key** solo para pruebas internas cuando haga falta.
- Aplicar a **production key** cuando el sitio público esté completo.
- Evaluar RSO recién después de la production key, si se quiere verificar titularidad de cuenta.

## 2. Tipos de key

| Tipo        | Uso                                               | Límite inicial                              | Público |
| ----------- | ------------------------------------------------- | ------------------------------------------- | ------- |
| Development | Prototipos y pruebas                              | Bajo; vence cada 24 h                       | No      |
| Personal    | Proyecto personal o comunidad privada chica       | 20 req/s y 100 req/2 min por región         | No      |
| Production  | Producto público aprobado por Developer Relations | 500 req/10 s y 30.000 req/10 min por región | Sí      |

Reglas:

- Una personal key **no se puede usar en un producto público**, ni siquiera en alpha/beta abierta.
- La production key es por producto y por juego.
- La key va **solo en el backend**. Nunca en `VITE_*`, frontend, logs ni repositorio.
- Los límites son por región y pueden incluir límites por método y por servicio.

## 3. Costo

Riot no cobra por la API key ni por la revisión. No hay un plan pago para acelerar la aprobación.

Costos reales:

- Dominio, hosting, base de datos y monitoreo.
- Tiempo de integración y mantenimiento.
- Cache y jobs para respetar rate limits.

## 4. Revisión

La aprobación es mixta:

- **Verificación de dominio:** automatizada, subiendo un `riot.txt` a la raíz del sitio.
- **Revisión del producto:** humana, por Developer Relations.

Revisan caso de uso, sitio funcional, flujo de usuario, términos, privacidad, seguridad, políticas de IP y calidad del producto.

La documentación oficial indica revisión semanal y hasta 3 semanas de demora. Reportes de la comunidad en 2026 hablan de **3 a 8 meses o más**. Planificar con meses, no con semanas.

## 5. Contacto

No hay llamada ni reunión comercial estándar.

- **Support site:** https://support-developer.riotgames.com
- **Developer Portal:** mensajes de la aplicación para aprobaciones, rechazos y preguntas.
- **Discord:** https://discord.gg/riotgamesdevrel (comunidad, no aprobaciones).
- **GitHub:** solo bugs de API, no solicitudes de key.

## 6. Assets y marca

La política general permite usar únicamente ciertos assets, como Data Dragon y Press Kit, y con condiciones. Los crests de rango oficiales y el logo de League no están automáticamente permitidos por tener una API key.

Decisión de Duo LAS:

- No usar crests oficiales ni el logo “L”.
- Mantener `RankIcon` con SVG originales.
- Si Riot autoriza assets oficiales por escrito, recién ahí evaluar el reemplazo.
- Mantener el boilerplate legal exacto de Riot visible en la web.

## 7. Requisitos para la production key

- [ ] Producto registrado en Developer Portal.
- [ ] Sitio público en un dominio propio.
- [ ] HTTPS y dominio verificado con `riot.txt`.
- [ ] Términos de uso y Política de Privacidad públicas.
- [ ] Flujo de registro, login, perfil y búsqueda de duo demostrable.
- [ ] Descripción clara del caso de uso LFG.
- [ ] Video o demo con el flujo completo.
- [ ] Operación estable: salud, logs y manejo de errores.
- [ ] Key solo en backend.
- [ ] Plan de rate limits y cache.
- [ ] Contacto de soporte visible.
- [ ] Boilerplate legal de Riot visible.

## 8. Plan técnico cuando llegue la key

1. Agregar `RIOT_API_KEY` en el entorno del backend.
2. Usar `RIOT_PLATFORM=la2` y `RIOT_REGION=americas` para LAS.
3. Resolver Riot ID a PUUID con Account-V1.
4. Consultar ranked solo cuando el usuario pida verificar o actualizar.
5. Guardar un snapshot de rango y `rank_verified_at`; no consultar en cada request.
6. Cachear respuestas y programar refresh con backoff.
7. Manejar `429` con `Retry-After` y degradar a rango declarado.
8. Agregar un kill switch para deshabilitar la integración sin deploy.
9. No loguear la key ni el Riot ID completo.
10. Si se verifica titularidad, implementar RSO después de la aprobación.

No implementar RSO “por las dudas”: requiere production key, cliente OAuth y un flujo de consentimiento.

## 9. Variables previstas

```env
RIOT_API_KEY=
RIOT_PLATFORM=la2
RIOT_REGION=americas
RIOT_API_TIMEOUT_MS=8000
```

No crear ninguna variable `VITE_RIOT_*`.

## 10. Checklist de aplicación

- [ ] Definir titular legal y datos de contacto del producto.
- [ ] Publicar web y API en dominios finales.
- [ ] Confirmar términos, privacidad y aviso de Riot.
- [ ] Verificar el dominio con `riot.txt`.
- [ ] Registrar el producto como LFG.
- [ ] Adjuntar demo del flujo completo.
- [ ] Explicar qué datos se guardan y para qué.
- [ ] Explicar moderación, reportes y suspensión.
- [ ] Confirmar que no se usan assets oficiales sin permiso.
- [ ] Enviar la solicitud y esperar la revisión.
- [ ] No usar una personal key en el sitio público mientras esperás.

## 11. Fuentes oficiales

- Portal y tipos de key: https://developer.riotgames.com/docs/portal
- Preguntas frecuentes: https://developer.riotgames.com/docs/faqs
- Tiempos de respuesta: https://support-developer.riotgames.com/hc/en-us/articles/22801270481427-Response-Times
- Producción: https://support-developer.riotgames.com/hc/en-us/articles/22801383038867-Production-Key-Applications
- Políticas generales: https://developer.riotgames.com/policies/general
- Política de League: https://developer.riotgames.com/docs/lol
- Deprecación de mensajes: https://support-developer.riotgames.com/hc/en-us/articles/28593035600531-App-Messaging-Deprecation

Los tiempos y requisitos pueden cambiar. Confirmar todo antes de aplicar.
