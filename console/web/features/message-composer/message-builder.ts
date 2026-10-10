import type { SandboxRequest } from "../../../contract/sandbox-api.ts";
import { controlDigit } from "../../../../src/control/iso7064.ts";

export const COMMAND_ARGUMENT_LABELS = {
  PING: [],
  ALTA: ["Nombre"],
  CONSULTA: ["Cuenta"],
  DEPOSITO: ["Cuenta", "Monto"],
  TRANSFER: ["Origen", "Destino", "Monto"],
  ANULA: ["Operación"],
} as const;

export type CommandName = keyof typeof COMMAND_ARGUMENT_LABELS;

export const COMMAND_NAMES: readonly CommandName[] = ["PING", "ALTA", "CONSULTA", "DEPOSITO", "TRANSFER", "ANULA"];

export function isCommandName(value: string): value is CommandName {
  return Object.hasOwn(COMMAND_ARGUMENT_LABELS, value);
}

export type MessageDraft =
  | { kind: "command"; command: CommandName; args: readonly string[]; manualControl: string | null }
  | { kind: "free"; text: string; manualControl: string | null };

export interface BuiltMessage {
  payload: string;
  /** Digit computed from the payload; null when the payload is not buildable. */
  computedControl: number | null;
  /** Final `PAYLOAD;CONTROL`; null when there are validation errors. */
  message: string | null;
  errors: string[];
}

function payloadOf(draft: MessageDraft): { payload: string; errors: string[] } {
  if (draft.kind === "free") {
    const payload = draft.text.trim();
    return { payload, errors: payload === "" ? ["Escribe el mensaje (sin el dígito de control)."] : [] };
  }
  const labels: readonly string[] = COMMAND_ARGUMENT_LABELS[draft.command];
  const values = labels.map((_label, index) => (draft.args[index] ?? "").trim());
  const errors: string[] = [];
  labels.forEach((label, index) => {
    const value = values[index] ?? "";
    if (value === "") errors.push(`Falta el argumento «${label}».`);
    else if (value.includes(";")) errors.push(`El argumento «${label}» no puede contener «;».`);
  });
  return { payload: [draft.command, ...values].join(";"), errors };
}

export function buildMessage(draft: MessageDraft): BuiltMessage {
  const { payload, errors } = payloadOf(draft);
  if (errors.length > 0) return { payload, computedControl: null, message: null, errors };
  const computedControl = controlDigit(payload);
  const control = draft.manualControl ?? String(computedControl);
  return { payload, computedControl, message: `${payload};${control}`, errors };
}

export function messageRequest(message: string): SandboxRequest {
  return { method: "POST", path: "/msg", body: JSON.stringify({ m: message }) };
}

export interface QuickAction {
  label: string;
  request: SandboxRequest;
}

export const QUICK_ACTIONS: readonly QuickAction[] = [
  { label: "Reiniciar estado", request: { method: "POST", path: "/__reset" } },
  { label: "Health", request: { method: "GET", path: "/health" } },
  { label: "Ruta inexistente", request: { method: "GET", path: "/ruta-inexistente" } },
  { label: "Body inválido", request: { method: "POST", path: "/msg", body: "esto no es json" } },
];
