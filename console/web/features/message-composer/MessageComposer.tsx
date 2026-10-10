import { useState } from "react";
import type { FormEvent } from "react";
import { Button, TextField } from "../../components/index.ts";
import { useSandboxSession } from "../sandbox-session/SandboxSessionProvider.tsx";
import { COMMAND_ARGUMENT_LABELS, COMMAND_NAMES, QUICK_ACTIONS, buildMessage, isCommandName, messageRequest } from "./message-builder.ts";
import type { CommandName, MessageDraft } from "./message-builder.ts";

const FREE_TEXT_OPTION = "LIBRE";

function toDraft(selection: CommandName | typeof FREE_TEXT_OPTION, args: readonly string[], freeText: string, manualControl: string | null): MessageDraft {
  if (selection === FREE_TEXT_OPTION) return { kind: "free", text: freeText, manualControl };
  return { kind: "command", command: selection, args, manualControl };
}

/** Prop-less. Builds protocol messages with a live control digit and sends them to the sandbox session. */
export function MessageComposer() {
  const { status, send, notice, dismissNotice, errorMessage, startNewSession } = useSandboxSession();
  const [selection, setSelection] = useState<CommandName | typeof FREE_TEXT_OPTION>("PING");
  const [args, setArgs] = useState<readonly string[]>([]);
  const [freeText, setFreeText] = useState("");
  const [manualMode, setManualMode] = useState(false);
  const [manualControl, setManualControl] = useState("");
  const [sending, setSending] = useState(false);

  const built = buildMessage(toDraft(selection, args, freeText, manualMode ? manualControl : null));
  const labels: readonly string[] = selection === FREE_TEXT_OPTION ? [] : COMMAND_ARGUMENT_LABELS[selection];
  const canSend = status === "ready" && !sending;

  function changeSelection(value: string): void {
    if (value === FREE_TEXT_OPTION) setSelection(FREE_TEXT_OPTION);
    else if (isCommandName(value)) setSelection(value);
    setArgs([]);
  }

  function changeArgument(index: number, value: string): void {
    setArgs(labels.map((_label, position) => (position === index ? value : (args[position] ?? ""))));
  }

  async function submitRequest(request: Parameters<typeof send>[0]): Promise<void> {
    setSending(true);
    try {
      await send(request);
    } finally {
      setSending(false);
    }
  }

  function submitMessage(event: FormEvent): void {
    event.preventDefault();
    if (built.message !== null && canSend) void submitRequest(messageRequest(built.message));
  }

  return (
    <div className="grid gap-4">
      {status === "error" && (
        <div role="alert" className="flex items-center justify-between gap-3 rounded border border-danger p-3 text-sm text-danger">
          <span>{errorMessage ?? "No se pudo abrir la sesión."}</span>
          <Button variant="ghost" onClick={() => void startNewSession()}>
            Reintentar
          </Button>
        </div>
      )}
      {notice !== null && (
        <div role="status" className="flex items-center justify-between gap-3 rounded border border-warning p-3 text-sm text-warning">
          <span>{notice}</span>
          <Button variant="ghost" onClick={dismissNotice}>
            Cerrar
          </Button>
        </div>
      )}

      <form onSubmit={submitMessage} className="grid gap-3">
        <label className="grid gap-1 text-xs text-text-muted">
          Comando
          <select
            value={selection}
            onChange={(event) => changeSelection(event.target.value)}
            className="rounded border border-border bg-surface-raised px-3 py-2 font-mono text-sm text-text"
          >
            {COMMAND_NAMES.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
            <option value={FREE_TEXT_OPTION}>Texto libre</option>
          </select>
        </label>

        {selection === FREE_TEXT_OPTION ? (
          <TextField label="Mensaje (sin control)" value={freeText} onChange={setFreeText} placeholder="PING" monospace />
        ) : (
          labels.map((label, index) => (
            <TextField key={`${selection}-${label}`} label={label} value={args[index] ?? ""} onChange={(value) => changeArgument(index, value)} monospace />
          ))
        )}

        <label className="flex items-center gap-2 text-xs text-text-muted">
          <input type="checkbox" checked={manualMode} onChange={(event) => setManualMode(event.target.checked)} />
          Control manual (enviar un control erróneo o mal formado para provocar E202/E201)
        </label>
        {manualMode && <TextField label="Control manual" value={manualControl} onChange={setManualControl} monospace />}

        <dl className="grid gap-1 rounded border border-border bg-surface-raised p-3 text-xs text-text-muted">
          <div className="flex gap-2">
            <dt>Payload:</dt>
            <dd className="font-mono text-text">{built.payload === "" ? "—" : built.payload}</dd>
          </div>
          <div className="flex gap-2">
            <dt>Control calculado:</dt>
            <dd className="font-mono text-accent">{built.computedControl ?? "—"}</dd>
          </div>
          <div className="flex gap-2">
            <dt>Mensaje final:</dt>
            <dd className="font-mono text-text">{built.message ?? "—"}</dd>
          </div>
        </dl>

        {built.errors.length > 0 && (
          <ul className="grid gap-1 text-xs text-warning">
            {built.errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        )}

        <div>
          <Button variant="primary" type="submit" disabled={!canSend || built.message === null}>
            Enviar mensaje
          </Button>
        </div>
      </form>

      <div className="grid gap-2">
        <p className="text-xs text-text-muted">Acciones rápidas</p>
        <div className="flex flex-wrap gap-2">
          {QUICK_ACTIONS.map((action) => (
            <Button key={action.label} variant="ghost" disabled={!canSend} onClick={() => void submitRequest(action.request)}>
              {action.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
