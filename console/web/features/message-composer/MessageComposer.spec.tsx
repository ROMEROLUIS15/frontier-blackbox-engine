import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SandboxSessionProvider } from "../sandbox-session/SandboxSessionProvider.tsx";
import { MessageComposer } from "./MessageComposer.tsx";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("MessageComposer", () => {
  it("shows the computed PING;64 message and enables sending once the session is ready", async () => {
    const fetchMock = vi.fn((_url: string, init?: RequestInit) =>
      Promise.resolve(
        init?.method === "POST"
          ? new Response(JSON.stringify({ sessionId: "s1", expiresAt: "2026-01-01T00:00:00Z" }), { status: 201 })
          : new Response(null, { status: 204 }),
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(
      <SandboxSessionProvider>
        <MessageComposer />
      </SandboxSessionProvider>,
    );

    expect(screen.getByText("PING;64")).toBeTruthy();
    const sendButton = screen.getByRole("button", { name: "Enviar mensaje" });
    await waitFor(() => expect(sendButton.hasAttribute("disabled")).toBe(false));
  });
});
