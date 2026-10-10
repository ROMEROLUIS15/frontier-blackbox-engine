/**
 * Static glossary used by scripts/experiment-guide.ts.
 * Every sentence is a close paraphrase of a row of docs/specification.md (cited by row id) or of a README.md line.
 * The generator fails when a cited spec row id does not exist, so a stale citation cannot go unnoticed.
 * Nothing here is learned from the replica or invented: to change the explanation, change the specification first.
 */

export interface CommandInfo {
  name: string;
  /** Names of the arguments between the command and the control digit. */
  args: readonly string[];
  meaning: string;
  cite: readonly string[];
}

export const COMMANDS: readonly CommandInfo[] = [
  { name: "PING", args: [], meaning: "responde `{\"pong\":true}`; ignora el control pero valida la aridad", cite: ["CMD-01", "INT-09"] },
  { name: "ALTA", args: ["nombre"], meaning: "crea una cuenta con saldo 0 y devuelve su `cuentaId`, secuencial desde `AC-0001`", cite: ["CMD-02"] },
  { name: "CONSULTA", args: ["cuenta"], meaning: "devuelve `cuenta_id` y `saldo`", cite: ["CMD-04"] },
  { name: "DEPOSITO", args: ["cuenta", "monto"], meaning: "suma el monto al saldo de la cuenta y devuelve un `operacionId`", cite: ["CMD-06"] },
  {
    name: "TRANSFER",
    args: ["origen", "destino", "monto"],
    meaning: "resta el monto de la cuenta de origen, lo suma a la de destino y devuelve un `operacionId`",
    cite: ["CMD-09"],
  },
  {
    name: "ANULA",
    args: ["operacion"],
    meaning: "anula una operación (primera vez `ok:true`; segunda vez `ok:false` con motivo `ya anulada`)",
    cite: ["CMD-15"],
  },
];

export interface ErrorInfo {
  code: string;
  /** Id of the row of docs/specification.md section 5 that defines the code. */
  row: string;
  status: number;
  mensaje: string;
  /** What the specification says triggers it. */
  rule: string;
  cite: readonly string[];
}

export const ERRORS: readonly ErrorInfo[] = [
  { code: "E001", row: "ERR-02", status: 401, mensaje: "no autorizado", rule: "falta la cabecera `Authorization` o el token es incorrecto", cite: ["ENT-05"] },
  { code: "E404", row: "ERR-01", status: 404, mensaje: "ruta desconocida", rule: "ruta inexistente o método no admitido en una ruta conocida", cite: ["ENT-02", "ENT-03"] },
  { code: "E100", row: "ERR-03", status: 400, mensaje: "json inválido", rule: "el cuerpo no es JSON", cite: ["ENT-08"] },
  { code: "E102", row: "ERR-04", status: 400, mensaje: "falta m", rule: "el JSON no trae `m`, o `m` no es un string", cite: ["ENT-09", "ENT-11"] },
  { code: "E103", row: "ERR-05", status: 400, mensaje: "falta control", rule: "el mensaje no contiene ningún `;`", cite: ["INT-07"] },
  { code: "E104", row: "ERR-06", status: 400, mensaje: "segmento vacío", rule: "algún segmento de `m` al dividirlo por `;` está vacío", cite: ["INT-10"] },
  {
    code: "E201", row: "ERR-07",
    status: 400,
    mensaje: "control mal formado",
    rule: "el control no es numérico o no tiene 1 o 2 dígitos (salvo en `PING`)",
    cite: ["INT-02", "INT-06"],
  },
  { code: "E202", row: "ERR-08", status: 400, mensaje: "control inválido", rule: "el control es numérico pero no es el válido (salvo en `PING`)", cite: ["INT-04", "INT-06b"] },
  { code: "E301", row: "ERR-09", status: 400, mensaje: "comando desconocido ", rule: "el comando no existe; puede añadir `sugerencia`", cite: ["CMD-19", "OBS-05"] },
  { code: "E302", row: "ERR-11", status: 400, mensaje: "aridad inválida", rule: "el número de argumentos no es el del comando", cite: ["CMD-20"] },
  { code: "E303", row: "ERR-12", status: 400, mensaje: "monto inválido", rule: "el monto es 0, negativo, decimal, no numérico, con cero a la izquierda o mayor que el máximo", cite: ["CMD-07", "CMD-07b", "CMD-08b"] },
  { code: "E304", row: "ERR-10", status: 400, mensaje: "origen y destino iguales", rule: "en `TRANSFER`, origen y destino son la misma cuenta", cite: ["CMD-14b"] },
  { code: "E401", row: "ERR-13", status: 404, mensaje: "cuenta inexistente", rule: "la cuenta consultada, de origen o de destino no existe", cite: ["CMD-05", "CMD-14"] },
  { code: "E402", row: "ERR-14", status: 404, mensaje: "operación inexistente", rule: "la operación que se quiere anular no existe", cite: ["CMD-16"] },
  { code: "E506", row: "ERR-15", status: 422, mensaje: "límite excedido", rule: "el monto de un `TRANSFER` supera el límite de la versión", cite: ["CMD-10", "CAM-02"] },
  { code: "E507", row: "ERR-16", status: 422, mensaje: "saldo insuficiente", rule: "el saldo de la cuenta de origen es menor que el monto", cite: ["CMD-12"] },
];

