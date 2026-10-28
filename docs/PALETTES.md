# Paletas de color

## Actual (guardada)

Snapshot previo al experimento. El respaldo exacto de los tokens está en
`apps/web/src/index.css.palette-backup`.

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

Valores hardcodeados de la paleta actual:

- `apps/web/index.html`: `theme-color` `#0b1220`.
- `apps/web/public/manifest.json`: `background_color` y `theme_color` `#0b1220`.
- `apps/web/public/favicon.svg`: fondo `#0b1220`, trazo y letra `#00c2b8`.
- `apps/web/src/pages/RegisterPage.jsx`: checkbox `accent-[#00c2b8]`.
- `apps/web/public/illustrations/*.svg`: fondos `#0b1220`, `#111a2c`, `#16213a`; acento `#00c2b8`; acento fuerte `#22d3ee`; bordes `#22304d`.

## Experimental (negro, cobalto y lima)

Distribución elegida: lima suavizado en CTAs/highlights, cobalto en superficies y bordes.

```css
--color-bg: #030407;
--color-surface: #060b14;
--color-surface-2: #0a1424;
--color-border: #1558c9;
--color-text: #f4f7fb;
--color-muted: #94a3b8;
--color-accent: #b0cf5c;
--color-accent-strong: #9fbf4f;
--color-gold: #f5c451;
--color-danger: #f87171;
--color-success: #34d399;
```

## Mapa reversible

| Actual    | Experimental | Uso                         |
| --------- | ------------ | --------------------------- |
| `#0b1220` | `#030407`    | Fondo general               |
| `#111a2c` | `#060b14`    | Superficie                  |
| `#16213a` | `#0a1424`    | Superficie secundaria       |
| `#0f172a` | `#060b14`    | Superficie en ilustraciones |
| `#22304d` | `#1558c9`    | Bordes                      |
| `#00c2b8` | `#b0cf5c`    | Acento principal suavizado  |
| `#22d3ee` | `#9fbf4f`    | Acento fuerte / hover       |

Los colores de rango, danger, success y muted no cambian.

## Reversión

1. Copiar `apps/web/src/index.css.palette-backup` sobre `apps/web/src/index.css`.
2. Aplicar el mapa reversible al revés en `index.html`, `manifest.json`,
   `favicon.svg`, `RegisterPage.jsx` e ilustraciones.
3. Borrar `docs/PALETTES.md` y el backup si la paleta actual queda definitiva.

## Pendiente si la paleta se aprueba

- Regenerar los PNG de `apps/web/public/icons/`.
- Actualizar los colores de los templates de Resend.
- Actualizar la sección de diseño de `docs/UI.md`.
