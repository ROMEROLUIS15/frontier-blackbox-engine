# Especificación conductual — servicio "La caja negra" (Reto 2)

Permite reimplementar el servicio sin tocar el original. Evidencia: `X:n` = línea (`id`) n de `experimentos.jsonl`; `E:n` = línea `n` de `pruebas/ejemplos.jsonl`.
Las líneas X:31–X:50 (`seq` `s-ej-01`) reproducen contra el original, en orden y tras un reset, los 20 ejemplos de
`pruebas/ejemplos.jsonl` (X:30+n = ejemplo n), con status y cuerpo idénticos en los 20 casos. El log tiene 7306 líneas:
X:1–X:84 son la versión 1 (campo `version` ausente: orden de validación, ANULA, saldos negativos y TRANSFER con
cuentas inexistentes o iguales) y X:85–X:7306 son la versión 2 (`"version":"v2"`, 7222 líneas; la última campaña es X:338–X:7306, ver sección 6.1). Esta especificación
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
| ENT-03 | Método no admitido en ruta conocida (`GET /msg`, `PUT /msg`, `DELETE /msg`) → mismo `404 E404 "ruta desconocida"`. | X:9, X:297, X:298 | confirmado |
| ENT-04 | La ruta se resuelve antes que la autenticación: ruta inexistente sin token → 404, no 401 (inferido). | X:12 | probable |
| ENT-05 | Autenticación `Authorization: Bearer <token>`. Sin header o con token incorrecto → `401 {"error":"E001","mensaje":"no autorizado"}`. | X:1, X:11 (incorrecto), X:10 (sin header) | confirmado |
| ENT-06 | `GET /health` exige token: sin token → `401 E001`; con token → `200 {"ok":true}`. | X:13, X:14 | probable |
| ENT-07 | `POST /__reset` con token → `200 {"ok":true}` y vuelve el estado al inicial (ver MEM-01). | Salida de los runs s-ctl-01, s-io-01, s-amt-01 (el reset no se registró como línea); X:3, X:19, X:299, X:314, X:316, X:329, X:331 (`200 {"ok":true}`, resets registrados) | confirmado |
| ENT-08 | Cuerpo que no es JSON → `400 {"error":"E100","mensaje":"json inválido"}`. | X:15 | probable |
| ENT-09 | JSON sin campo `m`, o `m` no string → `400 {"error":"E102","mensaje":"falta m"}`. | X:16, X:17 | confirmado |
| ENT-10 | Header `X-Req`: contador de `POST /msg` autenticados (incluye respuestas de error); no se reinicia con `/__reset`; no aparece en 401, 404 ni `/health`. | X:2–X:6 (1..5), X:15 (6), X:18→X:19 (9→10 tras reset), X:1, X:7–X:14 (sin header) | probable |
| ENT-11 | Cuerpo `[]` (array) → `400 E102 "falta m"`. | X:59 | probable |
| ENT-12 | Cuerpo JSON `null` o número (`5`) → `400 E102 "falta m"`; un string JSON (`"PING;64"`) también → E102; cuerpo vacío → `400 E100 "json inválido"`. | X:258, X:259, X:260, X:263 | confirmado |
| ENT-12b | Cuerpo muy grande. | — | supuesto: E100 |
| ENT-13 | `m` con valor `null` → `400 E102 "falta m"`; los campos extra del objeto se ignoran (`{"m":"PING;64","x":1}` → `200 {"pong":true}`); un `Content-Type` `text/plain` se acepta igual. | X:261, X:262, X:264 | confirmado |
| ENT-14 | La ruta se compara exacta: `POST /msg/` → `404 E404`; la query string se ignora (`POST /msg?x=1` → `200`); `POST /health` y `GET /__reset` → `404 E404`; `HEAD /health` → `404` con cuerpo vacío. | X:250, X:251, X:253, X:254, X:252 | confirmado |
| ENT-15 | Variantes de autenticación: `POST /__reset` con token incorrecto → `401 E001`; esquema en minúsculas (`bearer <token>`) y token sin esquema → `401 E001`. | X:255, X:256, X:257 | confirmado |

