# Especificación conductual — servicio "La caja negra" (Reto 2)

Permite reimplementar el servicio sin tocar el original. Evidencia: `X:n` = línea (`id`) n de `experimentos.jsonl`.
Las líneas X:31–X:50 (`seq` `s-ej-01`) reproducen contra el original, en orden y tras un reset, los 20 ejemplos de
`pruebas/ejemplos.jsonl` (X:30+n = ejemplo n), con status y cuerpo idénticos en los 20 casos. El log tiene 281 líneas:
X:1–X:84 son la versión 1 (campo `version` ausente: orden de validación, ANULA, saldos negativos y TRANSFER con
cuentas inexistentes o iguales) y X:85–X:281 son la versión 2 (`"version":"v2"`, 197 líneas). Esta especificación
describe la **versión 2**; donde difiere de la versión 1 la diferencia se documenta en la sección 6. Los ejemplos de
`pruebas/ejemplos.jsonl` se repitieron contra la versión 2 en X:115–X:134 (`s-ej-01-v2`, mismas 20 solicitudes).

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
| ENT-11 | Cuerpo `[]` (array) → `400 E102 "falta m"`. | X:59 | probable |
| ENT-12 | JSON que no es objeto distinto de array (número, `null`), cuerpo vacío o muy grande. | — | supuesto: E102 / E100 / E100 |

## 2. Integridad

| ID | Comportamiento | Evidencia | Confianza |
|---|---|---|---|
| INT-01 | `m` = campos separados por `;`. El último campo es el control; el payload es todo lo anterior. | X:31–X:50 | confirmado |
| INT-02 | Control no numérico → `400 {"error":"E201","mensaje":"control mal formado"}` (salvo en `PING`, ver INT-09). | X:47 | probable |
| INT-03 | Control válido = `98 − (N·100 mod 97)` (ISO 7064 MOD 97-10). N: payload en mayúsculas; dígitos sin cambio; letras A=1…Z=26 sin relleno; `;`, `-` y demás símbolos se descartan. | X:31–X:50 (los 18 controles numéricos aceptados coinciden; X:32, rechazado, no coincide); restos borde 0 y 1: X:3–X:6 | confirmado |
| INT-04 | Control numérico incorrecto → `400 {"error":"E202","mensaje":"control inválido"}` (salvo en `PING`, ver INT-09). | X:32, X:4, X:6 | confirmado |
| INT-05 | El control se calcula sobre el payload en mayúsculas: `CONSULTa;AC-0001` acepta el mismo control (14) que `CONSULTA;AC-0001` (inferido). | X:41, X:35 | probable |
| INT-06 | Ceros a la izquierda en el control: `PING;064` equivale a `PING;64` (comparación numérica). | X:58 | probable |
| INT-07 | Mensaje sin ningún `;`, incluido el mensaje vacío (`{"m":"PING"}`, `{"m":""}`) → `400 {"error":"E103","mensaje":"falta control"}`, antes que cualquier otra validación del mensaje. | X:60, X:144, X:204 | confirmado |
| INT-08 | Letras no ASCII en el payload del control. | — | supuesto: se descartan como cualquier símbolo |
| INT-09 | `PING` ignora el control por completo (formato y valor), pero valida la aridad: `PING;XX` y `PING;63` (el control válido es 64) → `200 {"pong":true}`; `PING;A;XX` → `400 E302`. Consistente con el ejemplo del README (líneas 59–63, `PING;XX`). Ver sección 6.2. | X:197, X:212, X:213; README | confirmado |
| INT-10 | Cualquier segmento vacío al dividir `m` por `;` (comando vacío, argumento vacío o control vacío) → `400 {"error":"E104","mensaje":"segmento vacío"}`, también con control erróneo o comando desconocido, y también en `PING`. Un segmento de un solo espacio no es vacío: `ALTA; ;85` → `201`. Ver CAM-03 (candidato). | X:179, X:194–X:196, X:198–X:202, X:205, X:242; X:203 | confirmado en v2 |

## 3. Comandos

El nombre del comando no distingue mayúsculas (X:41, X:57; probable). Aridad = campos entre comando y control.

