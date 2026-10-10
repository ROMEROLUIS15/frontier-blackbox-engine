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
  // ASSUMPTION: amounts beyond the safe integer range are also invalid.
  if (!/^\d+$/.test(raw)) return null;
  const n = Number(raw);
  return Number.isSafeInteger(n) && n > 0 ? n : null;
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
      // ASSUMPTION: any name is accepted and duplicates are allowed.
      state.accountCounter += 1;
      const id = formatId("AC", state.accountCounter);
      state.accounts.set(id, 0);
      return { status: 201, body: { cuentaId: id } };
    }

    case "CONSULTA": {
      // ASSUMPTION: account ids are matched exactly (case-sensitive).
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
      // Observed: E506 before E507 (experimentos.jsonl:30). ASSUMPTION: E401 and E303 come before both.
      const fromBalance = state.accounts.get(a);
      const toBalance = state.accounts.get(b);
      if (fromBalance === undefined || toBalance === undefined) return Errors.unknownAccount;
      const amount = parseAmount(c);
      if (amount === null) return Errors.invalidAmount;
      if (amount > TRANSFER_LIMIT) return Errors.limitExceeded;
      if (fromBalance < amount) return Errors.insufficientFunds;
      // ASSUMPTION: transferring to the same account gets no special treatment.
      state.accounts.set(a, fromBalance - amount);
      state.accounts.set(b, (state.accounts.get(b) ?? toBalance) + amount);
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
      // Observed: reverting a TRANSFER subtracts the amount from the destination.
      // ASSUMPTION: it also credits the origin; reverting a DEPOSITO debits the account; negative balances are allowed.
      state.accounts.set(op.to, (state.accounts.get(op.to) ?? 0) - op.amount);
      if (op.from !== null) state.accounts.set(op.from, (state.accounts.get(op.from) ?? 0) + op.amount);
      return { status: 200, body: { ok: true, anulada: a } };
    }
  }
}