## 2. Integridad

| ID | Comportamiento | Evidencia | Confianza |
|---|---|---|---|
| INT-01 | `m` = campos separados por `;`. El último campo es el control; el payload es todo lo anterior. | X:31–X:50 | confirmado |
| INT-02 | Control no numérico → `400 {"error":"E201","mensaje":"control mal formado"}` (salvo en `PING`, ver INT-09). | X:47 | probable |
| INT-03 | Control válido = `98 − (N·100 mod 97)` (ISO 7064 MOD 97-10). N: payload en mayúsculas; dígitos sin cambio; letras A=1…Z=26 sin relleno; `;`, `-` y demás símbolos se descartan. | X:31–X:50 (los 18 controles numéricos aceptados coinciden; X:32, rechazado, no coincide); restos borde 0 y 1: X:3–X:6 | confirmado |
| INT-04 | Control numérico incorrecto → `400 {"error":"E202","mensaje":"control inválido"}` (salvo en `PING`, ver INT-09). | X:32, X:4, X:6 | confirmado |
| INT-05 | El control se calcula sobre el payload en mayúsculas: `CONSULTa;AC-0001` acepta el mismo control (14) que `CONSULTA;AC-0001` (inferido). | X:41, X:35 | probable |
| INT-06 | Formato del control en comandos distintos de `PING`: 1 o 2 dígitos. `ALTA;Ana;050` (valor válido 50), `ALTA;Ana;150`, `+50` y `" 50"` → `400 E201` (150 no es E202); un solo dígito se acepta (`ALTA;Mateo;3` → `201`). `PING;064` → `200` solo porque `PING` ignora el control (X:58, INT-09). | X:282–X:285; E:4; X:58 | confirmado en v2 |
| INT-06b | Valor del control en comandos distintos de `PING`: se compara como **texto exacto**, no como número. `ALTA;Mateo;03` y `ALTA;Mateo;00` → `400 E202` aunque el control válido es 3; `ALTA;Mateo;3` → `201`. `" PING"` (con espacio) no recibe la exención de `PING`: `" PING;XX"` → E201 y `" PING;63"` → E202. | X:309, X:310, X:306, X:307; E:4 | confirmado en v2 |
| INT-07 | Mensaje sin ningún `;`, incluido el mensaje vacío (`{"m":"PING"}`, `{"m":""}`) → `400 {"error":"E103","mensaje":"falta control"}`, antes que cualquier otra validación del mensaje. | X:60, X:144, X:204 | confirmado |
| INT-08 | Las letras no ASCII del payload se descartan al calcular el control, como cualquier símbolo: `ALTA;Lucía;14` y `ALTA;Ana-María;49` se aceptan con el control calculado sin la `í`; `DEPÓSITO;AC-0001;100;68` (control calculado sin la `Ó`) no da E202 sino E301 (ver CMD-19b). | X:180, X:289, X:330 | confirmado |
| INT-09 | `PING` ignora el control por completo (formato y valor), pero valida la aridad: `PING;XX` y `PING;63` (el control válido es 64) → `200 {"pong":true}`; `PING;A;XX` → `400 E302`. Consistente con el ejemplo del README (líneas 62–64, `PING;XX`). Ver sección 6.2. | X:197, X:212, X:213; README líneas 62–64 | confirmado |
| INT-10 | Cualquier segmento vacío al dividir `m` por `;` (comando vacío, argumento vacío o control vacío) → `400 {"error":"E104","mensaje":"segmento vacío"}`, también con control erróneo o comando desconocido, y también en `PING`. Un segmento de un solo espacio no es vacío: `ALTA; ;85` → `201`. Ver CAM-03 (candidato). | X:179, X:194–X:196, X:198–X:202, X:205, X:242; X:203 | confirmado en v2 |

## 3. Comandos

El nombre del comando no distingue mayúsculas (X:41, X:57; probable). Aridad = campos entre comando y control.

