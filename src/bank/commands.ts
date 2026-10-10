import { Errors } from "../protocol/errors.ts";
import type { Reply } from "../protocol/errors.ts";
import type { ParsedMessage } from "../protocol/parse.ts";
import { formatId } from "./state.ts";
import type { BankState } from "./state.ts";

// Observed: 100000 accepted, 120000 rejected.
// Observed: 100001 rejected, and limit is per transfer, not cumulative (experimentos.jsonl:27-29).
const TRANSFER_LIMIT = 100000;

function parseAmount(raw: string): number | null {
  // Observed: 0, negative, decimal and non-numeric amounts -> E303 (experimentos.jsonl:21-24, 26).
  // Observed for DEPOSITO: a leading zero ("0500") -> E303 (experimentos.jsonl:84).
  // Inference: TRANSFER shares this parser, so it rejects leading zeros too (not observed).
  // ASSUMPTION: amounts beyond the safe integer range are also invalid.
  if (!/^[1-9]\d*$/.test(raw)) return null;
  const n = Number(raw);
  return Number.isSafeInteger(n) ? n : null;
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
      return { status: 200, body: { cuenta_id: a, saldo: balance } };
    }

    case "DEPOSITO": {
      const balance = state.accounts.get(a);
      if (balance === undefined) return Errors.unknownAccount;
      const amount = parseAmount(b);
      if (amount === null) return Errors.invalidAmount;
      state.accounts.set(a, balance + amount);
      const opId = nextOperationId(state);
      state.operations.set(opId, { kind: "DEPOSITO", from: null, to: a, amount, annulled: false });
      return { status: 200, body: { status: "recieved", operacionId: opId } };
    }

    case "TRANSFER": {
      // Observed order pairs: E303 before E401 (experimentos.jsonl:77), E401 before E506 (:78),
      // E506 before E507 (:30).
      // ASSUMPTION: E304's position relative to E303/E401/E506/E507 is unverified; :80 had valid
      // accounts and a valid amount.
      const amount = parseAmount(c);
      if (amount === null) return Errors.invalidAmount;
      const fromBalance = state.accounts.get(a);
      const toBalance = state.accounts.get(b);
      if (fromBalance === undefined || toBalance === undefined) return Errors.unknownAccount;
      // Observed: same origin and destination -> E304, no balance change (experimentos.jsonl:80-81).
      if (a === b) return Errors.sameAccount;
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
