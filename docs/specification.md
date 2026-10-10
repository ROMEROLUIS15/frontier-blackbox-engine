# Especificación conductual — servicio "La caja negra" (Reto 2)

Permite reimplementar el servicio sin tocar el original. Evidencia: `X:n` = línea (`id`) n de `experimentos.jsonl`.
Las líneas X:31–X:50 (`seq` `s-ej-01`) reproducen contra el original, en orden y tras un reset, los 20 ejemplos de
`pruebas/ejemplos.jsonl` (X:30+n = ejemplo n), con status y cuerpo idénticos en los 20 casos.

Confianza (README): **confirmado** = probado y repetido · **probable** = visto una vez o inferido (se marca
"inferido") · **supuesto** = no probado; es lo que hace la réplica por defecto.

Formato de error común: `{"error":"<código>","mensaje":"<texto>"}`. Todos los cuerpos son JSON.

## 1. Entrada

| ID | Comportamiento | Evidencia | Confianza |
|---|---|---|---|
| ENT-01 | Rutas conocidas: `GET /health`, `POST /__reset`, `POST /msg`. Mensajes en `POST /msg` con cuerpo `{"m":"<texto>"}`. | X:2, X:14; README | confirmado |
| ENT-02 | Ruta inexistente (GET o POST) → `404 {"error":"E404","mensaje":"ruta desconocida"}`. | X:7, X:8, X:12 | confirmado |
| ENT-03 | Método no admitido en ruta conocida (`GET /msg`) → mismo `404 E404 "ruta desconocida"`. | X:9 | probable |
| ENT-04 | La ruta se resuelve antes que la autenticación: ruta inexistente sin token → 404, no 401 (inferido). | X:12 | probable |
| ENT-05 | Autenticación `Authorization: Bearer <token>`. Sin header o con token incorrecto → `401 {"error":"E001","mensaje":"no autorizado"}`. | X:1, X:11 (incorrecto), X:10 (sin header) | confirmado |
| ENT-06 | `GET /health` exige token: sin token → `401 E001`; con token → `200 {"ok":true}`. | X:13, X:14 | probable |
| ENT-07 | `POST /__reset` con token → `200 {"ok":true}` y vuelve el estado al inicial (ver MEM-01). | Salida de los runs s-ctl-01, s-io-01, s-amt-01 (el reset no se registró como línea); X:3, X:19 | probable |
| ENT-08 | Cuerpo que no es JSON → `400 {"error":"E100","mensaje":"json inválido"}`. | X:15 | probable |
| ENT-09 | JSON sin campo `m`, o `m` no string → `400 {"error":"E102","mensaje":"falta m"}`. | X:16, X:17 | confirmado |
| ENT-10 | Header `X-Req`: contador de `POST /msg` autenticados (incluye respuestas de error); no se reinicia con `/__reset`; no aparece en 401, 404 ni `/health`. | X:2–X:6 (1..5), X:15 (6), X:18→X:19 (9→10 tras reset), X:1, X:7–X:14 (sin header) | probable |
| ENT-11 | JSON que no es objeto (array, número, `null`), cuerpo vacío o muy grande. | — | supuesto: E102 / E100 / E100 |

## 2. Integridad

| ID | Comportamiento | Evidencia | Confianza |
|---|---|---|---|
| INT-01 | `m` = campos separados por `;`. El último campo es el control; el payload es todo lo anterior. | X:31–X:50 | confirmado |
| INT-02 | Control no numérico → `400 {"error":"E201","mensaje":"control mal formado"}`. | X:47 | probable |
| INT-03 | Control válido = `98 − (N·100 mod 97)` (ISO 7064 MOD 97-10). N: payload en mayúsculas; dígitos sin cambio; letras A=1…Z=26 sin relleno; `;`, `-` y demás símbolos se descartan. | X:31–X:50 (los 18 controles numéricos aceptados coinciden; X:32, rechazado, no coincide); restos borde 0 y 1: X:3–X:6 | confirmado |
| INT-04 | Control numérico incorrecto → `400 {"error":"E202","mensaje":"control inválido"}`. | X:32, X:4, X:6 | confirmado |
| INT-05 | El control se calcula sobre el payload en mayúsculas: `CONSULTa;AC-0001` acepta el mismo control (14) que `CONSULTA;AC-0001` (inferido). | X:41, X:35 | probable |
| INT-06 | Ceros a la izquierda en el control (`064`), letras no ASCII en el payload. | — | supuesto: comparación numérica; no ASCII se descarta |