| ID | Comportamiento | Evidencia | Confianza |
|---|---|---|---|---|
| CMD-01 | `PING` (0 args): `200 {"pong":true}`; el control no se valida (INT-09). | X:31, X:2, X:115, X:197, X:212 | confirmado |
| CMD-02 | `ALTA;nombre` (1): Crea cuenta con saldo 0 → `201 {"cuentaId":"AC-NNNN"}`, secuencial desde `AC-0001`. | X:33, X:34, X:3, X:5, X:19, X:20 | confirmado |
| CMD-03 | `ALTA`: Nombre duplicado: se acepta y crea otra cuenta (`ALTA;Ana` dos veces → `AC-0001`, `AC-0002`). | X:74, X:83 | probable |
| CMD-03b | `ALTA`: Nombres con dígitos, símbolos, no ASCII o de 60 caracteres se aceptan (`Ana2`, `Ana-María`, 60 × `A`). Otros nombres (vacío: E104). | X:288, X:289, X:290 | confirmado para esos casos; supuesto: el resto |
| CMD-04 | `CONSULTA;cuenta` (1): `200 {"cuenta_id":"AC-NNNN","saldo":"<centavos/100 con 2 decimales>"}`: el saldo es un **string** (0 → `"0.00"`, 1 → `"0.01"`, 40000 → `"400.00"`, −5 → `"-0.05"`, −500 → `"-5.00"`, −1000 → `"-10.00"`, 19999999998 → `"199999999.98"`). En v1 era un número (X:35: `0`; X:38: `40000`); ver CAM-01. | X:119, X:176, X:122, X:228, X:157, X:249, X:281 | confirmado |
| CMD-05 | `CONSULTA`: Cuenta inexistente → `404 {"error":"E401","mensaje":"cuenta inexistente"}`. El id distingue mayúsculas: `ac-0001` → E401. | X:45, X:82 | confirmado |
| CMD-06 | `DEPOSITO;cuenta;monto` (2): Suma al saldo → `200 {"status":"recieved","operacionId":"OP-NNNN"}`. | X:36, X:48, X:25 | confirmado |
| CMD-07 | `DEPOSITO`: Monto 0, negativo, decimal o no numérico → `400 {"error":"E303","mensaje":"monto inválido"}`; también `+5`, `1e3` y un monto con espacio (`" 5"`). | X:21–X:24, X:177, X:230–X:232 | confirmado |
| CMD-07b | `DEPOSITO`: Monto con cero a la izquierda (`0500`) → `400 E303 "monto inválido"`, no se acepta como 500. | X:84, X:168 | confirmado |
| CMD-08 | `DEPOSITO`: Sin el límite de E506: se aceptan 250000 y 500000 (inferido). | X:36, X:25, X:189 | probable |
| CMD-08b | `DEPOSITO`, `TRANSFER`: Monto máximo 9999999999: por encima → `400 E303 "monto inválido"` (antes que E506 en TRANSFER); 9999999999 se acepta dos veces seguidas (saldo `"199999999.98"`), sin tope de saldo. Ver sección 6.2. | X:278, X:279, X:280, X:281, X:275, X:276; X:233 (9007199254740993) y X:235 (100000000000) → E303 | confirmado en v2 |
| CMD-09 | `TRANSFER;origen;destino;monto` (3): Resta del origen, suma al destino → `200 {"status":"recieved","operacionId":"OP-NNNN"}`. | X:37, X:38, X:40, X:41, X:28, X:29 | confirmado |
| CMD-10 | `TRANSFER`: Monto > 50000 → `422 {"error":"E506","mensaje":"límite excedido"}`, salvo entre cuentas del mismo titular (CMD-10b); 50000 se acepta (inclusivo); con saldo 50000, 50001 → E506 y no E507 (X:320). En v1 el límite era 100000 (X:39, X:40, X:27, X:28); ver CAM-02. | X:190, X:191, X:112, X:320, X:321 | confirmado |
| CMD-10b | `TRANSFER`: Regla del titular. El límite de 50000 **no aplica** cuando origen y destino tienen el mismo titular, es decir, el mismo argumento `nombre` de `ALTA` comparado de forma exacta y sensible a mayúsculas. `TRANSFER;AC-0001;AC-0002;100000` entre dos cuentas `Ana` con saldo 200000 → `200 OP-0002` y el destino queda en `"1000.00"` (X:2467, X:2468); lo mismo con cuentas no contiguas (`Ana`, `Beto`, `Ana`: `AC-0001` → `AC-0003`, X:2479). `Ana` y `ana` son titulares distintos → `422 E506` (X:2473). El saldo se sigue comprobando: mismo titular, monto sobre el límite y sobre el saldo → `422 E507`, no E506 (X:610, X:1304). Con titulares distintos el límite se mantiene (X:2442–X:2462, X:320, X:172). Las demás validaciones y su orden (ORD-08) no cambian. | X:2467, X:2468, X:2473, X:2479, X:610, X:1304; contraste: X:2442–X:2462, X:320, X:172 | confirmado |
| CMD-11 | `TRANSFER`: El límite es por transferencia, no acumulado: en v2 dos TRANSFER de 30000 seguidas (suma 60000 > 50000) se aceptan y el destino queda en `"600.00"`. En v1: 100000 + 30000 (X:28, X:29). | X:218, X:219, X:220; X:28, X:29 | confirmado |
| CMD-12 | `TRANSFER`: Saldo del origen menor que el monto → `422 {"error":"E507","mensaje":"saldo insuficiente"}`. Transferir exactamente el saldo del origen se acepta (`200`). | X:46; X:295; X:321 (50000 con saldo exacto 50000 → `200 OP-0002`); X:323 (desde saldo negativo → E507) | probable; confirmado en v2 para el saldo exacto y el saldo negativo |
| CMD-13 | `TRANSFER`: Monto 0 → `400 E303 "monto inválido"`. | X:26 | probable |
| CMD-14 | `TRANSFER`: Origen inexistente o destino inexistente → `404 E401 "cuenta inexistente"`. | X:75, X:76 | probable |
| CMD-14b | `TRANSFER`: Origen y destino iguales → `400 {"error":"E304","mensaje":"origen y destino iguales"}`; no cambia el saldo (500 antes y después, X:79–X:81) ni consume número de operación (el siguiente TRANSFER válido recibe `OP-0002` tras un E303 y un E304, X:337). | X:79–X:81 (saldo); X:336, X:337 (número de operación) | confirmado |
| CMD-14c | `TRANSFER`: Monto con cero a la izquierda (`0100`) → `400 E303 "monto inválido"`, igual que en DEPOSITO (CMD-07b). | X:335 | confirmado |
| CMD-14d | `TRANSFER`: Origen y destino iguales e inexistentes → `400 E304`, no E401 (E304 se evalúa antes que la existencia de las cuentas). Ver ORD-08. | X:210, X:222 | confirmado en v2 |
| CMD-15 | `ANULA;operacion` (1): Primera vez → `200 {"ok":true,"anulada":"OP-NNNN"}`; segunda vez → `200 {"ok":false,"motivo":"ya anulada"}`. | X:43, X:44, X:327 | confirmado |
| CMD-16 | `ANULA`: Operación inexistente → `404 {"error":"E402","mensaje":"operación inexistente"}`. El id se compara exacto: `op-0001` y `OP-1` → E402. | X:18, X:239, X:240 | confirmado |
| CMD-16b | `CONSULTA`: El id de cuenta se compara exacto: `AC-1` → `404 E401`. | X:241 | confirmado |
| CMD-17 | `ANULA`: Anular un TRANSFER descuenta el monto del destino: saldo 40700 = 40000 + 700 tras anular 100000 (inferido). | X:40, X:43, X:49 | probable |
| CMD-18 | `ANULA`: Anular un TRANSFER devuelve el monto al origen (1000 → 1000 con destino 0). | X:64–X:67 | probable |
| CMD-18b | `ANULA`: Anular un DEPOSITO descuenta el monto de la cuenta (1000 → 0). | X:63, X:68, X:69 | probable |
| CMD-18c | `ANULA`: Los saldos negativos están permitidos: anular un DEPOSITO ya gastado deja −500. | X:70–X:73; X:322 (anular un DEPOSITO ya gastado → `200 {"ok":true,"anulada":"OP-0001"}` y saldo negativo), X:323 (desde saldo negativo, TRANSFER → E507) | confirmado en v2 |
| CMD-18d | `ANULA`: Anular un TRANSFER ya compensado por una devolución posterior → `200 {"ok":true,"anulada":"OP-0002"}`; el destino queda en `"-500.00"` y el origen en `"500.00"`. Una segunda ANULA del mismo TRANSFER → `200 {"ok":false,"motivo":"ya anulada"}` y los saldos no cambian. | X:325, X:326, X:327, X:328 | confirmado |
| CMD-19 | Comando desconocido: → `400 {"error":"E301","mensaje":"comando desconocido "}` (con espacio final). Si un comando conocido está a distancia de edición (Levenshtein) de 2 o menos del nombre (en mayúsculas, sin recortar espacios) el cuerpo añade `"sugerencia":"<COMANDO>"` (ver OBS-05). | X:42, X:126, X:308 | probable |
| CMD-19b | Comando desconocido: `DEPÓSITO;AC-0001;100;68` → `400 E301` con `"sugerencia":"DEPOSITO"`: el nombre del comando no se normaliza (la `Ó` no pasa a `O`) y el control calculado descartando la `Ó` se acepta (no hay E202). | X:330 | confirmado |
| CMD-19c | Comando desconocido: `ANLUA;OP-0001;65` → `400 E301` con `"sugerencia":"ALTA"`. Ver OBS-07. | X:315 | confirmado |
| CMD-20 | Aridad incorrecta: → `400 {"error":"E302","mensaje":"aridad inválida"}`; también `ANULA` con un argumento de más. | X:50, X:291 | probable |

