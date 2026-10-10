import { createServer as createHttpServer } from "node:http";
import type { IncomingMessage, Server, ServerResponse } from "node:http";
import { createState, resetState } from "../bank/state.ts";
import { execute } from "../bank/commands.ts";
import { Errors } from "../protocol/errors.ts";
import type { Reply } from "../protocol/errors.ts";
import { isReply, parseMessage } from "../protocol/parse.ts";

const MAX_BODY_BYTES = 1_000_000;

function send(res: ServerResponse, reply: Reply, headers: Record<string, string> = {}): void {
  const payload = JSON.stringify(reply.body);
  res.writeHead(reply.status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(payload),
    ...headers,
  });
  res.end(payload);
}

async function readBody(req: IncomingMessage): Promise<string | null> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk));
    size += buf.length;
    if (size > MAX_BODY_BYTES) return null;
    chunks.push(buf);
  }
  return Buffer.concat(chunks).toString("utf8");
}

function extractMessage(raw: string | null): string | null {
  if (raw === null) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      !Array.isArray(parsed) &&
      "m" in parsed &&
      typeof parsed.m === "string"
    ) {
      return parsed.m;
    }
  } catch {
    // invalid JSON: handled by the caller as an invalid body
  }
  return null;
}

export function createServer(teamToken: string): Server {
  const state = createState();
  let requestCounter = 0;
  const expectedAuth = `Bearer ${teamToken}`;

  async function handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const path = (req.url ?? "").split("?")[0];

    // ASSUMPTION: /health is public so platform health checks work without the token.
    if (req.method === "GET" && path === "/health") {
      send(res, { status: 200, body: { status: "ok" } });
      return;
    }

    // ASSUMPTION: a missing Authorization header is treated like a wrong token (401 E001).
    if (req.headers.authorization !== expectedAuth) {
      send(res, Errors.unauthorized);
      return;
    }

    if (req.method === "POST" && path === "/__reset") {
      await readBody(req);
      resetState(state);
      requestCounter = 0;
      send(res, { status: 200, body: { ok: true } });
      return;
    }

    if (req.method === "POST" && path === "/msg") {
      const m = extractMessage(await readBody(req));
      requestCounter += 1; // observed: also incremented for error responses
      const headers = { "X-Req": String(requestCounter) };
      if (m === null) {
        send(res, Errors.invalidBody, headers);
        return;
      }
      const parsed = parseMessage(m);
      send(res, isReply(parsed) ? parsed : execute(state, parsed), headers);
      return;
    }

    send(res, Errors.routeNotFound);
  }

  return createHttpServer((req, res) => {
    handle(req, res).catch(() => {
      // ASSUMPTION: unexpected failures answer a generic 500 E500 body (unverified; no internals exposed).
      if (!res.headersSent) send(res, { status: 500, body: { error: "E500", mensaje: "error interno" } });
      else res.end();
    });
  });
}