## 3. Comandos

El nombre del comando no distingue mayúsculas (X:41, probable). Aridad = campos entre comando y control.

| ID | Comando | Comportamiento | Evidencia | Confianza |
|---|---|---|---|---|
| CMD-01 | `PING` (0 args) | `200 {"pong":true}` | X:31, X:2 | confirmado |
| CMD-02 | `ALTA;nombre` (1) | Crea cuenta con saldo 0 → `201 {"cuentaId":"AC-NNNN"}`, secuencial desde `AC-0001`. | X:33, X:34, X:3, X:5, X:19, X:20 | confirmado |
| CMD-03 | `ALTA` | Nombres duplicados o con caracteres especiales. | — | supuesto: se aceptan |
| CMD-04 | `CONSULTA;cuenta` (1) | `200 {"cuenta_id":"AC-NNNN","saldo":<n>}`. | X:35, X:38, X:41, X:49 | confirmado |
| CMD-05 | `CONSULTA` | Cuenta inexistente → `404 {"error":"E401","mensaje":"cuenta inexistente"}`. | X:45 | probable |
| CMD-06 | `DEPOSITO;cuenta;monto` (2) | Suma al saldo → `200 {"status":"recieved","operacionId":"OP-NNNN"}`. | X:36, X:48, X:25 | confirmado |
| CMD-07 | `DEPOSITO` | Monto 0, negativo, decimal o no numérico → `400 {"error":"E303","mensaje":"monto inválido"}`. | X:21–X:24 | confirmado |
| CMD-08 | `DEPOSITO` | Sin el límite de E506: se aceptan 250000 y 500000 (inferido). | X:36, X:25 | probable |
| CMD-09 | `TRANSFER;origen;destino;monto` (3) | Resta del origen, suma al destino → `200 {"status":"recieved","operacionId":"OP-NNNN"}`. | X:37, X:38, X:40, X:41, X:28, X:29 | confirmado |
| CMD-10 | `TRANSFER` | Monto > 100000 → `422 {"error":"E506","mensaje":"límite excedido"}`; 100000 se acepta. | X:39, X:40, X:27, X:28 | confirmado |
| CMD-11 | `TRANSFER` | El límite es por transferencia, no acumulado: 100000 + 30000 seguidas se aceptan (inferido). | X:28, X:29 | probable |
| CMD-12 | `TRANSFER` | Saldo del origen menor que el monto → `422 {"error":"E507","mensaje":"saldo insuficiente"}`. | X:46 | probable |
| CMD-13 | `TRANSFER` | Monto 0 → `400 E303 "monto inválido"`. | X:26 | probable |
| CMD-14 | `TRANSFER` | Origen o destino inexistente; transferencia a la misma cuenta. | — | supuesto: E401; sin trato especial |
| CMD-15 | `ANULA;operacion` (1) | Primera vez → `200 {"ok":true,"anulada":"OP-NNNN"}`; segunda vez → `200 {"ok":false,"motivo":"ya anulada"}`. | X:43, X:44 | probable |
| CMD-16 | `ANULA` | Operación inexistente → `404 {"error":"E402","mensaje":"operación inexistente"}`. | X:18 | probable |
| CMD-17 | `ANULA` | Anular un TRANSFER descuenta el monto del destino: saldo 40700 = 40000 + 700 tras anular 100000 (inferido). | X:40, X:43, X:49 | probable |
| CMD-18 | `ANULA` | Devuelve el monto al origen; anular un DEPOSITO lo descuenta; saldos negativos permitidos. | — | supuesto |
| CMD-19 | Comando desconocido | → `400 {"error":"E301","mensaje":"comando desconocido "}` (con espacio final). | X:42 | probable |
| CMD-20 | Aridad incorrecta | → `400 {"error":"E302","mensaje":"aridad inválida"}`. | X:50 | probable |

## 4. Memoria entre requests