| ID | Comando | Comportamiento | Evidencia | Confianza |
|---|---|---|---|---|
| CMD-01 | `PING` (0 args) | `200 {"pong":true}`; el control no se valida (INT-09). | X:31, X:2, X:115, X:197, X:212 | confirmado |
| CMD-02 | `ALTA;nombre` (1) | Crea cuenta con saldo 0 → `201 {"cuentaId":"AC-NNNN"}`, secuencial desde `AC-0001`. | X:33, X:34, X:3, X:5, X:19, X:20 | confirmado |
| CMD-03 | `ALTA` | Nombre duplicado: se acepta y crea otra cuenta (`ALTA;Ana` dos veces → `AC-0001`, `AC-0002`). | X:74, X:83 | probable |
| CMD-03b | `ALTA` | Nombres con caracteres especiales. | — | supuesto: se aceptan |
| CMD-04 | `CONSULTA;cuenta` (1) | `200 {"cuenta_id":"AC-NNNN","saldo":"<centavos/100 con 2 decimales>"}`: el saldo es un **string** (0 → `"0.00"`, 1 → `"0.01"`, 40000 → `"400.00"`, −5 → `"-0.05"`, −500 → `"-5.00"`, −1000 → `"-10.00"`, 19999999998 → `"199999999.98"`). En v1 era un número (X:35: `0`; X:38: `40000`); ver CAM-01. | X:119, X:176, X:122, X:228, X:157, X:249, X:281 | confirmado |
| CMD-05 | `CONSULTA` | Cuenta inexistente → `404 {"error":"E401","mensaje":"cuenta inexistente"}`. El id distingue mayúsculas: `ac-0001` → E401. | X:45, X:82 | confirmado |
| CMD-06 | `DEPOSITO;cuenta;monto` (2) | Suma al saldo → `200 {"status":"recieved","operacionId":"OP-NNNN"}`. | X:36, X:48, X:25 | confirmado |
| CMD-07 | `DEPOSITO` | Monto 0, negativo, decimal o no numérico → `400 {"error":"E303","mensaje":"monto inválido"}`; también `+5`, `1e3` y un monto con espacio (`" 5"`). | X:21–X:24, X:177, X:230–X:232 | confirmado |
| CMD-07b | `DEPOSITO` | Monto con cero a la izquierda (`0500`) → `400 E303 "monto inválido"`, no se acepta como 500. | X:84, X:168 | confirmado |
| CMD-08 | `DEPOSITO` | Sin el límite de E506: se aceptan 250000 y 500000 (inferido). | X:36, X:25, X:189 | probable |
| CMD-08b | `DEPOSITO`, `TRANSFER` | Monto máximo 9999999999: por encima → `400 E303 "monto inválido"` (antes que E506 en TRANSFER); 9999999999 se acepta dos veces seguidas (saldo `"199999999.98"`), sin tope de saldo. Ver sección 6.2. | X:278, X:279, X:280, X:281, X:275, X:276 | confirmado en v2 |
| CMD-09 | `TRANSFER;origen;destino;monto` (3) | Resta del origen, suma al destino → `200 {"status":"recieved","operacionId":"OP-NNNN"}`. | X:37, X:38, X:40, X:41, X:28, X:29 | confirmado |
| CMD-10 | `TRANSFER` | Monto > 50000 → `422 {"error":"E506","mensaje":"límite excedido"}`; 50000 se acepta (inclusivo). En v1 el límite era 100000 (X:39, X:40, X:27, X:28); ver CAM-02. | X:190, X:191, X:112 | confirmado |
| CMD-11 | `TRANSFER` | El límite es por transferencia, no acumulado: en v1, 100000 + 30000 seguidas se aceptaron (inferido). No repetido en v2. | X:28, X:29 | probable |
| CMD-12 | `TRANSFER` | Saldo del origen menor que el monto → `422 {"error":"E507","mensaje":"saldo insuficiente"}`. | X:46 | probable |
| CMD-13 | `TRANSFER` | Monto 0 → `400 E303 "monto inválido"`. | X:26 | probable |
| CMD-14 | `TRANSFER` | Origen inexistente o destino inexistente → `404 E401 "cuenta inexistente"`. | X:75, X:76 | probable |
| CMD-14b | `TRANSFER` | Origen y destino iguales → `400 {"error":"E304","mensaje":"origen y destino iguales"}`; no cambia el saldo (500 antes y después) ni consume número de operación. | X:79–X:81 | probable |
| CMD-14c | `TRANSFER` | Monto con ceros a la izquierda. | — | supuesto: monto con cero inicial → E303 (el parser es el de DEPOSITO, inferido de X:84, X:168) |
| CMD-14d | `TRANSFER` | Origen y destino iguales e inexistentes → `400 E304`, no E401 (E304 se evalúa antes que la existencia de las cuentas). Ver ORD-08. | X:210, X:222 | confirmado en v2 |
| CMD-15 | `ANULA;operacion` (1) | Primera vez → `200 {"ok":true,"anulada":"OP-NNNN"}`; segunda vez → `200 {"ok":false,"motivo":"ya anulada"}`. | X:43, X:44 | probable |
| CMD-16 | `ANULA` | Operación inexistente → `404 {"error":"E402","mensaje":"operación inexistente"}`. | X:18 | probable |
| CMD-17 | `ANULA` | Anular un TRANSFER descuenta el monto del destino: saldo 40700 = 40000 + 700 tras anular 100000 (inferido). | X:40, X:43, X:49 | probable |
| CMD-18 | `ANULA` | Anular un TRANSFER devuelve el monto al origen (1000 → 1000 con destino 0). | X:64–X:67 | probable |
| CMD-18b | `ANULA` | Anular un DEPOSITO descuenta el monto de la cuenta (1000 → 0). | X:63, X:68, X:69 | probable |
| CMD-18c | `ANULA` | Los saldos negativos están permitidos: anular un DEPOSITO ya gastado deja −500. | X:70–X:73 | probable |
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
| E102 | 400 | `falta m` | X:16, X:17, X:59 | confirmado |
| E103 | 400 | `falta control` | X:60, X:144, X:204 | confirmado |
| E104 | 400 | `segmento vacío` | X:179, X:194–X:196, X:198–X:202, X:205, X:242 | confirmado en v2 |
| E201 | 400 | `control mal formado` | X:47 | probable |
| E202 | 400 | `control inválido` | X:32, X:4, X:6 | confirmado |
| E301 | 400 | `comando desconocido ` (espacio final) | X:42 | probable |
| E304 | 400 | `origen y destino iguales` | X:80, X:210, X:222 | confirmado |
| E302 | 400 | `aridad inválida` | X:50 | probable |
| E303 | 400 | `monto inválido` | X:21–X:24, X:26, X:77, X:84, X:211, X:221, X:275, X:278 | confirmado |
| E401 | 404 | `cuenta inexistente` | X:45, X:75, X:76, X:78, X:82 | confirmado |
| E402 | 404 | `operación inexistente` | X:18 | probable |
| E506 | 422 | `límite excedido` | X:39, X:27, X:30, X:191, X:276 | confirmado |
| E507 | 422 | `saldo insuficiente` | X:46 | probable |

