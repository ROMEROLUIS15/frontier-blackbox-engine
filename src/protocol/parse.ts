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
 * Observed: control format (E201) and control value (E202) are checked before command (E301) and
 * arity (E302) (experimentos.jsonl:51-56). The order is defined only in this function.
 */
export function parseMessage(m: string): ParsedMessage | Reply {
  // Observed: experimentos.jsonl:60 (`PING` without `;` -> E103).
  // ASSUMPTION: any non-empty message without `;` is E103; only `PING` was observed.
  // ASSUMPTION: an empty message stays on the control-format path (E201); not demonstrated.
  if (m !== "" && !m.includes(";")) return Errors.missingControl;

  const fields = m.split(";");
  const control = fields[fields.length - 1] ?? "";

  if (!/^\d+$/.test(control)) return Errors.malformedControl;

  const payload = fields.slice(0, -1).join(";");
  // Observed: leading zeros in the control compare numerically ("064" equals 64, experimentos.jsonl:58).
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