| ID | Comportamiento | Evidencia | Confianza |
|---|---|---|---|
| MEM-01 | `/__reset` borra cuentas, operaciones y contadores `AC`/`OP`: tras cada reset la primera cuenta vuelve a ser `AC-0001` y la primera operación `OP-0001`. | X:3, X:19, X:25 | confirmado |
| MEM-02 | Las solicitudes rechazadas no consumen número de cuenta ni de operación. | X:32→X:33, X:4→X:5, X:39→X:40, X:21–X:24→X:25 | confirmado |
| MEM-03 | `ANULA` no consume número de operación. | X:43→X:48 (`OP-0004`) | probable |
| MEM-04 | Los saldos se acumulan entre requests. | X:35, X:38, X:41, X:49 | confirmado |
| MEM-05 | El estado de una operación anulada se recuerda (segunda ANULA → `ok:false`). | X:44 | probable |
| MEM-06 | `X-Req` persiste a través de `/__reset` (ver ENT-10). | X:18→X:19 | probable |

## 5. Errores

| Código | Status | `mensaje` exacto | Evidencia | Confianza |
|---|---|---|---|---|
| E404 | 404 | `ruta desconocida` | X:7–X:9, X:12 | confirmado |
| E001 | 401 | `no autorizado` | X:1, X:10, X:11, X:13 | confirmado |
| E100 | 400 | `json inválido` | X:15 | probable |
| E102 | 400 | `falta m` | X:16, X:17 | confirmado |
| E201 | 400 | `control mal formado` | X:47 | probable |
| E202 | 400 | `control inválido` | X:32, X:4, X:6 | confirmado |
| E301 | 400 | `comando desconocido ` (espacio final) | X:42 | probable |
| E302 | 400 | `aridad inválida` | X:50 | probable |
| E303 | 400 | `monto inválido` | X:21–X:24, X:26 | confirmado |
| E401 | 404 | `cuenta inexistente` | X:45 | probable |
| E402 | 404 | `operación inexistente` | X:18 | probable |
| E506 | 422 | `límite excedido` | X:39, X:27, X:30 | confirmado |
| E507 | 422 | `saldo insuficiente` | X:46 | probable |

Orden de evaluación:

| ID | Orden | Evidencia | Confianza |
|---|---|---|---|
| ORD-01 | Ruta (E404) antes que autenticación (E001). | X:12 | probable |
| ORD-02 | Autenticación antes que el cuerpo (E100/E102) y que la integridad. | — | supuesto |
| ORD-03 | Cuerpo (E100/E102) antes que control: sin `m` no hay control que validar (inferencia lógica, sin evidencia directa). | — | supuesto |
| ORD-04 | E201 → E202 → E301 → E302. E201 y E202 son excluyentes. X:42 y X:50 tienen control válido, así que no revelan el orden. | X:42, X:50 | supuesto |
| ORD-05 | E506 antes que E507: monto 150000 sobre el límite y sobre el saldo (130000) → E506. | X:30 | probable |
| ORD-06 | E401 y E303 antes que E506/E507. | — | supuesto |

## 6. Cambios durante el día

| ID | Comportamiento | Evidencia | Confianza |
|---|---|---|---|
| CAM-01 | No detectamos cambios respecto de la versión de la mañana: las repeticiones posteriores coinciden con los ejemplos (`PING;64` → `200 {"pong":true}`; 100000 aceptado; montos > 100000 → E506). | X:2 vs X:31; X:28 vs X:40; X:27 vs X:39 | probable |
| CAM-02 | No ejecutamos un chequeo sistemático de deriva; un cambio en comportamientos no repetidos no sería detectado. | — | supuesto |

## 7. Riesgos

Comportamientos que un cliente nuevo no debería heredar, y cómo cerrarlos:

| ID | Riesgo | Cierre propuesto |
|---|---|---|
| RIE-01 | Errores tipográficos en el contrato: `"recieved"`, espacio final en `"comando desconocido "`. | API v2 con textos corregidos; v1 congelada solo para clientes existentes. |
| RIE-02 | Claves inconsistentes: `cuentaId` (ALTA) vs `cuenta_id` (CONSULTA). | Un único estilo de nombres en v2. |
| RIE-03 | El control MOD 97 detecta errores de tipeo, no autentica ni protege la integridad ante un atacante. | Firmar mensajes (p. ej. HMAC) o confiar en TLS + autenticación; no tratar el control como seguridad. |
| RIE-04 | `X-Req` expone un contador global de uso del token y no se reinicia. | Reemplazarlo por un ID de request opaco. |
| RIE-05 | Comandos sin distinguir mayúsculas y montos como texto libre. | Validación estricta y documentada del formato. |
| RIE-06 | `ANULA` puede dejar saldos negativos (sin verificar, CMD-18). | Verificarlo y, si ocurre, rechazar anulaciones sin saldo suficiente. |