Orden de evaluación:

| ID | Orden | Evidencia | Confianza |
|---|---|---|---|
| ORD-01 | Ruta (E404) antes que autenticación (E001). | X:12 | probable |
| ORD-02 | Autenticación antes que el cuerpo (E100/E102) y que la integridad. | — | supuesto |
| ORD-03 | Cuerpo (E100/E102) antes que control: sin `m` no hay control que validar (inferencia lógica, sin evidencia directa). | — | supuesto |
| ORD-04 | E201 → E202 → E301 → E302: E201/E202 (control) se evalúan antes que E301/E302 (comando, aridad); con comando desconocido y control mal formado o inválido gana el control. E201 y E202 son excluyentes. `PING` queda fuera de esta cadena: solo valida aridad (INT-09). | X:51–X:56; X:197, X:212 | probable |
| ORD-04b | E103 (mensaje sin `;`) antes que todo lo demás del mensaje. | X:60, X:204 | confirmado |
| ORD-04c | E104 (segmento vacío) después de E103 y antes de E201, E202, E301 y E302: `ALTA;;86` (control erróneo) y `SALDOS;;55` (comando desconocido) dan E104. | X:198, X:201, X:199 | confirmado en v2 |
| ORD-05 | E506 antes que E507: monto 150000 sobre el límite y sobre el saldo (130000) → E506 (v1; sigue siendo E506 en v2 por el mismo orden). | X:30 | probable |
| ORD-06 | TRANSFER: E303 antes que E401 (origen inexistente y monto 0 → E303) y antes que E304 (cuentas iguales y monto 0 → E303). | X:77, X:221 | confirmado |
| ORD-07 | TRANSFER: E401 antes que E506 (destino inexistente y monto 200000 → E401). | X:78 | probable |
| ORD-08 | TRANSFER: E303 → E304 → E401 → E506 → E507. E304 antes que E401 (cuentas iguales inexistentes) y antes que E506 (monto 60000). | X:221, X:210, X:222, X:78, X:30 | confirmado en v2 |
| ORD-09 | DEPOSITO: E303 antes que E401 (cuenta inexistente y monto `abc` → E303). | X:211 | confirmado en v2 |

