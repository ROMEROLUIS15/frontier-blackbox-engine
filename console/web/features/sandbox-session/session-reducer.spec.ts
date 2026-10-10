import { describe, expect, it } from "vitest";
import type { SandboxExchange } from "../../../contract/sandbox-api.ts";
import { initialSessionState, sessionReducer } from "./session-reducer.ts";

const exchange: SandboxExchange = {
  id: "e1",
  sequence: 1,
  request: { method: "GET", path: "/health" },
  status: 200,
  xReq: "1",
  body: { ok: true },
  durationMs: 3,
  at: "2026-01-01T00:00:00.000Z",
};

const ready = sessionReducer(initialSessionState, { type: "session-started", sessionId: "s1" });

describe("sessionReducer", () => {
  it("starts connecting and becomes ready with a session id", () => {
    expect(initialSessionState.status).toBe("connecting");
    expect(ready).toMatchObject({ status: "ready", sessionId: "s1" });
  });

  it("records an error when the session cannot be created", () => {
    const failed = sessionReducer(initialSessionState, { type: "session-failed", message: "boom" });
    expect(failed).toMatchObject({ status: "error", sessionId: null, errorMessage: "boom" });
  });

  it("appends exchanges in order", () => {
    const next = sessionReducer(ready, { type: "exchange-recorded", exchange });
    expect(next.exchanges).toEqual([exchange]);
  });

  it("replaces the session, clears history and sets a notice", () => {
    const withHistory = sessionReducer(ready, { type: "exchange-recorded", exchange });
    const replaced = sessionReducer(withHistory, { type: "session-replaced", sessionId: "s2", notice: "nueva" });
    expect(replaced).toMatchObject({ status: "ready", sessionId: "s2", exchanges: [], notice: "nueva" });
  });

  it("keeps the session on a failed request and lets the notice be dismissed", () => {
    const failed = sessionReducer(ready, { type: "request-failed", message: "límite" });
    expect(failed).toMatchObject({ status: "ready", sessionId: "s1", notice: "límite" });
    expect(sessionReducer(failed, { type: "notice-dismissed" }).notice).toBeNull();
  });

  it("resets everything when connecting again", () => {
    expect(sessionReducer(ready, { type: "connecting" })).toEqual(initialSessionState);
  });
});
