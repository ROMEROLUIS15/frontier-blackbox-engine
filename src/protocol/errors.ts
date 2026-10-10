export type JsonBody = Record<string, unknown>;

export interface Reply {
  status: number;
  body: JsonBody;
}

function err(status: number, error: string, mensaje: string): Reply {
  return { status, body: { error, mensaje } };
}

// Response bodies are byte-exact copies of the original service's Spanish strings.
export const Errors = {
  unauthorized: err(401, "E001", "no autorizado"),
  // ASSUMPTION: a body that is not a JSON object with a string `m` yields E101 (unverified code and text).
  invalidBody: err(400, "E101", "cuerpo inválido"),
  malformedControl: err(400, "E201", "control mal formado"),
  invalidControl: err(400, "E202", "control inválido"),
  // Note the trailing space: it is part of the original message.
  unknownCommand: err(400, "E301", "comando desconocido "),
  invalidArity: err(400, "E302", "aridad inválida"),
  // ASSUMPTION: code E303 and its text for invalid amounts are unverified.
  invalidAmount: err(400, "E303", "monto inválido"),
  unknownAccount: err(404, "E401", "cuenta inexistente"),
  // ASSUMPTION: code E402, status 404 and text for unknown operations are unverified.
  unknownOperation: err(404, "E402", "operación inexistente"),
  limitExceeded: err(422, "E506", "límite excedido"),
  insufficientFunds: err(422, "E507", "saldo insuficiente"),
  // ASSUMPTION: unknown routes answer 404 E404 (unverified).
  routeNotFound: err(404, "E404", "ruta inexistente"),
} as const;
