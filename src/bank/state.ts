export interface Operation {
  kind: "DEPOSITO" | "TRANSFER";
  from: string | null;
  to: string;
  amount: number;
  annulled: boolean;
}

export interface BankState {
  accounts: Map<string, number>;
  // Holder name (the ALTA name argument) per account id, compared exactly (case-sensitive) by TRANSFER.
  holders: Map<string, string>;
  operations: Map<string, Operation>;
  accountCounter: number;
  operationCounter: number;
}

export function createState(): BankState {
  return { accounts: new Map(), holders: new Map(), operations: new Map(), accountCounter: 0, operationCounter: 0 };
}

export function resetState(state: BankState): void {
  state.accounts.clear();
  state.holders.clear();
  state.operations.clear();
  state.accountCounter = 0;
  state.operationCounter = 0;
}

export function formatId(prefix: "AC" | "OP", n: number): string {
  return `${prefix}-${String(n).padStart(4, "0")}`;
}
