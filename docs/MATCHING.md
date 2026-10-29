# MATCHING — Duo LAS

Fórmulas y reglas del motor de afinidad. Todo lo de este documento es lógica pura, testeable sin base de datos, y vive en `apps/api/src/config/matching.js` más funciones puras en `apps/api/src/modules/matching/matching.utils.js`.

## 1. Objetivo

Ordenar candidatos compatibles por probabilidad de que la partida sea buena y repetible, sin inventar datos que el MVP no tiene. El rango es declarado; la reputación y el feedback compensan.

## 2. Modelo de rango

### Tiers

```text
iron = 0
bronze = 1
silver = 2
gold = 3
platinum = 4
emerald = 5
diamond = 6
master = 7
grandmaster = 8
challenger = 9
```

### Divisiones

```text
iv = 0
iii = 1
ii = 2
i = 3
```

### Índice absoluto

```text
rank_index = tierIndex * 4 + divisionIndex
```

Maestro, Gran Maestro y Challenger no tienen división (`divisionIndex = 0`).

| Rango        | Índice |
| ------------ | ------ |
| Hierro IV    | 0      |
| Hierro I     | 3      |
| Bronce IV    | 4      |
| Plata IV     | 8      |
| Oro IV       | 12     |
| Platino IV   | 16     |
| Esmeralda IV | 20     |
| Diamante IV  | 24     |
| Diamante I   | 27     |
| Maestro      | 28     |
| Gran Maestro | 32     |
| Challenger   | 36     |

### Compatibilidad

```text
rankIndex(x, queue) =
  queue === 'flex' && x.flexRankIndex != null
    ? x.flexRankIndex
    : x.rankIndex

distance = |rankIndex(a, queue) - rankIndex(b, queue)|
maxDistance = queue === 'solo_duo' ? 4 : 8
compatible = distance <= maxDistance
```

- Solo/Dúo: ±1 tier y usa `rank_index`.
- Flex: ±2 tiers y usa `flex_rank_index`.
- Si un perfil no declaró Flex, se usa su `rank_index` de Solo/Dúo como respaldo.
- Dentro del mismo tier se permiten todas las divisiones.
- Un Diamante IV y un Esmeralda IV tienen distancia 4: compatibles en Solo/Dúo.
- Un Diamante I (27) y un Maestro (28) tienen distancia 1: compatibles.

## 3. Roles

Valores: `top`, `jungle`, `mid`, `adc`, `support`, `fill`.

Cada perfil declara principal y secundario; deben ser distintos salvo que alguno sea `fill`.

```text
rolesComplementary(a, b) =
  'fill' en roles(a) o 'fill' en roles(b)
  o existe ra en roles(a) y rb en roles(b) tal que ra !== rb
```

Donde `roles(x) = [x.primaryRole, x.secondaryRole]`.

- Mid + Jungla contra Jungla + Top: compatibles.
- Mid + Support contra Support + Mid: compatibles (existe par distinto).
- Mid + Mid contra Mid + Mid: incompatibles.
- `fill` es comodín: es compatible con cualquier rol y puede cubrir cualquier filtro de rol.

## 4. Horarios

28 bloques semanales:

```text
{dow}_{block}
dow = mon | tue | wed | thu | fri | sat | sun
block = early | morning | afternoon | night
```

Horas en ART:

| Bloque      | Rango       |
| ----------- | ----------- |
| `early`     | 00:00-05:59 |
| `morning`   | 06:00-11:59 |
| `afternoon` | 12:00-17:59 |
| `night`     | 18:00-23:59 |

### Solape

```text
overlap = |A ∩ B| / min(|A|, |B|)
```

- Si ambos tienen 1 bloque y coinciden: 1.0.
- Si A tiene 2 y B tiene 6, y coinciden 2: 1.0.
- No se penaliza tener más disponibilidad.
- Si `overlap = 0`, el candidato se descarta (filtro duro configurable).

## 5. Estilo de juego

Matriz de afinidad:

|         | casual | ranked | tryhard |
| ------- | ------ | ------ | ------- |
| casual  | 1.0    | 0.6    | 0.2     |
| ranked  | 0.6    | 1.0    | 0.6     |
| tryhard | 0.2    | 0.6    | 1.0     |

## 6. Idiomas

Lista de 1 a 3, el primero es principal.

```text
languageScore =
  1.0 si primaryLanguage(a) === primaryLanguage(b)
  0.6 si comparten al menos un idioma
  0   si no comparten ninguno
```

## 7. Micrófono

