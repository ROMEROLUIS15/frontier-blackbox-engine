import { randomBytes, randomUUID } from "node:crypto";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { createServer } from "../../src/http/server.ts";
import type { Logger } from "../../src/http/server.ts";
import type { SandboxExchange, SandboxRequest } from "../contract/sandbox-api.ts";
import { BffFailure } from "./bff-failure.ts";

export interface SandboxSession {
  forward(request: SandboxRequest): Promise<SandboxExchange>;
  close(): Promise<void>;
}

export interface SandboxSessionOptions {
  createToken?: (() => string) | undefined;
  timeoutMs: number;
}

const silentLogger: Logger = { info: () => undefined, error: () => undefined };

function generateInternalToken(): string {
  return randomBytes(24).toString("hex");
}

function isAddressInfo(address: string | AddressInfo | null): address is AddressInfo {
  return typeof address === "object" && address !== null;
}

function listenOnLoopback(server: Server): Promise<number> {
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (isAddressInfo(address)) resolve(address.port);
      else reject(new BffFailure("INTERNAL"));
    });
  });
}

function parseBody(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function isTimeout(error: unknown): boolean {
  return error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
}

/** Starts one real replica on 127.0.0.1:0. Its internal token lives only in this closure. */
export async function createSandboxSession(options: SandboxSessionOptions): Promise<SandboxSession> {
  const internalToken = (options.createToken ?? generateInternalToken)();
  const replica = createServer(internalToken, silentLogger);
  const port = await listenOnLoopback(replica);
  let sequence = 0;
  let closing: Promise<void> | null = null;

  async function forward(request: SandboxRequest): Promise<SandboxExchange> {
    const startedAt = new Date();
    const started = performance.now();
    let response: Response;
    let text: string;
    try {
      response = await fetch(`http://127.0.0.1:${port}${request.path}`, {
        method: request.method,
        headers: { authorization: `Bearer ${internalToken}`, "content-type": "application/json" },
        body: request.method === "POST" ? (request.body ?? "") : undefined,
        signal: AbortSignal.timeout(options.timeoutMs),
      });
      text = await response.text();
    } catch (error: unknown) {
      throw new BffFailure(isTimeout(error) ? "SANDBOX_TIMEOUT" : "INTERNAL");
    }
    sequence += 1;
    return {
      id: randomUUID(),
      sequence,
      request,
      status: response.status,
      xReq: response.headers.get("x-req"),
      body: parseBody(text),
      durationMs: Math.round((performance.now() - started) * 100) / 100,
      at: startedAt.toISOString(),
    };
  }

  function close(): Promise<void> {
    closing ??= new Promise<void>((resolve) => {
      replica.close(() => resolve());
      replica.closeAllConnections();
    });
    return closing;
  }

  return { forward, close };
}