export interface ShapeInfo {
  /** Comma-separated sorted keys of the JSON object. */
  keys: string;
  meaning: string;
  cite: readonly string[];
}

export const SHAPES: readonly ShapeInfo[] = [
  { keys: "pong", meaning: "respuesta de `PING`", cite: ["CMD-01"] },
  { keys: "cuentaId", meaning: "cuenta creada por `ALTA`; el id es secuencial desde `AC-0001`", cite: ["CMD-02"] },
  { keys: "cuenta_id,saldo", meaning: "respuesta de `CONSULTA`; en v1 el saldo era un número y en v2 es un string con dos decimales", cite: ["CMD-04", "CAM-01"] },
  { keys: "operacionId,status", meaning: "operación aceptada y registrada por `DEPOSITO` o `TRANSFER` (el texto `recieved` es el del original)", cite: ["CMD-06", "CMD-09", "RIE-01"] },
  { keys: "anulada,ok", meaning: "primera anulación de una operación", cite: ["CMD-15"] },
  { keys: "motivo,ok", meaning: "segunda anulación de la misma operación", cite: ["CMD-15"] },
  { keys: "ok", meaning: "respuesta de `GET /health` y de `POST /__reset`", cite: ["ENT-06", "ENT-07"] },
];

export interface CategoryInfo {
  key: string;
  label: string;
  /** Fixed explanation of why experiments of this category matter. */
  why: string;
  /** Sequence stems assigned to the category, e.g. `lim` for `s-v2-lim-01`. */
  stems: readonly string[];
}