```text
micScore = 1.0 si a.hasMic === b.hasMic, 0 en caso contrario
```

No se penaliza no tener mic; se premia la coincidencia de expectativa.

## 8. Score de match de duo

Pesos:

| Factor              | Peso |
| ------------------- | ---- |
| Horarios            | 40   |
| Estilo              | 25   |
| Idioma              | 15   |
| Roles               | 10   |
| Micrófono           | 5    |
| Proximidad de rango | 5    |

Fórmula:

```text
schedule  = 40 * overlap
style     = 25 * styleMatrix[a.playStyle][b.playStyle]
language  = 15 * languageScore
roles     = 10 * (a.primaryRole !== b.primaryRole ? 1 : 0.6)
mic       = 5  * micScore
rank      = 5  * clamp(1 - distance / maxDistance, 0, 1)

duoScore = round(schedule + style + language + roles + mic + rank)
```

Resultado entre 0 y 100.

### Ejemplo

- Horarios: A tiene 6, B tiene 4, coinciden 3 → `40 * 3/4 = 30`.
- Estilo: casual vs ranked → `25 * 0.6 = 15`.
- Idioma: ambos español → `15`.
- Roles: mid/jungle vs jungle/top → principal distinto → `10`.
- Mic: ambos sí → `5`.
- Rango: distancia 2 de 4 → `5 * 0.5 = 2.5`.

Total: `30 + 15 + 15 + 10 + 5 + 2.5 = 77.5` → **78**.

## 9. Score de Disponible ya

No usa horarios porque la persona está disponible ahora.

| Factor              | Peso |
| ------------------- | ---- |
| Proximidad de rango | 30   |
| Estilo              | 25   |
| Idioma              | 20   |
| Micrófono           | 10   |
| Reputación          | 15   |

```text
rank       = 30 * clamp(1 - distance / maxDistance, 0, 1)
style      = 25 * styleMatrix[a.playStyle][b.playStyle]
language   = 20 * languageScore
mic        = 10 * micScore
reputation = 15 * (b.reputationScore / 100)

nowScore = round(rank + style + language + mic + reputation)
```

La reputación arranca en 50, por lo que un perfil nuevo suma 7.5.

## 10. Score de afinidad para Busco 1

Se usa para ordenar postulantes y sugerencias.

Los posts guardan dos índices calculados:

```text
rank_min_index = tierIndex(rank_min_tier) * 4
rank_max_index = tierIndex(rank_max_tier) * 4 + (tier_max es master+ ? 0 : 3)
```

Así se incluyen todas las divisiones del tier máximo. Un post de Oro a Platino cubre de 12 a 19.

| Factor                      | Peso |
| --------------------------- | ---- |
| Encaje en el rango del post | 40   |
| Rol                         | 30   |
| Estilo                      | 20   |
| Idioma                      | 10   |

```text
midpoint = (post.rankMinIndex + post.rankMaxIndex) / 2
halfRange = max(1, (post.rankMaxIndex - post.rankMinIndex) / 2)
rankFit = clamp(1 - |rankIndex(applicant, post.queue) - midpoint| / halfRange, 0, 1)

roleFit =
  1.0 si el postulante es fill, el post pide fill o su rol principal está en rolesNeeded
  0.6 si su rol secundario está en rolesNeeded
  0   si no cumple (no debería llegar por filtro)

postFitScore = round(40 * rankFit + 30 * roleFit + 20 * style + 10 * language)
```

## 11. Filtros duros de candidatos

Un candidato debe cumplir todo:

1. Servidor `LAS`.
2. Usuario activo, no suspendido, no borrado.
3. Email verificado.
4. Perfil completo.
5. Edad confirmada.
6. `distance <= maxDistance` para la cola, usando el rango Flex en Flex.
7. Roles complementarios; `fill` siempre cumple.
8. `overlap >= 1` bloque horario (configurable).
9. No es uno mismo.
10. No hay bloqueo en ninguna dirección.
11. No hay conexión activa.
12. El viewer no le dio like pendiente ni está en match.
13. Si se filtra por rol, el candidato puede jugarlo o es `fill`.

No se exige que el candidato esté disponible ahora. Eso es exclusivo de "Disponible ya".

## 12. Consulta de candidatos

1. SQL filtra por servidor, estado, verificación, perfil completo, rango, solape de horarios con `&&`, bloqueos, conexiones y likes salientes.
2. Se limita a 200 perfiles ordenados por `last_active_at DESC`.
3. En memoria se valida complementariedad de roles y filtro por rol.
4. Se calcula `duoScore`.
5. Se ordena por score y desempate.
6. Se devuelven los primeros `limit` (máximo 50, default 20).