## 4. Memoria entre requests

| ID | Comportamiento | Evidencia | Confianza |
|---|---|---|---|
| MEM-01 | `/__reset` borra cuentas, operaciones y contadores `AC`/`OP`: tras cada reset la primera cuenta vuelve a ser `AC-0001` y la primera operación `OP-0001`. | X:3, X:19, X:25; resets registrados: X:314, X:316, X:329, X:331 (seguidos de `AC-0001` en X:317 y X:332, y de `OP-0001` en X:319 y X:334) | confirmado |
| MEM-02 | Las solicitudes rechazadas no consumen número de cuenta ni de operación. | X:32→X:33, X:4→X:5, X:39→X:40, X:21–X:24→X:25; X:335, X:336→X:337 (`OP-0002`); X:323→X:324 (`OP-0003`) | confirmado |
| MEM-03 | `ANULA` no consume número de operación. | X:43→X:48 (`OP-0004`); X:322→X:324 (tras una ANULA y un E507, el siguiente TRANSFER es `OP-0003`) | confirmado |
| MEM-04 | Los saldos se acumulan entre requests. | X:35, X:38, X:41, X:49 | confirmado |
| MEM-05 | El estado de una operación anulada se recuerda (segunda ANULA → `ok:false`). | X:44 | probable |
| MEM-06 | `X-Req` persiste a través de `/__reset` (ver ENT-10). | X:18→X:19 | probable |

