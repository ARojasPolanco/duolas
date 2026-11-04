# RIOT DEMO - Demo pública aislada

Documento de trabajo para `/demo-riot-9f4a2c`. La demo es pública, usa fixtures y no consulta la API de Riot.

## Objetivo

Mostrar cómo se vería el producto con la cuenta de Riot vinculada para acompañar la solicitud de Production API Key.

- Recorrido guiado por Mi perfil, Match, Perfil público, Disponible ya, Busco 1 y Cierre.
- Datos ficticios de perfil, rango y campeones.
- Sin backend, base de datos, auth real, SSE ni push.
- Sin Personal API Key ni Production API Key.
- Sin datos de usuarios reales.

## Ruta y acceso

```text
/demo-riot-9f4a2c
```

- El acceso se desbloquea con `VITE_RIOT_DEMO_ACCESS_CODE`; el código se comparte en la solicitud de revisión.
- La ruta se excluye de `robots.txt` y responde con `X-Robots-Tag: noindex, nofollow`.
- El CSP de Vercel permite imágenes de `ddragon.leagueoflegends.com`.
- El código de acceso no es una credencial real y no da acceso a la aplicación.

## Archivos

```text
apps/web/src/pages/RiotPublicDemoPage.jsx
apps/web/src/components/riot/RiotProfileView.jsx
apps/web/src/content/riotDemo.js
apps/web/public/robots.txt
```

## Recorrido

1. **Mi perfil**: cuenta Riot vinculada, nivel, rango y top campeones.
2. **Match**: cards con identidad verificada, score, campeones y “Ver perfil”.
3. **Perfil público**: vista de otro jugador, sin Riot ID ni contactos.
4. **Disponible ya**: disponibilidad con rango e identidad verificada.
5. **Busco 1**: publicaciones con el mismo dato verificado.
6. **Cierre**: resumen del recorrido.

## Datos ficticios

Todo sale de `apps/web/src/content/riotDemo.js`:

- `LunarFox#LAS`, `IronWolf#LAS` y `Luna#LAS` son cuentas inventadas.
- Niveles, rangos, LP, W/L y maestrías están hardcodeados.
- Los íconos de perfil y campeones se resuelven con Data Dragon usando IDs fijos.

No hay llamadas a Riot API, ni siquiera con la Personal API Key.

## Próxima fase

1. Publicar la demo y probar el acceso con el código de revisión.
2. Grabar video del flujo real en local con la Personal API Key, sin subir esa key.
3. Solicitar Production API Key.
4. Implementar RSO y verificación de rango en producción.
