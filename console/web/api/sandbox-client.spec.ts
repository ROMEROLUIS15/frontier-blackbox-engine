import { afterEach, describe, expect, it, vi } from "vitest";
import { BffRequestError, createSession, deleteSession, listExperiments, sendSandboxRequest } from "./sandbox-client.ts";

function mockFetch(status: number, body: unknown) {
  const response = body === undefined ? null : JSON.stringify(body);
  const fetchMock = vi.fn((_url: string, _init?: RequestInit) => Promise.resolve(new Response(response, { status })));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => vi.unstubAllGlobals());

describe("sandbox client", () => {
  it("creates a session through the relative BFF route", async () => {
    const fetchMock = mockFetch(201, { sessionId: "s1", expiresAt: "2026-01-01T00:00:00Z" });
    await expect(createSession()).resolves.toEqual({ sessionId: "s1", expiresAt: "2026-01-01T00:00:00Z" });
    expect(fetchMock).toHaveBeenCalledWith("/api/sandbox/sessions", { method: "POST" });
  });

  it("parses an exchange", async () => {
    const exchange = {
      id: "e1",
      sequence: 1,
      request: { method: "POST", path: "/msg", body: JSON.stringify({ m: "PING;64" }) },
      status: 200,
      xReq: "1",
      body: { pong: true },
      durationMs: 2,
      at: "2026-01-01T00:00:00Z",
    };
    const fetchMock = mockFetch(200, exchange);
    await expect(sendSandboxRequest("s1", { method: "POST", path: "/msg" })).resolves.toEqual(exchange);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/sandbox/sessions/s1/requests");
  });

  it("throws a typed error on SESSION_NOT_FOUND", async () => {
    mockFetch(404, { error: { code: "SESSION_NOT_FOUND", message: "sesión no encontrada" } });
    const error = await sendSandboxRequest("gone", { method: "GET", path: "/health" }).catch((reason: unknown) => reason);
    expect(error).toBeInstanceOf(BffRequestError);
    expect(error).toMatchObject({ code: "SESSION_NOT_FOUND", status: 404, message: "sesión no encontrada" });
  });

  it("throws UNKNOWN when the error body is not a BffError", async () => {
    mockFetch(502, "<html>");
    await expect(createSession()).rejects.toMatchObject({ code: "UNKNOWN", status: 502 });
  });

  it("rejects malformed success bodies", async () => {
    mockFetch(200, { experiments: [{ id: "x" }] });
    await expect(listExperiments()).rejects.toMatchObject({ code: "UNKNOWN" });
  });

  it("deletes a session", async () => {
    const fetchMock = mockFetch(204, undefined);
    await expect(deleteSession("s1")).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith("/api/sandbox/sessions/s1", { method: "DELETE" });
  });
});