## 5. Errores

| ID | Comportamiento | Evidencia | Confianza |
|---|---|---|---|
| ERR-01 | `E404` → status 404, `mensaje` exacto `ruta desconocida`. | X:7–X:9, X:12 | confirmado |
| ERR-02 | `E001` → status 401, `mensaje` exacto `no autorizado`. | X:1, X:10, X:11, X:13 | confirmado |
| ERR-03 | `E100` → status 400, `mensaje` exacto `json inválido`. | X:15, X:263 | probable |
| ERR-04 | `E102` → status 400, `mensaje` exacto `falta m`. | X:16, X:17, X:59, X:258–X:261 | confirmado |
| ERR-05 | `E103` → status 400, `mensaje` exacto `falta control`. | X:60, X:144, X:204 | confirmado |
| ERR-06 | `E104` → status 400, `mensaje` exacto `segmento vacío`. | X:179, X:194–X:196, X:198–X:202, X:205, X:242 | confirmado en v2 |
| ERR-07 | `E201` → status 400, `mensaje` exacto `control mal formado`. | X:47 | probable |
| ERR-08 | `E202` → status 400, `mensaje` exacto `control inválido`. | X:32, X:4, X:6 | confirmado |
| ERR-09 | `E301` → status 400, `mensaje` exacto `comando desconocido ` (espacio final); variante con `"sugerencia":"<COMANDO>"` cuando hay un comando a distancia ≤ 2 (OBS-05). | X:42, X:126, X:308; variante: X:286, X:287, X:300–X:305, X:311, X:312, X:315, X:330 | probable; variante confirmada en v2 |
| ERR-10 | `E304` → status 400, `mensaje` exacto `origen y destino iguales`. | X:80, X:210, X:222 | confirmado |
| ERR-11 | `E302` → status 400, `mensaje` exacto `aridad inválida`. | X:50 | probable |
| ERR-12 | `E303` → status 400, `mensaje` exacto `monto inválido`. | X:21–X:24, X:26, X:77, X:84, X:211, X:221, X:275, X:278 | confirmado |
| ERR-13 | `E401` → status 404, `mensaje` exacto `cuenta inexistente`. | X:45, X:75, X:76, X:78, X:82 | confirmado |
| ERR-14 | `E402` → status 404, `mensaje` exacto `operación inexistente`. | X:18, X:239, X:240 | confirmado |
| ERR-15 | `E506` → status 422, `mensaje` exacto `límite excedido`. | X:39, X:27, X:30, X:191, X:276, X:320 | confirmado |
| ERR-16 | `E507` → status 422, `mensaje` exacto `saldo insuficiente`. | X:46, X:323 | probable |

