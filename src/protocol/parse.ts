import { controlDigit } from "../control/iso7064.ts";
import { Errors } from "./errors.ts";
import type { Reply } from "./errors.ts";

export type CommandName = "PING" | "ALTA" | "CONSULTA" | "DEPOSITO" | "TRANSFER" | "ANULA";

export interface ParsedMessage {
  command: CommandName;
  args: string[];
}

const ARITY: Record<CommandName, number> = {
  PING: 0,
  ALTA: 1,
  CONSULTA: 1,
  DEPOSITO: 2,
  TRANSFER: 3,
  ANULA: 1,
};

function isCommand(name: string): name is CommandName {
  return Object.hasOwn(ARITY, name);
}

/**
 * Validates a raw message `m`. The order is defined only in this function (version 2):
 * E103 (no `;`) -> E104 (any empty segment) -> [PING: arity only] -> control format E201 -> control value E202
 * -> command E301 -> arity E302.
 */
export function parseMessage(m: string): ParsedMessage | Reply {
  // Observed: no `;` at all, including the empty message -> E103 (experimentos.jsonl:60, 144, 204).
  if (!m.includes(";")) return Errors.missingControl;

  const fields = m.split(";");

  // Observed: any empty segment, first command segment and last control segment included, is E104 and wins over
  // control, command and arity errors (experimentos.jsonl:179, 194-196, 198-202, 205, 242).
  // A segment holding only a space is not empty (experimentos.jsonl:203).
  if (fields.includes("")) return Errors.emptySegment;

  const name = (fields[0] ?? "").toUpperCase();
  const args = fields.slice(1, -1);

  // Observed: PING ignores the control completely (format and value) but still checks arity
  // (experimentos.jsonl:197, 212, 213).
  if (name === "PING") {
    return args.length === ARITY.PING ? { command: name, args } : Errors.invalidArity;
  }

  const control = fields[fields.length - 1] ?? "";
  // Observed: a non-PING control is 1 or 2 digits; "050", "150", "+50" and " 50" are E201, and a single digit is
  // accepted (experimentos.jsonl wave 10: X:282-285; ejemplos n=4).
  // ASSUMPTION: a 2-digit control with a leading zero (e.g. "03") is valid as a number; not yet measured.
  if (!/^\d{1,2}$/.test(control)) return Errors.malformedControl;

  const payload = fields.slice(0, -1).join(";");
  // Note: "064" equals 64 only for PING, which ignores the control (experimentos.jsonl:58, 142).
  if (Number(control) !== controlDigit(payload)) return Errors.invalidControl;

  if (!isCommand(name)) return Errors.unknownCommand;
  if (args.length !== ARITY[name]) return Errors.invalidArity;

  return { command: name, args };
}

export function isReply(value: ParsedMessage | Reply): value is Reply {
  return "status" in value;
}
