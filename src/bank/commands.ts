import { Errors } from "../protocol/errors.ts";
import type { Reply } from "../protocol/errors.ts";
import type { ParsedMessage } from "../protocol/parse.ts";
import { formatId } from "./state.ts";
import type { BankState } from "./state.ts";

// Observed (version 2): 50000 accepted, 50001 rejected (experimentos.jsonl:190-191). The limit is per transfer,
// not cumulative (experimentos.jsonl:27-29, version 1 with 100000).
const TRANSFER_LIMIT = 50000;

// Observed: 9999999999 accepted twice, 10000000000 -> E303 (experimentos.jsonl:278-280, 275). The balance has no cap.
const MAX_AMOUNT = 9999999999;

function parseAmount(raw: string): number | null {
  // Observed: 0, negative, decimal and non-numeric amounts -> E303 (experimentos.jsonl:21-24, 26, 177, 230-232).
  // Observed for DEPOSITO: a leading zero ("0500") -> E303 (experimentos.jsonl:84, 168).
  // Inference: TRANSFER shares this parser, so it rejects leading zeros too (not observed).
  if (!/^[1-9]\d*$/.test(raw)) return null;
  const n = Number(raw);
  return n <= MAX_AMOUNT ? n : null;
}

/**
 * Formats integer cents as a decimal string with exactly two decimals ("-0.05", "400.00").
 * Observed: experimentos.jsonl:119, 122, 157, 176, 228, 249, 281. Integer arithmetic only: no float division.
 * ASSUMPTION: balances stay within the safe integer range (the original shows no cap; none was probed).
 */
export function formatCents(cents: number): string {
  const absolute = Math.abs(cents);
  const fraction = absolute % 100;
  const whole = (absolute - fraction) / 100;
  return `${cents < 0 ? "-" : ""}${whole}.${String(fraction).padStart(2, "0")}`;
}

function nextOperationId(state: BankState): string {
  state.operationCounter += 1;
  return formatId("OP", state.operationCounter);
}

export function execute(state: BankState, msg: ParsedMessage): Reply {
  const [a = "", b = "", c = ""] = msg.args;
  switch (msg.command) {
    case "PING":
      return { status: 200, body: { pong: true } };

    case "ALTA": {
      // Observed: a duplicate name is accepted with a new id (experimentos.jsonl:83).
      // ASSUMPTION: any other name (empty, non-ASCII) is accepted too.
      state.accountCounter += 1;
      const id = formatId("AC", state.accountCounter);
      state.accounts.set(id, 0);
      return { status: 201, body: { cuentaId: id } };
    }

    case "CONSULTA": {
      // Observed: account ids are matched exactly; "ac-0001" is unknown (experimentos.jsonl:82).
      const balance = state.accounts.get(a);
      if (balance === undefined) return Errors.unknownAccount;
      return { status: 200, body: { cuenta_id: a, saldo: formatCents(balance) } };
    }

    case "DEPOSITO": {
      // Observed: the amount is validated before the account (E303 before E401, experimentos.jsonl:211).
      const amount = parseAmount(b);
      if (amount === null) return Errors.invalidAmount;
      const balance = state.accounts.get(a);
      if (balance === undefined) return Errors.unknownAccount;
      state.accounts.set(a, balance + amount);
      const opId = nextOperationId(state);
      state.operations.set(opId, { kind: "DEPOSITO", from: null, to: a, amount, annulled: false });
      return { status: 200, body: { status: "recieved", operacionId: opId } };
    }

    case "TRANSFER": {
      // Observed order (version 2): E303 -> E304 -> E401 -> E506 -> E507
      // (experimentos.jsonl:221, 210, 222, 78, 30).
      const amount = parseAmount(c);
      if (amount === null) return Errors.invalidAmount;
      // Observed: same origin and destination -> E304 even when the account does not exist, no balance change
      // (experimentos.jsonl:80-81, 210, 222).
      if (a === b) return Errors.sameAccount;
      const fromBalance = state.accounts.get(a);
      const toBalance = state.accounts.get(b);
      if (fromBalance === undefined || toBalance === undefined) return Errors.unknownAccount;
      if (amount > TRANSFER_LIMIT) return Errors.limitExceeded;
      if (fromBalance < amount) return Errors.insufficientFunds;
      state.accounts.set(a, fromBalance - amount);
      state.accounts.set(b, toBalance + amount);
      const opId = nextOperationId(state);
      state.operations.set(opId, { kind: "TRANSFER", from: a, to: b, amount, annulled: false });
      return { status: 200, body: { status: "recieved", operacionId: opId } };
    }

    case "ANULA": {
      // Observed: an unknown operation yields 404 E402 (experimentos.jsonl:18).
      const op = state.operations.get(a);
      if (op === undefined) return Errors.unknownOperation;
      if (op.annulled) return { status: 200, body: { ok: false, motivo: "ya anulada" } };
      op.annulled = true;
      // Observed: reverting a TRANSFER debits the destination and credits the origin (experimentos.jsonl:65-67);
      // reverting a DEPOSITO debits the account (68-69); negative balances are allowed (72-73).
      state.accounts.set(op.to, (state.accounts.get(op.to) ?? 0) - op.amount);
      if (op.from !== null) state.accounts.set(op.from, (state.accounts.get(op.from) ?? 0) + op.amount);
      return { status: 200, body: { ok: true, anulada: a } };
    }
  }
}