Orden de evaluación:

| ID | Orden | Evidencia | Confianza |
|---|---|---|---|
| ORD-01 | Ruta (E404) antes que autenticación (E001). | X:12 | probable |
| ORD-02 | Autenticación antes que el cuerpo (E100/E102) y que la integridad. | — | supuesto |
| ORD-03 | Cuerpo (E100/E102) antes que control: sin `m` no hay control que validar (inferencia lógica, sin evidencia directa). | — | supuesto |
| ORD-04 | E201 → E202 → E301 → E302: E201/E202 (control) se evalúan antes que E301/E302 (comando, aridad); con comando desconocido y control mal formado o inválido gana el control. E201 y E202 son excluyentes. `PING` queda fuera de esta cadena: solo valida aridad (INT-09). | X:51–X:56; X:197, X:212 | probable |
| ORD-04b | E103 (mensaje sin `;`) antes que todo lo demás del mensaje. | X:60, X:204 | confirmado |
| ORD-04c | E104 (segmento vacío) después de E103 y antes de E201, E202, E301 y E302: `ALTA;;86` (control erróneo) y `SALDOS;;55` (comando desconocido) dan E104. | X:198, X:201, X:199 | confirmado en v2 |
| ORD-05 | E506 antes que E507: monto 150000 sobre el límite y sobre el saldo (130000) → E506 (v1, X:30). En v2: monto 50001 con saldo 50000 → E506 (X:320). | X:30; X:320 | confirmado en v2 |
| ORD-06 | TRANSFER: E303 antes que E401 (origen inexistente y monto 0 → E303) y antes que E304 (cuentas iguales y monto 0 → E303). | X:77, X:221 | confirmado |
| ORD-07 | TRANSFER: E401 antes que E506 (destino inexistente y monto 200000 → E401). | X:78 | probable |
| ORD-08 | TRANSFER: E303 → E304 → E401 → E506 → E507; E506 no se evalúa entre cuentas del mismo titular (CMD-10b). E304 antes que E401 (cuentas iguales inexistentes) y antes que E506 (monto 60000). | X:221, X:210, X:222, X:78, X:30 | confirmado en v2 |
| ORD-09 | DEPOSITO: E303 antes que E401 (cuenta inexistente y monto `abc` → E303). | X:211 | confirmado en v2 |

