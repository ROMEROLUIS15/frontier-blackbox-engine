import { describe, expect, it } from "vitest";
import { buildMessage, messageRequest } from "./message-builder.ts";

describe("buildMessage", () => {
  it("builds PING;64", () => {
    const built = buildMessage({ kind: "command", command: "PING", args: [], manualControl: null });
    expect(built.message).toBe("PING;64");
    expect(built.computedControl).toBe(64);
  });

  it("builds ALTA;Lucia;82", () => {
    const built = buildMessage({ kind: "command", command: "ALTA", args: ["Lucia"], manualControl: null });
    expect(built.payload).toBe("ALTA;Lucia");
    expect(built.message).toBe("ALTA;Lucia;82");
  });

  it("builds DEPOSITO and TRANSFER from the public examples", () => {
    const deposit = buildMessage({ kind: "command", command: "DEPOSITO", args: ["AC-0001", "250000"], manualControl: null });
    const transfer = buildMessage({
      kind: "command",
      command: "TRANSFER",
      args: ["AC-0001", "AC-0002", "40000"],
      manualControl: null,
    });
    expect(deposit.message).toBe("DEPOSITO;AC-0001;250000;86");
    expect(transfer.message).toBe("TRANSFER;AC-0001;AC-0002;40000;86");
  });

  it("uses the manual control verbatim while still reporting the computed one", () => {
    const built = buildMessage({ kind: "command", command: "PING", args: [], manualControl: "99" });
    expect(built.message).toBe("PING;99");
    expect(built.computedControl).toBe(64);
  });

  it("allows a malformed manual control", () => {
    expect(buildMessage({ kind: "free", text: "PING", manualControl: "x" }).message).toBe("PING;x");
  });

  it("reports one error per missing argument", () => {
    const built = buildMessage({ kind: "command", command: "TRANSFER", args: ["AC-0001"], manualControl: null });
    expect(built.message).toBeNull();
    expect(built.errors).toEqual(["Falta el argumento «Destino».", "Falta el argumento «Monto»."]);
  });

  it("rejects separators inside an argument", () => {
    const built = buildMessage({ kind: "command", command: "ALTA", args: ["a;b"], manualControl: null });
    expect(built.errors).toEqual(["El argumento «Nombre» no puede contener «;»."]);
  });

  it("requires free text", () => {
    expect(buildMessage({ kind: "free", text: "  ", manualControl: null }).errors).toHaveLength(1);
  });
});

describe("messageRequest", () => {
  it("wraps the message in a JSON body", () => {
    expect(messageRequest("PING;64")).toEqual({ method: "POST", path: "/msg", body: JSON.stringify({ m: "PING;64" }) });
  });
});