/** Applied in this order; `preparation` and `replay` are decided per line, the rest per sequence stem. */
export const CATEGORIES: readonly CategoryInfo[] = [
  {
    key: "preparation",
    label: "Preparación",
    why: "Es un paso de preparación: deja las cuentas u operaciones en el estado que necesitan las solicitudes siguientes de la misma secuencia y por sí mismo no pone a prueba ninguna regla.",
    stems: [],
  },
  {
    key: "replay",
    label: "Repetición de v1 contra v2",
    why: "Repite una solicitud de v1 contra v2, con la misma solicitud y el mismo estado: es la única manera de probar que v2 cambió un comportamiento, porque una diferencia solo está probada si existe el par en ambas versiones (especificación, sección 6.1).",
    stems: [],
  },
  {
    key: "http",
    label: "Sonda de forma HTTP",
    why: "Pertenece a una secuencia que sondea la forma HTTP: cómo responde el servicio según la ruta, el método, la cabecera de autenticación o el cuerpo, antes de interpretar el contenido del mensaje (especificación, sección 1).",
    stems: ["diag", "io", "http"],
  },
  {
    key: "control",
    label: "Sonda del dígito de control",
    why: "Pertenece a una secuencia que sondea el dígito de control: cómo se valida, o se ignora, el último campo del mensaje (especificación, sección 2).",
    stems: ["ctl", "ping"],
  },
  {
    key: "order",
    label: "Sonda de orden de validación",
    why: "Pertenece a una secuencia que sondea el orden de validación: cuando una solicitud tiene más de un fallo, la respuesta revela cuál se evalúa primero (especificación, sección 5, «Orden de evaluación»).",
    stems: ["ord"],
  },
  {
    key: "boundary",
    label: "Sonda de límite o borde",
    why: "Pertenece a una secuencia que sondea límites y bordes (montos máximos, límite de TRANSFER, saldo insuficiente): fija el valor exacto en el que cambia la respuesta (especificación, CMD-08b, CMD-10, CMD-12).",
    stems: ["lim", "max", "e507"],
  },
  {
    key: "format",
    label: "Sonda de formato de campos",
    why: "Pertenece a una secuencia que sondea el formato de los campos (montos, nombres, identificadores, segmentos vacíos): determina qué valores acepta o rechaza el servicio (especificación, secciones 2 y 3).",
    stems: ["exp", "e104", "seg", "ids"],
  },
  {
    key: "amount",
    label: "Sonda de montos",
    why: "Pertenece a una secuencia que sondea los montos: qué valores acepta o rechaza el servicio (cero, negativos, decimales, texto) y desde qué valor se aplica un límite (especificación, CMD-07, CMD-10).",
    stems: ["amt"],
  },
  {
    key: "state",
    label: "Sonda de efecto en el estado",
    why: "Pertenece a una secuencia que sondea cómo las operaciones modifican el estado (anulaciones, transferencias, saldos negativos): comprueba lo que recuerda el servicio entre solicitudes (especificación, sección 4).",
    stems: ["anu", "tr", "neg"],
  },
  {
    key: "command",
    label: "Sonda del nombre de comando",
    why: "Pertenece a una secuencia que sondea los nombres de comando desconocidos y la sugerencia que acompaña a E301 (especificación, OBS-05).",
    stems: ["sug"],
  },
  {
    key: "final",
    label: "Sonda de la campaña final",
    why: "Pertenece a la campaña final de experimentos (secuencias `final-*`): sondea un punto concreto, el que enuncia la hipótesis registrada.",
    stems: ["final"],
  },
  {
    key: "example",
    label: "Reproducción de un ejemplo oficial",
    why: "Reproduce uno de los 20 ejemplos oficiales de `pruebas/ejemplos.jsonl` para comprobar que el original responde lo mismo (especificación, encabezado).",
    stems: ["ej"],
  },
];

/** Meaning of the control digit, from docs/specification.md INT-01 and INT-03. */
export const CONTROL_DIGIT = {
  text: "El último campo del mensaje es el dígito de control y todo lo anterior es el payload (INT-01). El control válido es `98 − (N·100 mod 97)` (ISO 7064 MOD 97-10), donde N se forma con el payload en mayúsculas: los dígitos se conservan, las letras valen A=1…Z=26 sin relleno y los demás símbolos se descartan (INT-03).",
  cite: ["INT-01", "INT-03"],
} as const;

/** Header forms logged in `auth`. Only the first three are described by the specification (ENT-05). */
export const AUTH_FORMS: Readonly<Record<string, { text: string; cite: readonly string[] }>> = {
  team: { text: "`Authorization: Bearer $TEAM_TOKEN`, con el token del equipo", cite: ["ENT-05"] },
  wrong: { text: "`Authorization: Bearer wrong-token`, con un token incorrecto", cite: ["ENT-05"] },
  none: { text: "sin la cabecera `Authorization`", cite: ["ENT-05"] },
  "bearer-lower": { text: "`Authorization: bearer $TEAM_TOKEN`, con el esquema `bearer` en minúsculas", cite: [] },
  "no-scheme": { text: "`Authorization: $TEAM_TOKEN`, el token sin el esquema `Bearer`", cite: [] },
};

/** Known routes, from ENT-01. */
export const KNOWN_ROUTES: readonly string[] = ["GET /health", "POST /__reset", "POST /msg"];

/** README.md facts used by the introduction. */
export const README_FACTS = {
  examplesMorning: "README.md, líneas 15-16: los ejemplos se grabaron con la versión del servicio de la mañana",
  serviceChanges: "README.md, líneas 132-133: el servicio puede cambiar durante el día",
} as const;
