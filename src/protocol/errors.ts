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
  // Observed: experimentos.jsonl:15 (body is not JSON).
  invalidJson: err(400, "E100", "json inválido"),
  // Observed: experimentos.jsonl:16-17 (no `m`, or `m` not a string).
  missingMessage: err(400, "E102", "falta m"),
  malformedControl: err(400, "E201", "control mal formado"),
  invalidControl: err(400, "E202", "control inválido"),
  // Note the trailing space: it is part of the original message.
  unknownCommand: err(400, "E301", "comando desconocido "),
  invalidArity: err(400, "E302", "aridad inválida"),
  // Observed: experimentos.jsonl:21-24, 26 (0, negative, decimal, non-numeric).
  invalidAmount: err(400, "E303", "monto inválido"),
  unknownAccount: err(404, "E401", "cuenta inexistente"),
  // Observed: experimentos.jsonl:18.
  unknownOperation: err(404, "E402", "operación inexistente"),
  limitExceeded: err(422, "E506", "límite excedido"),
  insufficientFunds: err(422, "E507", "saldo insuficiente"),
  // Observed: experimentos.jsonl:7-9, 12 (unknown path, or unsupported method on a known path).
  routeNotFound: err(404, "E404", "ruta desconocida"),
  // ASSUMPTION: unexpected failures answer a generic 500 E500 body (unverified; no internals exposed).
  internal: err(500, "E500", "error interno"),
} as const;