Índices que sostienen la consulta:

- `(server, rank_index)`.
- GIN `(schedule_blocks)`.
- `(user_id)` en likes, conexiones y bloqueos.
- `(last_active_at)`.

## 13. Desempate

Si dos candidatos tienen el mismo score:

1. Mayor `reputation_score`.
2. `last_active_at` más reciente.
3. `created_at` más antiguo.
4. `id` ascendente para determinismo.

## 14. Motivos para la UI

El servicio devuelve entre 2 y 4 motivos legibles:

- "Coinciden N horarios".
- "Mismo estilo" o "Estilos compatibles".
- "Hablan español" o "Comparten inglés".
- "Roles complementarios".
- "Ambos con micrófono" o "Ambos sin micrófono".
- "Rango muy cercano" si la distancia es 0 o 1.

No se muestran motivos negativos ni datos sensibles.

## 15. Configuración

`apps/api/src/config/matching.js`:

```js
export const RANK_TOLERANCE = {
  solo_duo: 4,
  flex: 8,
};

export const DUO_WEIGHTS = {
  schedule: 40,
  style: 25,
  language: 15,
  roles: 10,
  mic: 5,
  rank: 5,
};

export const NOW_WEIGHTS = {
  rank: 30,
  style: 25,
  language: 20,
  mic: 10,
  reputation: 15,
};

export const POST_WEIGHTS = {
  rank: 40,
  roles: 30,
  style: 20,
  language: 10,
};

export const REQUIRE_SCHEDULE_OVERLAP = true;
export const CANDIDATE_FETCH_LIMIT = 200;
export const CANDIDATE_RETURN_LIMIT = 20;
```

Los pesos deben sumar 100 cada uno. Un test unitario lo verifica.

## 16. Casos borde

- **Maestro+ sin división:** `divisionIndex = 0`; la distancia se calcula solo por tier. Maestro vs Challenger tiene distancia 8: incompatible en Solo/Dúo y compatible en Flex.
- **Ambos solo mid:** no son complementarios; se excluyen.
- **Perfil incompleto:** no aparece ni puede likear.
- **Email sin verificar:** no aparece ni puede likear.
- **Conexión archivada:** no bloquea candidatos; si hay like mutuo, se reactiva la misma fila.
- **Bloqueo:** excluye en ambas direcciones y archiva la conexión.
- **Disponibilidad vencida:** se cierra de forma perezosa y no aparece.
- **Cambio de rango:** recalcula `rank_index`; los likes existentes se mantienen.
- **Reputación nueva:** score 50 y etiqueta "Nuevo" con menos de 3 feedbacks.
- **Zona horaria:** ART fija, sin horario de verano; el matching compara bloques ART. El país del perfil solo se usa para mostrar la equivalencia local en la UI.
- **Sin solape horario:** se descarta aunque el resto sea perfecto.
- **Doble like:** idempotente; no duplica conexión.
- **Like a sí mismo:** 400.
- **Like a bloqueado:** 403.

## 17. Anti-abuso

- Doble ciego: no se revela quién likeó.
- Límite de 30 likes por hora.
- Límite de invitaciones y postulaciones por hora/día.
- Reportar auto-bloquea.
- No se puede invitar ni postular a quien ya tiene conexión activa.
- Una conexión por par; el histórico se conserva archivado.
- La reputación no se puede editar ni borrar.

## 18. Test vectors obligatorios

| Caso                     | Esperado                                            |
| ------------------------ | --------------------------------------------------- |
| Hierro IV vs Bronce IV   | Distancia 4, compatible Solo/Dúo                    |
| Hierro IV vs Bronce I    | Distancia 7, incompatible Solo/Dúo, compatible Flex |
| Diamante I vs Maestro    | Distancia 1, compatible                             |
| Mid/Mid vs Mid/Mid       | Incompatible                                        |
| Mid/Jungla vs Jungla/Top | Compatible                                          |
| Horarios disjuntos       | Excluido                                            |
| Score máximo             | 100 con todo perfecto                               |
| Score mínimo elegible    | ≥ 0 y determinista                                  |
| Pesos                    | Suman 100                                           |
| Reputación 0/0           | 50                                                  |
| Reputación 5/0           | 78                                                  |
| Reputación 5/1           | 70                                                  |
| Reputación 0/5           | 22                                                  |
