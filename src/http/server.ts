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

function parseJson(raw: string): { ok: true; value: unknown } | { ok: false } {
  try {
    return { ok: true, value: JSON.parse(raw) };
  } catch {
    return { ok: false };
  }
}

/** Returns the message `m`, or the error reply for an unusable body. */
function extractMessage(raw: string | null): string | Reply {
  // ASSUMPTION: an oversized body is treated like invalid JSON.
  if (raw === null) return Errors.invalidJson;
  const parsed = parseJson(raw);
  if (!parsed.ok) return Errors.invalidJson;
  const value = parsed.value;
  // ASSUMPTION: valid JSON that is not an object (array, number, null) answers like a missing `m`.
  if (typeof value === "object" && value !== null && !Array.isArray(value) && "m" in value && typeof value.m === "string") {
    return value.m;
  }
  return Errors.missingMessage;
}

const ROUTES = new Set(["GET /health", "POST /__reset", "POST /msg"]);

export function createServer(teamToken: string): Server {
  const state = createState();
  let requestCounter = 0;
  const expectedAuth = `Bearer ${teamToken}`;

  async function handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const path = (req.url ?? "").split("?")[0];
    const route = `${req.method ?? ""} ${path}`;

    // Observed: unknown routes and unsupported methods answer 404 before auth (experimentos.jsonl:7-9, 12).
    if (!ROUTES.has(route)) {
      send(res, Errors.routeNotFound);
      return;
    }

    // Observed: missing or wrong token -> 401 E001 on every known route, /health included (experimentos.jsonl:10-11, 13).
    if (req.headers.authorization !== expectedAuth) {
      send(res, Errors.unauthorized);
      return;
    }

    if (route === "GET /health") {
      send(res, { status: 200, body: { ok: true } }); // observed: experimentos.jsonl:14
      return;
    }

    if (route === "POST /__reset") {
      await readBody(req);
      resetState(state); // observed: X-Req is not reset (experimentos.jsonl:18 -> 19)
      send(res, { status: 200, body: { ok: true } });
      return;
    }

    const m = extractMessage(await readBody(req));
    requestCounter += 1; // observed: also incremented for error responses
    const headers = { "X-Req": String(requestCounter) };
    if (typeof m !== "string") {
      send(res, m, headers);
      return;
    }
    const parsed = parseMessage(m);
    send(res, isReply(parsed) ? parsed : execute(state, parsed), headers);
  }

  return createHttpServer((req, res) => {
    handle(req, res).catch(() => {
      // ASSUMPTION: unexpected failures answer a generic 500 E500 body (unverified; no internals exposed).
      if (!res.headersSent) send(res, { status: 500, body: { error: "E500", mensaje: "error interno" } });
      else res.end();
    });
  });
}