## 6. Cambios durante el día

### 6.1 Método y diferencias entre versiones

Método: se reprodujeron las 84 líneas de la versión 1 contra la versión 2 (X:85–X:168, mismas solicitudes que
X:1–X:84) y luego se ejecutaron oleadas nuevas de experimentos (X:169–X:7306). Una diferencia está **probada** solo
si la misma solicitud existe en ambas versiones con respuestas distintas.

| ID | Comportamiento | Evidencia | Confianza |
|---|---|---|---|
| CAM-01 | Formato del saldo en `CONSULTA`: v1 devolvía un número (`"saldo":0`, `"saldo":40000`); v2 devuelve un string con dos decimales (`"saldo":"0.00"`, `"saldo":"400.00"`). Diferencial probado: la misma solicitud con distinta respuesta. | X:35 vs X:119; X:38 vs X:122 | confirmado |
| CAM-02 | Límite de `TRANSFER`: v1 aceptaba 100000 y rechazaba más; v2 acepta hasta 50000 inclusive y rechaza 50001 (`E506`), salvo entre cuentas del mismo titular (CMD-10b). Diferencial probado: `TRANSFER;AC-0001;AC-0002;100000` pasó de `200` a `422 E506`. | X:28 vs X:112; v2: X:190, X:191 | confirmado |
| CAM-03 | **Candidato**: segmento vacío → `400 E104 "segmento vacío"` (ver INT-10 y ORD-04c). Observado en v2 en las líneas E104 citadas. **No hay línea base en v1 para segmentos vacíos** (ninguna de X:1–X:84 envía uno), así que la diferencia respecto de v1 **no está probada**: puede ser un cambio de v2 o un comportamiento que ya existía. | X:179, X:194, X:195, X:196, X:198, X:199, X:200, X:201, X:202, X:205, X:242 | supuesto (candidato: diferencia no probada) |
| CAM-04 | Método: campaña de fuzzing diferencial (X:338–X:7306), no una prueba de equivalencia. Secuencias aleatorias con estado de 1 a 12 pasos sobre los seis comandos con valores de borde; cada paso se envió al original y se comparó con la réplica. Tres lotes (300, 300 y 200 secuencias; semillas 20261011, 20261012 y 20261013), más sondas dirigidas (`s-v2-access-01`, `s-v2-e507-a`…`d`, `s-v2-holder-a`…`c`). Criterio de parada: dos lotes consecutivos sin diferencias nuevas. La campaña reveló la regla del titular (CMD-10b). No demuestra que no queden diferencias en lo que el fuzzing no generó (ver 6.3). | X:338–X:7306; regla revelada: X:610, X:1304, X:2467 | confirmado (método); la ausencia de otras diferencias no está probada |

### 6.2 Comportamiento observado en v2, sin línea base en v1

Estos comportamientos se observaron en v2, pero no existe solicitud equivalente en v1; **no se presentan como cambios
de versión**. La réplica los implementa porque son lo observado.

