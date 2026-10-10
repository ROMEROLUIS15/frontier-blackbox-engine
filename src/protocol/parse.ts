import { controlDigit } from "../control/iso7064.ts";
import { Errors, unknownCommandSuggesting } from "./errors.ts";
import { levenshtein } from "./levenshtein.ts";
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

// Observed: distance <= 2 gets a suggestion (experimentos.jsonl:286, 287, 300-305, 311, 312); distance 3 (DEPOS,
// X:313) and 4 (SALDOS, X:126) do not, nor does XYZ (X:308). Change the threshold here only.
const SUGGESTION_MAX_DISTANCE = 2;

/**
 * Closest known command to an unknown (already upper-cased, untrimmed) command name, or null when none is within
 * SUGGESTION_MAX_DISTANCE.
 * Observed: the metric is consistent with plain Levenshtein (X:311-313, X:315). X:315 ("ANLUA") is 2 from ALTA and
 * 2 from ANULA under Levenshtein, but 1 from ANULA under Damerau (OSA); the original answers ALTA, so it does not
 * choose by Damerau distance. This does not establish the general suggestion algorithm.
 * ASSUMPTION: ties go to the first command in ARITY order. X:315 is consistent with it but does not distinguish it
 * from alphabetical order (ALTA precedes ANULA in both).
 */
export function suggestCommand(name: string): CommandName | null {
  let best: CommandName | null = null;
  let bestDistance = SUGGESTION_MAX_DISTANCE + 1;
  for (const candidate of Object.keys(ARITY)) {
    if (!isCommand(candidate)) continue;
    const distance = levenshtein(name, candidate);
    if (distance < bestDistance) {
      best = candidate;
      bestDistance = distance;
    }
  }
  return best;
}

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
  if (!/^\d{1,2}$/.test(control)) return Errors.malformedControl;

  const payload = fields.slice(0, -1).join(";");
  // Observed: the control value is compared as exact text: "03" and "00" are E202 although the valid control is 3
  // (experimentos.jsonl:309, 310; "3" is accepted, ejemplos n=4). "064" is accepted only by PING, which ignores
  // the control (experimentos.jsonl:58, 142).
  if (control !== String(controlDigit(payload))) return Errors.invalidControl;

  if (!isCommand(name)) {
    const suggestion = suggestCommand(name);
    return suggestion === null ? Errors.unknownCommand : unknownCommandSuggesting(suggestion);
  }
  if (args.length !== ARITY[name]) return Errors.invalidArity;

  return { command: name, args };
}

export function isReply(value: ParsedMessage | Reply): value is Reply {
  return "status" in value;
}
