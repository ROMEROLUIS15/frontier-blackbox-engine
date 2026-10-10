# Guía de experimentos — servicio "La caja negra" (Reto 2)

> Documento generado por `scripts/experiment-guide.ts` a partir de `experimentos.jsonl`. No se edita a mano:
> cualquier cambio se hace en el log o en el generador y se regenera.

## Propósito y cómo leer cada entrada

Este documento explica, línea por línea, cada solicitud registrada en `experimentos.jsonl` (`X:n` = línea con `id` n):
qué se quería saber, en qué estado se hizo, cómo repetirla, qué respondió el servicio original, qué responde la réplica
y qué conclusión se registró. Cada entrada contiene:

- **Pregunta (hipótesis):** la hipótesis registrada, tal cual, antes de enviar la solicitud.
- **Preparación:** posición dentro de su secuencia y solicitudes previas que dejaron el estado necesario.
- **Solicitud:** comando `curl` ejecutable.
- **Respuesta del original:** status y cuerpo registrados (evidencia).
- **Respuesta de la réplica:** status y cuerpo medidos al generar este documento, y si coinciden con el original.
- **Conclusión:** la interpretación registrada en el log, con su etiqueta de evidencia.

La hipótesis es la pregunta formulada antes de la solicitud; la evidencia es el par status + cuerpo observado; la
conclusión es la interpretación que se anotó en el log y puede ser más débil que la evidencia (por ejemplo, una
inferencia).

## Cómo regenerar el documento

```bash
npm run docs:experiments            # escribe docs/experimentos.md
npm run docs:experiments -- --check # sale con código 1 si el archivo en disco está desactualizado
```

El generador levanta la réplica en el propio proceso (solo `127.0.0.1`, puerto efímero, token local fijo), reproduce
todas las líneas del log agrupadas por `seq` y con `POST /__reset` antes de cada grupo, y escribe el resultado sin
marcas de tiempo, de modo que la salida es determinista. No contacta con el servicio original ni con ningún otro host.

## Cómo reproducir una solicitud a mano

```bash
export TEAM_TOKEN=<token del equipo>   # nunca se escribe en el repositorio
export BASE_URL=<URL base>              # la del servicio original (mientras esté disponible) o la de la réplica
```

Ejecute en orden las solicitudes de la secuencia (empezando por `POST /__reset` con el token del equipo y cuerpo `{}`)
hasta la entrada que quiera repetir. El log no registra la cabecera `Content-Type`; los comandos usan
`application/json` cuando hay cuerpo. Las líneas X:1–X:6 no registran método, ruta ni autenticación: se toman de su
repetición en v2 y se marcan como inferidas.

## Método

- **Versión 1** (campo `version` ausente): X:1–X:84, 84 líneas.
- **Repetición de la versión 1 contra la versión 2** (campo `replay_of`): X:85–X:168, 84 líneas, una por cada línea de la versión 1, con la misma solicitud y el mismo estado.
- **Ondas nuevas de la versión 2:** X:169–X:313, 145 líneas.
- Total: 313 líneas (v1: 84; v2: 229, desde X:85).

Cada `seq` empieza con `POST /__reset`, de modo que su primera solicitud parte de un estado vacío. El propósito de cada
secuencia es la primera hipótesis registrada en ella.

| seq | Líneas | Solicitudes | Versión | Propósito (primera hipótesis) |
|---|---|---|---|---|
| `s-diag-01` | X:1 | 1 | v1 | Diagnóstico de autenticación: /msg acepta el token personal (sin reset previo; el reset devolvió 401 E001) |
| `s-ctl-01` | X:2–X:6 | 5 | v1 | Línea base: PING;64 sigue respondiendo igual que en el ejemplo n=1 (200 {"pong":true}) |
| `s-io-01` | X:7–X:18 | 12 | v1 | Ruta inexistente con GET y token válido: el original responde algo distinto del 404 E404 inventado por la réplica |
| `s-amt-01` | X:19–X:30 | 12 | v1 | Preparación: crear AC-0001 |
| `s-ej-01` | X:31–X:50 | 20 | v1 | Reproducción del ejemplo n=1 (pruebas/ejemplos.jsonl:1): el original responde 200 {"pong": true} |
| `s-ord-02` | X:51–X:60 | 10 | v1 | Orden: comando desconocido + control mal formado: ¿E301 o E201? |
| `s-anu-01` | X:61–X:73 | 13 | v1 | Preparación: AC-0001 |
| `s-tr-01` | X:74–X:84 | 11 | v1 | Preparación: AC-0001 |
| `s-diag-01-v2` | X:85 | 1 | v2 | Replay v2 de X:1: misma solicitud y mismo estado que en v1; ¿cambió la respuesta? |
| `s-ctl-01-v2` | X:86–X:90 | 5 | v2 | Replay v2 de X:2: misma solicitud y mismo estado que en v1; ¿cambió la respuesta? |
| `s-io-01-v2` | X:91–X:102 | 12 | v2 | Replay v2 de X:7: misma solicitud y mismo estado que en v1; ¿cambió la respuesta? |
| `s-amt-01-v2` | X:103–X:114 | 12 | v2 | Replay v2 de X:19: misma solicitud y mismo estado que en v1; ¿cambió la respuesta? |
| `s-ej-01-v2` | X:115–X:134 | 20 | v2 | Replay v2 de X:31: misma solicitud y mismo estado que en v1; ¿cambió la respuesta? |
| `s-ord-02-v2` | X:135–X:144 | 10 | v2 | Replay v2 de X:51: misma solicitud y mismo estado que en v1; ¿cambió la respuesta? |
| `s-anu-01-v2` | X:145–X:157 | 13 | v2 | Replay v2 de X:61: misma solicitud y mismo estado que en v1; ¿cambió la respuesta? |
| `s-tr-01-v2` | X:158–X:168 | 11 | v2 | Replay v2 de X:74: misma solicitud y mismo estado que en v1; ¿cambió la respuesta? |
| `s-v2-lim-01` | X:169–X:173 | 5 | v2 | Preparación: AC-0001 |
| `s-v2-exp-01` | X:174–X:180 | 7 | v2 | Preparación: AC-0001 |
| `s-v2-lim-02` | X:181–X:186 | 6 | v2 | Preparación: AC-0001 |
| `s-v2-lim-03` | X:187–X:192 | 6 | v2 | Preparación: AC-0001 |
| `s-v2-e104-01` | X:193–X:196 | 4 | v2 | Preparación: AC-0001 |
| `s-v2-seg-01` | X:197–X:205 | 9 | v2 | README.md:59-63 muestra PING;XX -> 200 pong; la réplica da E201. ¿Qué responde v2? |
| `s-v2-anu-01` | X:206–X:209 | 4 | v2 | Preparación: AC-0001 |
| `s-v2-ord-01` | X:210 | 1 | v2 | Estado vacío, origen = destino inexistente: ¿E304 o E401? |
| `s-v2-ord-02` | X:211 | 1 | v2 | Estado vacío, cuenta inexistente y monto inválido: ¿E401 o E303? |
| `s-v2-ping-01` | X:212–X:214 | 3 | v2 | PING con control numérico incorrecto (válido 64): ¿pong (ignora el control) o E202? |
| `s-v2-lim-04` | X:215–X:220 | 6 | v2 | Preparación: AC-0001 |
| `s-v2-ord-03` | X:221–X:222 | 2 | v2 | Estado vacío, monto inválido y origen = destino: ¿E303 o E304? |
| `s-v2-neg-01` | X:223–X:228 | 6 | v2 | Preparación: AC-0001 |
| `s-v2-amt-02` | X:229–X:236 | 8 | v2 | Preparación: AC-0001 |
| `s-v2-ids-01` | X:237–X:242 | 6 | v2 | Preparación: AC-0001 |
| `s-v2-anu-02` | X:243–X:249 | 7 | v2 | Preparación: AC-0001 |
| `s-v2-http-01` | X:250–X:264 | 15 | v2 | Ruta con barra final /msg/: ¿404 E404 o se acepta? |
| `s-v2-max-01` | X:265–X:276 | 12 | v2 | Preparación: AC-0001 |
| `s-v2-max-02` | X:277–X:281 | 5 | v2 | Preparación: AC-0001 con saldo 0 |
| `s-v2-ctl-02` | X:282–X:291 | 10 | v2 | Control con cero a la izquierda en un comando distinto de PING (válido 50): ¿201 o E202/E201? |
| `s-v2-e507-01` | X:292–X:296 | 5 | v2 | Preparación: AC-0001 |
| `s-v2-http-02` | X:297–X:299 | 3 | v2 | PUT /msg: ¿404 E404? |
| `s-v2-sug-01` | X:300–X:310 | 11 | v2 | Sugerencia: 'PIN' (distancia 1 de PING, control válido): ¿E301 con sugerencia PING? |
| `s-v2-sug-02` | X:311–X:313 | 3 | v2 | Umbral de sugerencia: 'CONSUL' está a distancia de Levenshtein 2 de CONSULTA: ¿sugerencia? |

## Resumen de hallazgos

Todas las cifras se calculan al generar el documento.

- Líneas del log: 313 (versión 1: 84; versión 2: 229).
- Conclusiones que empiezan con "CAMBIO 1": 12.
- Conclusiones que empiezan con "CAMBIO 2": 7.
- Conclusiones que empiezan con "Consecuencia del CAMBIO": 4.
- Conclusiones que empiezan con "Comportamiento de v2": 80.
- La réplica coincide con el original en 229/229 líneas de la versión 2.
- La réplica coincide con el original en 69/84 líneas de la versión 1.

La réplica implementa la versión 2. Una diferencia en una línea de la versión 1 no es un defecto: indica un punto donde
la versión 2 cambió el comportamiento. Líneas de la versión 1 que difieren:

- X:28 (ver X:112)
- X:29 (ver X:113)
- X:35 (ver X:119)
- X:38 (ver X:122)
- X:40 (ver X:124)
- X:41 (ver X:125)
- X:43 (ver X:127)
- X:44 (ver X:128)
- X:48 (ver X:132)
- X:49 (ver X:133)
- X:66 (ver X:150)
- X:67 (ver X:151)
- X:69 (ver X:153)
- X:73 (ver X:157)
- X:81 (ver X:165)

### Leyenda de etiquetas de evidencia

La etiqueta se asigna mecánicamente a partir de la conclusión registrada, en este orden de prioridad.

| Etiqueta | Criterio |
|---|---|
| Consecuencia de un cambio | La conclusión empieza con "Consecuencia". |
| Cambio de versión probado | La conclusión contiene "CAMBIO 1" o "CAMBIO 2" y no es una consecuencia. |
| Comportamiento de v2 sin línea base en v1 | La conclusión empieza con "Comportamiento de v2". |
| Preparación | La conclusión empieza con "Preparación". |
| Línea base v1 | La línea es de la versión 1. |
| Repetición en v2 | La línea tiene `replay_of` y la conclusión empieza con "Igual". |
| Observación | Cualquier otro caso. |

Distribución de etiquetas:

- Cambio de versión probado: 21
- Consecuencia de un cambio: 4
- Comportamiento de v2 sin línea base en v1: 80
- Preparación: 45
- Línea base v1: 73
- Repetición en v2: 69
- Observación: 21

## Experimentos por secuencia

### s-diag-01 — v1, X:1

#### X:1 — POST /msg PING;64

**Pregunta (hipótesis):** Diagnóstico de autenticación: /msg acepta el token personal (sin reset previo; el reset devolvió 401 E001)

**Preparación:** Posición 1 de 1 en `s-diag-01`. Estado vacío tras `POST /__reset`.

**Solicitud:** POST `/msg`, token incorrecto (`Authorization: Bearer wrong-token`). Método, ruta y autenticación no constan en esta línea: se infieren de X:85, su repetición en v2.

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer wrong-token" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"PING;64"}'
```

**Respuesta del original** (v1): status 401

```
{"error":"E001","mensaje":"no autorizado"}
```

**Respuesta de la réplica:** status 401 — coincide

```
{"error":"E001","mensaje":"no autorizado"}
```

**Conclusión:** status 401

**Etiqueta de evidencia:** Línea base v1

### s-ctl-01 — v1, X:2–X:6

#### X:2 — POST /msg PING;64

**Pregunta (hipótesis):** Línea base: PING;64 sigue respondiendo igual que en el ejemplo n=1 (200 {"pong":true})

**Preparación:** Posición 1 de 5 en `s-ctl-01`. Estado vacío tras `POST /__reset`.

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`). Método, ruta y autenticación no constan en esta línea: se infieren de X:86, su repetición en v2.

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"PING;64"}'
```

**Respuesta del original** (v1): status 200

```
{"pong":true}
```

**Respuesta de la réplica:** status 200 — coincide

```
{"pong":true}
```

**Conclusión:** status 200: coincide con lo esperado

**Etiqueta de evidencia:** Línea base v1

#### X:3 — POST /msg ALTA;Mava;98

**Pregunta (hipótesis):** Resto (N*100) mod 97 = 0: la fórmula ISO 98-(N*100 mod 97) predice control válido 98

**Preparación:** Posición 2 de 5 en `s-ctl-01`. Solicitudes previas tras el reset: X:2 (`PING;64`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`). Método, ruta y autenticación no constan en esta línea: se infieren de X:87, su repetición en v2.

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"ALTA;Mava;98"}'
```

**Respuesta del original** (v1): status 201

```
{"cuentaId":"AC-0001"}
```

**Respuesta de la réplica:** status 201 — coincide

```
{"cuentaId":"AC-0001"}
```

**Conclusión:** status 201: coincide con la predicción ISO

**Etiqueta de evidencia:** Línea base v1

#### X:4 — POST /msg ALTA;Laro;1

**Pregunta (hipótesis):** Resto (N*100) mod 97 = 0: la fórmula modular (1-100N) mod 97 predice control válido 1

**Preparación:** Posición 3 de 5 en `s-ctl-01`. Solicitudes previas tras el reset: X:2 (`PING;64`), X:3 (`ALTA;Mava;98`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`). Método, ruta y autenticación no constan en esta línea: se infieren de X:88, su repetición en v2.

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"ALTA;Laro;1"}'
```

**Respuesta del original** (v1): status 400

```
{"error":"E202","mensaje":"control inválido"}
```

**Respuesta de la réplica:** status 400 — coincide

```
{"error":"E202","mensaje":"control inválido"}
```

**Conclusión:** status 400: coincide con lo esperado (ISO)

**Etiqueta de evidencia:** Línea base v1

#### X:5 — POST /msg ALTA;Mari;97

**Pregunta (hipótesis):** Resto (N*100) mod 97 = 1: la fórmula ISO 98-(N*100 mod 97) predice control válido 97

**Preparación:** Posición 4 de 5 en `s-ctl-01`. Solicitudes previas tras el reset: X:2 (`PING;64`), X:3 (`ALTA;Mava;98`), X:4 (`ALTA;Laro;1`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`). Método, ruta y autenticación no constan en esta línea: se infieren de X:89, su repetición en v2.

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"ALTA;Mari;97"}'
```

**Respuesta del original** (v1): status 201

```
{"cuentaId":"AC-0002"}
```

**Respuesta de la réplica:** status 201 — coincide

```
{"cuentaId":"AC-0002"}
```

**Conclusión:** status 201: coincide con lo esperado (ISO)

**Etiqueta de evidencia:** Línea base v1

#### X:6 — POST /msg ALTA;Miro;0

**Pregunta (hipótesis):** Resto (N*100) mod 97 = 1: la fórmula modular (1-100N) mod 97 predice control válido 0

**Preparación:** Posición 5 de 5 en `s-ctl-01`. Solicitudes previas tras el reset: X:2 (`PING;64`), X:3 (`ALTA;Mava;98`), X:4 (`ALTA;Laro;1`), X:5 (`ALTA;Mari;97`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`). Método, ruta y autenticación no constan en esta línea: se infieren de X:90, su repetición en v2.

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"ALTA;Miro;0"}'
```

**Respuesta del original** (v1): status 400

```
{"error":"E202","mensaje":"control inválido"}
```

**Respuesta de la réplica:** status 400 — coincide

```
{"error":"E202","mensaje":"control inválido"}
```

**Conclusión:** status 400: coincide con lo esperado (ISO)

**Etiqueta de evidencia:** Línea base v1

### s-io-01 — v1, X:7–X:18

#### X:7 — GET /noexiste

**Pregunta (hipótesis):** Ruta inexistente con GET y token válido: el original responde algo distinto del 404 E404 inventado por la réplica

**Preparación:** Posición 1 de 12 en `s-io-01`. Estado vacío tras `POST /__reset`.

**Solicitud:** GET `/noexiste`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X GET \
  "$BASE_URL/noexiste" \
  -H "Authorization: Bearer $TEAM_TOKEN"
```

**Respuesta del original** (v1): status 404

```
{"error":"E404","mensaje":"ruta desconocida"}
```

**Respuesta de la réplica:** status 404 — coincide

```
{"error":"E404","mensaje":"ruta desconocida"}
```

**Conclusión:** Observado: ruta inexistente -> 404 E404 'ruta desconocida' (la réplica decía 'ruta inexistente': divergencia corregida).

**Etiqueta de evidencia:** Línea base v1

#### X:8 — POST /noexiste

**Pregunta (hipótesis):** Ruta inexistente con POST: misma respuesta que con GET

**Preparación:** Posición 2 de 12 en `s-io-01`. Solicitudes previas tras el reset: X:7 (GET /noexiste).

**Solicitud:** POST `/noexiste`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/noexiste" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"PING;64"}'
```

**Respuesta del original** (v1): status 404

```
{"error":"E404","mensaje":"ruta desconocida"}
```

**Respuesta de la réplica:** status 404 — coincide

```
{"error":"E404","mensaje":"ruta desconocida"}
```

**Conclusión:** Observado: POST a ruta inexistente responde igual que GET (404 E404 'ruta desconocida').

**Etiqueta de evidencia:** Línea base v1

#### X:9 — GET /msg

**Pregunta (hipótesis):** Método no admitido en /msg (GET): respuesta del original

**Preparación:** Posición 3 de 12 en `s-io-01`. Solicitudes previas tras el reset: X:7 (GET /noexiste), X:8 (`PING;64`).

**Solicitud:** GET `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X GET \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN"
```

**Respuesta del original** (v1): status 404

```
{"error":"E404","mensaje":"ruta desconocida"}
```

**Respuesta de la réplica:** status 404 — coincide

```
{"error":"E404","mensaje":"ruta desconocida"}
```

**Conclusión:** Observado: GET /msg (método no admitido) responde 404 E404 'ruta desconocida', igual que una ruta inexistente.

**Etiqueta de evidencia:** Línea base v1

#### X:10 — POST /msg PING;64

**Pregunta (hipótesis):** Sin header Authorization: el original responde 401 E001 igual que con token incorrecto

**Preparación:** Posición 4 de 12 en `s-io-01`. Solicitudes previas tras el reset: X:7 (GET /noexiste), X:8 (`PING;64`), X:9 (GET /msg).

**Solicitud:** POST `/msg`, sin cabecera `Authorization`.

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"PING;64"}'
```

**Respuesta del original** (v1): status 401

```
{"error":"E001","mensaje":"no autorizado"}
```

**Respuesta de la réplica:** status 401 — coincide

```
{"error":"E001","mensaje":"no autorizado"}
```

**Conclusión:** Observado: sin header Authorization -> 401 E001 'no autorizado', igual que con token incorrecto (supuesto confirmado).

**Etiqueta de evidencia:** Línea base v1

#### X:11 — POST /msg PING;64

**Pregunta (hipótesis):** Token incorrecto con formato Bearer: 401 E001 (replica experimentos.jsonl:1)

**Preparación:** Posición 5 de 12 en `s-io-01`. Solicitudes previas tras el reset: X:7 (GET /noexiste), X:8 (`PING;64`), X:9 (GET /msg), X:10 (`PING;64`).

**Solicitud:** POST `/msg`, token incorrecto (`Authorization: Bearer wrong-token`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer wrong-token" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"PING;64"}'
```

**Respuesta del original** (v1): status 401

```
{"error":"E001","mensaje":"no autorizado"}
```

**Respuesta de la réplica:** status 401 — coincide

```
{"error":"E001","mensaje":"no autorizado"}
```

**Conclusión:** Observado: token incorrecto -> 401 E001 (replica experimentos.jsonl:1).

**Etiqueta de evidencia:** Línea base v1

#### X:12 — GET /noexiste

**Pregunta (hipótesis):** Orden auth vs ruta: ruta inexistente sin token, ¿401 o respuesta de ruta?

**Preparación:** Posición 6 de 12 en `s-io-01`. Solicitudes previas tras el reset: X:7 (GET /noexiste), X:8 (`PING;64`), X:9 (GET /msg), X:10 (`PING;64`), X:11 (`PING;64`).

**Solicitud:** GET `/noexiste`, sin cabecera `Authorization`.

```bash
curl -sS -i \
  -X GET \
  "$BASE_URL/noexiste"
```

**Respuesta del original** (v1): status 404

```
{"error":"E404","mensaje":"ruta desconocida"}
```

**Respuesta de la réplica:** status 404 — coincide

```
{"error":"E404","mensaje":"ruta desconocida"}
```

**Conclusión:** Observado: ruta inexistente sin token -> 404, no 401. Inferido: la ruta se resuelve antes que la autenticación.

**Etiqueta de evidencia:** Línea base v1

#### X:13 — GET /health

**Pregunta (hipótesis):** GET /health sin token: ¿200 o 401?

**Preparación:** Posición 7 de 12 en `s-io-01`. Solicitudes previas tras el reset: X:7 (GET /noexiste), X:8 (`PING;64`), X:9 (GET /msg), X:10 (`PING;64`), X:11 (`PING;64`), X:12 (GET /noexiste).

**Solicitud:** GET `/health`, sin cabecera `Authorization`.

```bash
curl -sS -i \
  -X GET \
  "$BASE_URL/health"
```

**Respuesta del original** (v1): status 401

```
{"error":"E001","mensaje":"no autorizado"}
```

**Respuesta de la réplica:** status 401 — coincide

```
{"error":"E001","mensaje":"no autorizado"}
```

**Conclusión:** Observado: GET /health sin token -> 401 E001 (la réplica lo tenía público: divergencia corregida).

**Etiqueta de evidencia:** Línea base v1

#### X:14 — GET /health

**Pregunta (hipótesis):** GET /health con token: cuerpo exacto del original

**Preparación:** Posición 8 de 12 en `s-io-01`. Solicitudes previas tras el reset: X:7 (GET /noexiste), X:8 (`PING;64`), X:9 (GET /msg), X:10 (`PING;64`), X:11 (`PING;64`), X:12 (GET /noexiste), X:13 (GET /health).

**Solicitud:** GET `/health`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X GET \
  "$BASE_URL/health" \
  -H "Authorization: Bearer $TEAM_TOKEN"
```

**Respuesta del original** (v1): status 200

```
{"ok":true}
```

**Respuesta de la réplica:** status 200 — coincide

```
{"ok":true}
```

**Conclusión:** Observado: GET /health con token -> 200 {"ok":true} (la réplica respondía {"status":"ok"}: divergencia corregida).

**Etiqueta de evidencia:** Línea base v1

#### X:15 — POST /msg esto no es json

**Pregunta (hipótesis):** Body que no es JSON: respuesta del original (la réplica inventa E101)

**Preparación:** Posición 9 de 12 en `s-io-01`. Solicitudes previas tras el reset: X:7 (GET /noexiste), X:8 (`PING;64`), X:9 (GET /msg), X:10 (`PING;64`), X:11 (`PING;64`), X:12 (GET /noexiste), X:13 (GET /health), X:14 (GET /health).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw 'esto no es json'
```

**Respuesta del original** (v1): status 400

```
{"error":"E100","mensaje":"json inválido"}
```

**Respuesta de la réplica:** status 400 — coincide

```
{"error":"E100","mensaje":"json inválido"}
```

**Conclusión:** Observado: body que no es JSON -> 400 E100 'json inválido' (la réplica inventaba E101: corregido).

**Etiqueta de evidencia:** Línea base v1

#### X:16 — POST /msg {}

**Pregunta (hipótesis):** Body JSON sin campo m: respuesta del original

**Preparación:** Posición 10 de 12 en `s-io-01`. Solicitudes previas tras el reset: X:7 (GET /noexiste), X:8 (`PING;64`), X:9 (GET /msg), X:10 (`PING;64`), X:11 (`PING;64`), X:12 (GET /noexiste), X:13 (GET /health), X:14 (GET /health), X:15 (`esto no es json`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{}'
```

**Respuesta del original** (v1): status 400

```
{"error":"E102","mensaje":"falta m"}
```

**Respuesta de la réplica:** status 400 — coincide

```
{"error":"E102","mensaje":"falta m"}
```

**Conclusión:** Observado: JSON sin campo m -> 400 E102 'falta m'.

**Etiqueta de evidencia:** Línea base v1

#### X:17 — POST /msg {"m":123}

**Pregunta (hipótesis):** Campo m no string: respuesta del original

**Preparación:** Posición 11 de 12 en `s-io-01`. Solicitudes previas tras el reset: X:7 (GET /noexiste), X:8 (`PING;64`), X:9 (GET /msg), X:10 (`PING;64`), X:11 (`PING;64`), X:12 (GET /noexiste), X:13 (GET /health), X:14 (GET /health), X:15 (`esto no es json`), X:16 (`{}`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":123}'
```

**Respuesta del original** (v1): status 400

```
{"error":"E102","mensaje":"falta m"}
```

**Respuesta de la réplica:** status 400 — coincide

```
{"error":"E102","mensaje":"falta m"}
```

**Conclusión:** Observado: m no string -> 400 E102 'falta m'. Inferido: el original exige que m sea string.

**Etiqueta de evidencia:** Línea base v1

#### X:18 — POST /msg ANULA;OP-0099;69

**Pregunta (hipótesis):** ANULA de operación inexistente tras reset: respuesta del original (la réplica inventa 404 E402)

**Preparación:** Posición 12 de 12 en `s-io-01`. Solicitudes previas tras el reset: X:7 (GET /noexiste), X:8 (`PING;64`), X:9 (GET /msg), X:10 (`PING;64`), X:11 (`PING;64`), X:12 (GET /noexiste), X:13 (GET /health), X:14 (GET /health), X:15 (`esto no es json`), X:16 (`{}`), X:17 (`{"m":123}`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"ANULA;OP-0099;69"}'
```

**Respuesta del original** (v1): status 404

```
{"error":"E402","mensaje":"operación inexistente"}
```

**Respuesta de la réplica:** status 404 — coincide

```
{"error":"E402","mensaje":"operación inexistente"}
```

**Conclusión:** Observado: ANULA de operación inexistente -> 404 E402 'operación inexistente' (supuesto confirmado). X-Req=9: los 404 y 401 previos no incrementaron el contador.

**Etiqueta de evidencia:** Línea base v1

### s-amt-01 — v1, X:19–X:30

#### X:19 — POST /msg ALTA;Ana;50

**Pregunta (hipótesis):** Preparación: crear AC-0001

**Preparación:** Posición 1 de 12 en `s-amt-01`. Estado vacío tras `POST /__reset`.

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"ALTA;Ana;50"}'
```

**Respuesta del original** (v1): status 201

```
{"cuentaId":"AC-0001"}
```

**Respuesta de la réplica:** status 201 — coincide

```
{"cuentaId":"AC-0001"}
```

**Conclusión:** Preparación OK: AC-0001. Observado: X-Req=10 tras /__reset (antes 9): el reset no reinicia X-Req (divergencia de header corregida).

**Etiqueta de evidencia:** Preparación

#### X:20 — POST /msg ALTA;Beto;11

**Pregunta (hipótesis):** Preparación: crear AC-0002

**Preparación:** Posición 2 de 12 en `s-amt-01`. Solicitudes previas tras el reset: X:19 (`ALTA;Ana;50`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"ALTA;Beto;11"}'
```

**Respuesta del original** (v1): status 201

```
{"cuentaId":"AC-0002"}
```

**Respuesta de la réplica:** status 201 — coincide

```
{"cuentaId":"AC-0002"}
```

**Conclusión:** Preparación OK: AC-0002.

**Etiqueta de evidencia:** Preparación

#### X:21 — POST /msg DEPOSITO;AC-0001;0;31

**Pregunta (hipótesis):** Monto 0 en DEPOSITO: ¿error? (la réplica inventa E303)

**Preparación:** Posición 3 de 12 en `s-amt-01`. Solicitudes previas tras el reset: X:19 (`ALTA;Ana;50`), X:20 (`ALTA;Beto;11`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"DEPOSITO;AC-0001;0;31"}'
```

**Respuesta del original** (v1): status 400

```
{"error":"E303","mensaje":"monto inválido"}
```

**Respuesta de la réplica:** status 400 — coincide

```
{"error":"E303","mensaje":"monto inválido"}
```

**Conclusión:** Observado: monto 0 -> 400 E303 'monto inválido' (supuesto confirmado).

**Etiqueta de evidencia:** Línea base v1

#### X:22 — POST /msg DEPOSITO;AC-0001;-5;16

**Pregunta (hipótesis):** Monto negativo en DEPOSITO: respuesta del original

**Preparación:** Posición 4 de 12 en `s-amt-01`. Solicitudes previas tras el reset: X:19 (`ALTA;Ana;50`), X:20 (`ALTA;Beto;11`), X:21 (`DEPOSITO;AC-0001;0;31`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"DEPOSITO;AC-0001;-5;16"}'
```

**Respuesta del original** (v1): status 400

```
{"error":"E303","mensaje":"monto inválido"}
```

**Respuesta de la réplica:** status 400 — coincide

```
{"error":"E303","mensaje":"monto inválido"}
```

**Conclusión:** Observado: monto negativo -> 400 E303.

**Etiqueta de evidencia:** Línea base v1

#### X:23 — POST /msg DEPOSITO;AC-0001;12.5;7

**Pregunta (hipótesis):** Monto decimal en DEPOSITO: respuesta del original

**Preparación:** Posición 5 de 12 en `s-amt-01`. Solicitudes previas tras el reset: X:19 (`ALTA;Ana;50`), X:20 (`ALTA;Beto;11`), X:21 (`DEPOSITO;AC-0001;0;31`), X:22 (`DEPOSITO;AC-0001;-5;16`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"DEPOSITO;AC-0001;12.5;7"}'
```

**Respuesta del original** (v1): status 400

```
{"error":"E303","mensaje":"monto inválido"}
```

**Respuesta de la réplica:** status 400 — coincide

```
{"error":"E303","mensaje":"monto inválido"}
```

**Conclusión:** Observado: monto decimal -> 400 E303.

**Etiqueta de evidencia:** Línea base v1

#### X:24 — POST /msg DEPOSITO;AC-0001;abc;13

**Pregunta (hipótesis):** Monto no numérico en DEPOSITO: respuesta del original

**Preparación:** Posición 6 de 12 en `s-amt-01`. Solicitudes previas tras el reset: X:19 (`ALTA;Ana;50`), X:20 (`ALTA;Beto;11`), X:21 (`DEPOSITO;AC-0001;0;31`), X:22 (`DEPOSITO;AC-0001;-5;16`), X:23 (`DEPOSITO;AC-0001;12.5;7`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"DEPOSITO;AC-0001;abc;13"}'
```

**Respuesta del original** (v1): status 400

```
{"error":"E303","mensaje":"monto inválido"}
```

**Respuesta de la réplica:** status 400 — coincide

```
{"error":"E303","mensaje":"monto inválido"}
```

**Conclusión:** Observado: monto no numérico -> 400 E303.

**Etiqueta de evidencia:** Línea base v1

#### X:25 — POST /msg DEPOSITO;AC-0001;500000;90

**Pregunta (hipótesis):** Preparación: depósito válido de 500000 en AC-0001

**Preparación:** Posición 7 de 12 en `s-amt-01`. Solicitudes previas tras el reset: X:19 (`ALTA;Ana;50`), X:20 (`ALTA;Beto;11`), X:21 (`DEPOSITO;AC-0001;0;31`), X:22 (`DEPOSITO;AC-0001;-5;16`), X:23 (`DEPOSITO;AC-0001;12.5;7`), X:24 (`DEPOSITO;AC-0001;abc;13`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"DEPOSITO;AC-0001;500000;90"}'
```

**Respuesta del original** (v1): status 200

```
{"status":"recieved","operacionId":"OP-0001"}
```

**Respuesta de la réplica:** status 200 — coincide

```
{"status":"recieved","operacionId":"OP-0001"}
```

**Conclusión:** Preparación OK: OP-0001. Las solicitudes rechazadas no consumieron número de operación.

**Etiqueta de evidencia:** Preparación

#### X:26 — POST /msg TRANSFER;AC-0001;AC-0002;0;44

**Pregunta (hipótesis):** Monto 0 en TRANSFER: respuesta del original

**Preparación:** Posición 8 de 12 en `s-amt-01`. Solicitudes previas tras el reset: X:19 (`ALTA;Ana;50`), X:20 (`ALTA;Beto;11`), X:21 (`DEPOSITO;AC-0001;0;31`), X:22 (`DEPOSITO;AC-0001;-5;16`), X:23 (`DEPOSITO;AC-0001;12.5;7`), X:24 (`DEPOSITO;AC-0001;abc;13`), X:25 (`DEPOSITO;AC-0001;500000;90`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"TRANSFER;AC-0001;AC-0002;0;44"}'
```

**Respuesta del original** (v1): status 400

```
{"error":"E303","mensaje":"monto inválido"}
```

**Respuesta de la réplica:** status 400 — coincide

```
{"error":"E303","mensaje":"monto inválido"}
```

**Conclusión:** Observado: TRANSFER con monto 0 -> 400 E303.

**Etiqueta de evidencia:** Línea base v1

#### X:27 — POST /msg TRANSFER;AC-0001;AC-0002;100001;9

**Pregunta (hipótesis):** Umbral E506: primera transferencia de 100001; si da E506 el límite es > 100000 por transferencia

**Preparación:** Posición 9 de 12 en `s-amt-01`. Solicitudes previas tras el reset: X:19 (`ALTA;Ana;50`), X:20 (`ALTA;Beto;11`), X:21 (`DEPOSITO;AC-0001;0;31`), X:22 (`DEPOSITO;AC-0001;-5;16`), X:23 (`DEPOSITO;AC-0001;12.5;7`), X:24 (`DEPOSITO;AC-0001;abc;13`), X:25 (`DEPOSITO;AC-0001;500000;90`), X:26 (`TRANSFER;AC-0001;AC-0002;0;44`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"TRANSFER;AC-0001;AC-0002;100001;9"}'
```

**Respuesta del original** (v1): status 422

```
{"error":"E506","mensaje":"límite excedido"}
```

**Respuesta de la réplica:** status 422 — coincide

```
{"error":"E506","mensaje":"límite excedido"}
```

**Conclusión:** Observado: TRANSFER de 100001 como primera transferencia -> 422 E506. Umbral: monto > 100000.

**Etiqueta de evidencia:** Línea base v1

#### X:28 — POST /msg TRANSFER;AC-0001;AC-0002;100000;12

**Pregunta (hipótesis):** Umbral E506: 100000 se acepta (como ejemplos.jsonl:10)

**Preparación:** Posición 10 de 12 en `s-amt-01`. Solicitudes previas tras el reset: X:19 (`ALTA;Ana;50`), X:20 (`ALTA;Beto;11`), X:21 (`DEPOSITO;AC-0001;0;31`), X:22 (`DEPOSITO;AC-0001;-5;16`), X:23 (`DEPOSITO;AC-0001;12.5;7`), X:24 (`DEPOSITO;AC-0001;abc;13`), X:25 (`DEPOSITO;AC-0001;500000;90`), X:26 (`TRANSFER;AC-0001;AC-0002;0;44`), X:27 (`TRANSFER;AC-0001;AC-0002;100001;9`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"TRANSFER;AC-0001;AC-0002;100000;12"}'
```

**Respuesta del original** (v1): status 200

```
{"status":"recieved","operacionId":"OP-0002"}
```

**Respuesta de la réplica:** status 422 — difiere

```
{"error":"E506","mensaje":"límite excedido"}
```

La réplica implementa la versión 2: v2 cambió este comportamiento, ver X:112.

**Conclusión:** Observado: 100000 se acepta (igual que ejemplos.jsonl:10).

**Etiqueta de evidencia:** Línea base v1

#### X:29 — POST /msg TRANSFER;AC-0001;AC-0002;30000;16

**Pregunta (hipótesis):** Límite acumulado vs por transferencia: 30000 tras 100000; E506 indicaría límite acumulado

**Preparación:** Posición 11 de 12 en `s-amt-01`. Solicitudes previas tras el reset: X:19 (`ALTA;Ana;50`), X:20 (`ALTA;Beto;11`), X:21 (`DEPOSITO;AC-0001;0;31`), X:22 (`DEPOSITO;AC-0001;-5;16`), X:23 (`DEPOSITO;AC-0001;12.5;7`), X:24 (`DEPOSITO;AC-0001;abc;13`), X:25 (`DEPOSITO;AC-0001;500000;90`), X:26 (`TRANSFER;AC-0001;AC-0002;0;44`), X:27 (`TRANSFER;AC-0001;AC-0002;100001;9`), X:28 (`TRANSFER;AC-0001;AC-0002;100000;12`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"TRANSFER;AC-0001;AC-0002;30000;16"}'
```

**Respuesta del original** (v1): status 200

```
{"status":"recieved","operacionId":"OP-0003"}
```

**Respuesta de la réplica:** status 200 — difiere

```
{"status":"recieved","operacionId":"OP-0002"}
```

La réplica implementa la versión 2: v2 cambió este comportamiento, ver X:113.

**Conclusión:** Observado: 30000 tras 100000 se acepta (acumulado 130000). Inferido: el límite es por transferencia, no acumulado.

**Etiqueta de evidencia:** Línea base v1

#### X:30 — POST /msg TRANSFER;AC-0002;AC-0001;150000;2

**Pregunta (hipótesis):** Orden E506 vs E507: monto sobre el límite y mayor que el saldo de AC-0002

**Preparación:** Posición 12 de 12 en `s-amt-01`. Solicitudes previas tras el reset: X:19 (`ALTA;Ana;50`), X:20 (`ALTA;Beto;11`), X:21 (`DEPOSITO;AC-0001;0;31`), X:22 (`DEPOSITO;AC-0001;-5;16`), X:23 (`DEPOSITO;AC-0001;12.5;7`), X:24 (`DEPOSITO;AC-0001;abc;13`), X:25 (`DEPOSITO;AC-0001;500000;90`), X:26 (`TRANSFER;AC-0001;AC-0002;0;44`), X:27 (`TRANSFER;AC-0001;AC-0002;100001;9`), X:28 (`TRANSFER;AC-0001;AC-0002;100000;12`), X:29 (`TRANSFER;AC-0001;AC-0002;30000;16`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"TRANSFER;AC-0002;AC-0001;150000;2"}'
```

**Respuesta del original** (v1): status 422

```
{"error":"E506","mensaje":"límite excedido"}
```

**Respuesta de la réplica:** status 422 — coincide

```
{"error":"E506","mensaje":"límite excedido"}
```

**Conclusión:** Observado: monto 150000 sobre el límite y mayor que el saldo de AC-0002 (130000) -> E506. Inferido: E506 se evalúa antes que E507.

**Etiqueta de evidencia:** Línea base v1

### s-ej-01 — v1, X:31–X:50

#### X:31 — POST /msg PING;64

**Pregunta (hipótesis):** Reproducción del ejemplo n=1 (pruebas/ejemplos.jsonl:1): el original responde 200 {"pong": true}

**Preparación:** Posición 1 de 20 en `s-ej-01`. Estado vacío tras `POST /__reset`.

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"PING;64"}'
```

**Respuesta del original** (v1): status 200

```
{"pong":true}
```

**Respuesta de la réplica:** status 200 — coincide

```
{"pong":true}
```

**Conclusión:** Observado: igual a pruebas/ejemplos.jsonl:1 (status y cuerpo).

**Etiqueta de evidencia:** Línea base v1

#### X:32 — POST /msg ALTA;Lucia;83

**Pregunta (hipótesis):** Reproducción del ejemplo n=2 (pruebas/ejemplos.jsonl:2): el original responde 400 {"error": "E202", "mensaje": "control inválido"}

**Preparación:** Posición 2 de 20 en `s-ej-01`. Solicitudes previas tras el reset: X:31 (`PING;64`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"ALTA;Lucia;83"}'
```

**Respuesta del original** (v1): status 400

```
{"error":"E202","mensaje":"control inválido"}
```

**Respuesta de la réplica:** status 400 — coincide

```
{"error":"E202","mensaje":"control inválido"}
```

**Conclusión:** Observado: igual a pruebas/ejemplos.jsonl:2 (status y cuerpo).

**Etiqueta de evidencia:** Línea base v1

#### X:33 — POST /msg ALTA;Lucia;82

**Pregunta (hipótesis):** Reproducción del ejemplo n=3 (pruebas/ejemplos.jsonl:3): el original responde 201 {"cuentaId": "AC-0001"}

**Preparación:** Posición 3 de 20 en `s-ej-01`. Solicitudes previas tras el reset: X:31 (`PING;64`), X:32 (`ALTA;Lucia;83`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"ALTA;Lucia;82"}'
```

**Respuesta del original** (v1): status 201

```
{"cuentaId":"AC-0001"}
```

**Respuesta de la réplica:** status 201 — coincide

```
{"cuentaId":"AC-0001"}
```

**Conclusión:** Observado: igual a pruebas/ejemplos.jsonl:3 (status y cuerpo).

**Etiqueta de evidencia:** Línea base v1

#### X:34 — POST /msg ALTA;Mateo;3

**Pregunta (hipótesis):** Reproducción del ejemplo n=4 (pruebas/ejemplos.jsonl:4): el original responde 201 {"cuentaId": "AC-0002"}

**Preparación:** Posición 4 de 20 en `s-ej-01`. Solicitudes previas tras el reset: X:31 (`PING;64`), X:32 (`ALTA;Lucia;83`), X:33 (`ALTA;Lucia;82`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"ALTA;Mateo;3"}'
```

**Respuesta del original** (v1): status 201

```
{"cuentaId":"AC-0002"}
```

**Respuesta de la réplica:** status 201 — coincide

```
{"cuentaId":"AC-0002"}
```

**Conclusión:** Observado: igual a pruebas/ejemplos.jsonl:4 (status y cuerpo).

**Etiqueta de evidencia:** Línea base v1

#### X:35 — POST /msg CONSULTA;AC-0001;14

**Pregunta (hipótesis):** Reproducción del ejemplo n=5 (pruebas/ejemplos.jsonl:5): el original responde 200 {"cuenta_id": "AC-0001", "saldo": 0}

**Preparación:** Posición 5 de 20 en `s-ej-01`. Solicitudes previas tras el reset: X:31 (`PING;64`), X:32 (`ALTA;Lucia;83`), X:33 (`ALTA;Lucia;82`), X:34 (`ALTA;Mateo;3`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"CONSULTA;AC-0001;14"}'
```

**Respuesta del original** (v1): status 200

```
{"cuenta_id":"AC-0001","saldo":0}
```

**Respuesta de la réplica:** status 200 — difiere

```
{"cuenta_id":"AC-0001","saldo":"0.00"}
```

La réplica implementa la versión 2: v2 cambió este comportamiento, ver X:119.

**Conclusión:** Observado: igual a pruebas/ejemplos.jsonl:5 (status y cuerpo).

**Etiqueta de evidencia:** Línea base v1

#### X:36 — POST /msg DEPOSITO;AC-0001;250000;86

**Pregunta (hipótesis):** Reproducción del ejemplo n=6 (pruebas/ejemplos.jsonl:6): el original responde 200 {"status": "recieved", "operacionId": "OP-0001"}

**Preparación:** Posición 6 de 20 en `s-ej-01`. Solicitudes previas tras el reset: X:31 (`PING;64`), X:32 (`ALTA;Lucia;83`), X:33 (`ALTA;Lucia;82`), X:34 (`ALTA;Mateo;3`), X:35 (`CONSULTA;AC-0001;14`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"DEPOSITO;AC-0001;250000;86"}'
```

**Respuesta del original** (v1): status 200

```
{"status":"recieved","operacionId":"OP-0001"}
```

**Respuesta de la réplica:** status 200 — coincide

```
{"status":"recieved","operacionId":"OP-0001"}
```

**Conclusión:** Observado: igual a pruebas/ejemplos.jsonl:6 (status y cuerpo).

**Etiqueta de evidencia:** Línea base v1

#### X:37 — POST /msg TRANSFER;AC-0001;AC-0002;40000;86

**Pregunta (hipótesis):** Reproducción del ejemplo n=7 (pruebas/ejemplos.jsonl:7): el original responde 200 {"status": "recieved", "operacionId": "OP-0002"}

**Preparación:** Posición 7 de 20 en `s-ej-01`. Solicitudes previas tras el reset: X:31 (`PING;64`), X:32 (`ALTA;Lucia;83`), X:33 (`ALTA;Lucia;82`), X:34 (`ALTA;Mateo;3`), X:35 (`CONSULTA;AC-0001;14`), X:36 (`DEPOSITO;AC-0001;250000;86`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"TRANSFER;AC-0001;AC-0002;40000;86"}'
```

**Respuesta del original** (v1): status 200

```
{"status":"recieved","operacionId":"OP-0002"}
```

**Respuesta de la réplica:** status 200 — coincide

```
{"status":"recieved","operacionId":"OP-0002"}
```

**Conclusión:** Observado: igual a pruebas/ejemplos.jsonl:7 (status y cuerpo).

**Etiqueta de evidencia:** Línea base v1

#### X:38 — POST /msg CONSULTA;AC-0002;11

**Pregunta (hipótesis):** Reproducción del ejemplo n=8 (pruebas/ejemplos.jsonl:8): el original responde 200 {"cuenta_id": "AC-0002", "saldo": 40000}

**Preparación:** Posición 8 de 20 en `s-ej-01`. Solicitudes previas tras el reset: X:31 (`PING;64`), X:32 (`ALTA;Lucia;83`), X:33 (`ALTA;Lucia;82`), X:34 (`ALTA;Mateo;3`), X:35 (`CONSULTA;AC-0001;14`), X:36 (`DEPOSITO;AC-0001;250000;86`), X:37 (`TRANSFER;AC-0001;AC-0002;40000;86`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"CONSULTA;AC-0002;11"}'
```

**Respuesta del original** (v1): status 200

```
{"cuenta_id":"AC-0002","saldo":40000}
```

**Respuesta de la réplica:** status 200 — difiere

```
{"cuenta_id":"AC-0002","saldo":"400.00"}
```

La réplica implementa la versión 2: v2 cambió este comportamiento, ver X:122.

**Conclusión:** Observado: igual a pruebas/ejemplos.jsonl:8 (status y cuerpo).

**Etiqueta de evidencia:** Línea base v1

#### X:39 — POST /msg TRANSFER;AC-0001;AC-0002;120000;55

**Pregunta (hipótesis):** Reproducción del ejemplo n=9 (pruebas/ejemplos.jsonl:9): el original responde 422 {"error": "E506", "mensaje": "límite excedido"}

**Preparación:** Posición 9 de 20 en `s-ej-01`. Solicitudes previas tras el reset: X:31 (`PING;64`), X:32 (`ALTA;Lucia;83`), X:33 (`ALTA;Lucia;82`), X:34 (`ALTA;Mateo;3`), X:35 (`CONSULTA;AC-0001;14`), X:36 (`DEPOSITO;AC-0001;250000;86`), X:37 (`TRANSFER;AC-0001;AC-0002;40000;86`), X:38 (`CONSULTA;AC-0002;11`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"TRANSFER;AC-0001;AC-0002;120000;55"}'
```

**Respuesta del original** (v1): status 422

```
{"error":"E506","mensaje":"límite excedido"}
```

**Respuesta de la réplica:** status 422 — coincide

```
{"error":"E506","mensaje":"límite excedido"}
```

**Conclusión:** Observado: igual a pruebas/ejemplos.jsonl:9 (status y cuerpo).

**Etiqueta de evidencia:** Línea base v1

#### X:40 — POST /msg TRANSFER;AC-0001;AC-0002;100000;12

**Pregunta (hipótesis):** Reproducción del ejemplo n=10 (pruebas/ejemplos.jsonl:10): el original responde 200 {"status": "recieved", "operacionId": "OP-0003"}

**Preparación:** Posición 10 de 20 en `s-ej-01`. Solicitudes previas tras el reset: X:31 (`PING;64`), X:32 (`ALTA;Lucia;83`), X:33 (`ALTA;Lucia;82`), X:34 (`ALTA;Mateo;3`), X:35 (`CONSULTA;AC-0001;14`), X:36 (`DEPOSITO;AC-0001;250000;86`), X:37 (`TRANSFER;AC-0001;AC-0002;40000;86`), X:38 (`CONSULTA;AC-0002;11`), X:39 (`TRANSFER;AC-0001;AC-0002;120000;55`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"TRANSFER;AC-0001;AC-0002;100000;12"}'
```

**Respuesta del original** (v1): status 200

```
{"status":"recieved","operacionId":"OP-0003"}
```

**Respuesta de la réplica:** status 422 — difiere

```
{"error":"E506","mensaje":"límite excedido"}
```

La réplica implementa la versión 2: v2 cambió este comportamiento, ver X:124.

**Conclusión:** Observado: igual a pruebas/ejemplos.jsonl:10 (status y cuerpo).

**Etiqueta de evidencia:** Línea base v1

#### X:41 — POST /msg CONSULTa;AC-0001;14

**Pregunta (hipótesis):** Reproducción del ejemplo n=11 (pruebas/ejemplos.jsonl:11): el original responde 200 {"cuenta_id": "AC-0001", "saldo": 110000}

**Preparación:** Posición 11 de 20 en `s-ej-01`. Solicitudes previas tras el reset: X:31 (`PING;64`), X:32 (`ALTA;Lucia;83`), X:33 (`ALTA;Lucia;82`), X:34 (`ALTA;Mateo;3`), X:35 (`CONSULTA;AC-0001;14`), X:36 (`DEPOSITO;AC-0001;250000;86`), X:37 (`TRANSFER;AC-0001;AC-0002;40000;86`), X:38 (`CONSULTA;AC-0002;11`), X:39 (`TRANSFER;AC-0001;AC-0002;120000;55`), X:40 (`TRANSFER;AC-0001;AC-0002;100000;12`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"CONSULTa;AC-0001;14"}'
```

**Respuesta del original** (v1): status 200

```
{"cuenta_id":"AC-0001","saldo":110000}
```

**Respuesta de la réplica:** status 200 — difiere

```
{"cuenta_id":"AC-0001","saldo":"2100.00"}
```

La réplica implementa la versión 2: v2 cambió este comportamiento, ver X:125.

**Conclusión:** Observado: igual a pruebas/ejemplos.jsonl:11 (status y cuerpo).

**Etiqueta de evidencia:** Línea base v1

#### X:42 — POST /msg SALDOS;AC-0001;38

**Pregunta (hipótesis):** Reproducción del ejemplo n=12 (pruebas/ejemplos.jsonl:12): el original responde 400 {"error": "E301", "mensaje": "comando desconocido "}

**Preparación:** Posición 12 de 20 en `s-ej-01`. Solicitudes previas tras el reset: X:31 (`PING;64`), X:32 (`ALTA;Lucia;83`), X:33 (`ALTA;Lucia;82`), X:34 (`ALTA;Mateo;3`), X:35 (`CONSULTA;AC-0001;14`), X:36 (`DEPOSITO;AC-0001;250000;86`), X:37 (`TRANSFER;AC-0001;AC-0002;40000;86`), X:38 (`CONSULTA;AC-0002;11`), X:39 (`TRANSFER;AC-0001;AC-0002;120000;55`), X:40 (`TRANSFER;AC-0001;AC-0002;100000;12`), X:41 (`CONSULTa;AC-0001;14`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"SALDOS;AC-0001;38"}'
```

**Respuesta del original** (v1): status 400

```
{"error":"E301","mensaje":"comando desconocido "}
```

**Respuesta de la réplica:** status 400 — coincide

```
{"error":"E301","mensaje":"comando desconocido "}
```

**Conclusión:** Observado: igual a pruebas/ejemplos.jsonl:12 (status y cuerpo).

**Etiqueta de evidencia:** Línea base v1

#### X:43 — POST /msg ANULA;OP-0003;66

**Pregunta (hipótesis):** Reproducción del ejemplo n=13 (pruebas/ejemplos.jsonl:13): el original responde 200 {"ok": true, "anulada": "OP-0003"}

**Preparación:** Posición 13 de 20 en `s-ej-01`. Solicitudes previas tras el reset: X:31 (`PING;64`), X:32 (`ALTA;Lucia;83`), X:33 (`ALTA;Lucia;82`), X:34 (`ALTA;Mateo;3`), X:35 (`CONSULTA;AC-0001;14`), X:36 (`DEPOSITO;AC-0001;250000;86`), X:37 (`TRANSFER;AC-0001;AC-0002;40000;86`), X:38 (`CONSULTA;AC-0002;11`), X:39 (`TRANSFER;AC-0001;AC-0002;120000;55`), X:40 (`TRANSFER;AC-0001;AC-0002;100000;12`), X:41 (`CONSULTa;AC-0001;14`), X:42 (`SALDOS;AC-0001;38`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"ANULA;OP-0003;66"}'
```

**Respuesta del original** (v1): status 200

```
{"ok":true,"anulada":"OP-0003"}
```

**Respuesta de la réplica:** status 404 — difiere

```
{"error":"E402","mensaje":"operación inexistente"}
```

La réplica implementa la versión 2: v2 cambió este comportamiento, ver X:127.

**Conclusión:** Observado: igual a pruebas/ejemplos.jsonl:13 (status y cuerpo).

**Etiqueta de evidencia:** Línea base v1

#### X:44 — POST /msg ANULA;OP-0003;66

**Pregunta (hipótesis):** Reproducción del ejemplo n=14 (pruebas/ejemplos.jsonl:14): el original responde 200 {"ok": false, "motivo": "ya anulada"}

**Preparación:** Posición 14 de 20 en `s-ej-01`. Solicitudes previas tras el reset: X:31 (`PING;64`), X:32 (`ALTA;Lucia;83`), X:33 (`ALTA;Lucia;82`), X:34 (`ALTA;Mateo;3`), X:35 (`CONSULTA;AC-0001;14`), X:36 (`DEPOSITO;AC-0001;250000;86`), X:37 (`TRANSFER;AC-0001;AC-0002;40000;86`), X:38 (`CONSULTA;AC-0002;11`), X:39 (`TRANSFER;AC-0001;AC-0002;120000;55`), X:40 (`TRANSFER;AC-0001;AC-0002;100000;12`), X:41 (`CONSULTa;AC-0001;14`), X:42 (`SALDOS;AC-0001;38`), X:43 (`ANULA;OP-0003;66`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"ANULA;OP-0003;66"}'
```

**Respuesta del original** (v1): status 200

```
{"ok":false,"motivo":"ya anulada"}
```

**Respuesta de la réplica:** status 404 — difiere

```
{"error":"E402","mensaje":"operación inexistente"}
```

La réplica implementa la versión 2: v2 cambió este comportamiento, ver X:128.

**Conclusión:** Observado: igual a pruebas/ejemplos.jsonl:14 (status y cuerpo).

**Etiqueta de evidencia:** Línea base v1

#### X:45 — POST /msg CONSULTA;AC-0009;87

**Pregunta (hipótesis):** Reproducción del ejemplo n=15 (pruebas/ejemplos.jsonl:15): el original responde 404 {"error": "E401", "mensaje": "cuenta inexistente"}

**Preparación:** Posición 15 de 20 en `s-ej-01`. Solicitudes previas tras el reset: X:31 (`PING;64`), X:32 (`ALTA;Lucia;83`), X:33 (`ALTA;Lucia;82`), X:34 (`ALTA;Mateo;3`), X:35 (`CONSULTA;AC-0001;14`), X:36 (`DEPOSITO;AC-0001;250000;86`), X:37 (`TRANSFER;AC-0001;AC-0002;40000;86`), X:38 (`CONSULTA;AC-0002;11`), X:39 (`TRANSFER;AC-0001;AC-0002;120000;55`), X:40 (`TRANSFER;AC-0001;AC-0002;100000;12`), X:41 (`CONSULTa;AC-0001;14`), X:42 (`SALDOS;AC-0001;38`), X:43 (`ANULA;OP-0003;66`), X:44 (`ANULA;OP-0003;66`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"CONSULTA;AC-0009;87"}'
```

**Respuesta del original** (v1): status 404

```
{"error":"E401","mensaje":"cuenta inexistente"}
```

**Respuesta de la réplica:** status 404 — coincide

```
{"error":"E401","mensaje":"cuenta inexistente"}
```

**Conclusión:** Observado: igual a pruebas/ejemplos.jsonl:15 (status y cuerpo).

**Etiqueta de evidencia:** Línea base v1

#### X:46 — POST /msg TRANSFER;AC-0002;AC-0001;50000;23

**Pregunta (hipótesis):** Reproducción del ejemplo n=16 (pruebas/ejemplos.jsonl:16): el original responde 422 {"error": "E507", "mensaje": "saldo insuficiente"}

**Preparación:** Posición 16 de 20 en `s-ej-01`. Solicitudes previas tras el reset: X:31 (`PING;64`), X:32 (`ALTA;Lucia;83`), X:33 (`ALTA;Lucia;82`), X:34 (`ALTA;Mateo;3`), X:35 (`CONSULTA;AC-0001;14`), X:36 (`DEPOSITO;AC-0001;250000;86`), X:37 (`TRANSFER;AC-0001;AC-0002;40000;86`), X:38 (`CONSULTA;AC-0002;11`), X:39 (`TRANSFER;AC-0001;AC-0002;120000;55`), X:40 (`TRANSFER;AC-0001;AC-0002;100000;12`), X:41 (`CONSULTa;AC-0001;14`), X:42 (`SALDOS;AC-0001;38`), X:43 (`ANULA;OP-0003;66`), X:44 (`ANULA;OP-0003;66`), X:45 (`CONSULTA;AC-0009;87`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"TRANSFER;AC-0002;AC-0001;50000;23"}'
```

**Respuesta del original** (v1): status 422

```
{"error":"E507","mensaje":"saldo insuficiente"}
```

**Respuesta de la réplica:** status 422 — coincide

```
{"error":"E507","mensaje":"saldo insuficiente"}
```

**Conclusión:** Observado: igual a pruebas/ejemplos.jsonl:16 (status y cuerpo).

**Etiqueta de evidencia:** Línea base v1

#### X:47 — POST /msg DEPOSITO;AC-0002;700;5X

**Pregunta (hipótesis):** Reproducción del ejemplo n=17 (pruebas/ejemplos.jsonl:17): el original responde 400 {"error": "E201", "mensaje": "control mal formado"}

**Preparación:** Posición 17 de 20 en `s-ej-01`. Solicitudes previas tras el reset: X:31 (`PING;64`), X:32 (`ALTA;Lucia;83`), X:33 (`ALTA;Lucia;82`), X:34 (`ALTA;Mateo;3`), X:35 (`CONSULTA;AC-0001;14`), X:36 (`DEPOSITO;AC-0001;250000;86`), X:37 (`TRANSFER;AC-0001;AC-0002;40000;86`), X:38 (`CONSULTA;AC-0002;11`), X:39 (`TRANSFER;AC-0001;AC-0002;120000;55`), X:40 (`TRANSFER;AC-0001;AC-0002;100000;12`), X:41 (`CONSULTa;AC-0001;14`), X:42 (`SALDOS;AC-0001;38`), X:43 (`ANULA;OP-0003;66`), X:44 (`ANULA;OP-0003;66`), X:45 (`CONSULTA;AC-0009;87`), X:46 (`TRANSFER;AC-0002;AC-0001;50000;23`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"DEPOSITO;AC-0002;700;5X"}'
```

**Respuesta del original** (v1): status 400

```
{"error":"E201","mensaje":"control mal formado"}
```

**Respuesta de la réplica:** status 400 — coincide

```
{"error":"E201","mensaje":"control mal formado"}
```

**Conclusión:** Observado: igual a pruebas/ejemplos.jsonl:17 (status y cuerpo).

**Etiqueta de evidencia:** Línea base v1

#### X:48 — POST /msg DEPOSITO;AC-0002;700;35

**Pregunta (hipótesis):** Reproducción del ejemplo n=18 (pruebas/ejemplos.jsonl:18): el original responde 200 {"status": "recieved", "operacionId": "OP-0004"}

**Preparación:** Posición 18 de 20 en `s-ej-01`. Solicitudes previas tras el reset: X:31 (`PING;64`), X:32 (`ALTA;Lucia;83`), X:33 (`ALTA;Lucia;82`), X:34 (`ALTA;Mateo;3`), X:35 (`CONSULTA;AC-0001;14`), X:36 (`DEPOSITO;AC-0001;250000;86`), X:37 (`TRANSFER;AC-0001;AC-0002;40000;86`), X:38 (`CONSULTA;AC-0002;11`), X:39 (`TRANSFER;AC-0001;AC-0002;120000;55`), X:40 (`TRANSFER;AC-0001;AC-0002;100000;12`), X:41 (`CONSULTa;AC-0001;14`), X:42 (`SALDOS;AC-0001;38`), X:43 (`ANULA;OP-0003;66`), X:44 (`ANULA;OP-0003;66`), X:45 (`CONSULTA;AC-0009;87`), X:46 (`TRANSFER;AC-0002;AC-0001;50000;23`), X:47 (`DEPOSITO;AC-0002;700;5X`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"DEPOSITO;AC-0002;700;35"}'
```

**Respuesta del original** (v1): status 200

```
{"status":"recieved","operacionId":"OP-0004"}
```

**Respuesta de la réplica:** status 200 — difiere

```
{"status":"recieved","operacionId":"OP-0003"}
```

La réplica implementa la versión 2: v2 cambió este comportamiento, ver X:132.

**Conclusión:** Observado: igual a pruebas/ejemplos.jsonl:18 (status y cuerpo).

**Etiqueta de evidencia:** Línea base v1

#### X:49 — POST /msg CONSULTA;AC-0002;11

**Pregunta (hipótesis):** Reproducción del ejemplo n=19 (pruebas/ejemplos.jsonl:19): el original responde 200 {"cuenta_id": "AC-0002", "saldo": 40700}

**Preparación:** Posición 19 de 20 en `s-ej-01`. Solicitudes previas tras el reset: X:31 (`PING;64`), X:32 (`ALTA;Lucia;83`), X:33 (`ALTA;Lucia;82`), X:34 (`ALTA;Mateo;3`), X:35 (`CONSULTA;AC-0001;14`), X:36 (`DEPOSITO;AC-0001;250000;86`), X:37 (`TRANSFER;AC-0001;AC-0002;40000;86`), X:38 (`CONSULTA;AC-0002;11`), X:39 (`TRANSFER;AC-0001;AC-0002;120000;55`), X:40 (`TRANSFER;AC-0001;AC-0002;100000;12`), X:41 (`CONSULTa;AC-0001;14`), X:42 (`SALDOS;AC-0001;38`), X:43 (`ANULA;OP-0003;66`), X:44 (`ANULA;OP-0003;66`), X:45 (`CONSULTA;AC-0009;87`), X:46 (`TRANSFER;AC-0002;AC-0001;50000;23`), X:47 (`DEPOSITO;AC-0002;700;5X`), X:48 (`DEPOSITO;AC-0002;700;35`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"CONSULTA;AC-0002;11"}'
```

**Respuesta del original** (v1): status 200

```
{"cuenta_id":"AC-0002","saldo":40700}
```

**Respuesta de la réplica:** status 200 — difiere

```
{"cuenta_id":"AC-0002","saldo":"407.00"}
```

La réplica implementa la versión 2: v2 cambió este comportamiento, ver X:133.

**Conclusión:** Observado: igual a pruebas/ejemplos.jsonl:19 (status y cuerpo).

**Etiqueta de evidencia:** Línea base v1

#### X:50 — POST /msg ALTA;Lucia;Gomez;11

**Pregunta (hipótesis):** Reproducción del ejemplo n=20 (pruebas/ejemplos.jsonl:20): el original responde 400 {"error": "E302", "mensaje": "aridad inválida"}

**Preparación:** Posición 20 de 20 en `s-ej-01`. Solicitudes previas tras el reset: X:31 (`PING;64`), X:32 (`ALTA;Lucia;83`), X:33 (`ALTA;Lucia;82`), X:34 (`ALTA;Mateo;3`), X:35 (`CONSULTA;AC-0001;14`), X:36 (`DEPOSITO;AC-0001;250000;86`), X:37 (`TRANSFER;AC-0001;AC-0002;40000;86`), X:38 (`CONSULTA;AC-0002;11`), X:39 (`TRANSFER;AC-0001;AC-0002;120000;55`), X:40 (`TRANSFER;AC-0001;AC-0002;100000;12`), X:41 (`CONSULTa;AC-0001;14`), X:42 (`SALDOS;AC-0001;38`), X:43 (`ANULA;OP-0003;66`), X:44 (`ANULA;OP-0003;66`), X:45 (`CONSULTA;AC-0009;87`), X:46 (`TRANSFER;AC-0002;AC-0001;50000;23`), X:47 (`DEPOSITO;AC-0002;700;5X`), X:48 (`DEPOSITO;AC-0002;700;35`), X:49 (`CONSULTA;AC-0002;11`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"ALTA;Lucia;Gomez;11"}'
```

**Respuesta del original** (v1): status 400

```
{"error":"E302","mensaje":"aridad inválida"}
```

**Respuesta de la réplica:** status 400 — coincide

```
{"error":"E302","mensaje":"aridad inválida"}
```

**Conclusión:** Observado: igual a pruebas/ejemplos.jsonl:20 (status y cuerpo).

**Etiqueta de evidencia:** Línea base v1

### s-ord-02 — v1, X:51–X:60

#### X:51 — POST /msg SALDOS;AC-0001;5X

**Pregunta (hipótesis):** Orden: comando desconocido + control mal formado: ¿E301 o E201?

**Preparación:** Posición 1 de 10 en `s-ord-02`. Estado vacío tras `POST /__reset`.

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"SALDOS;AC-0001;5X"}'
```

**Respuesta del original** (v1): status 400

```
{"error":"E201","mensaje":"control mal formado"}
```

**Respuesta de la réplica:** status 400 — coincide

```
{"error":"E201","mensaje":"control mal formado"}
```

**Conclusión:** Observado: control mal formado gana sobre comando desconocido (E201 antes que E301). Coincide con la réplica.

**Etiqueta de evidencia:** Línea base v1

#### X:52 — POST /msg SALDOS;AC-0001;39

**Pregunta (hipótesis):** Orden: comando desconocido + control incorrecto (válido 38): ¿E301 o E202?

**Preparación:** Posición 2 de 10 en `s-ord-02`. Solicitudes previas tras el reset: X:51 (`SALDOS;AC-0001;5X`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"SALDOS;AC-0001;39"}'
```

**Respuesta del original** (v1): status 400

```
{"error":"E202","mensaje":"control inválido"}
```

**Respuesta de la réplica:** status 400 — coincide

```
{"error":"E202","mensaje":"control inválido"}
```

**Conclusión:** Observado: control incorrecto gana sobre comando desconocido (E202 antes que E301). Coincide.

**Etiqueta de evidencia:** Línea base v1

#### X:53 — POST /msg ALTA;Lucia;Gomez;5X

**Pregunta (hipótesis):** Orden: aridad inválida + control mal formado: ¿E302 o E201?

**Preparación:** Posición 3 de 10 en `s-ord-02`. Solicitudes previas tras el reset: X:51 (`SALDOS;AC-0001;5X`), X:52 (`SALDOS;AC-0001;39`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"ALTA;Lucia;Gomez;5X"}'
```

**Respuesta del original** (v1): status 400

```
{"error":"E201","mensaje":"control mal formado"}
```

**Respuesta de la réplica:** status 400 — coincide

```
{"error":"E201","mensaje":"control mal formado"}
```

**Conclusión:** Observado: E201 antes que E302 (aridad). Coincide.

**Etiqueta de evidencia:** Línea base v1

#### X:54 — POST /msg ALTA;Lucia;Gomez;12

**Pregunta (hipótesis):** Orden: aridad inválida + control incorrecto (válido 11): ¿E302 o E202?

**Preparación:** Posición 4 de 10 en `s-ord-02`. Solicitudes previas tras el reset: X:51 (`SALDOS;AC-0001;5X`), X:52 (`SALDOS;AC-0001;39`), X:53 (`ALTA;Lucia;Gomez;5X`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"ALTA;Lucia;Gomez;12"}'
```

**Respuesta del original** (v1): status 400

```
{"error":"E202","mensaje":"control inválido"}
```

**Respuesta de la réplica:** status 400 — coincide

```
{"error":"E202","mensaje":"control inválido"}
```

**Conclusión:** Observado: E202 antes que E302. Coincide.

**Etiqueta de evidencia:** Línea base v1

#### X:55 — POST /msg CONSULTA;AC-0001;AC-0002;5X

**Pregunta (hipótesis):** Orden (otro comando): aridad inválida + control mal formado: ¿E302 o E201?

**Preparación:** Posición 5 de 10 en `s-ord-02`. Solicitudes previas tras el reset: X:51 (`SALDOS;AC-0001;5X`), X:52 (`SALDOS;AC-0001;39`), X:53 (`ALTA;Lucia;Gomez;5X`), X:54 (`ALTA;Lucia;Gomez;12`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"CONSULTA;AC-0001;AC-0002;5X"}'
```

**Respuesta del original** (v1): status 400

```
{"error":"E201","mensaje":"control mal formado"}
```

**Respuesta de la réplica:** status 400 — coincide

```
{"error":"E201","mensaje":"control mal formado"}
```

**Conclusión:** Observado: E201 antes que E302 también con CONSULTA. Inferido: el orden no depende del comando. Coincide.

**Etiqueta de evidencia:** Línea base v1

#### X:56 — POST /msg CONSULTA;AC-0001;AC-0002;93

**Pregunta (hipótesis):** Orden (otro comando): aridad inválida + control incorrecto (válido 92): ¿E302 o E202?

**Preparación:** Posición 6 de 10 en `s-ord-02`. Solicitudes previas tras el reset: X:51 (`SALDOS;AC-0001;5X`), X:52 (`SALDOS;AC-0001;39`), X:53 (`ALTA;Lucia;Gomez;5X`), X:54 (`ALTA;Lucia;Gomez;12`), X:55 (`CONSULTA;AC-0001;AC-0002;5X`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"CONSULTA;AC-0001;AC-0002;93"}'
```

**Respuesta del original** (v1): status 400

```
{"error":"E202","mensaje":"control inválido"}
```

**Respuesta de la réplica:** status 400 — coincide

```
{"error":"E202","mensaje":"control inválido"}
```

**Conclusión:** Observado: E202 antes que E302 con CONSULTA. Coincide.

**Etiqueta de evidencia:** Línea base v1

#### X:57 — POST /msg ping;64

**Pregunta (hipótesis):** Comando en minúsculas completo: ¿200 pong?

**Preparación:** Posición 7 de 10 en `s-ord-02`. Solicitudes previas tras el reset: X:51 (`SALDOS;AC-0001;5X`), X:52 (`SALDOS;AC-0001;39`), X:53 (`ALTA;Lucia;Gomez;5X`), X:54 (`ALTA;Lucia;Gomez;12`), X:55 (`CONSULTA;AC-0001;AC-0002;5X`), X:56 (`CONSULTA;AC-0001;AC-0002;93`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"ping;64"}'
```

**Respuesta del original** (v1): status 200

```
{"pong":true}
```

**Respuesta de la réplica:** status 200 — coincide

```
{"pong":true}
```

**Conclusión:** Observado: comando en minúsculas completo aceptado (200 pong). Coincide.

**Etiqueta de evidencia:** Línea base v1

#### X:58 — POST /msg PING;064

**Pregunta (hipótesis):** Control con cero a la izquierda: ¿se compara numéricamente?

**Preparación:** Posición 8 de 10 en `s-ord-02`. Solicitudes previas tras el reset: X:51 (`SALDOS;AC-0001;5X`), X:52 (`SALDOS;AC-0001;39`), X:53 (`ALTA;Lucia;Gomez;5X`), X:54 (`ALTA;Lucia;Gomez;12`), X:55 (`CONSULTA;AC-0001;AC-0002;5X`), X:56 (`CONSULTA;AC-0001;AC-0002;93`), X:57 (`ping;64`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"PING;064"}'
```

**Respuesta del original** (v1): status 200

```
{"pong":true}
```

**Respuesta de la réplica:** status 200 — coincide

```
{"pong":true}
```

**Conclusión:** Observado: control con cero a la izquierda se compara numéricamente (064 = 64). Coincide.

**Etiqueta de evidencia:** Línea base v1

#### X:59 — POST /msg []

**Pregunta (hipótesis):** Body JSON que no es objeto ([]): ¿E102 falta m?

**Preparación:** Posición 9 de 10 en `s-ord-02`. Solicitudes previas tras el reset: X:51 (`SALDOS;AC-0001;5X`), X:52 (`SALDOS;AC-0001;39`), X:53 (`ALTA;Lucia;Gomez;5X`), X:54 (`ALTA;Lucia;Gomez;12`), X:55 (`CONSULTA;AC-0001;AC-0002;5X`), X:56 (`CONSULTA;AC-0001;AC-0002;93`), X:57 (`ping;64`), X:58 (`PING;064`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '[]'
```

**Respuesta del original** (v1): status 400

```
{"error":"E102","mensaje":"falta m"}
```

**Respuesta de la réplica:** status 400 — coincide

```
{"error":"E102","mensaje":"falta m"}
```

**Conclusión:** Observado: body JSON [] -> 400 E102 'falta m'. Coincide.

**Etiqueta de evidencia:** Línea base v1

#### X:60 — POST /msg PING

**Pregunta (hipótesis):** Mensaje sin campo de control: ¿E201?

**Preparación:** Posición 10 de 10 en `s-ord-02`. Solicitudes previas tras el reset: X:51 (`SALDOS;AC-0001;5X`), X:52 (`SALDOS;AC-0001;39`), X:53 (`ALTA;Lucia;Gomez;5X`), X:54 (`ALTA;Lucia;Gomez;12`), X:55 (`CONSULTA;AC-0001;AC-0002;5X`), X:56 (`CONSULTA;AC-0001;AC-0002;93`), X:57 (`ping;64`), X:58 (`PING;064`), X:59 (`[]`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"PING"}'
```

**Respuesta del original** (v1): status 400

```
{"error":"E103","mensaje":"falta control"}
```

**Respuesta de la réplica:** status 400 — coincide

```
{"error":"E103","mensaje":"falta control"}
```

**Conclusión:** Observado: mensaje sin ';' -> 400 E103 'falta control'. DIVERGENCIA: la réplica responde E201.

**Etiqueta de evidencia:** Línea base v1

### s-anu-01 — v1, X:61–X:73

#### X:61 — POST /msg ALTA;Ana;50

**Pregunta (hipótesis):** Preparación: AC-0001

**Preparación:** Posición 1 de 13 en `s-anu-01`. Estado vacío tras `POST /__reset`.

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"ALTA;Ana;50"}'
```

**Respuesta del original** (v1): status 201

```
{"cuentaId":"AC-0001"}
```

**Respuesta de la réplica:** status 201 — coincide

```
{"cuentaId":"AC-0001"}
```

**Conclusión:** Preparación OK.

**Etiqueta de evidencia:** Preparación

#### X:62 — POST /msg ALTA;Beto;11

**Pregunta (hipótesis):** Preparación: AC-0002

**Preparación:** Posición 2 de 13 en `s-anu-01`. Solicitudes previas tras el reset: X:61 (`ALTA;Ana;50`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"ALTA;Beto;11"}'
```

**Respuesta del original** (v1): status 201

```
{"cuentaId":"AC-0002"}
```

**Respuesta de la réplica:** status 201 — coincide

```
{"cuentaId":"AC-0002"}
```

**Conclusión:** Preparación OK.

**Etiqueta de evidencia:** Preparación

#### X:63 — POST /msg DEPOSITO;AC-0001;1000;35

**Pregunta (hipótesis):** Preparación: OP-0001 depósito 1000 en AC-0001

**Preparación:** Posición 3 de 13 en `s-anu-01`. Solicitudes previas tras el reset: X:61 (`ALTA;Ana;50`), X:62 (`ALTA;Beto;11`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"DEPOSITO;AC-0001;1000;35"}'
```

**Respuesta del original** (v1): status 200

```
{"status":"recieved","operacionId":"OP-0001"}
```

**Respuesta de la réplica:** status 200 — coincide

```
{"status":"recieved","operacionId":"OP-0001"}
```

**Conclusión:** Preparación OK.

**Etiqueta de evidencia:** Preparación

#### X:64 — POST /msg TRANSFER;AC-0001;AC-0002;300;6

**Pregunta (hipótesis):** Preparación: OP-0002 transfer 300 AC-0001→AC-0002

**Preparación:** Posición 4 de 13 en `s-anu-01`. Solicitudes previas tras el reset: X:61 (`ALTA;Ana;50`), X:62 (`ALTA;Beto;11`), X:63 (`DEPOSITO;AC-0001;1000;35`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"TRANSFER;AC-0001;AC-0002;300;6"}'
```

**Respuesta del original** (v1): status 200

```
{"status":"recieved","operacionId":"OP-0002"}
```

**Respuesta de la réplica:** status 200 — coincide

```
{"status":"recieved","operacionId":"OP-0002"}
```

**Conclusión:** Preparación OK.

**Etiqueta de evidencia:** Preparación

#### X:65 — POST /msg ANULA;OP-0002;69

**Pregunta (hipótesis):** Anular el TRANSFER

**Preparación:** Posición 5 de 13 en `s-anu-01`. Solicitudes previas tras el reset: X:61 (`ALTA;Ana;50`), X:62 (`ALTA;Beto;11`), X:63 (`DEPOSITO;AC-0001;1000;35`), X:64 (`TRANSFER;AC-0001;AC-0002;300;6`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"ANULA;OP-0002;69"}'
```

**Respuesta del original** (v1): status 200

```
{"ok":true,"anulada":"OP-0002"}
```

**Respuesta de la réplica:** status 200 — coincide

```
{"ok":true,"anulada":"OP-0002"}
```

**Conclusión:** Observado: ANULA de TRANSFER -> ok.

**Etiqueta de evidencia:** Línea base v1

#### X:66 — POST /msg CONSULTA;AC-0001;14

**Pregunta (hipótesis):** ANULA de TRANSFER: ¿el origen recupera el monto (1000) o queda en 700?

**Preparación:** Posición 6 de 13 en `s-anu-01`. Solicitudes previas tras el reset: X:61 (`ALTA;Ana;50`), X:62 (`ALTA;Beto;11`), X:63 (`DEPOSITO;AC-0001;1000;35`), X:64 (`TRANSFER;AC-0001;AC-0002;300;6`), X:65 (`ANULA;OP-0002;69`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"CONSULTA;AC-0001;14"}'
```

**Respuesta del original** (v1): status 200

```
{"cuenta_id":"AC-0001","saldo":1000}
```

**Respuesta de la réplica:** status 200 — difiere

```
{"cuenta_id":"AC-0001","saldo":"10.00"}
```

La réplica implementa la versión 2: v2 cambió este comportamiento, ver X:150.

**Conclusión:** Observado: tras ANULA de TRANSFER el origen recupera el monto (1000). Supuesto commands.ts:80 confirmado. Coincide.

**Etiqueta de evidencia:** Línea base v1

#### X:67 — POST /msg CONSULTA;AC-0002;11

**Pregunta (hipótesis):** ANULA de TRANSFER: ¿el destino vuelve a 0?

**Preparación:** Posición 7 de 13 en `s-anu-01`. Solicitudes previas tras el reset: X:61 (`ALTA;Ana;50`), X:62 (`ALTA;Beto;11`), X:63 (`DEPOSITO;AC-0001;1000;35`), X:64 (`TRANSFER;AC-0001;AC-0002;300;6`), X:65 (`ANULA;OP-0002;69`), X:66 (`CONSULTA;AC-0001;14`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"CONSULTA;AC-0002;11"}'
```

**Respuesta del original** (v1): status 200

```
{"cuenta_id":"AC-0002","saldo":0}
```

**Respuesta de la réplica:** status 200 — difiere

```
{"cuenta_id":"AC-0002","saldo":"0.00"}
```

La réplica implementa la versión 2: v2 cambió este comportamiento, ver X:151.

**Conclusión:** Observado: tras ANULA de TRANSFER el destino vuelve a 0. Coincide.

**Etiqueta de evidencia:** Línea base v1

#### X:68 — POST /msg ANULA;OP-0001;72

**Pregunta (hipótesis):** Anular un DEPOSITO: ¿se permite?

**Preparación:** Posición 8 de 13 en `s-anu-01`. Solicitudes previas tras el reset: X:61 (`ALTA;Ana;50`), X:62 (`ALTA;Beto;11`), X:63 (`DEPOSITO;AC-0001;1000;35`), X:64 (`TRANSFER;AC-0001;AC-0002;300;6`), X:65 (`ANULA;OP-0002;69`), X:66 (`CONSULTA;AC-0001;14`), X:67 (`CONSULTA;AC-0002;11`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"ANULA;OP-0001;72"}'
```

**Respuesta del original** (v1): status 200

```
{"ok":true,"anulada":"OP-0001"}
```

**Respuesta de la réplica:** status 200 — coincide

```
{"ok":true,"anulada":"OP-0001"}
```

**Conclusión:** Observado: ANULA de un DEPOSITO se acepta. Coincide.

**Etiqueta de evidencia:** Línea base v1

#### X:69 — POST /msg CONSULTA;AC-0001;14

**Pregunta (hipótesis):** ANULA de DEPOSITO: ¿el saldo baja 1000?

**Preparación:** Posición 9 de 13 en `s-anu-01`. Solicitudes previas tras el reset: X:61 (`ALTA;Ana;50`), X:62 (`ALTA;Beto;11`), X:63 (`DEPOSITO;AC-0001;1000;35`), X:64 (`TRANSFER;AC-0001;AC-0002;300;6`), X:65 (`ANULA;OP-0002;69`), X:66 (`CONSULTA;AC-0001;14`), X:67 (`CONSULTA;AC-0002;11`), X:68 (`ANULA;OP-0001;72`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"CONSULTA;AC-0001;14"}'
```

**Respuesta del original** (v1): status 200

```
{"cuenta_id":"AC-0001","saldo":0}
```

**Respuesta de la réplica:** status 200 — difiere

```
{"cuenta_id":"AC-0001","saldo":"0.00"}
```

La réplica implementa la versión 2: v2 cambió este comportamiento, ver X:153.

**Conclusión:** Observado: ANULA de DEPOSITO descuenta el monto (saldo 0). Coincide.

**Etiqueta de evidencia:** Línea base v1

#### X:70 — POST /msg DEPOSITO;AC-0002;500;53

**Pregunta (hipótesis):** Preparación: OP-0003 depósito 500 en AC-0002

**Preparación:** Posición 10 de 13 en `s-anu-01`. Solicitudes previas tras el reset: X:61 (`ALTA;Ana;50`), X:62 (`ALTA;Beto;11`), X:63 (`DEPOSITO;AC-0001;1000;35`), X:64 (`TRANSFER;AC-0001;AC-0002;300;6`), X:65 (`ANULA;OP-0002;69`), X:66 (`CONSULTA;AC-0001;14`), X:67 (`CONSULTA;AC-0002;11`), X:68 (`ANULA;OP-0001;72`), X:69 (`CONSULTA;AC-0001;14`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"DEPOSITO;AC-0002;500;53"}'
```

**Respuesta del original** (v1): status 200

```
{"status":"recieved","operacionId":"OP-0003"}
```

**Respuesta de la réplica:** status 200 — coincide

```
{"status":"recieved","operacionId":"OP-0003"}
```

**Conclusión:** Preparación OK.

**Etiqueta de evidencia:** Preparación

#### X:71 — POST /msg TRANSFER;AC-0002;AC-0001;500;73

**Pregunta (hipótesis):** Preparación: OP-0004 vacía AC-0002

**Preparación:** Posición 11 de 13 en `s-anu-01`. Solicitudes previas tras el reset: X:61 (`ALTA;Ana;50`), X:62 (`ALTA;Beto;11`), X:63 (`DEPOSITO;AC-0001;1000;35`), X:64 (`TRANSFER;AC-0001;AC-0002;300;6`), X:65 (`ANULA;OP-0002;69`), X:66 (`CONSULTA;AC-0001;14`), X:67 (`CONSULTA;AC-0002;11`), X:68 (`ANULA;OP-0001;72`), X:69 (`CONSULTA;AC-0001;14`), X:70 (`DEPOSITO;AC-0002;500;53`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"TRANSFER;AC-0002;AC-0001;500;73"}'
```

**Respuesta del original** (v1): status 200

```
{"status":"recieved","operacionId":"OP-0004"}
```

**Respuesta de la réplica:** status 200 — coincide

```
{"status":"recieved","operacionId":"OP-0004"}
```

**Conclusión:** Preparación OK.

**Etiqueta de evidencia:** Preparación

#### X:72 — POST /msg ANULA;OP-0003;66

**Pregunta (hipótesis):** Anular un depósito cuyo saldo ya se transfirió: ¿se permite saldo negativo o hay error?

**Preparación:** Posición 12 de 13 en `s-anu-01`. Solicitudes previas tras el reset: X:61 (`ALTA;Ana;50`), X:62 (`ALTA;Beto;11`), X:63 (`DEPOSITO;AC-0001;1000;35`), X:64 (`TRANSFER;AC-0001;AC-0002;300;6`), X:65 (`ANULA;OP-0002;69`), X:66 (`CONSULTA;AC-0001;14`), X:67 (`CONSULTA;AC-0002;11`), X:68 (`ANULA;OP-0001;72`), X:69 (`CONSULTA;AC-0001;14`), X:70 (`DEPOSITO;AC-0002;500;53`), X:71 (`TRANSFER;AC-0002;AC-0001;500;73`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"ANULA;OP-0003;66"}'
```

**Respuesta del original** (v1): status 200

```
{"ok":true,"anulada":"OP-0003"}
```

**Respuesta de la réplica:** status 200 — coincide

```
{"ok":true,"anulada":"OP-0003"}
```

**Conclusión:** Observado: ANULA de un depósito ya transferido se acepta.

**Etiqueta de evidencia:** Línea base v1

#### X:73 — POST /msg CONSULTA;AC-0002;11

**Pregunta (hipótesis):** Saldo de AC-0002 tras la anulación anterior

**Preparación:** Posición 13 de 13 en `s-anu-01`. Solicitudes previas tras el reset: X:61 (`ALTA;Ana;50`), X:62 (`ALTA;Beto;11`), X:63 (`DEPOSITO;AC-0001;1000;35`), X:64 (`TRANSFER;AC-0001;AC-0002;300;6`), X:65 (`ANULA;OP-0002;69`), X:66 (`CONSULTA;AC-0001;14`), X:67 (`CONSULTA;AC-0002;11`), X:68 (`ANULA;OP-0001;72`), X:69 (`CONSULTA;AC-0001;14`), X:70 (`DEPOSITO;AC-0002;500;53`), X:71 (`TRANSFER;AC-0002;AC-0001;500;73`), X:72 (`ANULA;OP-0003;66`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"CONSULTA;AC-0002;11"}'
```

**Respuesta del original** (v1): status 200

```
{"cuenta_id":"AC-0002","saldo":-500}
```

**Respuesta de la réplica:** status 200 — difiere

```
{"cuenta_id":"AC-0002","saldo":"-5.00"}
```

La réplica implementa la versión 2: v2 cambió este comportamiento, ver X:157.

**Conclusión:** Observado: saldo negativo permitido (-500) tras ANULA. Coincide.

**Etiqueta de evidencia:** Línea base v1

### s-tr-01 — v1, X:74–X:84

#### X:74 — POST /msg ALTA;Ana;50

**Pregunta (hipótesis):** Preparación: AC-0001

**Preparación:** Posición 1 de 11 en `s-tr-01`. Estado vacío tras `POST /__reset`.

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"ALTA;Ana;50"}'
```

**Respuesta del original** (v1): status 201

```
{"cuentaId":"AC-0001"}
```

**Respuesta de la réplica:** status 201 — coincide

```
{"cuentaId":"AC-0001"}
```

**Conclusión:** Preparación OK.

**Etiqueta de evidencia:** Preparación

#### X:75 — POST /msg TRANSFER;AC-0001;AC-0099;100;24

**Pregunta (hipótesis):** TRANSFER a destino inexistente: ¿E401?

**Preparación:** Posición 2 de 11 en `s-tr-01`. Solicitudes previas tras el reset: X:74 (`ALTA;Ana;50`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"TRANSFER;AC-0001;AC-0099;100;24"}'
```

**Respuesta del original** (v1): status 404

```
{"error":"E401","mensaje":"cuenta inexistente"}
```

**Respuesta de la réplica:** status 404 — coincide

```
{"error":"E401","mensaje":"cuenta inexistente"}
```

**Conclusión:** Observado: TRANSFER a destino inexistente -> 404 E401. Coincide.

**Etiqueta de evidencia:** Línea base v1

#### X:76 — POST /msg TRANSFER;AC-0099;AC-0001;100;12

**Pregunta (hipótesis):** TRANSFER desde origen inexistente: ¿E401?

**Preparación:** Posición 3 de 11 en `s-tr-01`. Solicitudes previas tras el reset: X:74 (`ALTA;Ana;50`), X:75 (`TRANSFER;AC-0001;AC-0099;100;24`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"TRANSFER;AC-0099;AC-0001;100;12"}'
```

**Respuesta del original** (v1): status 404

```
{"error":"E401","mensaje":"cuenta inexistente"}
```

**Respuesta de la réplica:** status 404 — coincide

```
{"error":"E401","mensaje":"cuenta inexistente"}
```

**Conclusión:** Observado: TRANSFER desde origen inexistente -> 404 E401. Coincide.

**Etiqueta de evidencia:** Línea base v1

#### X:77 — POST /msg TRANSFER;AC-0099;AC-0001;0;40

**Pregunta (hipótesis):** Orden: origen inexistente + monto 0: ¿E401 o E303?

**Preparación:** Posición 4 de 11 en `s-tr-01`. Solicitudes previas tras el reset: X:74 (`ALTA;Ana;50`), X:75 (`TRANSFER;AC-0001;AC-0099;100;24`), X:76 (`TRANSFER;AC-0099;AC-0001;100;12`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"TRANSFER;AC-0099;AC-0001;0;40"}'
```

**Respuesta del original** (v1): status 400

```
{"error":"E303","mensaje":"monto inválido"}
```

**Respuesta de la réplica:** status 400 — coincide

```
{"error":"E303","mensaje":"monto inválido"}
```

**Conclusión:** Observado: origen inexistente + monto 0 -> 400 E303. Inferido: el monto se valida antes que la existencia de cuentas. DIVERGENCIA: la réplica responde E401.

**Etiqueta de evidencia:** Línea base v1

#### X:78 — POST /msg TRANSFER;AC-0001;AC-0099;200000;33

**Pregunta (hipótesis):** Orden: destino inexistente + monto sobre el límite: ¿E401 o E506?

**Preparación:** Posición 5 de 11 en `s-tr-01`. Solicitudes previas tras el reset: X:74 (`ALTA;Ana;50`), X:75 (`TRANSFER;AC-0001;AC-0099;100;24`), X:76 (`TRANSFER;AC-0099;AC-0001;100;12`), X:77 (`TRANSFER;AC-0099;AC-0001;0;40`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"TRANSFER;AC-0001;AC-0099;200000;33"}'
```

**Respuesta del original** (v1): status 404

```
{"error":"E401","mensaje":"cuenta inexistente"}
```

**Respuesta de la réplica:** status 404 — coincide

```
{"error":"E401","mensaje":"cuenta inexistente"}
```

**Conclusión:** Observado: destino inexistente + 200000 -> E401. Inferido: E401 se evalúa antes que E506. Coincide.

**Etiqueta de evidencia:** Línea base v1

#### X:79 — POST /msg DEPOSITO;AC-0001;500;46

**Pregunta (hipótesis):** Preparación: saldo 500

**Preparación:** Posición 6 de 11 en `s-tr-01`. Solicitudes previas tras el reset: X:74 (`ALTA;Ana;50`), X:75 (`TRANSFER;AC-0001;AC-0099;100;24`), X:76 (`TRANSFER;AC-0099;AC-0001;100;12`), X:77 (`TRANSFER;AC-0099;AC-0001;0;40`), X:78 (`TRANSFER;AC-0001;AC-0099;200000;33`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"DEPOSITO;AC-0001;500;46"}'
```

**Respuesta del original** (v1): status 200

```
{"status":"recieved","operacionId":"OP-0001"}
```

**Respuesta de la réplica:** status 200 — coincide

```
{"status":"recieved","operacionId":"OP-0001"}
```

**Conclusión:** Preparación OK.

**Etiqueta de evidencia:** Preparación

#### X:80 — POST /msg TRANSFER;AC-0001;AC-0001;100;17

**Pregunta (hipótesis):** TRANSFER a la misma cuenta: ¿se acepta?

**Preparación:** Posición 7 de 11 en `s-tr-01`. Solicitudes previas tras el reset: X:74 (`ALTA;Ana;50`), X:75 (`TRANSFER;AC-0001;AC-0099;100;24`), X:76 (`TRANSFER;AC-0099;AC-0001;100;12`), X:77 (`TRANSFER;AC-0099;AC-0001;0;40`), X:78 (`TRANSFER;AC-0001;AC-0099;200000;33`), X:79 (`DEPOSITO;AC-0001;500;46`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"TRANSFER;AC-0001;AC-0001;100;17"}'
```

**Respuesta del original** (v1): status 400

```
{"error":"E304","mensaje":"origen y destino iguales"}
```

**Respuesta de la réplica:** status 400 — coincide

```
{"error":"E304","mensaje":"origen y destino iguales"}
```

**Conclusión:** Observado: TRANSFER a la misma cuenta -> 400 E304 'origen y destino iguales'. DIVERGENCIA: la réplica lo acepta (200).

**Etiqueta de evidencia:** Línea base v1

#### X:81 — POST /msg CONSULTA;AC-0001;14

**Pregunta (hipótesis):** Saldo tras transfer a la misma cuenta: ¿sigue 500?

**Preparación:** Posición 8 de 11 en `s-tr-01`. Solicitudes previas tras el reset: X:74 (`ALTA;Ana;50`), X:75 (`TRANSFER;AC-0001;AC-0099;100;24`), X:76 (`TRANSFER;AC-0099;AC-0001;100;12`), X:77 (`TRANSFER;AC-0099;AC-0001;0;40`), X:78 (`TRANSFER;AC-0001;AC-0099;200000;33`), X:79 (`DEPOSITO;AC-0001;500;46`), X:80 (`TRANSFER;AC-0001;AC-0001;100;17`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"CONSULTA;AC-0001;14"}'
```

**Respuesta del original** (v1): status 200

```
{"cuenta_id":"AC-0001","saldo":500}
```

**Respuesta de la réplica:** status 200 — difiere

```
{"cuenta_id":"AC-0001","saldo":"5.00"}
```

La réplica implementa la versión 2: v2 cambió este comportamiento, ver X:165.

**Conclusión:** Observado: saldo sigue en 500 (el transfer rechazado no movió dinero).

**Etiqueta de evidencia:** Línea base v1

#### X:82 — POST /msg CONSULTA;ac-0001;14

**Pregunta (hipótesis):** Id de cuenta en minúsculas: ¿E401 o se normaliza?

**Preparación:** Posición 9 de 11 en `s-tr-01`. Solicitudes previas tras el reset: X:74 (`ALTA;Ana;50`), X:75 (`TRANSFER;AC-0001;AC-0099;100;24`), X:76 (`TRANSFER;AC-0099;AC-0001;100;12`), X:77 (`TRANSFER;AC-0099;AC-0001;0;40`), X:78 (`TRANSFER;AC-0001;AC-0099;200000;33`), X:79 (`DEPOSITO;AC-0001;500;46`), X:80 (`TRANSFER;AC-0001;AC-0001;100;17`), X:81 (`CONSULTA;AC-0001;14`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"CONSULTA;ac-0001;14"}'
```

**Respuesta del original** (v1): status 404

```
{"error":"E401","mensaje":"cuenta inexistente"}
```

**Respuesta de la réplica:** status 404 — coincide

```
{"error":"E401","mensaje":"cuenta inexistente"}
```

**Conclusión:** Observado: id de cuenta en minúsculas -> 404 E401 (sin normalizar). Coincide.

**Etiqueta de evidencia:** Línea base v1

#### X:83 — POST /msg ALTA;Ana;50

**Pregunta (hipótesis):** Nombre duplicado en ALTA: ¿se acepta con nuevo id?

**Preparación:** Posición 10 de 11 en `s-tr-01`. Solicitudes previas tras el reset: X:74 (`ALTA;Ana;50`), X:75 (`TRANSFER;AC-0001;AC-0099;100;24`), X:76 (`TRANSFER;AC-0099;AC-0001;100;12`), X:77 (`TRANSFER;AC-0099;AC-0001;0;40`), X:78 (`TRANSFER;AC-0001;AC-0099;200000;33`), X:79 (`DEPOSITO;AC-0001;500;46`), X:80 (`TRANSFER;AC-0001;AC-0001;100;17`), X:81 (`CONSULTA;AC-0001;14`), X:82 (`CONSULTA;ac-0001;14`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"ALTA;Ana;50"}'
```

**Respuesta del original** (v1): status 201

```
{"cuentaId":"AC-0002"}
```

**Respuesta de la réplica:** status 201 — coincide

```
{"cuentaId":"AC-0002"}
```

**Conclusión:** Observado: ALTA con nombre duplicado se acepta con nuevo id (AC-0002). Coincide.

**Etiqueta de evidencia:** Línea base v1

#### X:84 — POST /msg DEPOSITO;AC-0001;0500;80

**Pregunta (hipótesis):** Monto con cero a la izquierda: ¿se acepta como 500?

**Preparación:** Posición 11 de 11 en `s-tr-01`. Solicitudes previas tras el reset: X:74 (`ALTA;Ana;50`), X:75 (`TRANSFER;AC-0001;AC-0099;100;24`), X:76 (`TRANSFER;AC-0099;AC-0001;100;12`), X:77 (`TRANSFER;AC-0099;AC-0001;0;40`), X:78 (`TRANSFER;AC-0001;AC-0099;200000;33`), X:79 (`DEPOSITO;AC-0001;500;46`), X:80 (`TRANSFER;AC-0001;AC-0001;100;17`), X:81 (`CONSULTA;AC-0001;14`), X:82 (`CONSULTA;ac-0001;14`), X:83 (`ALTA;Ana;50`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"DEPOSITO;AC-0001;0500;80"}'
```

**Respuesta del original** (v1): status 400

```
{"error":"E303","mensaje":"monto inválido"}
```

**Respuesta de la réplica:** status 400 — coincide

```
{"error":"E303","mensaje":"monto inválido"}
```

**Conclusión:** Observado: monto con cero a la izquierda '0500' -> 400 E303. DIVERGENCIA: la réplica lo acepta como 500.

**Etiqueta de evidencia:** Línea base v1

### s-diag-01-v2 — v2, X:85

#### X:85 — POST /msg PING;64

Repite X:1 (v1).

**Pregunta (hipótesis):** Replay v2 de X:1: misma solicitud y mismo estado que en v1; ¿cambió la respuesta?

**Preparación:** Posición 1 de 1 en `s-diag-01-v2`. Estado vacío tras `POST /__reset`.

**Solicitud:** POST `/msg`, token incorrecto (`Authorization: Bearer wrong-token`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer wrong-token" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"PING;64"}'
```

**Respuesta del original** (v2): status 401

```
{"error":"E001","mensaje":"no autorizado"}
```

**Respuesta de la réplica:** status 401 — coincide

```
{"error":"E001","mensaje":"no autorizado"}
```

**Conclusión:** Igual a X:1 (v1).

**Etiqueta de evidencia:** Repetición en v2

### s-ctl-01-v2 — v2, X:86–X:90

#### X:86 — POST /msg PING;64

Repite X:2 (v1).

**Pregunta (hipótesis):** Replay v2 de X:2: misma solicitud y mismo estado que en v1; ¿cambió la respuesta?

**Preparación:** Posición 1 de 5 en `s-ctl-01-v2`. Estado vacío tras `POST /__reset`.

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"PING;64"}'
```

**Respuesta del original** (v2): status 200

```
{"pong":true}
```

**Respuesta de la réplica:** status 200 — coincide

```
{"pong":true}
```

**Conclusión:** Igual a X:2 (v1).

**Etiqueta de evidencia:** Repetición en v2

#### X:87 — POST /msg ALTA;Mava;98

Repite X:3 (v1).

**Pregunta (hipótesis):** Replay v2 de X:3: misma solicitud y mismo estado que en v1; ¿cambió la respuesta?

**Preparación:** Posición 2 de 5 en `s-ctl-01-v2`. Solicitudes previas tras el reset: X:86 (`PING;64`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"ALTA;Mava;98"}'
```

**Respuesta del original** (v2): status 201

```
{"cuentaId":"AC-0001"}
```

**Respuesta de la réplica:** status 201 — coincide

```
{"cuentaId":"AC-0001"}
```

**Conclusión:** Igual a X:3 (v1).

**Etiqueta de evidencia:** Repetición en v2

#### X:88 — POST /msg ALTA;Laro;1

Repite X:4 (v1).

**Pregunta (hipótesis):** Replay v2 de X:4: misma solicitud y mismo estado que en v1; ¿cambió la respuesta?

**Preparación:** Posición 3 de 5 en `s-ctl-01-v2`. Solicitudes previas tras el reset: X:86 (`PING;64`), X:87 (`ALTA;Mava;98`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"ALTA;Laro;1"}'
```

**Respuesta del original** (v2): status 400

```
{"error":"E202","mensaje":"control inválido"}
```

**Respuesta de la réplica:** status 400 — coincide

```
{"error":"E202","mensaje":"control inválido"}
```

**Conclusión:** Igual a X:4 (v1).

**Etiqueta de evidencia:** Repetición en v2

#### X:89 — POST /msg ALTA;Mari;97

Repite X:5 (v1).

**Pregunta (hipótesis):** Replay v2 de X:5: misma solicitud y mismo estado que en v1; ¿cambió la respuesta?

**Preparación:** Posición 4 de 5 en `s-ctl-01-v2`. Solicitudes previas tras el reset: X:86 (`PING;64`), X:87 (`ALTA;Mava;98`), X:88 (`ALTA;Laro;1`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"ALTA;Mari;97"}'
```

**Respuesta del original** (v2): status 201

```
{"cuentaId":"AC-0002"}
```

**Respuesta de la réplica:** status 201 — coincide

```
{"cuentaId":"AC-0002"}
```

**Conclusión:** Igual a X:5 (v1).

**Etiqueta de evidencia:** Repetición en v2

#### X:90 — POST /msg ALTA;Miro;0

Repite X:6 (v1).

**Pregunta (hipótesis):** Replay v2 de X:6: misma solicitud y mismo estado que en v1; ¿cambió la respuesta?

**Preparación:** Posición 5 de 5 en `s-ctl-01-v2`. Solicitudes previas tras el reset: X:86 (`PING;64`), X:87 (`ALTA;Mava;98`), X:88 (`ALTA;Laro;1`), X:89 (`ALTA;Mari;97`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"ALTA;Miro;0"}'
```

**Respuesta del original** (v2): status 400

```
{"error":"E202","mensaje":"control inválido"}
```

**Respuesta de la réplica:** status 400 — coincide

```
{"error":"E202","mensaje":"control inválido"}
```

**Conclusión:** Igual a X:6 (v1).

**Etiqueta de evidencia:** Repetición en v2

### s-io-01-v2 — v2, X:91–X:102

#### X:91 — GET /noexiste

Repite X:7 (v1).

**Pregunta (hipótesis):** Replay v2 de X:7: misma solicitud y mismo estado que en v1; ¿cambió la respuesta?

**Preparación:** Posición 1 de 12 en `s-io-01-v2`. Estado vacío tras `POST /__reset`.

**Solicitud:** GET `/noexiste`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X GET \
  "$BASE_URL/noexiste" \
  -H "Authorization: Bearer $TEAM_TOKEN"
```

**Respuesta del original** (v2): status 404

```
{"error":"E404","mensaje":"ruta desconocida"}
```

**Respuesta de la réplica:** status 404 — coincide

```
{"error":"E404","mensaje":"ruta desconocida"}
```

**Conclusión:** Igual a X:7 (v1).

**Etiqueta de evidencia:** Repetición en v2

#### X:92 — POST /noexiste

Repite X:8 (v1).

**Pregunta (hipótesis):** Replay v2 de X:8: misma solicitud y mismo estado que en v1; ¿cambió la respuesta?

**Preparación:** Posición 2 de 12 en `s-io-01-v2`. Solicitudes previas tras el reset: X:91 (GET /noexiste).

**Solicitud:** POST `/noexiste`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/noexiste" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"PING;64"}'
```

**Respuesta del original** (v2): status 404

```
{"error":"E404","mensaje":"ruta desconocida"}
```

**Respuesta de la réplica:** status 404 — coincide

```
{"error":"E404","mensaje":"ruta desconocida"}
```

**Conclusión:** Igual a X:8 (v1).

**Etiqueta de evidencia:** Repetición en v2

#### X:93 — GET /msg

Repite X:9 (v1).

**Pregunta (hipótesis):** Replay v2 de X:9: misma solicitud y mismo estado que en v1; ¿cambió la respuesta?

**Preparación:** Posición 3 de 12 en `s-io-01-v2`. Solicitudes previas tras el reset: X:91 (GET /noexiste), X:92 (`PING;64`).

**Solicitud:** GET `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X GET \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN"
```

**Respuesta del original** (v2): status 404

```
{"error":"E404","mensaje":"ruta desconocida"}
```

**Respuesta de la réplica:** status 404 — coincide

```
{"error":"E404","mensaje":"ruta desconocida"}
```

**Conclusión:** Igual a X:9 (v1).

**Etiqueta de evidencia:** Repetición en v2

#### X:94 — POST /msg PING;64

Repite X:10 (v1).

**Pregunta (hipótesis):** Replay v2 de X:10: misma solicitud y mismo estado que en v1; ¿cambió la respuesta?

**Preparación:** Posición 4 de 12 en `s-io-01-v2`. Solicitudes previas tras el reset: X:91 (GET /noexiste), X:92 (`PING;64`), X:93 (GET /msg).

**Solicitud:** POST `/msg`, sin cabecera `Authorization`.

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"PING;64"}'
```

**Respuesta del original** (v2): status 401

```
{"error":"E001","mensaje":"no autorizado"}
```

**Respuesta de la réplica:** status 401 — coincide

```
{"error":"E001","mensaje":"no autorizado"}
```

**Conclusión:** Igual a X:10 (v1).

**Etiqueta de evidencia:** Repetición en v2

#### X:95 — POST /msg PING;64

Repite X:11 (v1).

**Pregunta (hipótesis):** Replay v2 de X:11: misma solicitud y mismo estado que en v1; ¿cambió la respuesta?

**Preparación:** Posición 5 de 12 en `s-io-01-v2`. Solicitudes previas tras el reset: X:91 (GET /noexiste), X:92 (`PING;64`), X:93 (GET /msg), X:94 (`PING;64`).

**Solicitud:** POST `/msg`, token incorrecto (`Authorization: Bearer wrong-token`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer wrong-token" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"PING;64"}'
```

**Respuesta del original** (v2): status 401

```
{"error":"E001","mensaje":"no autorizado"}
```

**Respuesta de la réplica:** status 401 — coincide

```
{"error":"E001","mensaje":"no autorizado"}
```

**Conclusión:** Igual a X:11 (v1).

**Etiqueta de evidencia:** Repetición en v2

#### X:96 — GET /noexiste

Repite X:12 (v1).

**Pregunta (hipótesis):** Replay v2 de X:12: misma solicitud y mismo estado que en v1; ¿cambió la respuesta?

**Preparación:** Posición 6 de 12 en `s-io-01-v2`. Solicitudes previas tras el reset: X:91 (GET /noexiste), X:92 (`PING;64`), X:93 (GET /msg), X:94 (`PING;64`), X:95 (`PING;64`).

**Solicitud:** GET `/noexiste`, sin cabecera `Authorization`.

```bash
curl -sS -i \
  -X GET \
  "$BASE_URL/noexiste"
```

**Respuesta del original** (v2): status 404

```
{"error":"E404","mensaje":"ruta desconocida"}
```

**Respuesta de la réplica:** status 404 — coincide

```
{"error":"E404","mensaje":"ruta desconocida"}
```

**Conclusión:** Igual a X:12 (v1).

**Etiqueta de evidencia:** Repetición en v2

#### X:97 — GET /health

Repite X:13 (v1).

**Pregunta (hipótesis):** Replay v2 de X:13: misma solicitud y mismo estado que en v1; ¿cambió la respuesta?

**Preparación:** Posición 7 de 12 en `s-io-01-v2`. Solicitudes previas tras el reset: X:91 (GET /noexiste), X:92 (`PING;64`), X:93 (GET /msg), X:94 (`PING;64`), X:95 (`PING;64`), X:96 (GET /noexiste).

**Solicitud:** GET `/health`, sin cabecera `Authorization`.

```bash
curl -sS -i \
  -X GET \
  "$BASE_URL/health"
```

**Respuesta del original** (v2): status 401

```
{"error":"E001","mensaje":"no autorizado"}
```

**Respuesta de la réplica:** status 401 — coincide

```
{"error":"E001","mensaje":"no autorizado"}
```

**Conclusión:** Igual a X:13 (v1).

**Etiqueta de evidencia:** Repetición en v2

#### X:98 — GET /health

Repite X:14 (v1).

**Pregunta (hipótesis):** Replay v2 de X:14: misma solicitud y mismo estado que en v1; ¿cambió la respuesta?

**Preparación:** Posición 8 de 12 en `s-io-01-v2`. Solicitudes previas tras el reset: X:91 (GET /noexiste), X:92 (`PING;64`), X:93 (GET /msg), X:94 (`PING;64`), X:95 (`PING;64`), X:96 (GET /noexiste), X:97 (GET /health).

**Solicitud:** GET `/health`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X GET \
  "$BASE_URL/health" \
  -H "Authorization: Bearer $TEAM_TOKEN"
```

**Respuesta del original** (v2): status 200

```
{"ok":true}
```

**Respuesta de la réplica:** status 200 — coincide

```
{"ok":true}
```

**Conclusión:** Igual a X:14 (v1).

**Etiqueta de evidencia:** Repetición en v2

#### X:99 — POST /msg esto no es json

Repite X:15 (v1).

**Pregunta (hipótesis):** Replay v2 de X:15: misma solicitud y mismo estado que en v1; ¿cambió la respuesta?

**Preparación:** Posición 9 de 12 en `s-io-01-v2`. Solicitudes previas tras el reset: X:91 (GET /noexiste), X:92 (`PING;64`), X:93 (GET /msg), X:94 (`PING;64`), X:95 (`PING;64`), X:96 (GET /noexiste), X:97 (GET /health), X:98 (GET /health).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw 'esto no es json'
```

**Respuesta del original** (v2): status 400

```
{"error":"E100","mensaje":"json inválido"}
```

**Respuesta de la réplica:** status 400 — coincide

```
{"error":"E100","mensaje":"json inválido"}
```

**Conclusión:** Igual a X:15 (v1).

**Etiqueta de evidencia:** Repetición en v2

#### X:100 — POST /msg {}

Repite X:16 (v1).

**Pregunta (hipótesis):** Replay v2 de X:16: misma solicitud y mismo estado que en v1; ¿cambió la respuesta?

**Preparación:** Posición 10 de 12 en `s-io-01-v2`. Solicitudes previas tras el reset: X:91 (GET /noexiste), X:92 (`PING;64`), X:93 (GET /msg), X:94 (`PING;64`), X:95 (`PING;64`), X:96 (GET /noexiste), X:97 (GET /health), X:98 (GET /health), X:99 (`esto no es json`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{}'
```

**Respuesta del original** (v2): status 400

```
{"error":"E102","mensaje":"falta m"}
```

**Respuesta de la réplica:** status 400 — coincide

```
{"error":"E102","mensaje":"falta m"}
```

**Conclusión:** Igual a X:16 (v1).

**Etiqueta de evidencia:** Repetición en v2

#### X:101 — POST /msg {"m":123}

Repite X:17 (v1).

**Pregunta (hipótesis):** Replay v2 de X:17: misma solicitud y mismo estado que en v1; ¿cambió la respuesta?

**Preparación:** Posición 11 de 12 en `s-io-01-v2`. Solicitudes previas tras el reset: X:91 (GET /noexiste), X:92 (`PING;64`), X:93 (GET /msg), X:94 (`PING;64`), X:95 (`PING;64`), X:96 (GET /noexiste), X:97 (GET /health), X:98 (GET /health), X:99 (`esto no es json`), X:100 (`{}`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":123}'
```

**Respuesta del original** (v2): status 400

```
{"error":"E102","mensaje":"falta m"}
```

**Respuesta de la réplica:** status 400 — coincide

```
{"error":"E102","mensaje":"falta m"}
```

**Conclusión:** Igual a X:17 (v1).

**Etiqueta de evidencia:** Repetición en v2

#### X:102 — POST /msg ANULA;OP-0099;69

Repite X:18 (v1).

**Pregunta (hipótesis):** Replay v2 de X:18: misma solicitud y mismo estado que en v1; ¿cambió la respuesta?

**Preparación:** Posición 12 de 12 en `s-io-01-v2`. Solicitudes previas tras el reset: X:91 (GET /noexiste), X:92 (`PING;64`), X:93 (GET /msg), X:94 (`PING;64`), X:95 (`PING;64`), X:96 (GET /noexiste), X:97 (GET /health), X:98 (GET /health), X:99 (`esto no es json`), X:100 (`{}`), X:101 (`{"m":123}`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"ANULA;OP-0099;69"}'
```

**Respuesta del original** (v2): status 404

```
{"error":"E402","mensaje":"operación inexistente"}
```

**Respuesta de la réplica:** status 404 — coincide

```
{"error":"E402","mensaje":"operación inexistente"}
```

**Conclusión:** Igual a X:18 (v1).

**Etiqueta de evidencia:** Repetición en v2

### s-amt-01-v2 — v2, X:103–X:114

#### X:103 — POST /msg ALTA;Ana;50

Repite X:19 (v1).

**Pregunta (hipótesis):** Replay v2 de X:19: misma solicitud y mismo estado que en v1; ¿cambió la respuesta?

**Preparación:** Posición 1 de 12 en `s-amt-01-v2`. Estado vacío tras `POST /__reset`.

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"ALTA;Ana;50"}'
```

**Respuesta del original** (v2): status 201

```
{"cuentaId":"AC-0001"}
```

**Respuesta de la réplica:** status 201 — coincide

```
{"cuentaId":"AC-0001"}
```

**Conclusión:** Igual a X:19 (v1).

**Etiqueta de evidencia:** Repetición en v2

#### X:104 — POST /msg ALTA;Beto;11

Repite X:20 (v1).

**Pregunta (hipótesis):** Replay v2 de X:20: misma solicitud y mismo estado que en v1; ¿cambió la respuesta?

**Preparación:** Posición 2 de 12 en `s-amt-01-v2`. Solicitudes previas tras el reset: X:103 (`ALTA;Ana;50`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"ALTA;Beto;11"}'
```

**Respuesta del original** (v2): status 201

```
{"cuentaId":"AC-0002"}
```

**Respuesta de la réplica:** status 201 — coincide

```
{"cuentaId":"AC-0002"}
```

**Conclusión:** Igual a X:20 (v1).

**Etiqueta de evidencia:** Repetición en v2

#### X:105 — POST /msg DEPOSITO;AC-0001;0;31

Repite X:21 (v1).

**Pregunta (hipótesis):** Replay v2 de X:21: misma solicitud y mismo estado que en v1; ¿cambió la respuesta?

**Preparación:** Posición 3 de 12 en `s-amt-01-v2`. Solicitudes previas tras el reset: X:103 (`ALTA;Ana;50`), X:104 (`ALTA;Beto;11`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"DEPOSITO;AC-0001;0;31"}'
```

**Respuesta del original** (v2): status 400

```
{"error":"E303","mensaje":"monto inválido"}
```

**Respuesta de la réplica:** status 400 — coincide

```
{"error":"E303","mensaje":"monto inválido"}
```

**Conclusión:** Igual a X:21 (v1).

**Etiqueta de evidencia:** Repetición en v2

#### X:106 — POST /msg DEPOSITO;AC-0001;-5;16

Repite X:22 (v1).

**Pregunta (hipótesis):** Replay v2 de X:22: misma solicitud y mismo estado que en v1; ¿cambió la respuesta?

**Preparación:** Posición 4 de 12 en `s-amt-01-v2`. Solicitudes previas tras el reset: X:103 (`ALTA;Ana;50`), X:104 (`ALTA;Beto;11`), X:105 (`DEPOSITO;AC-0001;0;31`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"DEPOSITO;AC-0001;-5;16"}'
```

**Respuesta del original** (v2): status 400

```
{"error":"E303","mensaje":"monto inválido"}
```

**Respuesta de la réplica:** status 400 — coincide

```
{"error":"E303","mensaje":"monto inválido"}
```

**Conclusión:** Igual a X:22 (v1).

**Etiqueta de evidencia:** Repetición en v2

#### X:107 — POST /msg DEPOSITO;AC-0001;12.5;7

Repite X:23 (v1).

**Pregunta (hipótesis):** Replay v2 de X:23: misma solicitud y mismo estado que en v1; ¿cambió la respuesta?

**Preparación:** Posición 5 de 12 en `s-amt-01-v2`. Solicitudes previas tras el reset: X:103 (`ALTA;Ana;50`), X:104 (`ALTA;Beto;11`), X:105 (`DEPOSITO;AC-0001;0;31`), X:106 (`DEPOSITO;AC-0001;-5;16`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"DEPOSITO;AC-0001;12.5;7"}'
```

**Respuesta del original** (v2): status 400

```
{"error":"E303","mensaje":"monto inválido"}
```

**Respuesta de la réplica:** status 400 — coincide

```
{"error":"E303","mensaje":"monto inválido"}
```

**Conclusión:** Igual a X:23 (v1).

**Etiqueta de evidencia:** Repetición en v2

#### X:108 — POST /msg DEPOSITO;AC-0001;abc;13

Repite X:24 (v1).

**Pregunta (hipótesis):** Replay v2 de X:24: misma solicitud y mismo estado que en v1; ¿cambió la respuesta?

**Preparación:** Posición 6 de 12 en `s-amt-01-v2`. Solicitudes previas tras el reset: X:103 (`ALTA;Ana;50`), X:104 (`ALTA;Beto;11`), X:105 (`DEPOSITO;AC-0001;0;31`), X:106 (`DEPOSITO;AC-0001;-5;16`), X:107 (`DEPOSITO;AC-0001;12.5;7`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"DEPOSITO;AC-0001;abc;13"}'
```

**Respuesta del original** (v2): status 400

```
{"error":"E303","mensaje":"monto inválido"}
```

**Respuesta de la réplica:** status 400 — coincide

```
{"error":"E303","mensaje":"monto inválido"}
```

**Conclusión:** Igual a X:24 (v1).

**Etiqueta de evidencia:** Repetición en v2

#### X:109 — POST /msg DEPOSITO;AC-0001;500000;90

Repite X:25 (v1).

**Pregunta (hipótesis):** Replay v2 de X:25: misma solicitud y mismo estado que en v1; ¿cambió la respuesta?

**Preparación:** Posición 7 de 12 en `s-amt-01-v2`. Solicitudes previas tras el reset: X:103 (`ALTA;Ana;50`), X:104 (`ALTA;Beto;11`), X:105 (`DEPOSITO;AC-0001;0;31`), X:106 (`DEPOSITO;AC-0001;-5;16`), X:107 (`DEPOSITO;AC-0001;12.5;7`), X:108 (`DEPOSITO;AC-0001;abc;13`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"DEPOSITO;AC-0001;500000;90"}'
```

**Respuesta del original** (v2): status 200

```
{"status":"recieved","operacionId":"OP-0001"}
```

**Respuesta de la réplica:** status 200 — coincide

```
{"status":"recieved","operacionId":"OP-0001"}
```

**Conclusión:** Igual a X:25 (v1).

**Etiqueta de evidencia:** Repetición en v2

#### X:110 — POST /msg TRANSFER;AC-0001;AC-0002;0;44

Repite X:26 (v1).

**Pregunta (hipótesis):** Replay v2 de X:26: misma solicitud y mismo estado que en v1; ¿cambió la respuesta?

**Preparación:** Posición 8 de 12 en `s-amt-01-v2`. Solicitudes previas tras el reset: X:103 (`ALTA;Ana;50`), X:104 (`ALTA;Beto;11`), X:105 (`DEPOSITO;AC-0001;0;31`), X:106 (`DEPOSITO;AC-0001;-5;16`), X:107 (`DEPOSITO;AC-0001;12.5;7`), X:108 (`DEPOSITO;AC-0001;abc;13`), X:109 (`DEPOSITO;AC-0001;500000;90`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"TRANSFER;AC-0001;AC-0002;0;44"}'
```

**Respuesta del original** (v2): status 400

```
{"error":"E303","mensaje":"monto inválido"}
```

**Respuesta de la réplica:** status 400 — coincide

```
{"error":"E303","mensaje":"monto inválido"}
```

**Conclusión:** Igual a X:26 (v1).

**Etiqueta de evidencia:** Repetición en v2

#### X:111 — POST /msg TRANSFER;AC-0001;AC-0002;100001;9

Repite X:27 (v1).

**Pregunta (hipótesis):** Replay v2 de X:27: misma solicitud y mismo estado que en v1; ¿cambió la respuesta?

**Preparación:** Posición 9 de 12 en `s-amt-01-v2`. Solicitudes previas tras el reset: X:103 (`ALTA;Ana;50`), X:104 (`ALTA;Beto;11`), X:105 (`DEPOSITO;AC-0001;0;31`), X:106 (`DEPOSITO;AC-0001;-5;16`), X:107 (`DEPOSITO;AC-0001;12.5;7`), X:108 (`DEPOSITO;AC-0001;abc;13`), X:109 (`DEPOSITO;AC-0001;500000;90`), X:110 (`TRANSFER;AC-0001;AC-0002;0;44`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"TRANSFER;AC-0001;AC-0002;100001;9"}'
```

**Respuesta del original** (v2): status 422

```
{"error":"E506","mensaje":"límite excedido"}
```

**Respuesta de la réplica:** status 422 — coincide

```
{"error":"E506","mensaje":"límite excedido"}
```

**Conclusión:** Igual a X:27 (v1).

**Etiqueta de evidencia:** Repetición en v2

#### X:112 — POST /msg TRANSFER;AC-0001;AC-0002;100000;12

Repite X:28 (v1).

**Pregunta (hipótesis):** Replay v2 de X:28: misma solicitud y mismo estado que en v1; ¿cambió la respuesta?

**Preparación:** Posición 10 de 12 en `s-amt-01-v2`. Solicitudes previas tras el reset: X:103 (`ALTA;Ana;50`), X:104 (`ALTA;Beto;11`), X:105 (`DEPOSITO;AC-0001;0;31`), X:106 (`DEPOSITO;AC-0001;-5;16`), X:107 (`DEPOSITO;AC-0001;12.5;7`), X:108 (`DEPOSITO;AC-0001;abc;13`), X:109 (`DEPOSITO;AC-0001;500000;90`), X:110 (`TRANSFER;AC-0001;AC-0002;0;44`), X:111 (`TRANSFER;AC-0001;AC-0002;100001;9`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"TRANSFER;AC-0001;AC-0002;100000;12"}'
```

**Respuesta del original** (v2): status 422

```
{"error":"E506","mensaje":"límite excedido"}
```

**Respuesta de la réplica:** status 422 — coincide

```
{"error":"E506","mensaje":"límite excedido"}
```

**Conclusión:** CAMBIO 2 (v2): TRANSFER de 100000 ahora da 422 E506; en v1 se aceptaba (X:10/X:28).  CAMBIO respecto de X:28 (v1): v1 200 {"status": "recieved", "operacionId": "OP-0002"} -> v2 422 {"error": "E506", "mensaje": "límite excedido"}.

**Etiqueta de evidencia:** Cambio de versión probado

#### X:113 — POST /msg TRANSFER;AC-0001;AC-0002;30000;16

Repite X:29 (v1).

**Pregunta (hipótesis):** Replay v2 de X:29: misma solicitud y mismo estado que en v1; ¿cambió la respuesta?

**Preparación:** Posición 11 de 12 en `s-amt-01-v2`. Solicitudes previas tras el reset: X:103 (`ALTA;Ana;50`), X:104 (`ALTA;Beto;11`), X:105 (`DEPOSITO;AC-0001;0;31`), X:106 (`DEPOSITO;AC-0001;-5;16`), X:107 (`DEPOSITO;AC-0001;12.5;7`), X:108 (`DEPOSITO;AC-0001;abc;13`), X:109 (`DEPOSITO;AC-0001;500000;90`), X:110 (`TRANSFER;AC-0001;AC-0002;0;44`), X:111 (`TRANSFER;AC-0001;AC-0002;100001;9`), X:112 (`TRANSFER;AC-0001;AC-0002;100000;12`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"TRANSFER;AC-0001;AC-0002;30000;16"}'
```

**Respuesta del original** (v2): status 200

```
{"status":"recieved","operacionId":"OP-0002"}
```

**Respuesta de la réplica:** status 200 — coincide

```
{"status":"recieved","operacionId":"OP-0002"}
```

**Conclusión:** Consecuencia del CAMBIO 2 (no es un cambio propio): la transferencia previa rechazada en v2 no creó operación ni movió saldo. Por eso el id es OP-0002 en vez de OP-0003. CAMBIO respecto de X:29 (v1): v1 200 {"status": "recieved", "operacionId": "OP-0003"} -> v2 200 {"status": "recieved", "operacionId": "OP-0002"}.

**Etiqueta de evidencia:** Consecuencia de un cambio

#### X:114 — POST /msg TRANSFER;AC-0002;AC-0001;150000;2

Repite X:30 (v1).

**Pregunta (hipótesis):** Replay v2 de X:30: misma solicitud y mismo estado que en v1; ¿cambió la respuesta?

**Preparación:** Posición 12 de 12 en `s-amt-01-v2`. Solicitudes previas tras el reset: X:103 (`ALTA;Ana;50`), X:104 (`ALTA;Beto;11`), X:105 (`DEPOSITO;AC-0001;0;31`), X:106 (`DEPOSITO;AC-0001;-5;16`), X:107 (`DEPOSITO;AC-0001;12.5;7`), X:108 (`DEPOSITO;AC-0001;abc;13`), X:109 (`DEPOSITO;AC-0001;500000;90`), X:110 (`TRANSFER;AC-0001;AC-0002;0;44`), X:111 (`TRANSFER;AC-0001;AC-0002;100001;9`), X:112 (`TRANSFER;AC-0001;AC-0002;100000;12`), X:113 (`TRANSFER;AC-0001;AC-0002;30000;16`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"TRANSFER;AC-0002;AC-0001;150000;2"}'
```

**Respuesta del original** (v2): status 422

```
{"error":"E506","mensaje":"límite excedido"}
```

**Respuesta de la réplica:** status 422 — coincide

```
{"error":"E506","mensaje":"límite excedido"}
```

**Conclusión:** Igual a X:30 (v1).

**Etiqueta de evidencia:** Repetición en v2

### s-ej-01-v2 — v2, X:115–X:134

#### X:115 — POST /msg PING;64

Repite X:31 (v1).

**Pregunta (hipótesis):** Replay v2 de X:31: misma solicitud y mismo estado que en v1; ¿cambió la respuesta?

**Preparación:** Posición 1 de 20 en `s-ej-01-v2`. Estado vacío tras `POST /__reset`.

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"PING;64"}'
```

**Respuesta del original** (v2): status 200

```
{"pong":true}
```

**Respuesta de la réplica:** status 200 — coincide

```
{"pong":true}
```

**Conclusión:** Igual a X:31 (v1).

**Etiqueta de evidencia:** Repetición en v2

#### X:116 — POST /msg ALTA;Lucia;83

Repite X:32 (v1).

**Pregunta (hipótesis):** Replay v2 de X:32: misma solicitud y mismo estado que en v1; ¿cambió la respuesta?

**Preparación:** Posición 2 de 20 en `s-ej-01-v2`. Solicitudes previas tras el reset: X:115 (`PING;64`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"ALTA;Lucia;83"}'
```

**Respuesta del original** (v2): status 400

```
{"error":"E202","mensaje":"control inválido"}
```

**Respuesta de la réplica:** status 400 — coincide

```
{"error":"E202","mensaje":"control inválido"}
```

**Conclusión:** Igual a X:32 (v1).

**Etiqueta de evidencia:** Repetición en v2

#### X:117 — POST /msg ALTA;Lucia;82

Repite X:33 (v1).

**Pregunta (hipótesis):** Replay v2 de X:33: misma solicitud y mismo estado que en v1; ¿cambió la respuesta?

**Preparación:** Posición 3 de 20 en `s-ej-01-v2`. Solicitudes previas tras el reset: X:115 (`PING;64`), X:116 (`ALTA;Lucia;83`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"ALTA;Lucia;82"}'
```

**Respuesta del original** (v2): status 201

```
{"cuentaId":"AC-0001"}
```

**Respuesta de la réplica:** status 201 — coincide

```
{"cuentaId":"AC-0001"}
```

**Conclusión:** Igual a X:33 (v1).

**Etiqueta de evidencia:** Repetición en v2

#### X:118 — POST /msg ALTA;Mateo;3

Repite X:34 (v1).

**Pregunta (hipótesis):** Replay v2 de X:34: misma solicitud y mismo estado que en v1; ¿cambió la respuesta?

**Preparación:** Posición 4 de 20 en `s-ej-01-v2`. Solicitudes previas tras el reset: X:115 (`PING;64`), X:116 (`ALTA;Lucia;83`), X:117 (`ALTA;Lucia;82`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"ALTA;Mateo;3"}'
```

**Respuesta del original** (v2): status 201

```
{"cuentaId":"AC-0002"}
```

**Respuesta de la réplica:** status 201 — coincide

```
{"cuentaId":"AC-0002"}
```

**Conclusión:** Igual a X:34 (v1).

**Etiqueta de evidencia:** Repetición en v2

#### X:119 — POST /msg CONSULTA;AC-0001;14

Repite X:35 (v1).

**Pregunta (hipótesis):** Replay v2 de X:35: misma solicitud y mismo estado que en v1; ¿cambió la respuesta?

**Preparación:** Posición 5 de 20 en `s-ej-01-v2`. Solicitudes previas tras el reset: X:115 (`PING;64`), X:116 (`ALTA;Lucia;83`), X:117 (`ALTA;Lucia;82`), X:118 (`ALTA;Mateo;3`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"CONSULTA;AC-0001;14"}'
```

**Respuesta del original** (v2): status 200

```
{"cuenta_id":"AC-0001","saldo":"0.00"}
```

**Respuesta de la réplica:** status 200 — coincide

```
{"cuenta_id":"AC-0001","saldo":"0.00"}
```

**Conclusión:** CAMBIO 1 (v2): CONSULTA devuelve saldo como string con 2 decimales y el valor dividido por 100 (v1: número entero).  CAMBIO respecto de X:35 (v1): v1 200 {"cuenta_id": "AC-0001", "saldo": 0} -> v2 200 {"cuenta_id": "AC-0001", "saldo": "0.00"}.

**Etiqueta de evidencia:** Cambio de versión probado

#### X:120 — POST /msg DEPOSITO;AC-0001;250000;86

Repite X:36 (v1).

**Pregunta (hipótesis):** Replay v2 de X:36: misma solicitud y mismo estado que en v1; ¿cambió la respuesta?

**Preparación:** Posición 6 de 20 en `s-ej-01-v2`. Solicitudes previas tras el reset: X:115 (`PING;64`), X:116 (`ALTA;Lucia;83`), X:117 (`ALTA;Lucia;82`), X:118 (`ALTA;Mateo;3`), X:119 (`CONSULTA;AC-0001;14`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"DEPOSITO;AC-0001;250000;86"}'
```

**Respuesta del original** (v2): status 200

```
{"status":"recieved","operacionId":"OP-0001"}
```

**Respuesta de la réplica:** status 200 — coincide

```
{"status":"recieved","operacionId":"OP-0001"}
```

**Conclusión:** Igual a X:36 (v1).

**Etiqueta de evidencia:** Repetición en v2

#### X:121 — POST /msg TRANSFER;AC-0001;AC-0002;40000;86

Repite X:37 (v1).

**Pregunta (hipótesis):** Replay v2 de X:37: misma solicitud y mismo estado que en v1; ¿cambió la respuesta?

**Preparación:** Posición 7 de 20 en `s-ej-01-v2`. Solicitudes previas tras el reset: X:115 (`PING;64`), X:116 (`ALTA;Lucia;83`), X:117 (`ALTA;Lucia;82`), X:118 (`ALTA;Mateo;3`), X:119 (`CONSULTA;AC-0001;14`), X:120 (`DEPOSITO;AC-0001;250000;86`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"TRANSFER;AC-0001;AC-0002;40000;86"}'
```

**Respuesta del original** (v2): status 200

```
{"status":"recieved","operacionId":"OP-0002"}
```

**Respuesta de la réplica:** status 200 — coincide

```
{"status":"recieved","operacionId":"OP-0002"}
```

**Conclusión:** Igual a X:37 (v1).

**Etiqueta de evidencia:** Repetición en v2

#### X:122 — POST /msg CONSULTA;AC-0002;11

Repite X:38 (v1).

**Pregunta (hipótesis):** Replay v2 de X:38: misma solicitud y mismo estado que en v1; ¿cambió la respuesta?

**Preparación:** Posición 8 de 20 en `s-ej-01-v2`. Solicitudes previas tras el reset: X:115 (`PING;64`), X:116 (`ALTA;Lucia;83`), X:117 (`ALTA;Lucia;82`), X:118 (`ALTA;Mateo;3`), X:119 (`CONSULTA;AC-0001;14`), X:120 (`DEPOSITO;AC-0001;250000;86`), X:121 (`TRANSFER;AC-0001;AC-0002;40000;86`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"CONSULTA;AC-0002;11"}'
```

**Respuesta del original** (v2): status 200

```
{"cuenta_id":"AC-0002","saldo":"400.00"}
```

**Respuesta de la réplica:** status 200 — coincide

```
{"cuenta_id":"AC-0002","saldo":"400.00"}
```

**Conclusión:** CAMBIO 1 (v2): CONSULTA devuelve saldo como string con 2 decimales y el valor dividido por 100 (v1: número entero).  CAMBIO respecto de X:38 (v1): v1 200 {"cuenta_id": "AC-0002", "saldo": 40000} -> v2 200 {"cuenta_id": "AC-0002", "saldo": "400.00"}.

**Etiqueta de evidencia:** Cambio de versión probado

#### X:123 — POST /msg TRANSFER;AC-0001;AC-0002;120000;55

Repite X:39 (v1).

**Pregunta (hipótesis):** Replay v2 de X:39: misma solicitud y mismo estado que en v1; ¿cambió la respuesta?

**Preparación:** Posición 9 de 20 en `s-ej-01-v2`. Solicitudes previas tras el reset: X:115 (`PING;64`), X:116 (`ALTA;Lucia;83`), X:117 (`ALTA;Lucia;82`), X:118 (`ALTA;Mateo;3`), X:119 (`CONSULTA;AC-0001;14`), X:120 (`DEPOSITO;AC-0001;250000;86`), X:121 (`TRANSFER;AC-0001;AC-0002;40000;86`), X:122 (`CONSULTA;AC-0002;11`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"TRANSFER;AC-0001;AC-0002;120000;55"}'
```

**Respuesta del original** (v2): status 422

```
{"error":"E506","mensaje":"límite excedido"}
```

**Respuesta de la réplica:** status 422 — coincide

```
{"error":"E506","mensaje":"límite excedido"}
```

**Conclusión:** Igual a X:39 (v1).

**Etiqueta de evidencia:** Repetición en v2

#### X:124 — POST /msg TRANSFER;AC-0001;AC-0002;100000;12

Repite X:40 (v1).

**Pregunta (hipótesis):** Replay v2 de X:40: misma solicitud y mismo estado que en v1; ¿cambió la respuesta?

**Preparación:** Posición 10 de 20 en `s-ej-01-v2`. Solicitudes previas tras el reset: X:115 (`PING;64`), X:116 (`ALTA;Lucia;83`), X:117 (`ALTA;Lucia;82`), X:118 (`ALTA;Mateo;3`), X:119 (`CONSULTA;AC-0001;14`), X:120 (`DEPOSITO;AC-0001;250000;86`), X:121 (`TRANSFER;AC-0001;AC-0002;40000;86`), X:122 (`CONSULTA;AC-0002;11`), X:123 (`TRANSFER;AC-0001;AC-0002;120000;55`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"TRANSFER;AC-0001;AC-0002;100000;12"}'
```

**Respuesta del original** (v2): status 422

```
{"error":"E506","mensaje":"límite excedido"}
```

**Respuesta de la réplica:** status 422 — coincide

```
{"error":"E506","mensaje":"límite excedido"}
```

**Conclusión:** CAMBIO 2 (v2): TRANSFER de 100000 ahora da 422 E506; en v1 se aceptaba (X:10/X:28).  CAMBIO respecto de X:40 (v1): v1 200 {"status": "recieved", "operacionId": "OP-0003"} -> v2 422 {"error": "E506", "mensaje": "límite excedido"}.

**Etiqueta de evidencia:** Cambio de versión probado

#### X:125 — POST /msg CONSULTa;AC-0001;14

Repite X:41 (v1).

**Pregunta (hipótesis):** Replay v2 de X:41: misma solicitud y mismo estado que en v1; ¿cambió la respuesta?

**Preparación:** Posición 11 de 20 en `s-ej-01-v2`. Solicitudes previas tras el reset: X:115 (`PING;64`), X:116 (`ALTA;Lucia;83`), X:117 (`ALTA;Lucia;82`), X:118 (`ALTA;Mateo;3`), X:119 (`CONSULTA;AC-0001;14`), X:120 (`DEPOSITO;AC-0001;250000;86`), X:121 (`TRANSFER;AC-0001;AC-0002;40000;86`), X:122 (`CONSULTA;AC-0002;11`), X:123 (`TRANSFER;AC-0001;AC-0002;120000;55`), X:124 (`TRANSFER;AC-0001;AC-0002;100000;12`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"CONSULTa;AC-0001;14"}'
```

**Respuesta del original** (v2): status 200

```
{"cuenta_id":"AC-0001","saldo":"2100.00"}
```

**Respuesta de la réplica:** status 200 — coincide

```
{"cuenta_id":"AC-0001","saldo":"2100.00"}
```

**Conclusión:** CAMBIO 1 (v2): CONSULTA devuelve saldo como string con 2 decimales y el valor dividido por 100 (v1: número entero). Consecuencia del CAMBIO 2 (no es un cambio propio): la transferencia previa rechazada en v2 no creó operación ni movió saldo. Saldo 210000 -> '2100.00'. CAMBIO respecto de X:41 (v1): v1 200 {"cuenta_id": "AC-0001", "saldo": 110000} -> v2 200 {"cuenta_id": "AC-0001", "saldo": "2100.00"}.

**Etiqueta de evidencia:** Cambio de versión probado

#### X:126 — POST /msg SALDOS;AC-0001;38

Repite X:42 (v1).

**Pregunta (hipótesis):** Replay v2 de X:42: misma solicitud y mismo estado que en v1; ¿cambió la respuesta?

**Preparación:** Posición 12 de 20 en `s-ej-01-v2`. Solicitudes previas tras el reset: X:115 (`PING;64`), X:116 (`ALTA;Lucia;83`), X:117 (`ALTA;Lucia;82`), X:118 (`ALTA;Mateo;3`), X:119 (`CONSULTA;AC-0001;14`), X:120 (`DEPOSITO;AC-0001;250000;86`), X:121 (`TRANSFER;AC-0001;AC-0002;40000;86`), X:122 (`CONSULTA;AC-0002;11`), X:123 (`TRANSFER;AC-0001;AC-0002;120000;55`), X:124 (`TRANSFER;AC-0001;AC-0002;100000;12`), X:125 (`CONSULTa;AC-0001;14`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"SALDOS;AC-0001;38"}'
```

**Respuesta del original** (v2): status 400

```
{"error":"E301","mensaje":"comando desconocido "}
```

**Respuesta de la réplica:** status 400 — coincide

```
{"error":"E301","mensaje":"comando desconocido "}
```

**Conclusión:** Igual a X:42 (v1).

**Etiqueta de evidencia:** Repetición en v2

#### X:127 — POST /msg ANULA;OP-0003;66

Repite X:43 (v1).

**Pregunta (hipótesis):** Replay v2 de X:43: misma solicitud y mismo estado que en v1; ¿cambió la respuesta?

**Preparación:** Posición 13 de 20 en `s-ej-01-v2`. Solicitudes previas tras el reset: X:115 (`PING;64`), X:116 (`ALTA;Lucia;83`), X:117 (`ALTA;Lucia;82`), X:118 (`ALTA;Mateo;3`), X:119 (`CONSULTA;AC-0001;14`), X:120 (`DEPOSITO;AC-0001;250000;86`), X:121 (`TRANSFER;AC-0001;AC-0002;40000;86`), X:122 (`CONSULTA;AC-0002;11`), X:123 (`TRANSFER;AC-0001;AC-0002;120000;55`), X:124 (`TRANSFER;AC-0001;AC-0002;100000;12`), X:125 (`CONSULTa;AC-0001;14`), X:126 (`SALDOS;AC-0001;38`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"ANULA;OP-0003;66"}'
```

**Respuesta del original** (v2): status 404

```
{"error":"E402","mensaje":"operación inexistente"}
```

**Respuesta de la réplica:** status 404 — coincide

```
{"error":"E402","mensaje":"operación inexistente"}
```

**Conclusión:** Consecuencia del CAMBIO 2 (no es un cambio propio): la transferencia previa rechazada en v2 no creó operación ni movió saldo. OP-0003 no existe en v2 -> E402. CAMBIO respecto de X:43 (v1): v1 200 {"ok": true, "anulada": "OP-0003"} -> v2 404 {"error": "E402", "mensaje": "operación inexistente"}.

**Etiqueta de evidencia:** Consecuencia de un cambio

#### X:128 — POST /msg ANULA;OP-0003;66

Repite X:44 (v1).

**Pregunta (hipótesis):** Replay v2 de X:44: misma solicitud y mismo estado que en v1; ¿cambió la respuesta?

**Preparación:** Posición 14 de 20 en `s-ej-01-v2`. Solicitudes previas tras el reset: X:115 (`PING;64`), X:116 (`ALTA;Lucia;83`), X:117 (`ALTA;Lucia;82`), X:118 (`ALTA;Mateo;3`), X:119 (`CONSULTA;AC-0001;14`), X:120 (`DEPOSITO;AC-0001;250000;86`), X:121 (`TRANSFER;AC-0001;AC-0002;40000;86`), X:122 (`CONSULTA;AC-0002;11`), X:123 (`TRANSFER;AC-0001;AC-0002;120000;55`), X:124 (`TRANSFER;AC-0001;AC-0002;100000;12`), X:125 (`CONSULTa;AC-0001;14`), X:126 (`SALDOS;AC-0001;38`), X:127 (`ANULA;OP-0003;66`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"ANULA;OP-0003;66"}'
```

**Respuesta del original** (v2): status 404

```
{"error":"E402","mensaje":"operación inexistente"}
```

**Respuesta de la réplica:** status 404 — coincide

```
{"error":"E402","mensaje":"operación inexistente"}
```

**Conclusión:** Consecuencia del CAMBIO 2 (no es un cambio propio): la transferencia previa rechazada en v2 no creó operación ni movió saldo. OP-0003 no existe en v2 -> E402. CAMBIO respecto de X:44 (v1): v1 200 {"ok": false, "motivo": "ya anulada"} -> v2 404 {"error": "E402", "mensaje": "operación inexistente"}.

**Etiqueta de evidencia:** Consecuencia de un cambio

#### X:129 — POST /msg CONSULTA;AC-0009;87

Repite X:45 (v1).

**Pregunta (hipótesis):** Replay v2 de X:45: misma solicitud y mismo estado que en v1; ¿cambió la respuesta?

**Preparación:** Posición 15 de 20 en `s-ej-01-v2`. Solicitudes previas tras el reset: X:115 (`PING;64`), X:116 (`ALTA;Lucia;83`), X:117 (`ALTA;Lucia;82`), X:118 (`ALTA;Mateo;3`), X:119 (`CONSULTA;AC-0001;14`), X:120 (`DEPOSITO;AC-0001;250000;86`), X:121 (`TRANSFER;AC-0001;AC-0002;40000;86`), X:122 (`CONSULTA;AC-0002;11`), X:123 (`TRANSFER;AC-0001;AC-0002;120000;55`), X:124 (`TRANSFER;AC-0001;AC-0002;100000;12`), X:125 (`CONSULTa;AC-0001;14`), X:126 (`SALDOS;AC-0001;38`), X:127 (`ANULA;OP-0003;66`), X:128 (`ANULA;OP-0003;66`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"CONSULTA;AC-0009;87"}'
```

**Respuesta del original** (v2): status 404

```
{"error":"E401","mensaje":"cuenta inexistente"}
```

**Respuesta de la réplica:** status 404 — coincide

```
{"error":"E401","mensaje":"cuenta inexistente"}
```

**Conclusión:** Igual a X:45 (v1).

**Etiqueta de evidencia:** Repetición en v2

#### X:130 — POST /msg TRANSFER;AC-0002;AC-0001;50000;23

Repite X:46 (v1).

**Pregunta (hipótesis):** Replay v2 de X:46: misma solicitud y mismo estado que en v1; ¿cambió la respuesta?

**Preparación:** Posición 16 de 20 en `s-ej-01-v2`. Solicitudes previas tras el reset: X:115 (`PING;64`), X:116 (`ALTA;Lucia;83`), X:117 (`ALTA;Lucia;82`), X:118 (`ALTA;Mateo;3`), X:119 (`CONSULTA;AC-0001;14`), X:120 (`DEPOSITO;AC-0001;250000;86`), X:121 (`TRANSFER;AC-0001;AC-0002;40000;86`), X:122 (`CONSULTA;AC-0002;11`), X:123 (`TRANSFER;AC-0001;AC-0002;120000;55`), X:124 (`TRANSFER;AC-0001;AC-0002;100000;12`), X:125 (`CONSULTa;AC-0001;14`), X:126 (`SALDOS;AC-0001;38`), X:127 (`ANULA;OP-0003;66`), X:128 (`ANULA;OP-0003;66`), X:129 (`CONSULTA;AC-0009;87`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"TRANSFER;AC-0002;AC-0001;50000;23"}'
```

**Respuesta del original** (v2): status 422

```
{"error":"E507","mensaje":"saldo insuficiente"}
```

**Respuesta de la réplica:** status 422 — coincide

```
{"error":"E507","mensaje":"saldo insuficiente"}
```

**Conclusión:** Igual a X:46 (v1).

**Etiqueta de evidencia:** Repetición en v2

#### X:131 — POST /msg DEPOSITO;AC-0002;700;5X

Repite X:47 (v1).

**Pregunta (hipótesis):** Replay v2 de X:47: misma solicitud y mismo estado que en v1; ¿cambió la respuesta?

**Preparación:** Posición 17 de 20 en `s-ej-01-v2`. Solicitudes previas tras el reset: X:115 (`PING;64`), X:116 (`ALTA;Lucia;83`), X:117 (`ALTA;Lucia;82`), X:118 (`ALTA;Mateo;3`), X:119 (`CONSULTA;AC-0001;14`), X:120 (`DEPOSITO;AC-0001;250000;86`), X:121 (`TRANSFER;AC-0001;AC-0002;40000;86`), X:122 (`CONSULTA;AC-0002;11`), X:123 (`TRANSFER;AC-0001;AC-0002;120000;55`), X:124 (`TRANSFER;AC-0001;AC-0002;100000;12`), X:125 (`CONSULTa;AC-0001;14`), X:126 (`SALDOS;AC-0001;38`), X:127 (`ANULA;OP-0003;66`), X:128 (`ANULA;OP-0003;66`), X:129 (`CONSULTA;AC-0009;87`), X:130 (`TRANSFER;AC-0002;AC-0001;50000;23`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"DEPOSITO;AC-0002;700;5X"}'
```

**Respuesta del original** (v2): status 400

```
{"error":"E201","mensaje":"control mal formado"}
```

**Respuesta de la réplica:** status 400 — coincide

```
{"error":"E201","mensaje":"control mal formado"}
```

**Conclusión:** Igual a X:47 (v1).

**Etiqueta de evidencia:** Repetición en v2

#### X:132 — POST /msg DEPOSITO;AC-0002;700;35

Repite X:48 (v1).

**Pregunta (hipótesis):** Replay v2 de X:48: misma solicitud y mismo estado que en v1; ¿cambió la respuesta?

**Preparación:** Posición 18 de 20 en `s-ej-01-v2`. Solicitudes previas tras el reset: X:115 (`PING;64`), X:116 (`ALTA;Lucia;83`), X:117 (`ALTA;Lucia;82`), X:118 (`ALTA;Mateo;3`), X:119 (`CONSULTA;AC-0001;14`), X:120 (`DEPOSITO;AC-0001;250000;86`), X:121 (`TRANSFER;AC-0001;AC-0002;40000;86`), X:122 (`CONSULTA;AC-0002;11`), X:123 (`TRANSFER;AC-0001;AC-0002;120000;55`), X:124 (`TRANSFER;AC-0001;AC-0002;100000;12`), X:125 (`CONSULTa;AC-0001;14`), X:126 (`SALDOS;AC-0001;38`), X:127 (`ANULA;OP-0003;66`), X:128 (`ANULA;OP-0003;66`), X:129 (`CONSULTA;AC-0009;87`), X:130 (`TRANSFER;AC-0002;AC-0001;50000;23`), X:131 (`DEPOSITO;AC-0002;700;5X`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"DEPOSITO;AC-0002;700;35"}'
```

**Respuesta del original** (v2): status 200

```
{"status":"recieved","operacionId":"OP-0003"}
```

**Respuesta de la réplica:** status 200 — coincide

```
{"status":"recieved","operacionId":"OP-0003"}
```

**Conclusión:** Consecuencia del CAMBIO 2 (no es un cambio propio): la transferencia previa rechazada en v2 no creó operación ni movió saldo. El depósito recibe OP-0003 en vez de OP-0004. CAMBIO respecto de X:48 (v1): v1 200 {"status": "recieved", "operacionId": "OP-0004"} -> v2 200 {"status": "recieved", "operacionId": "OP-0003"}.

**Etiqueta de evidencia:** Consecuencia de un cambio

#### X:133 — POST /msg CONSULTA;AC-0002;11

Repite X:49 (v1).

**Pregunta (hipótesis):** Replay v2 de X:49: misma solicitud y mismo estado que en v1; ¿cambió la respuesta?

**Preparación:** Posición 19 de 20 en `s-ej-01-v2`. Solicitudes previas tras el reset: X:115 (`PING;64`), X:116 (`ALTA;Lucia;83`), X:117 (`ALTA;Lucia;82`), X:118 (`ALTA;Mateo;3`), X:119 (`CONSULTA;AC-0001;14`), X:120 (`DEPOSITO;AC-0001;250000;86`), X:121 (`TRANSFER;AC-0001;AC-0002;40000;86`), X:122 (`CONSULTA;AC-0002;11`), X:123 (`TRANSFER;AC-0001;AC-0002;120000;55`), X:124 (`TRANSFER;AC-0001;AC-0002;100000;12`), X:125 (`CONSULTa;AC-0001;14`), X:126 (`SALDOS;AC-0001;38`), X:127 (`ANULA;OP-0003;66`), X:128 (`ANULA;OP-0003;66`), X:129 (`CONSULTA;AC-0009;87`), X:130 (`TRANSFER;AC-0002;AC-0001;50000;23`), X:131 (`DEPOSITO;AC-0002;700;5X`), X:132 (`DEPOSITO;AC-0002;700;35`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"CONSULTA;AC-0002;11"}'
```

**Respuesta del original** (v2): status 200

```
{"cuenta_id":"AC-0002","saldo":"407.00"}
```

**Respuesta de la réplica:** status 200 — coincide

```
{"cuenta_id":"AC-0002","saldo":"407.00"}
```

**Conclusión:** CAMBIO 1 (v2): CONSULTA devuelve saldo como string con 2 decimales y el valor dividido por 100 (v1: número entero). Consecuencia del CAMBIO 2 (no es un cambio propio): la transferencia previa rechazada en v2 no creó operación ni movió saldo. Saldo 40700 -> '407.00'. CAMBIO respecto de X:49 (v1): v1 200 {"cuenta_id": "AC-0002", "saldo": 40700} -> v2 200 {"cuenta_id": "AC-0002", "saldo": "407.00"}.

**Etiqueta de evidencia:** Cambio de versión probado

#### X:134 — POST /msg ALTA;Lucia;Gomez;11

Repite X:50 (v1).

**Pregunta (hipótesis):** Replay v2 de X:50: misma solicitud y mismo estado que en v1; ¿cambió la respuesta?

**Preparación:** Posición 20 de 20 en `s-ej-01-v2`. Solicitudes previas tras el reset: X:115 (`PING;64`), X:116 (`ALTA;Lucia;83`), X:117 (`ALTA;Lucia;82`), X:118 (`ALTA;Mateo;3`), X:119 (`CONSULTA;AC-0001;14`), X:120 (`DEPOSITO;AC-0001;250000;86`), X:121 (`TRANSFER;AC-0001;AC-0002;40000;86`), X:122 (`CONSULTA;AC-0002;11`), X:123 (`TRANSFER;AC-0001;AC-0002;120000;55`), X:124 (`TRANSFER;AC-0001;AC-0002;100000;12`), X:125 (`CONSULTa;AC-0001;14`), X:126 (`SALDOS;AC-0001;38`), X:127 (`ANULA;OP-0003;66`), X:128 (`ANULA;OP-0003;66`), X:129 (`CONSULTA;AC-0009;87`), X:130 (`TRANSFER;AC-0002;AC-0001;50000;23`), X:131 (`DEPOSITO;AC-0002;700;5X`), X:132 (`DEPOSITO;AC-0002;700;35`), X:133 (`CONSULTA;AC-0002;11`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"ALTA;Lucia;Gomez;11"}'
```

**Respuesta del original** (v2): status 400

```
{"error":"E302","mensaje":"aridad inválida"}
```

**Respuesta de la réplica:** status 400 — coincide

```
{"error":"E302","mensaje":"aridad inválida"}
```

**Conclusión:** Igual a X:50 (v1).

**Etiqueta de evidencia:** Repetición en v2

### s-ord-02-v2 — v2, X:135–X:144

#### X:135 — POST /msg SALDOS;AC-0001;5X

Repite X:51 (v1).

**Pregunta (hipótesis):** Replay v2 de X:51: misma solicitud y mismo estado que en v1; ¿cambió la respuesta?

**Preparación:** Posición 1 de 10 en `s-ord-02-v2`. Estado vacío tras `POST /__reset`.

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"SALDOS;AC-0001;5X"}'
```

**Respuesta del original** (v2): status 400

```
{"error":"E201","mensaje":"control mal formado"}
```

**Respuesta de la réplica:** status 400 — coincide

```
{"error":"E201","mensaje":"control mal formado"}
```

**Conclusión:** Igual a X:51 (v1).

**Etiqueta de evidencia:** Repetición en v2

#### X:136 — POST /msg SALDOS;AC-0001;39

Repite X:52 (v1).

**Pregunta (hipótesis):** Replay v2 de X:52: misma solicitud y mismo estado que en v1; ¿cambió la respuesta?

**Preparación:** Posición 2 de 10 en `s-ord-02-v2`. Solicitudes previas tras el reset: X:135 (`SALDOS;AC-0001;5X`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"SALDOS;AC-0001;39"}'
```

**Respuesta del original** (v2): status 400

```
{"error":"E202","mensaje":"control inválido"}
```

**Respuesta de la réplica:** status 400 — coincide

```
{"error":"E202","mensaje":"control inválido"}
```

**Conclusión:** Igual a X:52 (v1).

**Etiqueta de evidencia:** Repetición en v2

#### X:137 — POST /msg ALTA;Lucia;Gomez;5X

Repite X:53 (v1).

**Pregunta (hipótesis):** Replay v2 de X:53: misma solicitud y mismo estado que en v1; ¿cambió la respuesta?

**Preparación:** Posición 3 de 10 en `s-ord-02-v2`. Solicitudes previas tras el reset: X:135 (`SALDOS;AC-0001;5X`), X:136 (`SALDOS;AC-0001;39`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"ALTA;Lucia;Gomez;5X"}'
```

**Respuesta del original** (v2): status 400

```
{"error":"E201","mensaje":"control mal formado"}
```

**Respuesta de la réplica:** status 400 — coincide

```
{"error":"E201","mensaje":"control mal formado"}
```

**Conclusión:** Igual a X:53 (v1).

**Etiqueta de evidencia:** Repetición en v2

#### X:138 — POST /msg ALTA;Lucia;Gomez;12

Repite X:54 (v1).

**Pregunta (hipótesis):** Replay v2 de X:54: misma solicitud y mismo estado que en v1; ¿cambió la respuesta?

**Preparación:** Posición 4 de 10 en `s-ord-02-v2`. Solicitudes previas tras el reset: X:135 (`SALDOS;AC-0001;5X`), X:136 (`SALDOS;AC-0001;39`), X:137 (`ALTA;Lucia;Gomez;5X`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"ALTA;Lucia;Gomez;12"}'
```

**Respuesta del original** (v2): status 400

```
{"error":"E202","mensaje":"control inválido"}
```

**Respuesta de la réplica:** status 400 — coincide

```
{"error":"E202","mensaje":"control inválido"}
```

**Conclusión:** Igual a X:54 (v1).

**Etiqueta de evidencia:** Repetición en v2

#### X:139 — POST /msg CONSULTA;AC-0001;AC-0002;5X

Repite X:55 (v1).

**Pregunta (hipótesis):** Replay v2 de X:55: misma solicitud y mismo estado que en v1; ¿cambió la respuesta?

**Preparación:** Posición 5 de 10 en `s-ord-02-v2`. Solicitudes previas tras el reset: X:135 (`SALDOS;AC-0001;5X`), X:136 (`SALDOS;AC-0001;39`), X:137 (`ALTA;Lucia;Gomez;5X`), X:138 (`ALTA;Lucia;Gomez;12`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"CONSULTA;AC-0001;AC-0002;5X"}'
```

**Respuesta del original** (v2): status 400

```
{"error":"E201","mensaje":"control mal formado"}
```

**Respuesta de la réplica:** status 400 — coincide

```
{"error":"E201","mensaje":"control mal formado"}
```

**Conclusión:** Igual a X:55 (v1).

**Etiqueta de evidencia:** Repetición en v2

#### X:140 — POST /msg CONSULTA;AC-0001;AC-0002;93

Repite X:56 (v1).

**Pregunta (hipótesis):** Replay v2 de X:56: misma solicitud y mismo estado que en v1; ¿cambió la respuesta?

**Preparación:** Posición 6 de 10 en `s-ord-02-v2`. Solicitudes previas tras el reset: X:135 (`SALDOS;AC-0001;5X`), X:136 (`SALDOS;AC-0001;39`), X:137 (`ALTA;Lucia;Gomez;5X`), X:138 (`ALTA;Lucia;Gomez;12`), X:139 (`CONSULTA;AC-0001;AC-0002;5X`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"CONSULTA;AC-0001;AC-0002;93"}'
```

**Respuesta del original** (v2): status 400

```
{"error":"E202","mensaje":"control inválido"}
```

**Respuesta de la réplica:** status 400 — coincide

```
{"error":"E202","mensaje":"control inválido"}
```

**Conclusión:** Igual a X:56 (v1).

**Etiqueta de evidencia:** Repetición en v2

#### X:141 — POST /msg ping;64

Repite X:57 (v1).

**Pregunta (hipótesis):** Replay v2 de X:57: misma solicitud y mismo estado que en v1; ¿cambió la respuesta?

**Preparación:** Posición 7 de 10 en `s-ord-02-v2`. Solicitudes previas tras el reset: X:135 (`SALDOS;AC-0001;5X`), X:136 (`SALDOS;AC-0001;39`), X:137 (`ALTA;Lucia;Gomez;5X`), X:138 (`ALTA;Lucia;Gomez;12`), X:139 (`CONSULTA;AC-0001;AC-0002;5X`), X:140 (`CONSULTA;AC-0001;AC-0002;93`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"ping;64"}'
```

**Respuesta del original** (v2): status 200

```
{"pong":true}
```

**Respuesta de la réplica:** status 200 — coincide

```
{"pong":true}
```

**Conclusión:** Igual a X:57 (v1).

**Etiqueta de evidencia:** Repetición en v2

#### X:142 — POST /msg PING;064

Repite X:58 (v1).

**Pregunta (hipótesis):** Replay v2 de X:58: misma solicitud y mismo estado que en v1; ¿cambió la respuesta?

**Preparación:** Posición 8 de 10 en `s-ord-02-v2`. Solicitudes previas tras el reset: X:135 (`SALDOS;AC-0001;5X`), X:136 (`SALDOS;AC-0001;39`), X:137 (`ALTA;Lucia;Gomez;5X`), X:138 (`ALTA;Lucia;Gomez;12`), X:139 (`CONSULTA;AC-0001;AC-0002;5X`), X:140 (`CONSULTA;AC-0001;AC-0002;93`), X:141 (`ping;64`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"PING;064"}'
```

**Respuesta del original** (v2): status 200

```
{"pong":true}
```

**Respuesta de la réplica:** status 200 — coincide

```
{"pong":true}
```

**Conclusión:** Igual a X:58 (v1).

**Etiqueta de evidencia:** Repetición en v2

#### X:143 — POST /msg []

Repite X:59 (v1).

**Pregunta (hipótesis):** Replay v2 de X:59: misma solicitud y mismo estado que en v1; ¿cambió la respuesta?

**Preparación:** Posición 9 de 10 en `s-ord-02-v2`. Solicitudes previas tras el reset: X:135 (`SALDOS;AC-0001;5X`), X:136 (`SALDOS;AC-0001;39`), X:137 (`ALTA;Lucia;Gomez;5X`), X:138 (`ALTA;Lucia;Gomez;12`), X:139 (`CONSULTA;AC-0001;AC-0002;5X`), X:140 (`CONSULTA;AC-0001;AC-0002;93`), X:141 (`ping;64`), X:142 (`PING;064`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '[]'
```

**Respuesta del original** (v2): status 400

```
{"error":"E102","mensaje":"falta m"}
```

**Respuesta de la réplica:** status 400 — coincide

```
{"error":"E102","mensaje":"falta m"}
```

**Conclusión:** Igual a X:59 (v1).

**Etiqueta de evidencia:** Repetición en v2

#### X:144 — POST /msg PING

Repite X:60 (v1).

**Pregunta (hipótesis):** Replay v2 de X:60: misma solicitud y mismo estado que en v1; ¿cambió la respuesta?

**Preparación:** Posición 10 de 10 en `s-ord-02-v2`. Solicitudes previas tras el reset: X:135 (`SALDOS;AC-0001;5X`), X:136 (`SALDOS;AC-0001;39`), X:137 (`ALTA;Lucia;Gomez;5X`), X:138 (`ALTA;Lucia;Gomez;12`), X:139 (`CONSULTA;AC-0001;AC-0002;5X`), X:140 (`CONSULTA;AC-0001;AC-0002;93`), X:141 (`ping;64`), X:142 (`PING;064`), X:143 (`[]`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"PING"}'
```

**Respuesta del original** (v2): status 400

```
{"error":"E103","mensaje":"falta control"}
```

**Respuesta de la réplica:** status 400 — coincide

```
{"error":"E103","mensaje":"falta control"}
```

**Conclusión:** Igual a X:60 (v1).

**Etiqueta de evidencia:** Repetición en v2

### s-anu-01-v2 — v2, X:145–X:157

#### X:145 — POST /msg ALTA;Ana;50

Repite X:61 (v1).

**Pregunta (hipótesis):** Replay v2 de X:61: misma solicitud y mismo estado que en v1; ¿cambió la respuesta?

**Preparación:** Posición 1 de 13 en `s-anu-01-v2`. Estado vacío tras `POST /__reset`.

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"ALTA;Ana;50"}'
```

**Respuesta del original** (v2): status 201

```
{"cuentaId":"AC-0001"}
```

**Respuesta de la réplica:** status 201 — coincide

```
{"cuentaId":"AC-0001"}
```

**Conclusión:** Igual a X:61 (v1).

**Etiqueta de evidencia:** Repetición en v2

#### X:146 — POST /msg ALTA;Beto;11

Repite X:62 (v1).

**Pregunta (hipótesis):** Replay v2 de X:62: misma solicitud y mismo estado que en v1; ¿cambió la respuesta?

**Preparación:** Posición 2 de 13 en `s-anu-01-v2`. Solicitudes previas tras el reset: X:145 (`ALTA;Ana;50`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"ALTA;Beto;11"}'
```

**Respuesta del original** (v2): status 201

```
{"cuentaId":"AC-0002"}
```

**Respuesta de la réplica:** status 201 — coincide

```
{"cuentaId":"AC-0002"}
```

**Conclusión:** Igual a X:62 (v1).

**Etiqueta de evidencia:** Repetición en v2

#### X:147 — POST /msg DEPOSITO;AC-0001;1000;35

Repite X:63 (v1).

**Pregunta (hipótesis):** Replay v2 de X:63: misma solicitud y mismo estado que en v1; ¿cambió la respuesta?

**Preparación:** Posición 3 de 13 en `s-anu-01-v2`. Solicitudes previas tras el reset: X:145 (`ALTA;Ana;50`), X:146 (`ALTA;Beto;11`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"DEPOSITO;AC-0001;1000;35"}'
```

**Respuesta del original** (v2): status 200

```
{"status":"recieved","operacionId":"OP-0001"}
```

**Respuesta de la réplica:** status 200 — coincide

```
{"status":"recieved","operacionId":"OP-0001"}
```

**Conclusión:** Igual a X:63 (v1).

**Etiqueta de evidencia:** Repetición en v2

#### X:148 — POST /msg TRANSFER;AC-0001;AC-0002;300;6

Repite X:64 (v1).

**Pregunta (hipótesis):** Replay v2 de X:64: misma solicitud y mismo estado que en v1; ¿cambió la respuesta?

**Preparación:** Posición 4 de 13 en `s-anu-01-v2`. Solicitudes previas tras el reset: X:145 (`ALTA;Ana;50`), X:146 (`ALTA;Beto;11`), X:147 (`DEPOSITO;AC-0001;1000;35`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"TRANSFER;AC-0001;AC-0002;300;6"}'
```

**Respuesta del original** (v2): status 200

```
{"status":"recieved","operacionId":"OP-0002"}
```

**Respuesta de la réplica:** status 200 — coincide

```
{"status":"recieved","operacionId":"OP-0002"}
```

**Conclusión:** Igual a X:64 (v1).

**Etiqueta de evidencia:** Repetición en v2

#### X:149 — POST /msg ANULA;OP-0002;69

Repite X:65 (v1).

**Pregunta (hipótesis):** Replay v2 de X:65: misma solicitud y mismo estado que en v1; ¿cambió la respuesta?

**Preparación:** Posición 5 de 13 en `s-anu-01-v2`. Solicitudes previas tras el reset: X:145 (`ALTA;Ana;50`), X:146 (`ALTA;Beto;11`), X:147 (`DEPOSITO;AC-0001;1000;35`), X:148 (`TRANSFER;AC-0001;AC-0002;300;6`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"ANULA;OP-0002;69"}'
```

**Respuesta del original** (v2): status 200

```
{"ok":true,"anulada":"OP-0002"}
```

**Respuesta de la réplica:** status 200 — coincide

```
{"ok":true,"anulada":"OP-0002"}
```

**Conclusión:** Igual a X:65 (v1).

**Etiqueta de evidencia:** Repetición en v2

#### X:150 — POST /msg CONSULTA;AC-0001;14

Repite X:66 (v1).

**Pregunta (hipótesis):** Replay v2 de X:66: misma solicitud y mismo estado que en v1; ¿cambió la respuesta?

**Preparación:** Posición 6 de 13 en `s-anu-01-v2`. Solicitudes previas tras el reset: X:145 (`ALTA;Ana;50`), X:146 (`ALTA;Beto;11`), X:147 (`DEPOSITO;AC-0001;1000;35`), X:148 (`TRANSFER;AC-0001;AC-0002;300;6`), X:149 (`ANULA;OP-0002;69`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"CONSULTA;AC-0001;14"}'
```

**Respuesta del original** (v2): status 200

```
{"cuenta_id":"AC-0001","saldo":"10.00"}
```

**Respuesta de la réplica:** status 200 — coincide

```
{"cuenta_id":"AC-0001","saldo":"10.00"}
```

**Conclusión:** CAMBIO 1 (v2): CONSULTA devuelve saldo como string con 2 decimales y el valor dividido por 100 (v1: número entero).  CAMBIO respecto de X:66 (v1): v1 200 {"cuenta_id": "AC-0001", "saldo": 1000} -> v2 200 {"cuenta_id": "AC-0001", "saldo": "10.00"}.

**Etiqueta de evidencia:** Cambio de versión probado

#### X:151 — POST /msg CONSULTA;AC-0002;11

Repite X:67 (v1).

**Pregunta (hipótesis):** Replay v2 de X:67: misma solicitud y mismo estado que en v1; ¿cambió la respuesta?

**Preparación:** Posición 7 de 13 en `s-anu-01-v2`. Solicitudes previas tras el reset: X:145 (`ALTA;Ana;50`), X:146 (`ALTA;Beto;11`), X:147 (`DEPOSITO;AC-0001;1000;35`), X:148 (`TRANSFER;AC-0001;AC-0002;300;6`), X:149 (`ANULA;OP-0002;69`), X:150 (`CONSULTA;AC-0001;14`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"CONSULTA;AC-0002;11"}'
```

**Respuesta del original** (v2): status 200

```
{"cuenta_id":"AC-0002","saldo":"0.00"}
```

**Respuesta de la réplica:** status 200 — coincide

```
{"cuenta_id":"AC-0002","saldo":"0.00"}
```

**Conclusión:** CAMBIO 1 (v2): CONSULTA devuelve saldo como string con 2 decimales y el valor dividido por 100 (v1: número entero).  CAMBIO respecto de X:67 (v1): v1 200 {"cuenta_id": "AC-0002", "saldo": 0} -> v2 200 {"cuenta_id": "AC-0002", "saldo": "0.00"}.

**Etiqueta de evidencia:** Cambio de versión probado

#### X:152 — POST /msg ANULA;OP-0001;72

Repite X:68 (v1).

**Pregunta (hipótesis):** Replay v2 de X:68: misma solicitud y mismo estado que en v1; ¿cambió la respuesta?

**Preparación:** Posición 8 de 13 en `s-anu-01-v2`. Solicitudes previas tras el reset: X:145 (`ALTA;Ana;50`), X:146 (`ALTA;Beto;11`), X:147 (`DEPOSITO;AC-0001;1000;35`), X:148 (`TRANSFER;AC-0001;AC-0002;300;6`), X:149 (`ANULA;OP-0002;69`), X:150 (`CONSULTA;AC-0001;14`), X:151 (`CONSULTA;AC-0002;11`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"ANULA;OP-0001;72"}'
```

**Respuesta del original** (v2): status 200

```
{"ok":true,"anulada":"OP-0001"}
```

**Respuesta de la réplica:** status 200 — coincide

```
{"ok":true,"anulada":"OP-0001"}
```

**Conclusión:** Igual a X:68 (v1).

**Etiqueta de evidencia:** Repetición en v2

#### X:153 — POST /msg CONSULTA;AC-0001;14

Repite X:69 (v1).

**Pregunta (hipótesis):** Replay v2 de X:69: misma solicitud y mismo estado que en v1; ¿cambió la respuesta?

**Preparación:** Posición 9 de 13 en `s-anu-01-v2`. Solicitudes previas tras el reset: X:145 (`ALTA;Ana;50`), X:146 (`ALTA;Beto;11`), X:147 (`DEPOSITO;AC-0001;1000;35`), X:148 (`TRANSFER;AC-0001;AC-0002;300;6`), X:149 (`ANULA;OP-0002;69`), X:150 (`CONSULTA;AC-0001;14`), X:151 (`CONSULTA;AC-0002;11`), X:152 (`ANULA;OP-0001;72`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"CONSULTA;AC-0001;14"}'
```

**Respuesta del original** (v2): status 200

```
{"cuenta_id":"AC-0001","saldo":"0.00"}
```

**Respuesta de la réplica:** status 200 — coincide

```
{"cuenta_id":"AC-0001","saldo":"0.00"}
```

**Conclusión:** CAMBIO 1 (v2): CONSULTA devuelve saldo como string con 2 decimales y el valor dividido por 100 (v1: número entero).  CAMBIO respecto de X:69 (v1): v1 200 {"cuenta_id": "AC-0001", "saldo": 0} -> v2 200 {"cuenta_id": "AC-0001", "saldo": "0.00"}.

**Etiqueta de evidencia:** Cambio de versión probado

#### X:154 — POST /msg DEPOSITO;AC-0002;500;53

Repite X:70 (v1).

**Pregunta (hipótesis):** Replay v2 de X:70: misma solicitud y mismo estado que en v1; ¿cambió la respuesta?

**Preparación:** Posición 10 de 13 en `s-anu-01-v2`. Solicitudes previas tras el reset: X:145 (`ALTA;Ana;50`), X:146 (`ALTA;Beto;11`), X:147 (`DEPOSITO;AC-0001;1000;35`), X:148 (`TRANSFER;AC-0001;AC-0002;300;6`), X:149 (`ANULA;OP-0002;69`), X:150 (`CONSULTA;AC-0001;14`), X:151 (`CONSULTA;AC-0002;11`), X:152 (`ANULA;OP-0001;72`), X:153 (`CONSULTA;AC-0001;14`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"DEPOSITO;AC-0002;500;53"}'
```

**Respuesta del original** (v2): status 200

```
{"status":"recieved","operacionId":"OP-0003"}
```

**Respuesta de la réplica:** status 200 — coincide

```
{"status":"recieved","operacionId":"OP-0003"}
```

**Conclusión:** Igual a X:70 (v1).

**Etiqueta de evidencia:** Repetición en v2

#### X:155 — POST /msg TRANSFER;AC-0002;AC-0001;500;73

Repite X:71 (v1).

**Pregunta (hipótesis):** Replay v2 de X:71: misma solicitud y mismo estado que en v1; ¿cambió la respuesta?

**Preparación:** Posición 11 de 13 en `s-anu-01-v2`. Solicitudes previas tras el reset: X:145 (`ALTA;Ana;50`), X:146 (`ALTA;Beto;11`), X:147 (`DEPOSITO;AC-0001;1000;35`), X:148 (`TRANSFER;AC-0001;AC-0002;300;6`), X:149 (`ANULA;OP-0002;69`), X:150 (`CONSULTA;AC-0001;14`), X:151 (`CONSULTA;AC-0002;11`), X:152 (`ANULA;OP-0001;72`), X:153 (`CONSULTA;AC-0001;14`), X:154 (`DEPOSITO;AC-0002;500;53`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"TRANSFER;AC-0002;AC-0001;500;73"}'
```

**Respuesta del original** (v2): status 200

```
{"status":"recieved","operacionId":"OP-0004"}
```

**Respuesta de la réplica:** status 200 — coincide

```
{"status":"recieved","operacionId":"OP-0004"}
```

**Conclusión:** Igual a X:71 (v1).

**Etiqueta de evidencia:** Repetición en v2

#### X:156 — POST /msg ANULA;OP-0003;66

Repite X:72 (v1).

**Pregunta (hipótesis):** Replay v2 de X:72: misma solicitud y mismo estado que en v1; ¿cambió la respuesta?

**Preparación:** Posición 12 de 13 en `s-anu-01-v2`. Solicitudes previas tras el reset: X:145 (`ALTA;Ana;50`), X:146 (`ALTA;Beto;11`), X:147 (`DEPOSITO;AC-0001;1000;35`), X:148 (`TRANSFER;AC-0001;AC-0002;300;6`), X:149 (`ANULA;OP-0002;69`), X:150 (`CONSULTA;AC-0001;14`), X:151 (`CONSULTA;AC-0002;11`), X:152 (`ANULA;OP-0001;72`), X:153 (`CONSULTA;AC-0001;14`), X:154 (`DEPOSITO;AC-0002;500;53`), X:155 (`TRANSFER;AC-0002;AC-0001;500;73`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"ANULA;OP-0003;66"}'
```

**Respuesta del original** (v2): status 200

```
{"ok":true,"anulada":"OP-0003"}
```

**Respuesta de la réplica:** status 200 — coincide

```
{"ok":true,"anulada":"OP-0003"}
```

**Conclusión:** Igual a X:72 (v1).

**Etiqueta de evidencia:** Repetición en v2

#### X:157 — POST /msg CONSULTA;AC-0002;11

Repite X:73 (v1).

**Pregunta (hipótesis):** Replay v2 de X:73: misma solicitud y mismo estado que en v1; ¿cambió la respuesta?

**Preparación:** Posición 13 de 13 en `s-anu-01-v2`. Solicitudes previas tras el reset: X:145 (`ALTA;Ana;50`), X:146 (`ALTA;Beto;11`), X:147 (`DEPOSITO;AC-0001;1000;35`), X:148 (`TRANSFER;AC-0001;AC-0002;300;6`), X:149 (`ANULA;OP-0002;69`), X:150 (`CONSULTA;AC-0001;14`), X:151 (`CONSULTA;AC-0002;11`), X:152 (`ANULA;OP-0001;72`), X:153 (`CONSULTA;AC-0001;14`), X:154 (`DEPOSITO;AC-0002;500;53`), X:155 (`TRANSFER;AC-0002;AC-0001;500;73`), X:156 (`ANULA;OP-0003;66`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"CONSULTA;AC-0002;11"}'
```

**Respuesta del original** (v2): status 200

```
{"cuenta_id":"AC-0002","saldo":"-5.00"}
```

**Respuesta de la réplica:** status 200 — coincide

```
{"cuenta_id":"AC-0002","saldo":"-5.00"}
```

**Conclusión:** CAMBIO 1 (v2): CONSULTA devuelve saldo como string con 2 decimales y el valor dividido por 100 (v1: número entero).  CAMBIO respecto de X:73 (v1): v1 200 {"cuenta_id": "AC-0002", "saldo": -500} -> v2 200 {"cuenta_id": "AC-0002", "saldo": "-5.00"}.

**Etiqueta de evidencia:** Cambio de versión probado

### s-tr-01-v2 — v2, X:158–X:168

#### X:158 — POST /msg ALTA;Ana;50

Repite X:74 (v1).

**Pregunta (hipótesis):** Replay v2 de X:74: misma solicitud y mismo estado que en v1; ¿cambió la respuesta?

**Preparación:** Posición 1 de 11 en `s-tr-01-v2`. Estado vacío tras `POST /__reset`.

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"ALTA;Ana;50"}'
```

**Respuesta del original** (v2): status 201

```
{"cuentaId":"AC-0001"}
```

**Respuesta de la réplica:** status 201 — coincide

```
{"cuentaId":"AC-0001"}
```

**Conclusión:** Igual a X:74 (v1).

**Etiqueta de evidencia:** Repetición en v2

#### X:159 — POST /msg TRANSFER;AC-0001;AC-0099;100;24

Repite X:75 (v1).

**Pregunta (hipótesis):** Replay v2 de X:75: misma solicitud y mismo estado que en v1; ¿cambió la respuesta?

**Preparación:** Posición 2 de 11 en `s-tr-01-v2`. Solicitudes previas tras el reset: X:158 (`ALTA;Ana;50`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"TRANSFER;AC-0001;AC-0099;100;24"}'
```

**Respuesta del original** (v2): status 404

```
{"error":"E401","mensaje":"cuenta inexistente"}
```

**Respuesta de la réplica:** status 404 — coincide

```
{"error":"E401","mensaje":"cuenta inexistente"}
```

**Conclusión:** Igual a X:75 (v1).

**Etiqueta de evidencia:** Repetición en v2

#### X:160 — POST /msg TRANSFER;AC-0099;AC-0001;100;12

Repite X:76 (v1).

**Pregunta (hipótesis):** Replay v2 de X:76: misma solicitud y mismo estado que en v1; ¿cambió la respuesta?

**Preparación:** Posición 3 de 11 en `s-tr-01-v2`. Solicitudes previas tras el reset: X:158 (`ALTA;Ana;50`), X:159 (`TRANSFER;AC-0001;AC-0099;100;24`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"TRANSFER;AC-0099;AC-0001;100;12"}'
```

**Respuesta del original** (v2): status 404

```
{"error":"E401","mensaje":"cuenta inexistente"}
```

**Respuesta de la réplica:** status 404 — coincide

```
{"error":"E401","mensaje":"cuenta inexistente"}
```

**Conclusión:** Igual a X:76 (v1).

**Etiqueta de evidencia:** Repetición en v2

#### X:161 — POST /msg TRANSFER;AC-0099;AC-0001;0;40

Repite X:77 (v1).

**Pregunta (hipótesis):** Replay v2 de X:77: misma solicitud y mismo estado que en v1; ¿cambió la respuesta?

**Preparación:** Posición 4 de 11 en `s-tr-01-v2`. Solicitudes previas tras el reset: X:158 (`ALTA;Ana;50`), X:159 (`TRANSFER;AC-0001;AC-0099;100;24`), X:160 (`TRANSFER;AC-0099;AC-0001;100;12`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"TRANSFER;AC-0099;AC-0001;0;40"}'
```

**Respuesta del original** (v2): status 400

```
{"error":"E303","mensaje":"monto inválido"}
```

**Respuesta de la réplica:** status 400 — coincide

```
{"error":"E303","mensaje":"monto inválido"}
```

**Conclusión:** Igual a X:77 (v1).

**Etiqueta de evidencia:** Repetición en v2

#### X:162 — POST /msg TRANSFER;AC-0001;AC-0099;200000;33

Repite X:78 (v1).

**Pregunta (hipótesis):** Replay v2 de X:78: misma solicitud y mismo estado que en v1; ¿cambió la respuesta?

**Preparación:** Posición 5 de 11 en `s-tr-01-v2`. Solicitudes previas tras el reset: X:158 (`ALTA;Ana;50`), X:159 (`TRANSFER;AC-0001;AC-0099;100;24`), X:160 (`TRANSFER;AC-0099;AC-0001;100;12`), X:161 (`TRANSFER;AC-0099;AC-0001;0;40`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"TRANSFER;AC-0001;AC-0099;200000;33"}'
```

**Respuesta del original** (v2): status 404

```
{"error":"E401","mensaje":"cuenta inexistente"}
```

**Respuesta de la réplica:** status 404 — coincide

```
{"error":"E401","mensaje":"cuenta inexistente"}
```

**Conclusión:** Igual a X:78 (v1).

**Etiqueta de evidencia:** Repetición en v2

#### X:163 — POST /msg DEPOSITO;AC-0001;500;46

Repite X:79 (v1).

**Pregunta (hipótesis):** Replay v2 de X:79: misma solicitud y mismo estado que en v1; ¿cambió la respuesta?

**Preparación:** Posición 6 de 11 en `s-tr-01-v2`. Solicitudes previas tras el reset: X:158 (`ALTA;Ana;50`), X:159 (`TRANSFER;AC-0001;AC-0099;100;24`), X:160 (`TRANSFER;AC-0099;AC-0001;100;12`), X:161 (`TRANSFER;AC-0099;AC-0001;0;40`), X:162 (`TRANSFER;AC-0001;AC-0099;200000;33`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"DEPOSITO;AC-0001;500;46"}'
```

**Respuesta del original** (v2): status 200

```
{"status":"recieved","operacionId":"OP-0001"}
```

**Respuesta de la réplica:** status 200 — coincide

```
{"status":"recieved","operacionId":"OP-0001"}
```

**Conclusión:** Igual a X:79 (v1).

**Etiqueta de evidencia:** Repetición en v2

#### X:164 — POST /msg TRANSFER;AC-0001;AC-0001;100;17

Repite X:80 (v1).

**Pregunta (hipótesis):** Replay v2 de X:80: misma solicitud y mismo estado que en v1; ¿cambió la respuesta?

**Preparación:** Posición 7 de 11 en `s-tr-01-v2`. Solicitudes previas tras el reset: X:158 (`ALTA;Ana;50`), X:159 (`TRANSFER;AC-0001;AC-0099;100;24`), X:160 (`TRANSFER;AC-0099;AC-0001;100;12`), X:161 (`TRANSFER;AC-0099;AC-0001;0;40`), X:162 (`TRANSFER;AC-0001;AC-0099;200000;33`), X:163 (`DEPOSITO;AC-0001;500;46`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"TRANSFER;AC-0001;AC-0001;100;17"}'
```

**Respuesta del original** (v2): status 400

```
{"error":"E304","mensaje":"origen y destino iguales"}
```

**Respuesta de la réplica:** status 400 — coincide

```
{"error":"E304","mensaje":"origen y destino iguales"}
```

**Conclusión:** Igual a X:80 (v1).

**Etiqueta de evidencia:** Repetición en v2

#### X:165 — POST /msg CONSULTA;AC-0001;14

Repite X:81 (v1).

**Pregunta (hipótesis):** Replay v2 de X:81: misma solicitud y mismo estado que en v1; ¿cambió la respuesta?

**Preparación:** Posición 8 de 11 en `s-tr-01-v2`. Solicitudes previas tras el reset: X:158 (`ALTA;Ana;50`), X:159 (`TRANSFER;AC-0001;AC-0099;100;24`), X:160 (`TRANSFER;AC-0099;AC-0001;100;12`), X:161 (`TRANSFER;AC-0099;AC-0001;0;40`), X:162 (`TRANSFER;AC-0001;AC-0099;200000;33`), X:163 (`DEPOSITO;AC-0001;500;46`), X:164 (`TRANSFER;AC-0001;AC-0001;100;17`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"CONSULTA;AC-0001;14"}'
```

**Respuesta del original** (v2): status 200

```
{"cuenta_id":"AC-0001","saldo":"5.00"}
```

**Respuesta de la réplica:** status 200 — coincide

```
{"cuenta_id":"AC-0001","saldo":"5.00"}
```

**Conclusión:** CAMBIO 1 (v2): CONSULTA devuelve saldo como string con 2 decimales y el valor dividido por 100 (v1: número entero).  CAMBIO respecto de X:81 (v1): v1 200 {"cuenta_id": "AC-0001", "saldo": 500} -> v2 200 {"cuenta_id": "AC-0001", "saldo": "5.00"}.

**Etiqueta de evidencia:** Cambio de versión probado

#### X:166 — POST /msg CONSULTA;ac-0001;14

Repite X:82 (v1).

**Pregunta (hipótesis):** Replay v2 de X:82: misma solicitud y mismo estado que en v1; ¿cambió la respuesta?

**Preparación:** Posición 9 de 11 en `s-tr-01-v2`. Solicitudes previas tras el reset: X:158 (`ALTA;Ana;50`), X:159 (`TRANSFER;AC-0001;AC-0099;100;24`), X:160 (`TRANSFER;AC-0099;AC-0001;100;12`), X:161 (`TRANSFER;AC-0099;AC-0001;0;40`), X:162 (`TRANSFER;AC-0001;AC-0099;200000;33`), X:163 (`DEPOSITO;AC-0001;500;46`), X:164 (`TRANSFER;AC-0001;AC-0001;100;17`), X:165 (`CONSULTA;AC-0001;14`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"CONSULTA;ac-0001;14"}'
```

**Respuesta del original** (v2): status 404

```
{"error":"E401","mensaje":"cuenta inexistente"}
```

**Respuesta de la réplica:** status 404 — coincide

```
{"error":"E401","mensaje":"cuenta inexistente"}
```

**Conclusión:** Igual a X:82 (v1).

**Etiqueta de evidencia:** Repetición en v2

#### X:167 — POST /msg ALTA;Ana;50

Repite X:83 (v1).

**Pregunta (hipótesis):** Replay v2 de X:83: misma solicitud y mismo estado que en v1; ¿cambió la respuesta?

**Preparación:** Posición 10 de 11 en `s-tr-01-v2`. Solicitudes previas tras el reset: X:158 (`ALTA;Ana;50`), X:159 (`TRANSFER;AC-0001;AC-0099;100;24`), X:160 (`TRANSFER;AC-0099;AC-0001;100;12`), X:161 (`TRANSFER;AC-0099;AC-0001;0;40`), X:162 (`TRANSFER;AC-0001;AC-0099;200000;33`), X:163 (`DEPOSITO;AC-0001;500;46`), X:164 (`TRANSFER;AC-0001;AC-0001;100;17`), X:165 (`CONSULTA;AC-0001;14`), X:166 (`CONSULTA;ac-0001;14`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"ALTA;Ana;50"}'
```

**Respuesta del original** (v2): status 201

```
{"cuentaId":"AC-0002"}
```

**Respuesta de la réplica:** status 201 — coincide

```
{"cuentaId":"AC-0002"}
```

**Conclusión:** Igual a X:83 (v1).

**Etiqueta de evidencia:** Repetición en v2

#### X:168 — POST /msg DEPOSITO;AC-0001;0500;80

Repite X:84 (v1).

**Pregunta (hipótesis):** Replay v2 de X:84: misma solicitud y mismo estado que en v1; ¿cambió la respuesta?

**Preparación:** Posición 11 de 11 en `s-tr-01-v2`. Solicitudes previas tras el reset: X:158 (`ALTA;Ana;50`), X:159 (`TRANSFER;AC-0001;AC-0099;100;24`), X:160 (`TRANSFER;AC-0099;AC-0001;100;12`), X:161 (`TRANSFER;AC-0099;AC-0001;0;40`), X:162 (`TRANSFER;AC-0001;AC-0099;200000;33`), X:163 (`DEPOSITO;AC-0001;500;46`), X:164 (`TRANSFER;AC-0001;AC-0001;100;17`), X:165 (`CONSULTA;AC-0001;14`), X:166 (`CONSULTA;ac-0001;14`), X:167 (`ALTA;Ana;50`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"DEPOSITO;AC-0001;0500;80"}'
```

**Respuesta del original** (v2): status 400

```
{"error":"E303","mensaje":"monto inválido"}
```

**Respuesta de la réplica:** status 400 — coincide

```
{"error":"E303","mensaje":"monto inválido"}
```

**Conclusión:** Igual a X:84 (v1).

**Etiqueta de evidencia:** Repetición en v2

### s-v2-lim-01 — v2, X:169–X:173

#### X:169 — POST /msg ALTA;Ana;50

**Pregunta (hipótesis):** Preparación: AC-0001

**Preparación:** Posición 1 de 5 en `s-v2-lim-01`. Estado vacío tras `POST /__reset`.

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"ALTA;Ana;50"}'
```

**Respuesta del original** (v2): status 201

```
{"cuentaId":"AC-0001"}
```

**Respuesta de la réplica:** status 201 — coincide

```
{"cuentaId":"AC-0001"}
```

**Conclusión:** Preparación (201 AC-0001).

**Etiqueta de evidencia:** Preparación

#### X:170 — POST /msg ALTA;Beto;11

**Pregunta (hipótesis):** Preparación: AC-0002

**Preparación:** Posición 2 de 5 en `s-v2-lim-01`. Solicitudes previas tras el reset: X:169 (`ALTA;Ana;50`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"ALTA;Beto;11"}'
```

**Respuesta del original** (v2): status 201

```
{"cuentaId":"AC-0002"}
```

**Respuesta de la réplica:** status 201 — coincide

```
{"cuentaId":"AC-0002"}
```

**Conclusión:** Preparación (201 AC-0002).

**Etiqueta de evidencia:** Preparación

#### X:171 — POST /msg DEPOSITO;AC-0001;250000;86

**Pregunta (hipótesis):** Preparación: saldo suficiente en AC-0001

**Preparación:** Posición 3 de 5 en `s-v2-lim-01`. Solicitudes previas tras el reset: X:169 (`ALTA;Ana;50`), X:170 (`ALTA;Beto;11`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"DEPOSITO;AC-0001;250000;86"}'
```

**Respuesta del original** (v2): status 200

```
{"status":"recieved","operacionId":"OP-0001"}
```

**Respuesta de la réplica:** status 200 — coincide

```
{"status":"recieved","operacionId":"OP-0001"}
```

**Conclusión:** Preparación (200 OP-0001).

**Etiqueta de evidencia:** Preparación

#### X:172 — POST /msg TRANSFER;AC-0001;AC-0002;99999;24

**Pregunta (hipótesis):** Límite v2: 100000 da E506 en v2 (X:112); ¿99999 se acepta? Si sí, la regla pasó a monto >= 100000

**Preparación:** Posición 4 de 5 en `s-v2-lim-01`. Solicitudes previas tras el reset: X:169 (`ALTA;Ana;50`), X:170 (`ALTA;Beto;11`), X:171 (`DEPOSITO;AC-0001;250000;86`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"TRANSFER;AC-0001;AC-0002;99999;24"}'
```

**Respuesta del original** (v2): status 422

```
{"error":"E506","mensaje":"límite excedido"}
```

**Respuesta de la réplica:** status 422 — coincide

```
{"error":"E506","mensaje":"límite excedido"}
```

**Conclusión:** CAMBIO 2 (v2): 99999 también da 422 E506; el límite v2 es < 99999. En v1 se aceptaba 100000 (X:28).

**Etiqueta de evidencia:** Cambio de versión probado

#### X:173 — POST /msg CONSULTA;AC-0002;11

**Pregunta (hipótesis):** Saldo de AC-0002 tras el intento (formato v2)

**Preparación:** Posición 5 de 5 en `s-v2-lim-01`. Solicitudes previas tras el reset: X:169 (`ALTA;Ana;50`), X:170 (`ALTA;Beto;11`), X:171 (`DEPOSITO;AC-0001;250000;86`), X:172 (`TRANSFER;AC-0001;AC-0002;99999;24`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"CONSULTA;AC-0002;11"}'
```

**Respuesta del original** (v2): status 200

```
{"cuenta_id":"AC-0002","saldo":"0.00"}
```

**Respuesta de la réplica:** status 200 — coincide

```
{"cuenta_id":"AC-0002","saldo":"0.00"}
```

**Conclusión:** Saldo de AC-0002 "0.00": el TRANSFER rechazado no movió dinero (formato CAMBIO 1).

**Etiqueta de evidencia:** Cambio de versión probado

### s-v2-exp-01 — v2, X:174–X:180

#### X:174 — POST /msg ALTA;Ana;50

**Pregunta (hipótesis):** Preparación: AC-0001

**Preparación:** Posición 1 de 7 en `s-v2-exp-01`. Estado vacío tras `POST /__reset`.

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"ALTA;Ana;50"}'
```

**Respuesta del original** (v2): status 201

```
{"cuentaId":"AC-0001"}
```

**Respuesta de la réplica:** status 201 — coincide

```
{"cuentaId":"AC-0001"}
```

**Conclusión:** Preparación (201 AC-0001).

**Etiqueta de evidencia:** Preparación

#### X:175 — POST /msg DEPOSITO;AC-0001;1;28

**Pregunta (hipótesis):** Escala v2: depósito de 1

**Preparación:** Posición 2 de 7 en `s-v2-exp-01`. Solicitudes previas tras el reset: X:174 (`ALTA;Ana;50`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"DEPOSITO;AC-0001;1;28"}'
```

**Respuesta del original** (v2): status 200

```
{"status":"recieved","operacionId":"OP-0001"}
```

**Respuesta de la réplica:** status 200 — coincide

```
{"status":"recieved","operacionId":"OP-0001"}
```

**Conclusión:** DEPOSITO de 1 aceptado (200 OP-0001).

**Etiqueta de evidencia:** Observación

#### X:176 — POST /msg CONSULTA;AC-0001;14

**Pregunta (hipótesis):** Escala v2: ¿saldo '0.01' (división por 100)?

**Preparación:** Posición 3 de 7 en `s-v2-exp-01`. Solicitudes previas tras el reset: X:174 (`ALTA;Ana;50`), X:175 (`DEPOSITO;AC-0001;1;28`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"CONSULTA;AC-0001;14"}'
```

**Respuesta del original** (v2): status 200

```
{"cuenta_id":"AC-0001","saldo":"0.01"}
```

**Respuesta de la réplica:** status 200 — coincide

```
{"cuenta_id":"AC-0001","saldo":"0.01"}
```

**Conclusión:** CAMBIO 1 (v2): saldo "0.01" tras depositar 1; confirma la escala /100 con 2 decimales fijos.

**Etiqueta de evidencia:** Cambio de versión probado

#### X:177 — POST /msg DEPOSITO;AC-0001;10.50;79

**Pregunta (hipótesis):** Cambio 3 candidato: ¿v2 acepta montos con 2 decimales? (v1 rechazaba 12.5, X:23)

**Preparación:** Posición 4 de 7 en `s-v2-exp-01`. Solicitudes previas tras el reset: X:174 (`ALTA;Ana;50`), X:175 (`DEPOSITO;AC-0001;1;28`), X:176 (`CONSULTA;AC-0001;14`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"DEPOSITO;AC-0001;10.50;79"}'
```

**Respuesta del original** (v2): status 400

```
{"error":"E303","mensaje":"monto inválido"}
```

**Respuesta de la réplica:** status 400 — coincide

```
{"error":"E303","mensaje":"monto inválido"}
```

**Conclusión:** Igual que v1: un monto con decimales da 400 E303 (v1 rechazaba 12.5, X:23). No es el cambio 3.

**Etiqueta de evidencia:** Observación

#### X:178 — POST /msg CONSULTA;AC-0001;14

**Pregunta (hipótesis):** Saldo tras el depósito con decimales

**Preparación:** Posición 5 de 7 en `s-v2-exp-01`. Solicitudes previas tras el reset: X:174 (`ALTA;Ana;50`), X:175 (`DEPOSITO;AC-0001;1;28`), X:176 (`CONSULTA;AC-0001;14`), X:177 (`DEPOSITO;AC-0001;10.50;79`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"CONSULTA;AC-0001;14"}'
```

**Respuesta del original** (v2): status 200

```
{"cuenta_id":"AC-0001","saldo":"0.01"}
```

**Respuesta de la réplica:** status 200 — coincide

```
{"cuenta_id":"AC-0001","saldo":"0.01"}
```

**Conclusión:** El depósito rechazado no alteró el saldo ("0.01").

**Etiqueta de evidencia:** Observación

#### X:179 — POST /msg ALTA;;85

**Pregunta (hipótesis):** Cambio 3 candidato: ALTA con nombre vacío (no registrado en v1)

**Preparación:** Posición 6 de 7 en `s-v2-exp-01`. Solicitudes previas tras el reset: X:174 (`ALTA;Ana;50`), X:175 (`DEPOSITO;AC-0001;1;28`), X:176 (`CONSULTA;AC-0001;14`), X:177 (`DEPOSITO;AC-0001;10.50;79`), X:178 (`CONSULTA;AC-0001;14`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"ALTA;;85"}'
```

**Respuesta del original** (v2): status 400

```
{"error":"E104","mensaje":"segmento vacío"}
```

**Respuesta de la réplica:** status 400 — coincide

```
{"error":"E104","mensaje":"segmento vacío"}
```

**Conclusión:** Comportamiento de v2 (sin línea base en v1): ALTA con nombre vacío da 400 E104 "segmento vacío", un código ausente del catálogo observado en v1. La réplica no valida segmentos vacíos (parse.ts no lo hace). Candidato a cambio 3, sin demostrar.

**Etiqueta de evidencia:** Comportamiento de v2 sin línea base en v1

#### X:180 — POST /msg ALTA;Lucía;14

**Pregunta (hipótesis):** Cambio 3 candidato: ALTA con nombre acentuado; control calculado descartando la í (supuesto iso7064.ts:19)

**Preparación:** Posición 7 de 7 en `s-v2-exp-01`. Solicitudes previas tras el reset: X:174 (`ALTA;Ana;50`), X:175 (`DEPOSITO;AC-0001;1;28`), X:176 (`CONSULTA;AC-0001;14`), X:177 (`DEPOSITO;AC-0001;10.50;79`), X:178 (`CONSULTA;AC-0001;14`), X:179 (`ALTA;;85`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"ALTA;Lucía;14"}'
```

**Respuesta del original** (v2): status 201

```
{"cuentaId":"AC-0002"}
```

**Respuesta de la réplica:** status 201 — coincide

```
{"cuentaId":"AC-0002"}
```

**Conclusión:** ALTA;Lucía da 201: el control calculado descartando la í es aceptado; igual que el supuesto de iso7064.ts. No es un cambio.

**Etiqueta de evidencia:** Observación

### s-v2-lim-02 — v2, X:181–X:186

#### X:181 — POST /msg ALTA;Ana;50

**Pregunta (hipótesis):** Preparación: AC-0001

**Preparación:** Posición 1 de 6 en `s-v2-lim-02`. Estado vacío tras `POST /__reset`.

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"ALTA;Ana;50"}'
```

**Respuesta del original** (v2): status 201

```
{"cuentaId":"AC-0001"}
```

**Respuesta de la réplica:** status 201 — coincide

```
{"cuentaId":"AC-0001"}
```

**Conclusión:** Preparación (201 AC-0001).

**Etiqueta de evidencia:** Preparación

#### X:182 — POST /msg ALTA;Beto;11

**Pregunta (hipótesis):** Preparación: AC-0002

**Preparación:** Posición 2 de 6 en `s-v2-lim-02`. Solicitudes previas tras el reset: X:181 (`ALTA;Ana;50`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"ALTA;Beto;11"}'
```

**Respuesta del original** (v2): status 201

```
{"cuentaId":"AC-0002"}
```

**Respuesta de la réplica:** status 201 — coincide

```
{"cuentaId":"AC-0002"}
```

**Conclusión:** Preparación (201 AC-0002).

**Etiqueta de evidencia:** Preparación

#### X:183 — POST /msg DEPOSITO;AC-0001;250000;86

**Pregunta (hipótesis):** Preparación: saldo suficiente

**Preparación:** Posición 3 de 6 en `s-v2-lim-02`. Solicitudes previas tras el reset: X:181 (`ALTA;Ana;50`), X:182 (`ALTA;Beto;11`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"DEPOSITO;AC-0001;250000;86"}'
```

**Respuesta del original** (v2): status 200

```
{"status":"recieved","operacionId":"OP-0001"}
```

**Respuesta de la réplica:** status 200 — coincide

```
{"status":"recieved","operacionId":"OP-0001"}
```

**Conclusión:** Preparación (200 OP-0001).

**Etiqueta de evidencia:** Preparación

#### X:184 — POST /msg TRANSFER;AC-0001;AC-0002;60000;32

**Pregunta (hipótesis):** Bisección del límite v2: 40000 aceptado (X:121), 99999 rechazado (X:172); ¿60000?

**Preparación:** Posición 4 de 6 en `s-v2-lim-02`. Solicitudes previas tras el reset: X:181 (`ALTA;Ana;50`), X:182 (`ALTA;Beto;11`), X:183 (`DEPOSITO;AC-0001;250000;86`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"TRANSFER;AC-0001;AC-0002;60000;32"}'
```

**Respuesta del original** (v2): status 422

```
{"error":"E506","mensaje":"límite excedido"}
```

**Respuesta de la réplica:** status 422 — coincide

```
{"error":"E506","mensaje":"límite excedido"}
```

**Conclusión:** CAMBIO 2 (v2): 60000 da 422 E506. Con 40000 aceptado (X:121), el límite v2 está en [40000, 60000).

**Etiqueta de evidencia:** Cambio de versión probado

#### X:185 — POST /msg TRANSFER;AC-0001;AC-0002;80000;75

**Pregunta (hipótesis):** Bisección del límite v2: ¿80000?

**Preparación:** Posición 5 de 6 en `s-v2-lim-02`. Solicitudes previas tras el reset: X:181 (`ALTA;Ana;50`), X:182 (`ALTA;Beto;11`), X:183 (`DEPOSITO;AC-0001;250000;86`), X:184 (`TRANSFER;AC-0001;AC-0002;60000;32`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"TRANSFER;AC-0001;AC-0002;80000;75"}'
```

**Respuesta del original** (v2): status 422

```
{"error":"E506","mensaje":"límite excedido"}
```

**Respuesta de la réplica:** status 422 — coincide

```
{"error":"E506","mensaje":"límite excedido"}
```

**Conclusión:** CAMBIO 2 (v2): 80000 da 422 E506, coherente con X:184.

**Etiqueta de evidencia:** Cambio de versión probado

#### X:186 — POST /msg CONSULTA;AC-0002;11

**Pregunta (hipótesis):** Confirma cuánto llegó a AC-0002

**Preparación:** Posición 6 de 6 en `s-v2-lim-02`. Solicitudes previas tras el reset: X:181 (`ALTA;Ana;50`), X:182 (`ALTA;Beto;11`), X:183 (`DEPOSITO;AC-0001;250000;86`), X:184 (`TRANSFER;AC-0001;AC-0002;60000;32`), X:185 (`TRANSFER;AC-0001;AC-0002;80000;75`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"CONSULTA;AC-0002;11"}'
```

**Respuesta del original** (v2): status 200

```
{"cuenta_id":"AC-0002","saldo":"0.00"}
```

**Respuesta de la réplica:** status 200 — coincide

```
{"cuenta_id":"AC-0002","saldo":"0.00"}
```

**Conclusión:** AC-0002 sigue en "0.00": ninguno de los dos TRANSFER movió dinero.

**Etiqueta de evidencia:** Observación

### s-v2-lim-03 — v2, X:187–X:192

#### X:187 — POST /msg ALTA;Ana;50

**Pregunta (hipótesis):** Preparación: AC-0001

**Preparación:** Posición 1 de 6 en `s-v2-lim-03`. Estado vacío tras `POST /__reset`.

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"ALTA;Ana;50"}'
```

**Respuesta del original** (v2): status 201

```
{"cuentaId":"AC-0001"}
```

**Respuesta de la réplica:** status 201 — coincide

```
{"cuentaId":"AC-0001"}
```

**Conclusión:** Preparación (201 AC-0001).

**Etiqueta de evidencia:** Preparación

#### X:188 — POST /msg ALTA;Beto;11

**Pregunta (hipótesis):** Preparación: AC-0002

**Preparación:** Posición 2 de 6 en `s-v2-lim-03`. Solicitudes previas tras el reset: X:187 (`ALTA;Ana;50`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"ALTA;Beto;11"}'
```

**Respuesta del original** (v2): status 201

```
{"cuentaId":"AC-0002"}
```

**Respuesta de la réplica:** status 201 — coincide

```
{"cuentaId":"AC-0002"}
```

**Conclusión:** Preparación (201 AC-0002).

**Etiqueta de evidencia:** Preparación

#### X:189 — POST /msg DEPOSITO;AC-0001;250000;86

**Pregunta (hipótesis):** Preparación: saldo suficiente

**Preparación:** Posición 3 de 6 en `s-v2-lim-03`. Solicitudes previas tras el reset: X:187 (`ALTA;Ana;50`), X:188 (`ALTA;Beto;11`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"DEPOSITO;AC-0001;250000;86"}'
```

**Respuesta del original** (v2): status 200

```
{"status":"recieved","operacionId":"OP-0001"}
```

**Respuesta de la réplica:** status 200 — coincide

```
{"status":"recieved","operacionId":"OP-0001"}
```

**Conclusión:** Preparación (200 OP-0001).

**Etiqueta de evidencia:** Preparación

#### X:190 — POST /msg TRANSFER;AC-0001;AC-0002;50000;59

**Pregunta (hipótesis):** Límite exacto v2: 40000 aceptado (X:121), 60000 rechazado (X:184); ¿50000 se acepta?

**Preparación:** Posición 4 de 6 en `s-v2-lim-03`. Solicitudes previas tras el reset: X:187 (`ALTA;Ana;50`), X:188 (`ALTA;Beto;11`), X:189 (`DEPOSITO;AC-0001;250000;86`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"TRANSFER;AC-0001;AC-0002;50000;59"}'
```

**Respuesta del original** (v2): status 200

```
{"status":"recieved","operacionId":"OP-0002"}
```

**Respuesta de la réplica:** status 200 — coincide

```
{"status":"recieved","operacionId":"OP-0002"}
```

**Conclusión:** CAMBIO 2 (v2): TRANSFER de 50000 se acepta (200 OP-0002).

**Etiqueta de evidencia:** Cambio de versión probado

#### X:191 — POST /msg TRANSFER;AC-0001;AC-0002;50001;56

**Pregunta (hipótesis):** Límite exacto v2: ¿50001 se rechaza? (si 50000 pasa y 50001 no, el límite es 50000 inclusive)

**Preparación:** Posición 5 de 6 en `s-v2-lim-03`. Solicitudes previas tras el reset: X:187 (`ALTA;Ana;50`), X:188 (`ALTA;Beto;11`), X:189 (`DEPOSITO;AC-0001;250000;86`), X:190 (`TRANSFER;AC-0001;AC-0002;50000;59`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"TRANSFER;AC-0001;AC-0002;50001;56"}'
```

**Respuesta del original** (v2): status 422

```
{"error":"E506","mensaje":"límite excedido"}
```

**Respuesta de la réplica:** status 422 — coincide

```
{"error":"E506","mensaje":"límite excedido"}
```

**Conclusión:** CAMBIO 2 (v2): TRANSFER de 50001 da 422 E506. Con X:190, el límite v2 es 50000 inclusive (monto > 50000 se rechaza). En v1 se aceptaba 100000 (X:28).

**Etiqueta de evidencia:** Cambio de versión probado

#### X:192 — POST /msg CONSULTA;AC-0002;11

**Pregunta (hipótesis):** Confirma cuánto llegó a AC-0002

**Preparación:** Posición 6 de 6 en `s-v2-lim-03`. Solicitudes previas tras el reset: X:187 (`ALTA;Ana;50`), X:188 (`ALTA;Beto;11`), X:189 (`DEPOSITO;AC-0001;250000;86`), X:190 (`TRANSFER;AC-0001;AC-0002;50000;59`), X:191 (`TRANSFER;AC-0001;AC-0002;50001;56`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"CONSULTA;AC-0002;11"}'
```

**Respuesta del original** (v2): status 200

```
{"cuenta_id":"AC-0002","saldo":"500.00"}
```

**Respuesta de la réplica:** status 200 — coincide

```
{"cuenta_id":"AC-0002","saldo":"500.00"}
```

**Conclusión:** Saldo de AC-0002 "500.00" = 50000/100: solo pasó el TRANSFER de 50000 (formato CAMBIO 1).

**Etiqueta de evidencia:** Cambio de versión probado

### s-v2-e104-01 — v2, X:193–X:196

#### X:193 — POST /msg ALTA;Ana;50

**Pregunta (hipótesis):** Preparación: AC-0001

**Preparación:** Posición 1 de 4 en `s-v2-e104-01`. Estado vacío tras `POST /__reset`.

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"ALTA;Ana;50"}'
```

**Respuesta del original** (v2): status 201

```
{"cuentaId":"AC-0001"}
```

**Respuesta de la réplica:** status 201 — coincide

```
{"cuentaId":"AC-0001"}
```

**Conclusión:** Preparación (201 AC-0001).

**Etiqueta de evidencia:** Preparación

#### X:194 — POST /msg CONSULTA;;11

**Pregunta (hipótesis):** E104 v2: ¿segmento vacío en CONSULTA da E104 (X:179) o E401?

**Preparación:** Posición 2 de 4 en `s-v2-e104-01`. Solicitudes previas tras el reset: X:193 (`ALTA;Ana;50`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"CONSULTA;;11"}'
```

**Respuesta del original** (v2): status 400

```
{"error":"E104","mensaje":"segmento vacío"}
```

**Respuesta de la réplica:** status 400 — coincide

```
{"error":"E104","mensaje":"segmento vacío"}
```

**Conclusión:** Comportamiento de v2 (sin línea base en v1): CONSULTA con cuenta vacía da 400 E104, no E401.

**Etiqueta de evidencia:** Comportamiento de v2 sin línea base en v1

#### X:195 — POST /msg DEPOSITO;AC-0001;;4

**Pregunta (hipótesis):** E104 v2: ¿monto vacío da E104 o E303?

**Preparación:** Posición 3 de 4 en `s-v2-e104-01`. Solicitudes previas tras el reset: X:193 (`ALTA;Ana;50`), X:194 (`CONSULTA;;11`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"DEPOSITO;AC-0001;;4"}'
```

**Respuesta del original** (v2): status 400

```
{"error":"E104","mensaje":"segmento vacío"}
```

**Respuesta de la réplica:** status 400 — coincide

```
{"error":"E104","mensaje":"segmento vacío"}
```

**Conclusión:** Comportamiento de v2 (sin línea base en v1): DEPOSITO con monto vacío da 400 E104, no E303.

**Etiqueta de evidencia:** Comportamiento de v2 sin línea base en v1

#### X:196 — POST /msg TRANSFER;AC-0001;;100;27

**Pregunta (hipótesis):** E104 v2: ¿destino vacío da E104 o E401?

**Preparación:** Posición 4 de 4 en `s-v2-e104-01`. Solicitudes previas tras el reset: X:193 (`ALTA;Ana;50`), X:194 (`CONSULTA;;11`), X:195 (`DEPOSITO;AC-0001;;4`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"TRANSFER;AC-0001;;100;27"}'
```

**Respuesta del original** (v2): status 400

```
{"error":"E104","mensaje":"segmento vacío"}
```

**Respuesta de la réplica:** status 400 — coincide

```
{"error":"E104","mensaje":"segmento vacío"}
```

**Conclusión:** Comportamiento de v2 (sin línea base en v1): TRANSFER con destino vacío da 400 E104, no E401. E104 aplica a cualquier segmento vacío y se evalúa antes que E303/E401.

**Etiqueta de evidencia:** Comportamiento de v2 sin línea base en v1

### s-v2-seg-01 — v2, X:197–X:205

#### X:197 — POST /msg PING;XX

**Pregunta (hipótesis):** README.md:59-63 muestra PING;XX -> 200 pong; la réplica da E201. ¿Qué responde v2?

**Preparación:** Posición 1 de 9 en `s-v2-seg-01`. Estado vacío tras `POST /__reset`.

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"PING;XX"}'
```

**Respuesta del original** (v2): status 200

```
{"pong":true}
```

**Respuesta de la réplica:** status 200 — coincide

```
{"pong":true}
```

**Conclusión:** Comportamiento de v2: PING;XX da 200 pong, igual que el ejemplo del README (README.md:59-63, documento previo a v2); inferido: no es un cambio. PING no valida el formato del control. La réplica responde E201: discrepancia.

**Etiqueta de evidencia:** Comportamiento de v2 sin línea base en v1

#### X:198 — POST /msg ALTA;;86

**Pregunta (hipótesis):** Orden E104 vs E202: segmento vacío con control incorrecto (válido es 85)

**Preparación:** Posición 2 de 9 en `s-v2-seg-01`. Solicitudes previas tras el reset: X:197 (`PING;XX`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"ALTA;;86"}'
```

**Respuesta del original** (v2): status 400

```
{"error":"E104","mensaje":"segmento vacío"}
```

**Respuesta de la réplica:** status 400 — coincide

```
{"error":"E104","mensaje":"segmento vacío"}
```

**Conclusión:** Comportamiento de v2: ALTA;;86 (control incorrecto, el válido es 85) da E104, no E202: E104 se evalúa antes que la validación del control.

**Etiqueta de evidencia:** Comportamiento de v2 sin línea base en v1

#### X:199 — POST /msg ALTA;Ana;

**Pregunta (hipótesis):** Control vacío: ¿E104, E201 o E103?

**Preparación:** Posición 3 de 9 en `s-v2-seg-01`. Solicitudes previas tras el reset: X:197 (`PING;XX`), X:198 (`ALTA;;86`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"ALTA;Ana;"}'
```

**Respuesta del original** (v2): status 400

```
{"error":"E104","mensaje":"segmento vacío"}
```

**Respuesta de la réplica:** status 400 — coincide

```
{"error":"E104","mensaje":"segmento vacío"}
```

**Conclusión:** Comportamiento de v2: control vacío (ALTA;Ana;) da E104, no E201 ni E103.

**Etiqueta de evidencia:** Comportamiento de v2 sin línea base en v1

#### X:200 — POST /msg PING;;64

**Pregunta (hipótesis):** Orden E104 vs E302: PING con un segmento vacío extra y control válido

**Preparación:** Posición 4 de 9 en `s-v2-seg-01`. Solicitudes previas tras el reset: X:197 (`PING;XX`), X:198 (`ALTA;;86`), X:199 (`ALTA;Ana;`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"PING;;64"}'
```

**Respuesta del original** (v2): status 400

```
{"error":"E104","mensaje":"segmento vacío"}
```

**Respuesta de la réplica:** status 400 — coincide

```
{"error":"E104","mensaje":"segmento vacío"}
```

**Conclusión:** Comportamiento de v2: PING;;64 da E104, no E302: E104 antes que la aridad.

**Etiqueta de evidencia:** Comportamiento de v2 sin línea base en v1

#### X:201 — POST /msg SALDOS;;55

**Pregunta (hipótesis):** Orden E104 vs E301: comando desconocido con segmento vacío y control válido

**Preparación:** Posición 5 de 9 en `s-v2-seg-01`. Solicitudes previas tras el reset: X:197 (`PING;XX`), X:198 (`ALTA;;86`), X:199 (`ALTA;Ana;`), X:200 (`PING;;64`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"SALDOS;;55"}'
```

**Respuesta del original** (v2): status 400

```
{"error":"E104","mensaje":"segmento vacío"}
```

**Respuesta de la réplica:** status 400 — coincide

```
{"error":"E104","mensaje":"segmento vacío"}
```

**Conclusión:** Comportamiento de v2: SALDOS;;55 da E104, no E301: E104 antes que el comando desconocido.

**Etiqueta de evidencia:** Comportamiento de v2 sin línea base en v1

#### X:202 — POST /msg ALTA;;;85

**Pregunta (hipótesis):** Dos segmentos vacíos en ALTA con control válido: ¿E104 o E302?

**Preparación:** Posición 6 de 9 en `s-v2-seg-01`. Solicitudes previas tras el reset: X:197 (`PING;XX`), X:198 (`ALTA;;86`), X:199 (`ALTA;Ana;`), X:200 (`PING;;64`), X:201 (`SALDOS;;55`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"ALTA;;;85"}'
```

**Respuesta del original** (v2): status 400

```
{"error":"E104","mensaje":"segmento vacío"}
```

**Respuesta de la réplica:** status 400 — coincide

```
{"error":"E104","mensaje":"segmento vacío"}
```

**Conclusión:** Comportamiento de v2: dos segmentos vacíos (ALTA;;;85) dan E104.

**Etiqueta de evidencia:** Comportamiento de v2 sin línea base en v1

#### X:203 — POST /msg ALTA; ;85

**Pregunta (hipótesis):** Segmento con un espacio: ¿cuenta como vacío (E104) o crea la cuenta?

**Preparación:** Posición 7 de 9 en `s-v2-seg-01`. Solicitudes previas tras el reset: X:197 (`PING;XX`), X:198 (`ALTA;;86`), X:199 (`ALTA;Ana;`), X:200 (`PING;;64`), X:201 (`SALDOS;;55`), X:202 (`ALTA;;;85`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"ALTA; ;85"}'
```

**Respuesta del original** (v2): status 201

```
{"cuentaId":"AC-0001"}
```

**Respuesta de la réplica:** status 201 — coincide

```
{"cuentaId":"AC-0001"}
```

**Conclusión:** Comportamiento de v2: un segmento con un espacio (ALTA; ;85) no es vacío: 201 AC-0001.

**Etiqueta de evidencia:** Comportamiento de v2 sin línea base en v1

#### X:204 — POST /msg 

**Pregunta (hipótesis):** m vacío: ¿E103, E104 o E201?

**Preparación:** Posición 8 de 9 en `s-v2-seg-01`. Solicitudes previas tras el reset: X:197 (`PING;XX`), X:198 (`ALTA;;86`), X:199 (`ALTA;Ana;`), X:200 (`PING;;64`), X:201 (`SALDOS;;55`), X:202 (`ALTA;;;85`), X:203 (`ALTA; ;85`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":""}'
```

**Respuesta del original** (v2): status 400

```
{"error":"E103","mensaje":"falta control"}
```

**Respuesta de la réplica:** status 400 — coincide

```
{"error":"E103","mensaje":"falta control"}
```

**Conclusión:** Comportamiento de v2: m vacío da 400 E103 'falta control' (sin ';', igual que PING en X:60/X:144). La réplica responde E201: discrepancia.

**Etiqueta de evidencia:** Comportamiento de v2 sin línea base en v1

#### X:205 — POST /msg ;PING;64

**Pregunta (hipótesis):** Comando vacío al inicio con control válido: ¿E104 o E301?

**Preparación:** Posición 9 de 9 en `s-v2-seg-01`. Solicitudes previas tras el reset: X:197 (`PING;XX`), X:198 (`ALTA;;86`), X:199 (`ALTA;Ana;`), X:200 (`PING;;64`), X:201 (`SALDOS;;55`), X:202 (`ALTA;;;85`), X:203 (`ALTA; ;85`), X:204 (``).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":";PING;64"}'
```

**Respuesta del original** (v2): status 400

```
{"error":"E104","mensaje":"segmento vacío"}
```

**Respuesta de la réplica:** status 400 — coincide

```
{"error":"E104","mensaje":"segmento vacío"}
```

**Conclusión:** Comportamiento de v2: comando vacío al inicio (;PING;64) da E104.

**Etiqueta de evidencia:** Comportamiento de v2 sin línea base en v1

### s-v2-anu-01 — v2, X:206–X:209

#### X:206 — POST /msg ALTA;Ana;50

**Pregunta (hipótesis):** Preparación: AC-0001

**Preparación:** Posición 1 de 4 en `s-v2-anu-01`. Estado vacío tras `POST /__reset`.

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"ALTA;Ana;50"}'
```

**Respuesta del original** (v2): status 201

```
{"cuentaId":"AC-0001"}
```

**Respuesta de la réplica:** status 201 — coincide

```
{"cuentaId":"AC-0001"}
```

**Conclusión:** Preparación (201 AC-0001).

**Etiqueta de evidencia:** Preparación

#### X:207 — POST /msg DEPOSITO;AC-0001;100;82

**Pregunta (hipótesis):** Preparación: OP-0001

**Preparación:** Posición 2 de 4 en `s-v2-anu-01`. Solicitudes previas tras el reset: X:206 (`ALTA;Ana;50`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"DEPOSITO;AC-0001;100;82"}'
```

**Respuesta del original** (v2): status 200

```
{"status":"recieved","operacionId":"OP-0001"}
```

**Respuesta de la réplica:** status 200 — coincide

```
{"status":"recieved","operacionId":"OP-0001"}
```

**Conclusión:** Preparación (200 OP-0001).

**Etiqueta de evidencia:** Preparación

#### X:208 — POST /msg ANULA;OP-0001;72

**Pregunta (hipótesis):** ANULA de un DEPOSITO en v2: ¿200 ok:true?

**Preparación:** Posición 3 de 4 en `s-v2-anu-01`. Solicitudes previas tras el reset: X:206 (`ALTA;Ana;50`), X:207 (`DEPOSITO;AC-0001;100;82`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"ANULA;OP-0001;72"}'
```

**Respuesta del original** (v2): status 200

```
{"ok":true,"anulada":"OP-0001"}
```

**Respuesta de la réplica:** status 200 — coincide

```
{"ok":true,"anulada":"OP-0001"}
```

**Conclusión:** ANULA de un DEPOSITO da 200 ok:true en v2, igual que v1 (X:68).

**Etiqueta de evidencia:** Observación

#### X:209 — POST /msg ANULA;OP-0001;72

**Pregunta (hipótesis):** Segunda ANULA: ¿200 ok:false 'ya anulada' como en v1 (X:44, E:14)?

**Preparación:** Posición 4 de 4 en `s-v2-anu-01`. Solicitudes previas tras el reset: X:206 (`ALTA;Ana;50`), X:207 (`DEPOSITO;AC-0001;100;82`), X:208 (`ANULA;OP-0001;72`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"ANULA;OP-0001;72"}'
```

**Respuesta del original** (v2): status 200

```
{"ok":false,"motivo":"ya anulada"}
```

**Respuesta de la réplica:** status 200 — coincide

```
{"ok":false,"motivo":"ya anulada"}
```

**Conclusión:** Segunda ANULA da 200 ok:false 'ya anulada' en v2, igual que v1 (X:44, E:14). No es un cambio.

**Etiqueta de evidencia:** Observación

### s-v2-ord-01 — v2, X:210

#### X:210 — POST /msg TRANSFER;AC-0001;AC-0001;100;17

**Pregunta (hipótesis):** Estado vacío, origen = destino inexistente: ¿E304 o E401?

**Preparación:** Posición 1 de 1 en `s-v2-ord-01`. Estado vacío tras `POST /__reset`.

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"TRANSFER;AC-0001;AC-0001;100;17"}'
```

**Respuesta del original** (v2): status 400

```
{"error":"E304","mensaje":"origen y destino iguales"}
```

**Respuesta de la réplica:** status 400 — coincide

```
{"error":"E304","mensaje":"origen y destino iguales"}
```

**Conclusión:** Comportamiento de v2: con estado vacío, TRANSFER;AC-0001;AC-0001;100 da E304, no E401: E304 se evalúa antes que la existencia de cuentas. La réplica de PR #1 evalúa E401 antes que E304: discrepancia.

**Etiqueta de evidencia:** Comportamiento de v2 sin línea base en v1

### s-v2-ord-02 — v2, X:211

#### X:211 — POST /msg DEPOSITO;AC-0001;abc;13

**Pregunta (hipótesis):** Estado vacío, cuenta inexistente y monto inválido: ¿E401 o E303?

**Preparación:** Posición 1 de 1 en `s-v2-ord-02`. Estado vacío tras `POST /__reset`.

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"DEPOSITO;AC-0001;abc;13"}'
```

**Respuesta del original** (v2): status 400

```
{"error":"E303","mensaje":"monto inválido"}
```

**Respuesta de la réplica:** status 400 — coincide

```
{"error":"E303","mensaje":"monto inválido"}
```

**Conclusión:** Comportamiento de v2: con estado vacío, DEPOSITO;AC-0001;abc da E303, no E401: el monto se valida antes que la cuenta (igual que TRANSFER, X:77). La réplica evalúa E401 primero: discrepancia.

**Etiqueta de evidencia:** Comportamiento de v2 sin línea base en v1

### s-v2-ping-01 — v2, X:212–X:214

#### X:212 — POST /msg PING;63

**Pregunta (hipótesis):** PING con control numérico incorrecto (válido 64): ¿pong (ignora el control) o E202?

**Preparación:** Posición 1 de 3 en `s-v2-ping-01`. Estado vacío tras `POST /__reset`.

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"PING;63"}'
```

**Respuesta del original** (v2): status 200

```
{"pong":true}
```

**Respuesta de la réplica:** status 200 — coincide

```
{"pong":true}
```

**Conclusión:** Comportamiento de v2: PING;63 (control numérico incorrecto, el válido es 64) da 200 pong. Junto con X:197, PING ignora el control por completo, tanto el formato como el valor.

**Etiqueta de evidencia:** Comportamiento de v2 sin línea base en v1

#### X:213 — POST /msg PING;A;XX

**Pregunta (hipótesis):** PING con argumento extra y control no numérico: ¿pong, E302 o E201?

**Preparación:** Posición 2 de 3 en `s-v2-ping-01`. Solicitudes previas tras el reset: X:212 (`PING;63`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"PING;A;XX"}'
```

**Respuesta del original** (v2): status 400

```
{"error":"E302","mensaje":"aridad inválida"}
```

**Respuesta de la réplica:** status 400 — coincide

```
{"error":"E302","mensaje":"aridad inválida"}
```

**Conclusión:** Comportamiento de v2: PING;A;XX da E302. PING sí valida la aridad aunque ignore el control.

**Etiqueta de evidencia:** Comportamiento de v2 sin línea base en v1

#### X:214 — POST /msg CONSULTA;AC-0001;XX

**Pregunta (hipótesis):** Control no numérico fuera de PING: ¿E201 (como E:17) o se ignora?

**Preparación:** Posición 3 de 3 en `s-v2-ping-01`. Solicitudes previas tras el reset: X:212 (`PING;63`), X:213 (`PING;A;XX`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"CONSULTA;AC-0001;XX"}'
```

**Respuesta del original** (v2): status 400

```
{"error":"E201","mensaje":"control mal formado"}
```

**Respuesta de la réplica:** status 400 — coincide

```
{"error":"E201","mensaje":"control mal formado"}
```

**Conclusión:** Comportamiento de v2: CONSULTA;AC-0001;XX da E201. La excepción del control es solo de PING (igual que DEPOSITO 5X en E:17).

**Etiqueta de evidencia:** Comportamiento de v2 sin línea base en v1

### s-v2-lim-04 — v2, X:215–X:220

#### X:215 — POST /msg ALTA;Ana;50

**Pregunta (hipótesis):** Preparación: AC-0001

**Preparación:** Posición 1 de 6 en `s-v2-lim-04`. Estado vacío tras `POST /__reset`.

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"ALTA;Ana;50"}'
```

**Respuesta del original** (v2): status 201

```
{"cuentaId":"AC-0001"}
```

**Respuesta de la réplica:** status 201 — coincide

```
{"cuentaId":"AC-0001"}
```

**Conclusión:** Preparación (201 AC-0001).

**Etiqueta de evidencia:** Preparación

#### X:216 — POST /msg ALTA;Beto;11

**Pregunta (hipótesis):** Preparación: AC-0002

**Preparación:** Posición 2 de 6 en `s-v2-lim-04`. Solicitudes previas tras el reset: X:215 (`ALTA;Ana;50`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"ALTA;Beto;11"}'
```

**Respuesta del original** (v2): status 201

```
{"cuentaId":"AC-0002"}
```

**Respuesta de la réplica:** status 201 — coincide

```
{"cuentaId":"AC-0002"}
```

**Conclusión:** Preparación (201 AC-0002).

**Etiqueta de evidencia:** Preparación

#### X:217 — POST /msg DEPOSITO;AC-0001;250000;86

**Pregunta (hipótesis):** Preparación: saldo suficiente

**Preparación:** Posición 3 de 6 en `s-v2-lim-04`. Solicitudes previas tras el reset: X:215 (`ALTA;Ana;50`), X:216 (`ALTA;Beto;11`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"DEPOSITO;AC-0001;250000;86"}'
```

**Respuesta del original** (v2): status 200

```
{"status":"recieved","operacionId":"OP-0001"}
```

**Respuesta de la réplica:** status 200 — coincide

```
{"status":"recieved","operacionId":"OP-0001"}
```

**Conclusión:** Preparación (200 OP-0001).

**Etiqueta de evidencia:** Preparación

#### X:218 — POST /msg TRANSFER;AC-0001;AC-0002;30000;16

**Pregunta (hipótesis):** Límite acumulado: primera transferencia de 30000 (bajo 50000)

**Preparación:** Posición 4 de 6 en `s-v2-lim-04`. Solicitudes previas tras el reset: X:215 (`ALTA;Ana;50`), X:216 (`ALTA;Beto;11`), X:217 (`DEPOSITO;AC-0001;250000;86`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"TRANSFER;AC-0001;AC-0002;30000;16"}'
```

**Respuesta del original** (v2): status 200

```
{"status":"recieved","operacionId":"OP-0002"}
```

**Respuesta de la réplica:** status 200 — coincide

```
{"status":"recieved","operacionId":"OP-0002"}
```

**Conclusión:** TRANSFER de 30000 aceptado (200 OP-0002).

**Etiqueta de evidencia:** Observación

#### X:219 — POST /msg TRANSFER;AC-0001;AC-0002;30000;16

**Pregunta (hipótesis):** Límite acumulado: segunda de 30000 (suma 60000 > 50000): ¿200 (por transferencia) o E506 (acumulado)?

**Preparación:** Posición 5 de 6 en `s-v2-lim-04`. Solicitudes previas tras el reset: X:215 (`ALTA;Ana;50`), X:216 (`ALTA;Beto;11`), X:217 (`DEPOSITO;AC-0001;250000;86`), X:218 (`TRANSFER;AC-0001;AC-0002;30000;16`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"TRANSFER;AC-0001;AC-0002;30000;16"}'
```

**Respuesta del original** (v2): status 200

```
{"status":"recieved","operacionId":"OP-0003"}
```

**Respuesta de la réplica:** status 200 — coincide

```
{"status":"recieved","operacionId":"OP-0003"}
```

**Conclusión:** Comportamiento de v2: la segunda TRANSFER de 30000 (suma 60000 > 50000) da 200. El límite es por transferencia, no acumulado (igual que v1, X:29).

**Etiqueta de evidencia:** Comportamiento de v2 sin línea base en v1

#### X:220 — POST /msg CONSULTA;AC-0002;11

**Pregunta (hipótesis):** Confirma cuánto llegó a AC-0002

**Preparación:** Posición 6 de 6 en `s-v2-lim-04`. Solicitudes previas tras el reset: X:215 (`ALTA;Ana;50`), X:216 (`ALTA;Beto;11`), X:217 (`DEPOSITO;AC-0001;250000;86`), X:218 (`TRANSFER;AC-0001;AC-0002;30000;16`), X:219 (`TRANSFER;AC-0001;AC-0002;30000;16`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"CONSULTA;AC-0002;11"}'
```

**Respuesta del original** (v2): status 200

```
{"cuenta_id":"AC-0002","saldo":"600.00"}
```

**Respuesta de la réplica:** status 200 — coincide

```
{"cuenta_id":"AC-0002","saldo":"600.00"}
```

**Conclusión:** Saldo "600.00" = 60000/100: pasaron las dos transferencias.

**Etiqueta de evidencia:** Observación

### s-v2-ord-03 — v2, X:221–X:222

#### X:221 — POST /msg TRANSFER;AC-0001;AC-0001;0;74

**Pregunta (hipótesis):** Estado vacío, monto inválido y origen = destino: ¿E303 o E304?

**Preparación:** Posición 1 de 2 en `s-v2-ord-03`. Estado vacío tras `POST /__reset`.

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"TRANSFER;AC-0001;AC-0001;0;74"}'
```

**Respuesta del original** (v2): status 400

```
{"error":"E303","mensaje":"monto inválido"}
```

**Respuesta de la réplica:** status 400 — coincide

```
{"error":"E303","mensaje":"monto inválido"}
```

**Conclusión:** Comportamiento de v2: con estado vacío, TRANSFER;AC-0001;AC-0001;0 da E303. E303 se evalúa antes que E304.

**Etiqueta de evidencia:** Comportamiento de v2 sin línea base en v1

#### X:222 — POST /msg TRANSFER;AC-0001;AC-0001;60000;11

**Pregunta (hipótesis):** Estado vacío, monto sobre el límite y origen = destino: ¿E304 o E506?

**Preparación:** Posición 2 de 2 en `s-v2-ord-03`. Solicitudes previas tras el reset: X:221 (`TRANSFER;AC-0001;AC-0001;0;74`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"TRANSFER;AC-0001;AC-0001;60000;11"}'
```

**Respuesta del original** (v2): status 400

```
{"error":"E304","mensaje":"origen y destino iguales"}
```

**Respuesta de la réplica:** status 400 — coincide

```
{"error":"E304","mensaje":"origen y destino iguales"}
```

**Conclusión:** Comportamiento de v2: con estado vacío, TRANSFER;AC-0001;AC-0001;60000 da E304. E304 se evalúa antes que E506. Orden de TRANSFER: E303 -> E304 -> E401 (X:210) -> E506 (X:78) -> E507 (X:30).

**Etiqueta de evidencia:** Comportamiento de v2 sin línea base en v1

### s-v2-neg-01 — v2, X:223–X:228

#### X:223 — POST /msg ALTA;Ana;50

**Pregunta (hipótesis):** Preparación: AC-0001

**Preparación:** Posición 1 de 6 en `s-v2-neg-01`. Estado vacío tras `POST /__reset`.

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"ALTA;Ana;50"}'
```

**Respuesta del original** (v2): status 201

```
{"cuentaId":"AC-0001"}
```

**Respuesta de la réplica:** status 201 — coincide

```
{"cuentaId":"AC-0001"}
```

**Conclusión:** Preparación (201 AC-0001).

**Etiqueta de evidencia:** Preparación

#### X:224 — POST /msg ALTA;Beto;11

**Pregunta (hipótesis):** Preparación: AC-0002

**Preparación:** Posición 2 de 6 en `s-v2-neg-01`. Solicitudes previas tras el reset: X:223 (`ALTA;Ana;50`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"ALTA;Beto;11"}'
```

**Respuesta del original** (v2): status 201

```
{"cuentaId":"AC-0002"}
```

**Respuesta de la réplica:** status 201 — coincide

```
{"cuentaId":"AC-0002"}
```

**Conclusión:** Preparación (201 AC-0002).

**Etiqueta de evidencia:** Preparación

#### X:225 — POST /msg DEPOSITO;AC-0001;5;16

**Pregunta (hipótesis):** Preparación: OP-0001, AC-0001 = 5

**Preparación:** Posición 3 de 6 en `s-v2-neg-01`. Solicitudes previas tras el reset: X:223 (`ALTA;Ana;50`), X:224 (`ALTA;Beto;11`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"DEPOSITO;AC-0001;5;16"}'
```

**Respuesta del original** (v2): status 200

```
{"status":"recieved","operacionId":"OP-0001"}
```

**Respuesta de la réplica:** status 200 — coincide

```
{"status":"recieved","operacionId":"OP-0001"}
```

**Conclusión:** Preparación (200 OP-0001).

**Etiqueta de evidencia:** Preparación

#### X:226 — POST /msg TRANSFER;AC-0001;AC-0002;5;29

**Pregunta (hipótesis):** Preparación: AC-0001 queda en 0

**Preparación:** Posición 4 de 6 en `s-v2-neg-01`. Solicitudes previas tras el reset: X:223 (`ALTA;Ana;50`), X:224 (`ALTA;Beto;11`), X:225 (`DEPOSITO;AC-0001;5;16`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"TRANSFER;AC-0001;AC-0002;5;29"}'
```

**Respuesta del original** (v2): status 200

```
{"status":"recieved","operacionId":"OP-0002"}
```

**Respuesta de la réplica:** status 200 — coincide

```
{"status":"recieved","operacionId":"OP-0002"}
```

**Conclusión:** Preparación: AC-0001 queda en 0 (200 OP-0002).

**Etiqueta de evidencia:** Preparación

#### X:227 — POST /msg ANULA;OP-0001;72

**Pregunta (hipótesis):** Anular el depósito ya transferido: ¿200 con saldo negativo (como v1 X:72) o rechazo?

**Preparación:** Posición 5 de 6 en `s-v2-neg-01`. Solicitudes previas tras el reset: X:223 (`ALTA;Ana;50`), X:224 (`ALTA;Beto;11`), X:225 (`DEPOSITO;AC-0001;5;16`), X:226 (`TRANSFER;AC-0001;AC-0002;5;29`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"ANULA;OP-0001;72"}'
```

**Respuesta del original** (v2): status 200

```
{"ok":true,"anulada":"OP-0001"}
```

**Respuesta de la réplica:** status 200 — coincide

```
{"ok":true,"anulada":"OP-0001"}
```

**Conclusión:** ANULA de un DEPOSITO ya transferido da 200 ok:true: se permite saldo negativo (igual que v1, X:72).

**Etiqueta de evidencia:** Observación

#### X:228 — POST /msg CONSULTA;AC-0001;14

**Pregunta (hipótesis):** Formato de centavos negativos: ¿"-0.05"?

**Preparación:** Posición 6 de 6 en `s-v2-neg-01`. Solicitudes previas tras el reset: X:223 (`ALTA;Ana;50`), X:224 (`ALTA;Beto;11`), X:225 (`DEPOSITO;AC-0001;5;16`), X:226 (`TRANSFER;AC-0001;AC-0002;5;29`), X:227 (`ANULA;OP-0001;72`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"CONSULTA;AC-0001;14"}'
```

**Respuesta del original** (v2): status 200

```
{"cuenta_id":"AC-0001","saldo":"-0.05"}
```

**Respuesta de la réplica:** status 200 — coincide

```
{"cuenta_id":"AC-0001","saldo":"-0.05"}
```

**Conclusión:** CAMBIO 1 (v2): un saldo de -5 se muestra como "-0.05": signo, entero con cero a la izquierda y 2 decimales.

**Etiqueta de evidencia:** Cambio de versión probado

### s-v2-amt-02 — v2, X:229–X:236

#### X:229 — POST /msg ALTA;Ana;50

**Pregunta (hipótesis):** Preparación: AC-0001

**Preparación:** Posición 1 de 8 en `s-v2-amt-02`. Estado vacío tras `POST /__reset`.

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"ALTA;Ana;50"}'
```

**Respuesta del original** (v2): status 201

```
{"cuentaId":"AC-0001"}
```

**Respuesta de la réplica:** status 201 — coincide

```
{"cuentaId":"AC-0001"}
```

**Conclusión:** Preparación (201 AC-0001).

**Etiqueta de evidencia:** Preparación

#### X:230 — POST /msg DEPOSITO;AC-0001;+5;16

**Pregunta (hipótesis):** Monto con signo +: ¿E303 o se acepta?

**Preparación:** Posición 2 de 8 en `s-v2-amt-02`. Solicitudes previas tras el reset: X:229 (`ALTA;Ana;50`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"DEPOSITO;AC-0001;+5;16"}'
```

**Respuesta del original** (v2): status 400

```
{"error":"E303","mensaje":"monto inválido"}
```

**Respuesta de la réplica:** status 400 — coincide

```
{"error":"E303","mensaje":"monto inválido"}
```

**Conclusión:** Comportamiento de v2: monto '+5' da E303.

**Etiqueta de evidencia:** Comportamiento de v2 sin línea base en v1

#### X:231 — POST /msg DEPOSITO;AC-0001;1e3;20

**Pregunta (hipótesis):** Monto en notación exponencial: ¿E303?

**Preparación:** Posición 3 de 8 en `s-v2-amt-02`. Solicitudes previas tras el reset: X:229 (`ALTA;Ana;50`), X:230 (`DEPOSITO;AC-0001;+5;16`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"DEPOSITO;AC-0001;1e3;20"}'
```

**Respuesta del original** (v2): status 400

```
{"error":"E303","mensaje":"monto inválido"}
```

**Respuesta de la réplica:** status 400 — coincide

```
{"error":"E303","mensaje":"monto inválido"}
```

**Conclusión:** Comportamiento de v2: monto '1e3' da E303.

**Etiqueta de evidencia:** Comportamiento de v2 sin línea base en v1

#### X:232 — POST /msg DEPOSITO;AC-0001; 5;16

**Pregunta (hipótesis):** Monto con espacio inicial: ¿E303 o se recorta?

**Preparación:** Posición 4 de 8 en `s-v2-amt-02`. Solicitudes previas tras el reset: X:229 (`ALTA;Ana;50`), X:230 (`DEPOSITO;AC-0001;+5;16`), X:231 (`DEPOSITO;AC-0001;1e3;20`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"DEPOSITO;AC-0001; 5;16"}'
```

**Respuesta del original** (v2): status 400

```
{"error":"E303","mensaje":"monto inválido"}
```

**Respuesta de la réplica:** status 400 — coincide

```
{"error":"E303","mensaje":"monto inválido"}
```

**Conclusión:** Comportamiento de v2: monto ' 5' (espacio inicial) da E303; no se recorta.

**Etiqueta de evidencia:** Comportamiento de v2 sin línea base en v1

#### X:233 — POST /msg DEPOSITO;AC-0001;9007199254740993;88

**Pregunta (hipótesis):** Monto mayor que 2^53: ¿E303, límite o se acepta con precisión?

**Preparación:** Posición 5 de 8 en `s-v2-amt-02`. Solicitudes previas tras el reset: X:229 (`ALTA;Ana;50`), X:230 (`DEPOSITO;AC-0001;+5;16`), X:231 (`DEPOSITO;AC-0001;1e3;20`), X:232 (`DEPOSITO;AC-0001; 5;16`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"DEPOSITO;AC-0001;9007199254740993;88"}'
```

**Respuesta del original** (v2): status 400

```
{"error":"E303","mensaje":"monto inválido"}
```

**Respuesta de la réplica:** status 400 — coincide

```
{"error":"E303","mensaje":"monto inválido"}
```

**Conclusión:** Comportamiento de v2: monto 9007199254740993 (> 2^53) da E303.

**Etiqueta de evidencia:** Comportamiento de v2 sin línea base en v1

#### X:234 — POST /msg CONSULTA;AC-0001;14

**Pregunta (hipótesis):** Saldo tras el monto grande: revela precisión y formato

**Preparación:** Posición 6 de 8 en `s-v2-amt-02`. Solicitudes previas tras el reset: X:229 (`ALTA;Ana;50`), X:230 (`DEPOSITO;AC-0001;+5;16`), X:231 (`DEPOSITO;AC-0001;1e3;20`), X:232 (`DEPOSITO;AC-0001; 5;16`), X:233 (`DEPOSITO;AC-0001;9007199254740993;88`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"CONSULTA;AC-0001;14"}'
```

**Respuesta del original** (v2): status 200

```
{"cuenta_id":"AC-0001","saldo":"0.00"}
```

**Respuesta de la réplica:** status 200 — coincide

```
{"cuenta_id":"AC-0001","saldo":"0.00"}
```

**Conclusión:** El saldo sigue en "0.00": los depósitos rechazados no alteran el estado.

**Etiqueta de evidencia:** Observación

#### X:235 — POST /msg DEPOSITO;AC-0001;100000000000;39

**Pregunta (hipótesis):** ¿Hay límite de DEPOSITO en v2? (10^11)

**Preparación:** Posición 7 de 8 en `s-v2-amt-02`. Solicitudes previas tras el reset: X:229 (`ALTA;Ana;50`), X:230 (`DEPOSITO;AC-0001;+5;16`), X:231 (`DEPOSITO;AC-0001;1e3;20`), X:232 (`DEPOSITO;AC-0001; 5;16`), X:233 (`DEPOSITO;AC-0001;9007199254740993;88`), X:234 (`CONSULTA;AC-0001;14`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"DEPOSITO;AC-0001;100000000000;39"}'
```

**Respuesta del original** (v2): status 400

```
{"error":"E303","mensaje":"monto inválido"}
```

**Respuesta de la réplica:** status 400 — coincide

```
{"error":"E303","mensaje":"monto inválido"}
```

**Conclusión:** Comportamiento de v2: DEPOSITO de 100000000000 da E303 (no E506). Con 500000 aceptado (X:109), existe un monto máximo entre 500000 y 10^11; el valor exacto es desconocido.

**Etiqueta de evidencia:** Comportamiento de v2 sin línea base en v1

#### X:236 — POST /msg CONSULTA;AC-0001;14

**Pregunta (hipótesis):** Saldo acumulado grande: formato

**Preparación:** Posición 8 de 8 en `s-v2-amt-02`. Solicitudes previas tras el reset: X:229 (`ALTA;Ana;50`), X:230 (`DEPOSITO;AC-0001;+5;16`), X:231 (`DEPOSITO;AC-0001;1e3;20`), X:232 (`DEPOSITO;AC-0001; 5;16`), X:233 (`DEPOSITO;AC-0001;9007199254740993;88`), X:234 (`CONSULTA;AC-0001;14`), X:235 (`DEPOSITO;AC-0001;100000000000;39`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"CONSULTA;AC-0001;14"}'
```

**Respuesta del original** (v2): status 200

```
{"cuenta_id":"AC-0001","saldo":"0.00"}
```

**Respuesta de la réplica:** status 200 — coincide

```
{"cuenta_id":"AC-0001","saldo":"0.00"}
```

**Conclusión:** El saldo sigue en "0.00".

**Etiqueta de evidencia:** Observación

### s-v2-ids-01 — v2, X:237–X:242

#### X:237 — POST /msg ALTA;Ana;50

**Pregunta (hipótesis):** Preparación: AC-0001

**Preparación:** Posición 1 de 6 en `s-v2-ids-01`. Estado vacío tras `POST /__reset`.

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"ALTA;Ana;50"}'
```

**Respuesta del original** (v2): status 201

```
{"cuentaId":"AC-0001"}
```

**Respuesta de la réplica:** status 201 — coincide

```
{"cuentaId":"AC-0001"}
```

**Conclusión:** Preparación (201 AC-0001).

**Etiqueta de evidencia:** Preparación

#### X:238 — POST /msg DEPOSITO;AC-0001;100;82

**Pregunta (hipótesis):** Preparación: OP-0001

**Preparación:** Posición 2 de 6 en `s-v2-ids-01`. Solicitudes previas tras el reset: X:237 (`ALTA;Ana;50`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"DEPOSITO;AC-0001;100;82"}'
```

**Respuesta del original** (v2): status 200

```
{"status":"recieved","operacionId":"OP-0001"}
```

**Respuesta de la réplica:** status 200 — coincide

```
{"status":"recieved","operacionId":"OP-0001"}
```

**Conclusión:** Preparación (200 OP-0001).

**Etiqueta de evidencia:** Preparación

#### X:239 — POST /msg ANULA;op-0001;72

**Pregunta (hipótesis):** Id de operación en minúsculas: ¿E402 o se acepta?

**Preparación:** Posición 3 de 6 en `s-v2-ids-01`. Solicitudes previas tras el reset: X:237 (`ALTA;Ana;50`), X:238 (`DEPOSITO;AC-0001;100;82`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"ANULA;op-0001;72"}'
```

**Respuesta del original** (v2): status 404

```
{"error":"E402","mensaje":"operación inexistente"}
```

**Respuesta de la réplica:** status 404 — coincide

```
{"error":"E402","mensaje":"operación inexistente"}
```

**Conclusión:** Comportamiento de v2: 'op-0001' en minúsculas da E402: los ids de operación son sensibles a mayúsculas.

**Etiqueta de evidencia:** Comportamiento de v2 sin línea base en v1

#### X:240 — POST /msg ANULA;OP-1;91

**Pregunta (hipótesis):** Id de operación sin ceros: ¿E402 o se acepta?

**Preparación:** Posición 4 de 6 en `s-v2-ids-01`. Solicitudes previas tras el reset: X:237 (`ALTA;Ana;50`), X:238 (`DEPOSITO;AC-0001;100;82`), X:239 (`ANULA;op-0001;72`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"ANULA;OP-1;91"}'
```

**Respuesta del original** (v2): status 404

```
{"error":"E402","mensaje":"operación inexistente"}
```

**Respuesta de la réplica:** status 404 — coincide

```
{"error":"E402","mensaje":"operación inexistente"}
```

**Conclusión:** Comportamiento de v2: 'OP-1' da E402: el id exige el formato exacto OP-NNNN.

**Etiqueta de evidencia:** Comportamiento de v2 sin línea base en v1

#### X:241 — POST /msg CONSULTA;AC-1;5

**Pregunta (hipótesis):** Id de cuenta sin ceros: ¿E401 o se acepta?

**Preparación:** Posición 5 de 6 en `s-v2-ids-01`. Solicitudes previas tras el reset: X:237 (`ALTA;Ana;50`), X:238 (`DEPOSITO;AC-0001;100;82`), X:239 (`ANULA;op-0001;72`), X:240 (`ANULA;OP-1;91`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"CONSULTA;AC-1;5"}'
```

**Respuesta del original** (v2): status 404

```
{"error":"E401","mensaje":"cuenta inexistente"}
```

**Respuesta de la réplica:** status 404 — coincide

```
{"error":"E401","mensaje":"cuenta inexistente"}
```

**Conclusión:** Comportamiento de v2: 'AC-1' da E401: el id exige el formato exacto AC-NNNN.

**Etiqueta de evidencia:** Comportamiento de v2 sin línea base en v1

#### X:242 — POST /msg PING;

**Pregunta (hipótesis):** PING con control vacío: ¿E104 (segmento vacío) o pong (PING ignora el control)?

**Preparación:** Posición 6 de 6 en `s-v2-ids-01`. Solicitudes previas tras el reset: X:237 (`ALTA;Ana;50`), X:238 (`DEPOSITO;AC-0001;100;82`), X:239 (`ANULA;op-0001;72`), X:240 (`ANULA;OP-1;91`), X:241 (`CONSULTA;AC-1;5`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"PING;"}'
```

**Respuesta del original** (v2): status 400

```
{"error":"E104","mensaje":"segmento vacío"}
```

**Respuesta de la réplica:** status 400 — coincide

```
{"error":"E104","mensaje":"segmento vacío"}
```

**Conclusión:** Comportamiento de v2: 'PING;' (control vacío) da E104: el segmento vacío se evalúa aunque PING ignore el control.

**Etiqueta de evidencia:** Comportamiento de v2 sin línea base en v1

### s-v2-anu-02 — v2, X:243–X:249

#### X:243 — POST /msg ALTA;Ana;50

**Pregunta (hipótesis):** Preparación: AC-0001

**Preparación:** Posición 1 de 7 en `s-v2-anu-02`. Estado vacío tras `POST /__reset`.

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"ALTA;Ana;50"}'
```

**Respuesta del original** (v2): status 201

```
{"cuentaId":"AC-0001"}
```

**Respuesta de la réplica:** status 201 — coincide

```
{"cuentaId":"AC-0001"}
```

**Conclusión:** Preparación (201 AC-0001).

**Etiqueta de evidencia:** Preparación

#### X:244 — POST /msg ALTA;Beto;11

**Pregunta (hipótesis):** Preparación: AC-0002

**Preparación:** Posición 2 de 7 en `s-v2-anu-02`. Solicitudes previas tras el reset: X:243 (`ALTA;Ana;50`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"ALTA;Beto;11"}'
```

**Respuesta del original** (v2): status 201

```
{"cuentaId":"AC-0002"}
```

**Respuesta de la réplica:** status 201 — coincide

```
{"cuentaId":"AC-0002"}
```

**Conclusión:** Preparación (201 AC-0002).

**Etiqueta de evidencia:** Preparación

#### X:245 — POST /msg DEPOSITO;AC-0001;1000;35

**Pregunta (hipótesis):** Preparación: OP-0001

**Preparación:** Posición 3 de 7 en `s-v2-anu-02`. Solicitudes previas tras el reset: X:243 (`ALTA;Ana;50`), X:244 (`ALTA;Beto;11`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"DEPOSITO;AC-0001;1000;35"}'
```

**Respuesta del original** (v2): status 200

```
{"status":"recieved","operacionId":"OP-0001"}
```

**Respuesta de la réplica:** status 200 — coincide

```
{"status":"recieved","operacionId":"OP-0001"}
```

**Conclusión:** Preparación (200 OP-0001).

**Etiqueta de evidencia:** Preparación

#### X:246 — POST /msg TRANSFER;AC-0001;AC-0002;1000;37

**Pregunta (hipótesis):** Preparación: OP-0002, AC-0002 = 1000

**Preparación:** Posición 4 de 7 en `s-v2-anu-02`. Solicitudes previas tras el reset: X:243 (`ALTA;Ana;50`), X:244 (`ALTA;Beto;11`), X:245 (`DEPOSITO;AC-0001;1000;35`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"TRANSFER;AC-0001;AC-0002;1000;37"}'
```

**Respuesta del original** (v2): status 200

```
{"status":"recieved","operacionId":"OP-0002"}
```

**Respuesta de la réplica:** status 200 — coincide

```
{"status":"recieved","operacionId":"OP-0002"}
```

**Conclusión:** Preparación (200 OP-0002).

**Etiqueta de evidencia:** Preparación

#### X:247 — POST /msg TRANSFER;AC-0002;AC-0001;1000;14

**Pregunta (hipótesis):** El destino gasta el dinero: OP-0003, AC-0002 = 0

**Preparación:** Posición 5 de 7 en `s-v2-anu-02`. Solicitudes previas tras el reset: X:243 (`ALTA;Ana;50`), X:244 (`ALTA;Beto;11`), X:245 (`DEPOSITO;AC-0001;1000;35`), X:246 (`TRANSFER;AC-0001;AC-0002;1000;37`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"TRANSFER;AC-0002;AC-0001;1000;14"}'
```

**Respuesta del original** (v2): status 200

```
{"status":"recieved","operacionId":"OP-0003"}
```

**Respuesta de la réplica:** status 200 — coincide

```
{"status":"recieved","operacionId":"OP-0003"}
```

**Conclusión:** Preparación: el destino gasta el dinero (200 OP-0003, AC-0002 = 0).

**Etiqueta de evidencia:** Preparación

#### X:248 — POST /msg ANULA;OP-0002;69

**Pregunta (hipótesis):** ANULA de una TRANSFER cuyo destino ya gastó: ¿200 con saldo negativo o E507?

**Preparación:** Posición 6 de 7 en `s-v2-anu-02`. Solicitudes previas tras el reset: X:243 (`ALTA;Ana;50`), X:244 (`ALTA;Beto;11`), X:245 (`DEPOSITO;AC-0001;1000;35`), X:246 (`TRANSFER;AC-0001;AC-0002;1000;37`), X:247 (`TRANSFER;AC-0002;AC-0001;1000;14`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"ANULA;OP-0002;69"}'
```

**Respuesta del original** (v2): status 200

```
{"ok":true,"anulada":"OP-0002"}
```

**Respuesta de la réplica:** status 200 — coincide

```
{"ok":true,"anulada":"OP-0002"}
```

**Conclusión:** Comportamiento de v2: ANULA de una TRANSFER cuyo destino ya gastó da 200 ok:true (no E507).

**Etiqueta de evidencia:** Comportamiento de v2 sin línea base en v1

#### X:249 — POST /msg CONSULTA;AC-0002;11

**Pregunta (hipótesis):** Saldo del destino tras la anulación

**Preparación:** Posición 7 de 7 en `s-v2-anu-02`. Solicitudes previas tras el reset: X:243 (`ALTA;Ana;50`), X:244 (`ALTA;Beto;11`), X:245 (`DEPOSITO;AC-0001;1000;35`), X:246 (`TRANSFER;AC-0001;AC-0002;1000;37`), X:247 (`TRANSFER;AC-0002;AC-0001;1000;14`), X:248 (`ANULA;OP-0002;69`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"CONSULTA;AC-0002;11"}'
```

**Respuesta del original** (v2): status 200

```
{"cuenta_id":"AC-0002","saldo":"-10.00"}
```

**Respuesta de la réplica:** status 200 — coincide

```
{"cuenta_id":"AC-0002","saldo":"-10.00"}
```

**Conclusión:** Comportamiento de v2: el destino queda en "-10.00": la anulación descuenta del destino aunque quede negativo.

**Etiqueta de evidencia:** Comportamiento de v2 sin línea base en v1

### s-v2-http-01 — v2, X:250–X:264

#### X:250 — POST /msg/

**Pregunta (hipótesis):** Ruta con barra final /msg/: ¿404 E404 o se acepta?

**Preparación:** Posición 1 de 15 en `s-v2-http-01`. Estado vacío tras `POST /__reset`.

**Solicitud:** POST `/msg/`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg/" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"PING;64"}'
```

**Respuesta del original** (v2): status 404

```
{"error":"E404","mensaje":"ruta desconocida"}
```

**Respuesta de la réplica:** status 404 — coincide

```
{"error":"E404","mensaje":"ruta desconocida"}
```

**Conclusión:** Comportamiento de v2: /msg/ (barra final) da 404 E404.

**Etiqueta de evidencia:** Comportamiento de v2 sin línea base en v1

#### X:251 — POST /msg?x=1

**Pregunta (hipótesis):** Ruta con query string /msg?x=1: ¿se acepta?

**Preparación:** Posición 2 de 15 en `s-v2-http-01`. Solicitudes previas tras el reset: X:250 (`PING;64`).

**Solicitud:** POST `/msg?x=1`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg?x=1" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"PING;64"}'
```

**Respuesta del original** (v2): status 200

```
{"pong":true}
```

**Respuesta de la réplica:** status 200 — coincide

```
{"pong":true}
```

**Conclusión:** Comportamiento de v2: /msg?x=1 se acepta (200 pong): la query string se ignora.

**Etiqueta de evidencia:** Comportamiento de v2 sin línea base en v1

#### X:252 — HEAD /health

**Pregunta (hipótesis):** HEAD /health: status

**Preparación:** Posición 3 de 15 en `s-v2-http-01`. Solicitudes previas tras el reset: X:250 (`PING;64`), X:251 (`PING;64`).

**Solicitud:** HEAD `/health`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  --head \
  "$BASE_URL/health" \
  -H "Authorization: Bearer $TEAM_TOKEN"
```

**Respuesta del original** (v2): status 404

```
(cuerpo vacío)
```

**Respuesta de la réplica:** status 404 — coincide

```
(cuerpo vacío)
```

**Conclusión:** Comportamiento de v2: HEAD /health da 404 sin cuerpo.

**Etiqueta de evidencia:** Comportamiento de v2 sin línea base en v1

#### X:253 — POST /health

**Pregunta (hipótesis):** POST /health: ¿200 o 404?

**Preparación:** Posición 4 de 15 en `s-v2-http-01`. Solicitudes previas tras el reset: X:250 (`PING;64`), X:251 (`PING;64`), X:252 (HEAD /health).

**Solicitud:** POST `/health`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/health" \
  -H "Authorization: Bearer $TEAM_TOKEN"
```

**Respuesta del original** (v2): status 404

```
{"error":"E404","mensaje":"ruta desconocida"}
```

**Respuesta de la réplica:** status 404 — coincide

```
{"error":"E404","mensaje":"ruta desconocida"}
```

**Conclusión:** Comportamiento de v2: POST /health da 404 E404.

**Etiqueta de evidencia:** Comportamiento de v2 sin línea base en v1

#### X:254 — GET /__reset

**Pregunta (hipótesis):** GET /__reset: ¿404 o resetea?

**Preparación:** Posición 5 de 15 en `s-v2-http-01`. Solicitudes previas tras el reset: X:250 (`PING;64`), X:251 (`PING;64`), X:252 (HEAD /health), X:253 (POST /health).

**Solicitud:** GET `/__reset`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X GET \
  "$BASE_URL/__reset" \
  -H "Authorization: Bearer $TEAM_TOKEN"
```

**Respuesta del original** (v2): status 404

```
{"error":"E404","mensaje":"ruta desconocida"}
```

**Respuesta de la réplica:** status 404 — coincide

```
{"error":"E404","mensaje":"ruta desconocida"}
```

**Conclusión:** Comportamiento de v2: GET /__reset da 404 E404.

**Etiqueta de evidencia:** Comportamiento de v2 sin línea base en v1

#### X:255 — POST /__reset

**Pregunta (hipótesis):** POST /__reset con token incorrecto: ¿401?

**Preparación:** Posición 6 de 15 en `s-v2-http-01`. Solicitudes previas tras el reset: X:250 (`PING;64`), X:251 (`PING;64`), X:252 (HEAD /health), X:253 (POST /health), X:254 (GET /__reset).

**Solicitud:** POST `/__reset`, token incorrecto (`Authorization: Bearer wrong-token`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/__reset" \
  -H "Authorization: Bearer wrong-token"
```

**Respuesta del original** (v2): status 401

```
{"error":"E001","mensaje":"no autorizado"}
```

**Respuesta de la réplica:** status 401 — coincide

```
{"error":"E001","mensaje":"no autorizado"}
```

**Conclusión:** Comportamiento de v2: POST /__reset con token incorrecto da 401 E001.

**Etiqueta de evidencia:** Comportamiento de v2 sin línea base en v1

#### X:256 — POST /msg PING;64

**Pregunta (hipótesis):** Esquema 'bearer' en minúscula: ¿200 o 401?

**Preparación:** Posición 7 de 15 en `s-v2-http-01`. Solicitudes previas tras el reset: X:250 (`PING;64`), X:251 (`PING;64`), X:252 (HEAD /health), X:253 (POST /health), X:254 (GET /__reset), X:255 (POST /__reset).

**Solicitud:** POST `/msg`, esquema en minúsculas (`Authorization: bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"PING;64"}'
```

**Respuesta del original** (v2): status 401

```
{"error":"E001","mensaje":"no autorizado"}
```

**Respuesta de la réplica:** status 401 — coincide

```
{"error":"E001","mensaje":"no autorizado"}
```

**Conclusión:** Comportamiento de v2: el esquema 'bearer' en minúscula da 401 E001.

**Etiqueta de evidencia:** Comportamiento de v2 sin línea base en v1

#### X:257 — POST /msg PING;64

**Pregunta (hipótesis):** Authorization sin esquema: ¿401?

**Preparación:** Posición 8 de 15 en `s-v2-http-01`. Solicitudes previas tras el reset: X:250 (`PING;64`), X:251 (`PING;64`), X:252 (HEAD /health), X:253 (POST /health), X:254 (GET /__reset), X:255 (POST /__reset), X:256 (`PING;64`).

**Solicitud:** POST `/msg`, token sin esquema (`Authorization: $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"PING;64"}'
```

**Respuesta del original** (v2): status 401

```
{"error":"E001","mensaje":"no autorizado"}
```

**Respuesta de la réplica:** status 401 — coincide

```
{"error":"E001","mensaje":"no autorizado"}
```

**Conclusión:** Comportamiento de v2: Authorization sin esquema da 401 E001.

**Etiqueta de evidencia:** Comportamiento de v2 sin línea base en v1

#### X:258 — POST /msg null

**Pregunta (hipótesis):** Cuerpo JSON null: ¿E102 o E100?

**Preparación:** Posición 9 de 15 en `s-v2-http-01`. Solicitudes previas tras el reset: X:250 (`PING;64`), X:251 (`PING;64`), X:252 (HEAD /health), X:253 (POST /health), X:254 (GET /__reset), X:255 (POST /__reset), X:256 (`PING;64`), X:257 (`PING;64`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw 'null'
```

**Respuesta del original** (v2): status 400

```
{"error":"E102","mensaje":"falta m"}
```

**Respuesta de la réplica:** status 400 — coincide

```
{"error":"E102","mensaje":"falta m"}
```

**Conclusión:** Comportamiento de v2: cuerpo JSON null da E102.

**Etiqueta de evidencia:** Comportamiento de v2 sin línea base en v1

#### X:259 — POST /msg 5

**Pregunta (hipótesis):** Cuerpo JSON número: ¿E102 o E100?

**Preparación:** Posición 10 de 15 en `s-v2-http-01`. Solicitudes previas tras el reset: X:250 (`PING;64`), X:251 (`PING;64`), X:252 (HEAD /health), X:253 (POST /health), X:254 (GET /__reset), X:255 (POST /__reset), X:256 (`PING;64`), X:257 (`PING;64`), X:258 (`null`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '5'
```

**Respuesta del original** (v2): status 400

```
{"error":"E102","mensaje":"falta m"}
```

**Respuesta de la réplica:** status 400 — coincide

```
{"error":"E102","mensaje":"falta m"}
```

**Conclusión:** Comportamiento de v2: cuerpo JSON número da E102.

**Etiqueta de evidencia:** Comportamiento de v2 sin línea base en v1

#### X:260 — POST /msg "PING;64"

**Pregunta (hipótesis):** Cuerpo JSON string: ¿E102 o E100?

**Preparación:** Posición 11 de 15 en `s-v2-http-01`. Solicitudes previas tras el reset: X:250 (`PING;64`), X:251 (`PING;64`), X:252 (HEAD /health), X:253 (POST /health), X:254 (GET /__reset), X:255 (POST /__reset), X:256 (`PING;64`), X:257 (`PING;64`), X:258 (`null`), X:259 (`5`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '"PING;64"'
```

**Respuesta del original** (v2): status 400

```
{"error":"E102","mensaje":"falta m"}
```

**Respuesta de la réplica:** status 400 — coincide

```
{"error":"E102","mensaje":"falta m"}
```

**Conclusión:** Comportamiento de v2: cuerpo JSON string da E102.

**Etiqueta de evidencia:** Comportamiento de v2 sin línea base en v1

#### X:261 — POST /msg {"m":null}

**Pregunta (hipótesis):** m null: ¿E102?

**Preparación:** Posición 12 de 15 en `s-v2-http-01`. Solicitudes previas tras el reset: X:250 (`PING;64`), X:251 (`PING;64`), X:252 (HEAD /health), X:253 (POST /health), X:254 (GET /__reset), X:255 (POST /__reset), X:256 (`PING;64`), X:257 (`PING;64`), X:258 (`null`), X:259 (`5`), X:260 (`"PING;64"`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":null}'
```

**Respuesta del original** (v2): status 400

```
{"error":"E102","mensaje":"falta m"}
```

**Respuesta de la réplica:** status 400 — coincide

```
{"error":"E102","mensaje":"falta m"}
```

**Conclusión:** Comportamiento de v2: m null da E102.

**Etiqueta de evidencia:** Comportamiento de v2 sin línea base en v1

#### X:262 — POST /msg PING;64

**Pregunta (hipótesis):** Campo extra en el JSON: ¿se ignora?

**Preparación:** Posición 13 de 15 en `s-v2-http-01`. Solicitudes previas tras el reset: X:250 (`PING;64`), X:251 (`PING;64`), X:252 (HEAD /health), X:253 (POST /health), X:254 (GET /__reset), X:255 (POST /__reset), X:256 (`PING;64`), X:257 (`PING;64`), X:258 (`null`), X:259 (`5`), X:260 (`"PING;64"`), X:261 (`{"m":null}`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"PING;64","x":1}'
```

**Respuesta del original** (v2): status 200

```
{"pong":true}
```

**Respuesta de la réplica:** status 200 — coincide

```
{"pong":true}
```

**Conclusión:** Comportamiento de v2: un campo extra en el JSON se ignora (200 pong).

**Etiqueta de evidencia:** Comportamiento de v2 sin línea base en v1

#### X:263 — POST /msg 

**Pregunta (hipótesis):** Cuerpo vacío: ¿E100 o E102?

**Preparación:** Posición 14 de 15 en `s-v2-http-01`. Solicitudes previas tras el reset: X:250 (`PING;64`), X:251 (`PING;64`), X:252 (HEAD /health), X:253 (POST /health), X:254 (GET /__reset), X:255 (POST /__reset), X:256 (`PING;64`), X:257 (`PING;64`), X:258 (`null`), X:259 (`5`), X:260 (`"PING;64"`), X:261 (`{"m":null}`), X:262 (`PING;64`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw ''
```

**Respuesta del original** (v2): status 400

```
{"error":"E100","mensaje":"json inválido"}
```

**Respuesta de la réplica:** status 400 — coincide

```
{"error":"E100","mensaje":"json inválido"}
```

**Conclusión:** Comportamiento de v2: cuerpo vacío da E100.

**Etiqueta de evidencia:** Comportamiento de v2 sin línea base en v1

#### X:264 — POST /msg PING;64

**Pregunta (hipótesis):** Content-Type text/plain con JSON válido: ¿se acepta?

**Preparación:** Posición 15 de 15 en `s-v2-http-01`. Solicitudes previas tras el reset: X:250 (`PING;64`), X:251 (`PING;64`), X:252 (HEAD /health), X:253 (POST /health), X:254 (GET /__reset), X:255 (POST /__reset), X:256 (`PING;64`), X:257 (`PING;64`), X:258 (`null`), X:259 (`5`), X:260 (`"PING;64"`), X:261 (`{"m":null}`), X:262 (`PING;64`), X:263 (``).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"PING;64"}'
```

**Respuesta del original** (v2): status 200

```
{"pong":true}
```

**Respuesta de la réplica:** status 200 — coincide

```
{"pong":true}
```

**Conclusión:** Comportamiento de v2: Content-Type text/plain con JSON válido se acepta (200 pong).

**Etiqueta de evidencia:** Comportamiento de v2 sin línea base en v1

### s-v2-max-01 — v2, X:265–X:276

#### X:265 — POST /msg ALTA;Ana;50

**Pregunta (hipótesis):** Preparación: AC-0001

**Preparación:** Posición 1 de 12 en `s-v2-max-01`. Estado vacío tras `POST /__reset`.

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"ALTA;Ana;50"}'
```

**Respuesta del original** (v2): status 201

```
{"cuentaId":"AC-0001"}
```

**Respuesta de la réplica:** status 201 — coincide

```
{"cuentaId":"AC-0001"}
```

**Conclusión:** Preparación (201 AC-0001).

**Etiqueta de evidencia:** Preparación

#### X:266 — POST /msg DEPOSITO;AC-0001;999999;4

**Pregunta (hipótesis):** Máximo de DEPOSITO en v2: aceptado 500000, rechazado 100000000000; ¿999999?

**Preparación:** Posición 2 de 12 en `s-v2-max-01`. Solicitudes previas tras el reset: X:265 (`ALTA;Ana;50`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"DEPOSITO;AC-0001;999999;4"}'
```

**Respuesta del original** (v2): status 200

```
{"status":"recieved","operacionId":"OP-0001"}
```

**Respuesta de la réplica:** status 200 — coincide

```
{"status":"recieved","operacionId":"OP-0001"}
```

**Conclusión:** Máximo de DEPOSITO en v2: 999999 aceptado.

**Etiqueta de evidencia:** Observación

#### X:267 — POST /msg DEPOSITO;AC-0001;1000000;51

**Pregunta (hipótesis):** Máximo de DEPOSITO en v2: aceptado 999999, rechazado 100000000000; ¿1000000?

**Preparación:** Posición 3 de 12 en `s-v2-max-01`. Solicitudes previas tras el reset: X:265 (`ALTA;Ana;50`), X:266 (`DEPOSITO;AC-0001;999999;4`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"DEPOSITO;AC-0001;1000000;51"}'
```

**Respuesta del original** (v2): status 200

```
{"status":"recieved","operacionId":"OP-0002"}
```

**Respuesta de la réplica:** status 200 — coincide

```
{"status":"recieved","operacionId":"OP-0002"}
```

**Conclusión:** Máximo de DEPOSITO en v2: 1000000 aceptado.

**Etiqueta de evidencia:** Observación

#### X:268 — POST /msg DEPOSITO;AC-0001;1000001;48

**Pregunta (hipótesis):** Máximo de DEPOSITO en v2: aceptado 1000000, rechazado 100000000000; ¿1000001?

**Preparación:** Posición 4 de 12 en `s-v2-max-01`. Solicitudes previas tras el reset: X:265 (`ALTA;Ana;50`), X:266 (`DEPOSITO;AC-0001;999999;4`), X:267 (`DEPOSITO;AC-0001;1000000;51`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"DEPOSITO;AC-0001;1000001;48"}'
```

**Respuesta del original** (v2): status 200

```
{"status":"recieved","operacionId":"OP-0003"}
```

**Respuesta de la réplica:** status 200 — coincide

```
{"status":"recieved","operacionId":"OP-0003"}
```

**Conclusión:** Máximo de DEPOSITO en v2: 1000001 aceptado.

**Etiqueta de evidencia:** Observación

#### X:269 — POST /msg DEPOSITO;AC-0001;316227924;96

**Pregunta (hipótesis):** Máximo de DEPOSITO en v2: aceptado 1000001, rechazado 100000000000; ¿316227924?

**Preparación:** Posición 5 de 12 en `s-v2-max-01`. Solicitudes previas tras el reset: X:265 (`ALTA;Ana;50`), X:266 (`DEPOSITO;AC-0001;999999;4`), X:267 (`DEPOSITO;AC-0001;1000000;51`), X:268 (`DEPOSITO;AC-0001;1000001;48`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"DEPOSITO;AC-0001;316227924;96"}'
```

**Respuesta del original** (v2): status 200

```
{"status":"recieved","operacionId":"OP-0004"}
```

**Respuesta de la réplica:** status 200 — coincide

```
{"status":"recieved","operacionId":"OP-0004"}
```

**Conclusión:** Máximo de DEPOSITO en v2: 316227924 aceptado.

**Etiqueta de evidencia:** Observación

#### X:270 — POST /msg DEPOSITO;AC-0001;5623414656;60

**Pregunta (hipótesis):** Máximo de DEPOSITO en v2: aceptado 316227924, rechazado 100000000000; ¿5623414656?

**Preparación:** Posición 6 de 12 en `s-v2-max-01`. Solicitudes previas tras el reset: X:265 (`ALTA;Ana;50`), X:266 (`DEPOSITO;AC-0001;999999;4`), X:267 (`DEPOSITO;AC-0001;1000000;51`), X:268 (`DEPOSITO;AC-0001;1000001;48`), X:269 (`DEPOSITO;AC-0001;316227924;96`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"DEPOSITO;AC-0001;5623414656;60"}'
```

**Respuesta del original** (v2): status 200

```
{"status":"recieved","operacionId":"OP-0005"}
```

**Respuesta de la réplica:** status 200 — coincide

```
{"status":"recieved","operacionId":"OP-0005"}
```

**Conclusión:** Máximo de DEPOSITO en v2: 5623414656 aceptado.

**Etiqueta de evidencia:** Observación

#### X:271 — POST /msg DEPOSITO;AC-0001;23713740017;45

**Pregunta (hipótesis):** Máximo de DEPOSITO en v2: aceptado 5623414656, rechazado 100000000000; ¿23713740017?

**Preparación:** Posición 7 de 12 en `s-v2-max-01`. Solicitudes previas tras el reset: X:265 (`ALTA;Ana;50`), X:266 (`DEPOSITO;AC-0001;999999;4`), X:267 (`DEPOSITO;AC-0001;1000000;51`), X:268 (`DEPOSITO;AC-0001;1000001;48`), X:269 (`DEPOSITO;AC-0001;316227924;96`), X:270 (`DEPOSITO;AC-0001;5623414656;60`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"DEPOSITO;AC-0001;23713740017;45"}'
```

**Respuesta del original** (v2): status 400

```
{"error":"E303","mensaje":"monto inválido"}
```

**Respuesta de la réplica:** status 400 — coincide

```
{"error":"E303","mensaje":"monto inválido"}
```

**Conclusión:** Máximo de DEPOSITO en v2: 23713740017 da E303.

**Etiqueta de evidencia:** Observación

#### X:272 — POST /msg DEPOSITO;AC-0001;14668577336;85

**Pregunta (hipótesis):** Máximo de DEPOSITO en v2: aceptado 5623414656, rechazado 23713740017; ¿14668577336?

**Preparación:** Posición 8 de 12 en `s-v2-max-01`. Solicitudes previas tras el reset: X:265 (`ALTA;Ana;50`), X:266 (`DEPOSITO;AC-0001;999999;4`), X:267 (`DEPOSITO;AC-0001;1000000;51`), X:268 (`DEPOSITO;AC-0001;1000001;48`), X:269 (`DEPOSITO;AC-0001;316227924;96`), X:270 (`DEPOSITO;AC-0001;5623414656;60`), X:271 (`DEPOSITO;AC-0001;23713740017;45`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"DEPOSITO;AC-0001;14668577336;85"}'
```

**Respuesta del original** (v2): status 400

```
{"error":"E303","mensaje":"monto inválido"}
```

**Respuesta de la réplica:** status 400 — coincide

```
{"error":"E303","mensaje":"monto inválido"}
```

**Conclusión:** Máximo de DEPOSITO en v2: 14668577336 da E303.

**Etiqueta de evidencia:** Observación

#### X:273 — POST /msg DEPOSITO;AC-0001;10145995996;55

**Pregunta (hipótesis):** Máximo de DEPOSITO en v2: aceptado 5623414656, rechazado 14668577336; ¿10145995996?

**Preparación:** Posición 9 de 12 en `s-v2-max-01`. Solicitudes previas tras el reset: X:265 (`ALTA;Ana;50`), X:266 (`DEPOSITO;AC-0001;999999;4`), X:267 (`DEPOSITO;AC-0001;1000000;51`), X:268 (`DEPOSITO;AC-0001;1000001;48`), X:269 (`DEPOSITO;AC-0001;316227924;96`), X:270 (`DEPOSITO;AC-0001;5623414656;60`), X:271 (`DEPOSITO;AC-0001;23713740017;45`), X:272 (`DEPOSITO;AC-0001;14668577336;85`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"DEPOSITO;AC-0001;10145995996;55"}'
```

**Respuesta del original** (v2): status 400

```
{"error":"E303","mensaje":"monto inválido"}
```

**Respuesta de la réplica:** status 400 — coincide

```
{"error":"E303","mensaje":"monto inválido"}
```

**Conclusión:** Máximo de DEPOSITO en v2: 10145995996 da E303. El máximo está en [5623414656, 10145995996); no se distingue si es por monto o por saldo acumulado (saldo previo 5942642580).

**Etiqueta de evidencia:** Observación

#### X:274 — POST /msg ALTA;Beto;11

**Pregunta (hipótesis):** Preparación: AC-0002

**Preparación:** Posición 10 de 12 en `s-v2-max-01`. Solicitudes previas tras el reset: X:265 (`ALTA;Ana;50`), X:266 (`DEPOSITO;AC-0001;999999;4`), X:267 (`DEPOSITO;AC-0001;1000000;51`), X:268 (`DEPOSITO;AC-0001;1000001;48`), X:269 (`DEPOSITO;AC-0001;316227924;96`), X:270 (`DEPOSITO;AC-0001;5623414656;60`), X:271 (`DEPOSITO;AC-0001;23713740017;45`), X:272 (`DEPOSITO;AC-0001;14668577336;85`), X:273 (`DEPOSITO;AC-0001;10145995996;55`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"ALTA;Beto;11"}'
```

**Respuesta del original** (v2): status 201

```
{"cuentaId":"AC-0002"}
```

**Respuesta de la réplica:** status 201 — coincide

```
{"cuentaId":"AC-0002"}
```

**Conclusión:** Preparación (201 AC-0002).

**Etiqueta de evidencia:** Preparación

#### X:275 — POST /msg TRANSFER;AC-0001;AC-0002;100000000000;7

**Pregunta (hipótesis):** TRANSFER de 10^11: ¿E303 (mismo máximo que DEPOSITO) o E506 (límite)?

**Preparación:** Posición 11 de 12 en `s-v2-max-01`. Solicitudes previas tras el reset: X:265 (`ALTA;Ana;50`), X:266 (`DEPOSITO;AC-0001;999999;4`), X:267 (`DEPOSITO;AC-0001;1000000;51`), X:268 (`DEPOSITO;AC-0001;1000001;48`), X:269 (`DEPOSITO;AC-0001;316227924;96`), X:270 (`DEPOSITO;AC-0001;5623414656;60`), X:271 (`DEPOSITO;AC-0001;23713740017;45`), X:272 (`DEPOSITO;AC-0001;14668577336;85`), X:273 (`DEPOSITO;AC-0001;10145995996;55`), X:274 (`ALTA;Beto;11`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"TRANSFER;AC-0001;AC-0002;100000000000;7"}'
```

**Respuesta del original** (v2): status 400

```
{"error":"E303","mensaje":"monto inválido"}
```

**Respuesta de la réplica:** status 400 — coincide

```
{"error":"E303","mensaje":"monto inválido"}
```

**Conclusión:** Comportamiento de v2: TRANSFER de 10^11 da E303, no E506: el máximo de monto se valida antes que el límite de transferencia.

**Etiqueta de evidencia:** Comportamiento de v2 sin línea base en v1

#### X:276 — POST /msg TRANSFER;AC-0001;AC-0002;1000001;11

**Pregunta (hipótesis):** TRANSFER de 1000001: ¿E303 o E506?

**Preparación:** Posición 12 de 12 en `s-v2-max-01`. Solicitudes previas tras el reset: X:265 (`ALTA;Ana;50`), X:266 (`DEPOSITO;AC-0001;999999;4`), X:267 (`DEPOSITO;AC-0001;1000000;51`), X:268 (`DEPOSITO;AC-0001;1000001;48`), X:269 (`DEPOSITO;AC-0001;316227924;96`), X:270 (`DEPOSITO;AC-0001;5623414656;60`), X:271 (`DEPOSITO;AC-0001;23713740017;45`), X:272 (`DEPOSITO;AC-0001;14668577336;85`), X:273 (`DEPOSITO;AC-0001;10145995996;55`), X:274 (`ALTA;Beto;11`), X:275 (`TRANSFER;AC-0001;AC-0002;100000000000;7`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"TRANSFER;AC-0001;AC-0002;1000001;11"}'
```

**Respuesta del original** (v2): status 422

```
{"error":"E506","mensaje":"límite excedido"}
```

**Respuesta de la réplica:** status 422 — coincide

```
{"error":"E506","mensaje":"límite excedido"}
```

**Conclusión:** Comportamiento de v2: TRANSFER de 1000001 da E506 (supera 50000 y está bajo el máximo de monto).

**Etiqueta de evidencia:** Comportamiento de v2 sin línea base en v1

### s-v2-max-02 — v2, X:277–X:281

#### X:277 — POST /msg ALTA;Ana;50

**Pregunta (hipótesis):** Preparación: AC-0001 con saldo 0

**Preparación:** Posición 1 de 5 en `s-v2-max-02`. Estado vacío tras `POST /__reset`.

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"ALTA;Ana;50"}'
```

**Respuesta del original** (v2): status 201

```
{"cuentaId":"AC-0001"}
```

**Respuesta de la réplica:** status 201 — coincide

```
{"cuentaId":"AC-0001"}
```

**Conclusión:** Preparación (201 AC-0001, saldo 0).

**Etiqueta de evidencia:** Preparación

#### X:278 — POST /msg DEPOSITO;AC-0001;10000000000;63

**Pregunta (hipótesis):** Máximo de DEPOSITO: con saldo 0, ¿10^10 da E303?

**Preparación:** Posición 2 de 5 en `s-v2-max-02`. Solicitudes previas tras el reset: X:277 (`ALTA;Ana;50`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"DEPOSITO;AC-0001;10000000000;63"}'
```

**Respuesta del original** (v2): status 400

```
{"error":"E303","mensaje":"monto inválido"}
```

**Respuesta de la réplica:** status 400 — coincide

```
{"error":"E303","mensaje":"monto inválido"}
```

**Conclusión:** Comportamiento de v2: con saldo 0, DEPOSITO de 10000000000 (10^10) da E303. El máximo es por monto, no por saldo.

**Etiqueta de evidencia:** Comportamiento de v2 sin línea base en v1

#### X:279 — POST /msg DEPOSITO;AC-0001;9999999999;4

**Pregunta (hipótesis):** Máximo de DEPOSITO: ¿10 dígitos (9999999999) se aceptan con saldo 0?

**Preparación:** Posición 3 de 5 en `s-v2-max-02`. Solicitudes previas tras el reset: X:277 (`ALTA;Ana;50`), X:278 (`DEPOSITO;AC-0001;10000000000;63`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"DEPOSITO;AC-0001;9999999999;4"}'
```

**Respuesta del original** (v2): status 200

```
{"status":"recieved","operacionId":"OP-0001"}
```

**Respuesta de la réplica:** status 200 — coincide

```
{"status":"recieved","operacionId":"OP-0001"}
```

**Conclusión:** Comportamiento de v2: DEPOSITO de 9999999999 (10 dígitos) se acepta. Con X:278, el monto máximo es 9999999999.

**Etiqueta de evidencia:** Comportamiento de v2 sin línea base en v1

#### X:280 — POST /msg DEPOSITO;AC-0001;9999999999;4

**Pregunta (hipótesis):** Tope por saldo: segundo 9999999999 (saldo 19999999998). Si se acepta, el máximo es por monto

**Preparación:** Posición 4 de 5 en `s-v2-max-02`. Solicitudes previas tras el reset: X:277 (`ALTA;Ana;50`), X:278 (`DEPOSITO;AC-0001;10000000000;63`), X:279 (`DEPOSITO;AC-0001;9999999999;4`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"DEPOSITO;AC-0001;9999999999;4"}'
```

**Respuesta del original** (v2): status 200

```
{"status":"recieved","operacionId":"OP-0002"}
```

**Respuesta de la réplica:** status 200 — coincide

```
{"status":"recieved","operacionId":"OP-0002"}
```

**Conclusión:** Comportamiento de v2: un segundo 9999999999 se acepta (saldo 19999999998): no hay tope por saldo acumulado.

**Etiqueta de evidencia:** Comportamiento de v2 sin línea base en v1

#### X:281 — POST /msg CONSULTA;AC-0001;14

**Pregunta (hipótesis):** Formato de un saldo enorme

**Preparación:** Posición 5 de 5 en `s-v2-max-02`. Solicitudes previas tras el reset: X:277 (`ALTA;Ana;50`), X:278 (`DEPOSITO;AC-0001;10000000000;63`), X:279 (`DEPOSITO;AC-0001;9999999999;4`), X:280 (`DEPOSITO;AC-0001;9999999999;4`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"CONSULTA;AC-0001;14"}'
```

**Respuesta del original** (v2): status 200

```
{"cuenta_id":"AC-0001","saldo":"199999999.98"}
```

**Respuesta de la réplica:** status 200 — coincide

```
{"cuenta_id":"AC-0001","saldo":"199999999.98"}
```

**Conclusión:** CAMBIO 1 (v2): el saldo 19999999998 se muestra como "199999999.98", sin separador de miles ni pérdida de precisión.

**Etiqueta de evidencia:** Cambio de versión probado

### s-v2-ctl-02 — v2, X:282–X:291

#### X:282 — POST /msg ALTA;Ana;050

**Pregunta (hipótesis):** Control con cero a la izquierda en un comando distinto de PING (válido 50): ¿201 o E202/E201?

**Preparación:** Posición 1 de 10 en `s-v2-ctl-02`. Estado vacío tras `POST /__reset`.

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"ALTA;Ana;050"}'
```

**Respuesta del original** (v2): status 400

```
{"error":"E201","mensaje":"control mal formado"}
```

**Respuesta de la réplica:** status 400 — coincide

```
{"error":"E201","mensaje":"control mal formado"}
```

**Conclusión:** Comportamiento de v2 (sin línea base en v1): control '050' en ALTA (valor 50, válido) da E201. Un control con cero a la izquierda y 3 caracteres es mal formado fuera de PING.

**Etiqueta de evidencia:** Comportamiento de v2 sin línea base en v1

#### X:283 — POST /msg ALTA;Ana;+50

**Pregunta (hipótesis):** Control con signo +: ¿E201?

**Preparación:** Posición 2 de 10 en `s-v2-ctl-02`. Solicitudes previas tras el reset: X:282 (`ALTA;Ana;050`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"ALTA;Ana;+50"}'
```

**Respuesta del original** (v2): status 400

```
{"error":"E201","mensaje":"control mal formado"}
```

**Respuesta de la réplica:** status 400 — coincide

```
{"error":"E201","mensaje":"control mal formado"}
```

**Conclusión:** Comportamiento de v2: control '+50' da E201.

**Etiqueta de evidencia:** Comportamiento de v2 sin línea base en v1

#### X:284 — POST /msg ALTA;Ana; 50

**Pregunta (hipótesis):** Control con espacio inicial: ¿E201 o se recorta?

**Preparación:** Posición 3 de 10 en `s-v2-ctl-02`. Solicitudes previas tras el reset: X:282 (`ALTA;Ana;050`), X:283 (`ALTA;Ana;+50`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"ALTA;Ana; 50"}'
```

**Respuesta del original** (v2): status 400

```
{"error":"E201","mensaje":"control mal formado"}
```

**Respuesta de la réplica:** status 400 — coincide

```
{"error":"E201","mensaje":"control mal formado"}
```

**Conclusión:** Comportamiento de v2: control ' 50' (espacio inicial) da E201.

**Etiqueta de evidencia:** Comportamiento de v2 sin línea base en v1

#### X:285 — POST /msg ALTA;Ana;150

**Pregunta (hipótesis):** Control numérico mayor que 98: ¿E202?

**Preparación:** Posición 4 de 10 en `s-v2-ctl-02`. Solicitudes previas tras el reset: X:282 (`ALTA;Ana;050`), X:283 (`ALTA;Ana;+50`), X:284 (`ALTA;Ana; 50`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"ALTA;Ana;150"}'
```

**Respuesta del original** (v2): status 400

```
{"error":"E201","mensaje":"control mal formado"}
```

**Respuesta de la réplica:** status 400 — coincide

```
{"error":"E201","mensaje":"control mal formado"}
```

**Conclusión:** Comportamiento de v2 (sin línea base en v1): control '150' da E201, no E202. Junto con X:282, un control de más de 2 caracteres es mal formado.

**Etiqueta de evidencia:** Comportamiento de v2 sin línea base en v1

#### X:286 — POST /msg  PING;64

**Pregunta (hipótesis):** Espacio antes del comando: ¿E301 o pong?

**Preparación:** Posición 5 de 10 en `s-v2-ctl-02`. Solicitudes previas tras el reset: X:282 (`ALTA;Ana;050`), X:283 (`ALTA;Ana;+50`), X:284 (`ALTA;Ana; 50`), X:285 (`ALTA;Ana;150`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":" PING;64"}'
```

**Respuesta del original** (v2): status 400

```
{"error":"E301","mensaje":"comando desconocido ","sugerencia":"PING"}
```

**Respuesta de la réplica:** status 400 — coincide

```
{"error":"E301","mensaje":"comando desconocido ","sugerencia":"PING"}
```

**Conclusión:** Comportamiento de v2 (sin línea base en v1): ' PING;64' da 400 E301 con un campo nuevo "sugerencia": "PING". El cuerpo de E301 sin sugerencia se mantiene para SALDOS (X:42 v1 = X:126 v2).

**Etiqueta de evidencia:** Comportamiento de v2 sin línea base en v1

#### X:287 — POST /msg ALTA ;Ana;50

**Pregunta (hipótesis):** Espacio después del comando (control válido): ¿E301 o 201?

**Preparación:** Posición 6 de 10 en `s-v2-ctl-02`. Solicitudes previas tras el reset: X:282 (`ALTA;Ana;050`), X:283 (`ALTA;Ana;+50`), X:284 (`ALTA;Ana; 50`), X:285 (`ALTA;Ana;150`), X:286 (` PING;64`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"ALTA ;Ana;50"}'
```

**Respuesta del original** (v2): status 400

```
{"error":"E301","mensaje":"comando desconocido ","sugerencia":"ALTA"}
```

**Respuesta de la réplica:** status 400 — coincide

```
{"error":"E301","mensaje":"comando desconocido ","sugerencia":"ALTA"}
```

**Conclusión:** Comportamiento de v2 (sin línea base en v1): 'ALTA ;Ana;50' da 400 E301 con "sugerencia": "ALTA".

**Etiqueta de evidencia:** Comportamiento de v2 sin línea base en v1

#### X:288 — POST /msg ALTA;Ana2;97

**Pregunta (hipótesis):** Nombre con dígito: ¿201?

**Preparación:** Posición 7 de 10 en `s-v2-ctl-02`. Solicitudes previas tras el reset: X:282 (`ALTA;Ana;050`), X:283 (`ALTA;Ana;+50`), X:284 (`ALTA;Ana; 50`), X:285 (`ALTA;Ana;150`), X:286 (` PING;64`), X:287 (`ALTA ;Ana;50`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"ALTA;Ana2;97"}'
```

**Respuesta del original** (v2): status 201

```
{"cuentaId":"AC-0001"}
```

**Respuesta de la réplica:** status 201 — coincide

```
{"cuentaId":"AC-0001"}
```

**Conclusión:** Comportamiento de v2: nombre con dígito se acepta (201).

**Etiqueta de evidencia:** Comportamiento de v2 sin línea base en v1

#### X:289 — POST /msg ALTA;Ana-María;49

**Pregunta (hipótesis):** Nombre con guion y acento: ¿201?

**Preparación:** Posición 8 de 10 en `s-v2-ctl-02`. Solicitudes previas tras el reset: X:282 (`ALTA;Ana;050`), X:283 (`ALTA;Ana;+50`), X:284 (`ALTA;Ana; 50`), X:285 (`ALTA;Ana;150`), X:286 (` PING;64`), X:287 (`ALTA ;Ana;50`), X:288 (`ALTA;Ana2;97`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"ALTA;Ana-María;49"}'
```

**Respuesta del original** (v2): status 201

```
{"cuentaId":"AC-0002"}
```

**Respuesta de la réplica:** status 201 — coincide

```
{"cuentaId":"AC-0002"}
```

**Conclusión:** Comportamiento de v2: nombre con guion y acento se acepta (201).

**Etiqueta de evidencia:** Comportamiento de v2 sin línea base en v1

#### X:290 — POST /msg ALTA;AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA;86

**Pregunta (hipótesis):** Nombre de 60 caracteres: ¿201 o hay longitud máxima?

**Preparación:** Posición 9 de 10 en `s-v2-ctl-02`. Solicitudes previas tras el reset: X:282 (`ALTA;Ana;050`), X:283 (`ALTA;Ana;+50`), X:284 (`ALTA;Ana; 50`), X:285 (`ALTA;Ana;150`), X:286 (` PING;64`), X:287 (`ALTA ;Ana;50`), X:288 (`ALTA;Ana2;97`), X:289 (`ALTA;Ana-María;49`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"ALTA;AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA;86"}'
```

**Respuesta del original** (v2): status 201

```
{"cuentaId":"AC-0003"}
```

**Respuesta de la réplica:** status 201 — coincide

```
{"cuentaId":"AC-0003"}
```

**Conclusión:** Comportamiento de v2: nombre de 60 caracteres se acepta (201).

**Etiqueta de evidencia:** Comportamiento de v2 sin línea base en v1

#### X:291 — POST /msg ANULA;OP-0001;X;45

**Pregunta (hipótesis):** ANULA con un argumento extra (control válido): ¿E302?

**Preparación:** Posición 10 de 10 en `s-v2-ctl-02`. Solicitudes previas tras el reset: X:282 (`ALTA;Ana;050`), X:283 (`ALTA;Ana;+50`), X:284 (`ALTA;Ana; 50`), X:285 (`ALTA;Ana;150`), X:286 (` PING;64`), X:287 (`ALTA ;Ana;50`), X:288 (`ALTA;Ana2;97`), X:289 (`ALTA;Ana-María;49`), X:290 (`ALTA;AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA;86`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"ANULA;OP-0001;X;45"}'
```

**Respuesta del original** (v2): status 400

```
{"error":"E302","mensaje":"aridad inválida"}
```

**Respuesta de la réplica:** status 400 — coincide

```
{"error":"E302","mensaje":"aridad inválida"}
```

**Conclusión:** Comportamiento de v2: ANULA con un argumento extra da E302.

**Etiqueta de evidencia:** Comportamiento de v2 sin línea base en v1

### s-v2-e507-01 — v2, X:292–X:296

#### X:292 — POST /msg ALTA;Ana;50

**Pregunta (hipótesis):** Preparación: AC-0001

**Preparación:** Posición 1 de 5 en `s-v2-e507-01`. Estado vacío tras `POST /__reset`.

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"ALTA;Ana;50"}'
```

**Respuesta del original** (v2): status 201

```
{"cuentaId":"AC-0001"}
```

**Respuesta de la réplica:** status 201 — coincide

```
{"cuentaId":"AC-0001"}
```

**Conclusión:** Preparación (201 AC-0001).

**Etiqueta de evidencia:** Preparación

#### X:293 — POST /msg ALTA;Beto;11

**Pregunta (hipótesis):** Preparación: AC-0002

**Preparación:** Posición 2 de 5 en `s-v2-e507-01`. Solicitudes previas tras el reset: X:292 (`ALTA;Ana;50`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"ALTA;Beto;11"}'
```

**Respuesta del original** (v2): status 201

```
{"cuentaId":"AC-0002"}
```

**Respuesta de la réplica:** status 201 — coincide

```
{"cuentaId":"AC-0002"}
```

**Conclusión:** Preparación (201 AC-0002).

**Etiqueta de evidencia:** Preparación

#### X:294 — POST /msg DEPOSITO;AC-0001;1000;35

**Pregunta (hipótesis):** Preparación: AC-0001 = 1000

**Preparación:** Posición 3 de 5 en `s-v2-e507-01`. Solicitudes previas tras el reset: X:292 (`ALTA;Ana;50`), X:293 (`ALTA;Beto;11`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"DEPOSITO;AC-0001;1000;35"}'
```

**Respuesta del original** (v2): status 200

```
{"status":"recieved","operacionId":"OP-0001"}
```

**Respuesta de la réplica:** status 200 — coincide

```
{"status":"recieved","operacionId":"OP-0001"}
```

**Conclusión:** Preparación (200 OP-0001).

**Etiqueta de evidencia:** Preparación

#### X:295 — POST /msg TRANSFER;AC-0001;AC-0002;1000;37

**Pregunta (hipótesis):** TRANSFER por el saldo exacto del origen: ¿200 o E507?

**Preparación:** Posición 4 de 5 en `s-v2-e507-01`. Solicitudes previas tras el reset: X:292 (`ALTA;Ana;50`), X:293 (`ALTA;Beto;11`), X:294 (`DEPOSITO;AC-0001;1000;35`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"TRANSFER;AC-0001;AC-0002;1000;37"}'
```

**Respuesta del original** (v2): status 200

```
{"status":"recieved","operacionId":"OP-0002"}
```

**Respuesta de la réplica:** status 200 — coincide

```
{"status":"recieved","operacionId":"OP-0002"}
```

**Conclusión:** Comportamiento de v2: TRANSFER por el saldo exacto del origen se acepta (200); E507 solo cuando el monto supera el saldo.

**Etiqueta de evidencia:** Comportamiento de v2 sin línea base en v1

#### X:296 — POST /msg CONSULTA;AC-0001;14

**Pregunta (hipótesis):** Saldo del origen tras transferir todo

**Preparación:** Posición 5 de 5 en `s-v2-e507-01`. Solicitudes previas tras el reset: X:292 (`ALTA;Ana;50`), X:293 (`ALTA;Beto;11`), X:294 (`DEPOSITO;AC-0001;1000;35`), X:295 (`TRANSFER;AC-0001;AC-0002;1000;37`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"CONSULTA;AC-0001;14"}'
```

**Respuesta del original** (v2): status 200

```
{"cuenta_id":"AC-0001","saldo":"0.00"}
```

**Respuesta de la réplica:** status 200 — coincide

```
{"cuenta_id":"AC-0001","saldo":"0.00"}
```

**Conclusión:** Saldo del origen "0.00" tras transferir todo.

**Etiqueta de evidencia:** Observación

### s-v2-http-02 — v2, X:297–X:299

#### X:297 — PUT /msg PING;64

**Pregunta (hipótesis):** PUT /msg: ¿404 E404?

**Preparación:** Posición 1 de 3 en `s-v2-http-02`. Estado vacío tras `POST /__reset`.

**Solicitud:** PUT `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X PUT \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"PING;64"}'
```

**Respuesta del original** (v2): status 404

```
{"error":"E404","mensaje":"ruta desconocida"}
```

**Respuesta de la réplica:** status 404 — coincide

```
{"error":"E404","mensaje":"ruta desconocida"}
```

**Conclusión:** Comportamiento de v2: PUT /msg da 404 E404.

**Etiqueta de evidencia:** Comportamiento de v2 sin línea base en v1

#### X:298 — DELETE /msg PING;64

**Pregunta (hipótesis):** DELETE /msg: ¿404 E404?

**Preparación:** Posición 2 de 3 en `s-v2-http-02`. Solicitudes previas tras el reset: X:297 (`PING;64`).

**Solicitud:** DELETE `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X DELETE \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"PING;64"}'
```

**Respuesta del original** (v2): status 404

```
{"error":"E404","mensaje":"ruta desconocida"}
```

**Respuesta de la réplica:** status 404 — coincide

```
{"error":"E404","mensaje":"ruta desconocida"}
```

**Conclusión:** Comportamiento de v2: DELETE /msg da 404 E404.

**Etiqueta de evidencia:** Comportamiento de v2 sin línea base en v1

#### X:299 — POST /__reset

**Pregunta (hipótesis):** POST /__reset con el token del equipo: status y cuerpo de la respuesta

**Preparación:** Posición 3 de 3 en `s-v2-http-02`. Solicitudes previas tras el reset: X:297 (`PING;64`), X:298 (`PING;64`).

**Solicitud:** POST `/__reset`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/__reset" \
  -H "Authorization: Bearer $TEAM_TOKEN"
```

**Respuesta del original** (v2): status 200

```
{"ok":true}
```

**Respuesta de la réplica:** status 200 — coincide

```
{"ok":true}
```

**Conclusión:** Comportamiento de v2: POST /__reset con el token del equipo da 200 {"ok": true}.

**Etiqueta de evidencia:** Comportamiento de v2 sin línea base en v1

### s-v2-sug-01 — v2, X:300–X:310

#### X:300 — POST /msg PIN;87

**Pregunta (hipótesis):** Sugerencia: 'PIN' (distancia 1 de PING, control válido): ¿E301 con sugerencia PING?

**Preparación:** Posición 1 de 11 en `s-v2-sug-01`. Estado vacío tras `POST /__reset`.

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"PIN;87"}'
```

**Respuesta del original** (v2): status 400

```
{"error":"E301","mensaje":"comando desconocido ","sugerencia":"PING"}
```

**Respuesta de la réplica:** status 400 — coincide

```
{"error":"E301","mensaje":"comando desconocido ","sugerencia":"PING"}
```

**Conclusión:** Comportamiento de v2 (sin línea base en v1): 'PIN' da E301 con "sugerencia": "PING" (distancia de edición 1).

**Etiqueta de evidencia:** Comportamiento de v2 sin línea base en v1

#### X:301 — POST /msg PINGG;28

**Pregunta (hipótesis):** Sugerencia: 'PINGG' (distancia 1 de PING): ¿sugerencia?

**Preparación:** Posición 2 de 11 en `s-v2-sug-01`. Solicitudes previas tras el reset: X:300 (`PIN;87`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"PINGG;28"}'
```

**Respuesta del original** (v2): status 400

```
{"error":"E301","mensaje":"comando desconocido ","sugerencia":"PING"}
```

**Respuesta de la réplica:** status 400 — coincide

```
{"error":"E301","mensaje":"comando desconocido ","sugerencia":"PING"}
```

**Conclusión:** Comportamiento de v2: 'PINGG' da E301 con sugerencia PING (distancia 1).

**Etiqueta de evidencia:** Comportamiento de v2 sin línea base en v1

#### X:302 — POST /msg DEPOSITOS;AC-0001;100;67

**Pregunta (hipótesis):** Sugerencia: 'DEPOSITOS' (prefijo DEPOSITO + S): ¿sugerencia DEPOSITO?

**Preparación:** Posición 3 de 11 en `s-v2-sug-01`. Solicitudes previas tras el reset: X:300 (`PIN;87`), X:301 (`PINGG;28`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"DEPOSITOS;AC-0001;100;67"}'
```

**Respuesta del original** (v2): status 400

```
{"error":"E301","mensaje":"comando desconocido ","sugerencia":"DEPOSITO"}
```

**Respuesta de la réplica:** status 400 — coincide

```
{"error":"E301","mensaje":"comando desconocido ","sugerencia":"DEPOSITO"}
```

**Conclusión:** Comportamiento de v2: 'DEPOSITOS' da E301 con sugerencia DEPOSITO (distancia 1).

**Etiqueta de evidencia:** Comportamiento de v2 sin línea base en v1

#### X:303 — POST /msg CONSULT;AC-0001;41

**Pregunta (hipótesis):** Sugerencia: 'CONSULT' (prefijo de CONSULTA): ¿sugerencia?

**Preparación:** Posición 4 de 11 en `s-v2-sug-01`. Solicitudes previas tras el reset: X:300 (`PIN;87`), X:301 (`PINGG;28`), X:302 (`DEPOSITOS;AC-0001;100;67`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"CONSULT;AC-0001;41"}'
```

**Respuesta del original** (v2): status 400

```
{"error":"E301","mensaje":"comando desconocido ","sugerencia":"CONSULTA"}
```

**Respuesta de la réplica:** status 400 — coincide

```
{"error":"E301","mensaje":"comando desconocido ","sugerencia":"CONSULTA"}
```

**Conclusión:** Comportamiento de v2: 'CONSULT' da E301 con sugerencia CONSULTA (distancia 1).

**Etiqueta de evidencia:** Comportamiento de v2 sin línea base en v1

#### X:304 — POST /msg ping ;64

**Pregunta (hipótesis):** Sugerencia: 'ping ' en minúsculas con espacio final: ¿sugerencia 'PING' en mayúsculas?

**Preparación:** Posición 5 de 11 en `s-v2-sug-01`. Solicitudes previas tras el reset: X:300 (`PIN;87`), X:301 (`PINGG;28`), X:302 (`DEPOSITOS;AC-0001;100;67`), X:303 (`CONSULT;AC-0001;41`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"ping ;64"}'
```

**Respuesta del original** (v2): status 400

```
{"error":"E301","mensaje":"comando desconocido ","sugerencia":"PING"}
```

**Respuesta de la réplica:** status 400 — coincide

```
{"error":"E301","mensaje":"comando desconocido ","sugerencia":"PING"}
```

**Conclusión:** Comportamiento de v2: 'ping ' da E301 con sugerencia 'PING' en mayúsculas: la comparación ignora mayúsculas (distancia 1 tras pasar a mayúsculas).

**Etiqueta de evidencia:** Comportamiento de v2 sin línea base en v1

#### X:305 — POST /msg AL TA;Ana;50

**Pregunta (hipótesis):** Sugerencia: espacio interno 'AL TA': ¿sugerencia ALTA?

**Preparación:** Posición 6 de 11 en `s-v2-sug-01`. Solicitudes previas tras el reset: X:300 (`PIN;87`), X:301 (`PINGG;28`), X:302 (`DEPOSITOS;AC-0001;100;67`), X:303 (`CONSULT;AC-0001;41`), X:304 (`ping ;64`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"AL TA;Ana;50"}'
```

**Respuesta del original** (v2): status 400

```
{"error":"E301","mensaje":"comando desconocido ","sugerencia":"ALTA"}
```

**Respuesta de la réplica:** status 400 — coincide

```
{"error":"E301","mensaje":"comando desconocido ","sugerencia":"ALTA"}
```

**Conclusión:** Comportamiento de v2: 'AL TA' da E301 con sugerencia ALTA (distancia 1).

**Etiqueta de evidencia:** Comportamiento de v2 sin línea base en v1

#### X:306 — POST /msg  PING;XX

**Pregunta (hipótesis):** Orden: ' PING' con control mal formado: ¿E201 o E301 con sugerencia?

**Preparación:** Posición 7 de 11 en `s-v2-sug-01`. Solicitudes previas tras el reset: X:300 (`PIN;87`), X:301 (`PINGG;28`), X:302 (`DEPOSITOS;AC-0001;100;67`), X:303 (`CONSULT;AC-0001;41`), X:304 (`ping ;64`), X:305 (`AL TA;Ana;50`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":" PING;XX"}'
```

**Respuesta del original** (v2): status 400

```
{"error":"E201","mensaje":"control mal formado"}
```

**Respuesta de la réplica:** status 400 — coincide

```
{"error":"E201","mensaje":"control mal formado"}
```

**Conclusión:** Comportamiento de v2: ' PING;XX' da E201: el control se valida antes que el comando, y ' PING' no recibe la excepción de PING.

**Etiqueta de evidencia:** Comportamiento de v2 sin línea base en v1

#### X:307 — POST /msg  PING;63

**Pregunta (hipótesis):** Orden: ' PING' con control incorrecto (válido 64): ¿E202 o E301?

**Preparación:** Posición 8 de 11 en `s-v2-sug-01`. Solicitudes previas tras el reset: X:300 (`PIN;87`), X:301 (`PINGG;28`), X:302 (`DEPOSITOS;AC-0001;100;67`), X:303 (`CONSULT;AC-0001;41`), X:304 (`ping ;64`), X:305 (`AL TA;Ana;50`), X:306 (` PING;XX`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":" PING;63"}'
```

**Respuesta del original** (v2): status 400

```
{"error":"E202","mensaje":"control inválido"}
```

**Respuesta de la réplica:** status 400 — coincide

```
{"error":"E202","mensaje":"control inválido"}
```

**Conclusión:** Comportamiento de v2: ' PING;63' da E202 (el control válido es 64): mismo orden que X:306.

**Etiqueta de evidencia:** Comportamiento de v2 sin línea base en v1

#### X:308 — POST /msg XYZ;20

**Pregunta (hipótesis):** Control negativo: comando sin parecido: ¿E301 sin sugerencia?

**Preparación:** Posición 9 de 11 en `s-v2-sug-01`. Solicitudes previas tras el reset: X:300 (`PIN;87`), X:301 (`PINGG;28`), X:302 (`DEPOSITOS;AC-0001;100;67`), X:303 (`CONSULT;AC-0001;41`), X:304 (`ping ;64`), X:305 (`AL TA;Ana;50`), X:306 (` PING;XX`), X:307 (` PING;63`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"XYZ;20"}'
```

**Respuesta del original** (v2): status 400

```
{"error":"E301","mensaje":"comando desconocido "}
```

**Respuesta de la réplica:** status 400 — coincide

```
{"error":"E301","mensaje":"comando desconocido "}
```

**Conclusión:** Comportamiento de v2: 'XYZ' da E301 sin campo sugerencia (ningún comando cercano), igual que SALDOS (X:126).

**Etiqueta de evidencia:** Comportamiento de v2 sin línea base en v1

#### X:309 — POST /msg ALTA;Mateo;03

**Pregunta (hipótesis):** Control de 2 dígitos con cero a la izquierda (válido 3, E:4): ¿201 o E201?

**Preparación:** Posición 10 de 11 en `s-v2-sug-01`. Solicitudes previas tras el reset: X:300 (`PIN;87`), X:301 (`PINGG;28`), X:302 (`DEPOSITOS;AC-0001;100;67`), X:303 (`CONSULT;AC-0001;41`), X:304 (`ping ;64`), X:305 (`AL TA;Ana;50`), X:306 (` PING;XX`), X:307 (` PING;63`), X:308 (`XYZ;20`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"ALTA;Mateo;03"}'
```

**Respuesta del original** (v2): status 400

```
{"error":"E202","mensaje":"control inválido"}
```

**Respuesta de la réplica:** status 400 — coincide

```
{"error":"E202","mensaje":"control inválido"}
```

**Conclusión:** Comportamiento de v2 (sin línea base en v1): 'ALTA;Mateo;03' da E202 aunque el control válido es 3 (E:4): el control de 2 dígitos con cero a la izquierda tiene formato válido pero se compara como texto exacto.

**Etiqueta de evidencia:** Comportamiento de v2 sin línea base en v1

#### X:310 — POST /msg ALTA;Mateo;00

**Pregunta (hipótesis):** Control '00' (incorrecto, el válido es 3): ¿E202 o E201?

**Preparación:** Posición 11 de 11 en `s-v2-sug-01`. Solicitudes previas tras el reset: X:300 (`PIN;87`), X:301 (`PINGG;28`), X:302 (`DEPOSITOS;AC-0001;100;67`), X:303 (`CONSULT;AC-0001;41`), X:304 (`ping ;64`), X:305 (`AL TA;Ana;50`), X:306 (` PING;XX`), X:307 (` PING;63`), X:308 (`XYZ;20`), X:309 (`ALTA;Mateo;03`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"ALTA;Mateo;00"}'
```

**Respuesta del original** (v2): status 400

```
{"error":"E202","mensaje":"control inválido"}
```

**Respuesta de la réplica:** status 400 — coincide

```
{"error":"E202","mensaje":"control inválido"}
```

**Conclusión:** Comportamiento de v2: 'ALTA;Mateo;00' da E202.

**Etiqueta de evidencia:** Comportamiento de v2 sin línea base en v1

### s-v2-sug-02 — v2, X:311–X:313

#### X:311 — POST /msg CONSUL;AC-0001;92

**Pregunta (hipótesis):** Umbral de sugerencia: 'CONSUL' está a distancia de Levenshtein 2 de CONSULTA: ¿sugerencia?

**Preparación:** Posición 1 de 3 en `s-v2-sug-02`. Estado vacío tras `POST /__reset`.

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"CONSUL;AC-0001;92"}'
```

**Respuesta del original** (v2): status 400

```
{"error":"E301","mensaje":"comando desconocido ","sugerencia":"CONSULTA"}
```

**Respuesta de la réplica:** status 400 — coincide

```
{"error":"E301","mensaje":"comando desconocido ","sugerencia":"CONSULTA"}
```

**Conclusión:** Comportamiento de v2: 'CONSUL' (Levenshtein 2 de CONSULTA) da E301 con sugerencia CONSULTA: el umbral incluye distancia 2.

**Etiqueta de evidencia:** Comportamiento de v2 sin línea base en v1

#### X:312 — POST /msg PIGN;12

**Pregunta (hipótesis):** Umbral de sugerencia: 'PIGN' está a Levenshtein 2 (transposición, Damerau 1) de PING: ¿sugerencia?

**Preparación:** Posición 2 de 3 en `s-v2-sug-02`. Solicitudes previas tras el reset: X:311 (`CONSUL;AC-0001;92`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"PIGN;12"}'
```

**Respuesta del original** (v2): status 400

```
{"error":"E301","mensaje":"comando desconocido ","sugerencia":"PING"}
```

**Respuesta de la réplica:** status 400 — coincide

```
{"error":"E301","mensaje":"comando desconocido ","sugerencia":"PING"}
```

**Conclusión:** Comportamiento de v2: 'PIGN' (Levenshtein 2, Damerau 1 de PING) da E301 con sugerencia PING; no distingue entre ambas métricas.

**Etiqueta de evidencia:** Comportamiento de v2 sin línea base en v1

#### X:313 — POST /msg DEPOS;AC-0001;100;8

**Pregunta (hipótesis):** Umbral de sugerencia: 'DEPOS' está a Levenshtein 3 de DEPOSITO: ¿sugerencia?

**Preparación:** Posición 3 de 3 en `s-v2-sug-02`. Solicitudes previas tras el reset: X:311 (`CONSUL;AC-0001;92`), X:312 (`PIGN;12`).

**Solicitud:** POST `/msg`, token del equipo (`Authorization: Bearer $TEAM_TOKEN`).

```bash
curl -sS -i \
  -X POST \
  "$BASE_URL/msg" \
  -H "Authorization: Bearer $TEAM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{"m":"DEPOS;AC-0001;100;8"}'
```

**Respuesta del original** (v2): status 400

```
{"error":"E301","mensaje":"comando desconocido "}
```

**Respuesta de la réplica:** status 400 — coincide

```
{"error":"E301","mensaje":"comando desconocido "}
```

**Conclusión:** Comportamiento de v2: 'DEPOS' (Levenshtein 3 de DEPOSITO) da E301 sin sugerencia. Con X:311, el umbral es distancia <= 2.

**Etiqueta de evidencia:** Comportamiento de v2 sin línea base en v1
