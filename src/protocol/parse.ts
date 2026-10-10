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
 * Validates a raw message `m`.
 * ASSUMPTION: the relative order of the checks (control format, control value, command, arity)
 * is unverified; it is defined only in this function so it can be changed in one place.
 */
export function parseMessage(m: string): ParsedMessage | Reply {
  const fields = m.split(";");
  const control = fields[fields.length - 1] ?? "";

  if (!/^\d+$/.test(control)) return Errors.malformedControl;

  const payload = fields.slice(0, -1).join(";");
  // ASSUMPTION: leading zeros in the control compare numerically ("064" equals 64).
  if (Number(control) !== controlDigit(payload)) return Errors.invalidControl;

  const name = (fields[0] ?? "").toUpperCase();
  if (!isCommand(name) || fields.length < 2) return Errors.unknownCommand;

  const args = fields.slice(1, -1);
  if (args.length !== ARITY[name]) return Errors.invalidArity;

  return { command: name, args };
}

export function isReply(value: ParsedMessage | Reply): value is Reply {
  return "status" in value;
}