## 6. Cambios durante el día

### 6.1 Método y diferencias entre versiones

Método: se reprodujeron las 84 líneas de la versión 1 contra la versión 2 (X:85–X:168, mismas solicitudes que
X:1–X:84) y luego se ejecutaron oleadas nuevas de experimentos (X:169–X:281). Una diferencia está **probada** solo
si la misma solicitud existe en ambas versiones con respuestas distintas.

| ID | Cambio | Evidencia | Confianza |
|---|---|---|---|
| CAM-01 | Formato del saldo en `CONSULTA`: v1 devolvía un número (`"saldo":0`, `"saldo":40000`); v2 devuelve un string con dos decimales (`"saldo":"0.00"`, `"saldo":"400.00"`). Diferencial probado: la misma solicitud con distinta respuesta. | X:35 vs X:119; X:38 vs X:122 | confirmado |
| CAM-02 | Límite de `TRANSFER`: v1 aceptaba 100000 y rechazaba más; v2 acepta hasta 50000 inclusive y rechaza 50001 (`E506`). Diferencial probado: `TRANSFER;AC-0001;AC-0002;100000` pasó de `200` a `422 E506`. | X:28 vs X:112; v2: X:190, X:191 | confirmado |
| CAM-03 | **Candidato**: segmento vacío → `400 E104 "segmento vacío"` (ver INT-10 y ORD-04c). Observado en v2 en X:179, X:194–X:205 y X:242. **No hay línea base en v1 para segmentos vacíos** (ninguna de X:1–X:84 envía uno), así que la diferencia respecto de v1 **no está probada**: puede ser un cambio de v2 o un comportamiento que ya existía. | X:179, X:194–X:205, X:242 | candidato (diferencia no probada) |

### 6.2 Comportamiento observado en v2, sin línea base en v1

Estos comportamientos se observaron en v2, pero no existe solicitud equivalente en v1; **no se presentan como cambios
de versión**. La réplica los implementa porque son lo observado.

| ID | Comportamiento observado en v2, sin línea base en v1 | Evidencia | Confianza |
|---|---|---|---|
| OBS-01 | `PING` ignora el control (formato y valor) pero valida la aridad (INT-09). Consistente con el ejemplo del README (líneas 59–63). | X:197, X:212, X:213; README | confirmado en v2 |
| OBS-02 | Orden de validación de TRANSFER E303 → E304 → E401 → E506 → E507 (ORD-08) y de DEPOSITO E303 → E401 (ORD-09). | X:210, X:211, X:221, X:222 | confirmado en v2 |
| OBS-03 | Monto máximo 9999999999 en DEPOSITO y TRANSFER (`E303` por encima, antes que `E506`); sin tope de saldo (CMD-08b). | X:275, X:276, X:278, X:279, X:280, X:281 | confirmado en v2 |
| OBS-04 | Mensaje vacío `""` → `E103` (INT-07). | X:204 | confirmado en v2 |

### 6.3 Límite del método

No se ejecutó un chequeo sistemático de deriva sobre comportamientos no repetidos entre versiones: un cambio en un
comportamiento que no se probó en ambas versiones no sería detectado (supuesto, sin evidencia).

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