| ID | Comportamiento | Evidencia | Confianza |
|---|---|---|---|
| OBS-01 | `PING` ignora el control (formato y valor) pero valida la aridad (INT-09). Consistente con el ejemplo del README (líneas 62–64, `PING;XX`). | X:197, X:212, X:213; README líneas 62–64 | confirmado en v2 |
| OBS-02 | Orden de validación de TRANSFER E303 → E304 → E401 → E506 → E507 (ORD-08; E506 no aplica entre cuentas del mismo titular, CMD-10b) y de DEPOSITO E303 → E401 (ORD-09). | X:210, X:211, X:221, X:222 | confirmado en v2 |
| OBS-03 | Monto máximo 9999999999 en DEPOSITO y TRANSFER (`E303` por encima, antes que `E506`); sin tope de saldo (CMD-08b). | X:275, X:276, X:278, X:279, X:280, X:281 | confirmado en v2 |
| OBS-04 | Mensaje vacío `""` → `E103` (INT-07). | X:204 | confirmado en v2 |
| OBS-05 | `E301` con campo opcional `sugerencia`: nombre del comando conocido más cercano si está a distancia de edición (Levenshtein) ≤ 2 del campo de comando en mayúsculas, sin recortar espacios: `" PING"`, `PIN`, `PINGG`, `ping `, `PIGN` (distancia 2) → `PING`; `ALTA ` y `AL TA` → `ALTA`; `DEPOSITOS` → `DEPOSITO`; `CONSULT` y `CONSUL` (distancia 2) → `CONSULTA`. Sin la clave cuando no hay comando cercano: `DEPOS` (distancia 3, X:313), `SALDOS` (distancia 4, X:126) y `XYZ`. Los errores de control ganan antes: `" PING;XX"` → E201, `" PING;63"` → E202. La métrica es consistente con Levenshtein (X:311–X:313, X:315); no se afirma el algoritmo general de sugerencia. Supuesto: desempate por el orden PING, ALTA, CONSULTA, DEPOSITO, TRANSFER, ANULA (ver OBS-07). | X:286, X:287, X:300–X:305, X:311–X:313, X:308, X:126; X:306, X:307 | confirmado en v2 (umbral ≤ 2); supuesto: desempate |
| OBS-06 | El control de comandos distintos de `PING` es de 1 o 2 dígitos y se compara como texto exacto (INT-06, INT-06b). | X:282–X:285, X:309, X:310 | confirmado en v2 |
| OBS-07 | Empate en la sugerencia: `ANLUA;OP-0001;65` → `E301` con `"sugerencia":"ALTA"`. `ANLUA` está a distancia Levenshtein 2 de `ALTA` y de `ANULA`, y a distancia Damerau (OSA) 1 de `ANULA` y 2 de `ALTA`. Como el original responde `ALTA`, no elige por distancia de Damerau; con Levenshtein hay empate y gana `ALTA`. La regla de desempate (orden de los comandos o alfabético) no queda distinguida, porque `ALTA` precede a `ANULA` en ambos órdenes. | X:315 | confirmado en v2 (no es Damerau); supuesto: regla de desempate |

### 6.3 Límite del método

No se ejecutó un chequeo sistemático de deriva sobre comportamientos no repetidos entre versiones: un cambio en un
comportamiento que no se probó en ambas versiones no sería detectado (supuesto, sin evidencia). La campaña de fuzzing (CAM-04) comparó la réplica con la versión 2 del original, no entre versiones: no prueba los resultados de ninguna evaluación externa.

## 7. Riesgos

Comportamientos que un cliente nuevo no debería heredar, y cómo cerrarlos:

| ID | Comportamiento | Evidencia | Confianza |
|---|---|---|---|
| RIE-01 | Errores tipográficos en el contrato: `"recieved"`, espacio final en `"comando desconocido "`. Cierre propuesto: API v2 con textos corregidos; v1 congelada solo para clientes existentes. | X:36, X:42 | confirmado |
| RIE-02 | Claves inconsistentes: `cuentaId` (ALTA) vs `cuenta_id` (CONSULTA). Cierre propuesto: un único estilo de nombres en v2. | X:33, X:119 | confirmado |
| RIE-03 | El control MOD 97 detecta errores de tipeo, no autentica ni protege la integridad ante un atacante. Cierre propuesto: firmar mensajes (p. ej. HMAC) o confiar en TLS + autenticación; no tratar el control como seguridad. | X:31–X:50 (INT-03: fórmula pública y determinista) | confirmado |
| RIE-04 | `X-Req` expone un contador global de uso del token y no se reinicia. Cierre propuesto: reemplazarlo por un ID de request opaco. | X:2–X:6, X:18→X:19 | probable |
| RIE-05 | Comandos sin distinguir mayúsculas y montos como texto libre. Cierre propuesto: validación estricta y documentada del formato. | X:41, X:57, X:21–X:24 | probable |
| RIE-06 | `ANULA` deja saldos negativos: anular un DEPOSITO ya gastado se acepta (CMD-18c). Cierre propuesto: rechazar anulaciones sin saldo suficiente. | X:70–X:73, X:322 | confirmado |
