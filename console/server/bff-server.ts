import { createServer as createHttpServer } from "node:http";
import type { IncomingMessage, Server, ServerResponse } from "node:http";
import { BFF_ROUTES } from "../contract/sandbox-api.ts";
import { consoleLogger } from "../../src/http/server.ts";
import type { Logger } from "../../src/http/server.ts";
import { BffFailure } from "./bff-failure.ts";
import { DEFAULT_LIMITS } from "./bff-limits.ts";
import type { BffLimits } from "./bff-limits.ts";
import { createExperimentsCatalog } from "./experiments-catalog.ts";
import type { ExperimentsCatalog } from "./experiments-catalog.ts";
import { sendFailure, sendFile, sendJson, sendNoContent } from "./http-responses.ts";
import { readJsonBody } from "./request-body.ts";
import { logRequest } from "./request-logging.ts";
import { parseSandboxRequest } from "./request-validation.ts";
import { createSandboxSession } from "./sandbox-session.ts";
import { createSessionRegistry } from "./session-registry.ts";
import type { SessionRegistry } from "./session-registry.ts";
import { loadStaticAsset } from "./static-assets.ts";

export interface BffServerOptions {
  limits?: BffLimits;
  /** Test seam for the per-session internal token. */
  createToken?: () => string;
  logger?: Logger;
  experiments?: ExperimentsCatalog;
  distDir?: string | null;
}

const SEND_REQUEST_PATH = /^\/api\/sandbox\/sessions\/([^/]+)\/requests$/;
const DELETE_SESSION_PATH = /^\/api\/sandbox\/sessions\/([^/]+)$/;

interface RouteContext {
  registry: SessionRegistry;
  experiments: ExperimentsCatalog;
  limits: BffLimits;
  distDir: string | null;
}

function pathnameOf(request: IncomingMessage): string {
  return (request.url ?? "").split("?")[0] ?? "";
}

function errorClass(error: unknown): string {
  return error instanceof Error ? error.name : typeof error;
}

async function handleSendRequest(
  context: RouteContext,
  sessionId: string,
  request: IncomingMessage,
  response: ServerResponse,
): Promise<void> {
  const payload = await readJsonBody(request, context.limits.maxRequestBodyBytes);
  const sandboxRequest = parseSandboxRequest(payload, context.limits.maxForwardedBodyBytes);
  if (sandboxRequest === null) throw new BffFailure("INVALID_REQUEST");
  sendJson(response, 200, await context.registry.send(sessionId, sandboxRequest));
}

async function handleStatic(context: RouteContext, pathname: string, response: ServerResponse): Promise<void> {
  if (context.distDir === null) throw new BffFailure("NOT_FOUND");
  const asset = await loadStaticAsset(context.distDir, pathname);
  if (asset === null) throw new BffFailure("NOT_FOUND");
  sendFile(response, asset.contentType, asset.content);
}

async function route(context: RouteContext, request: IncomingMessage, response: ServerResponse): Promise<void> {
  const method = request.method ?? "";
  const pathname = pathnameOf(request);
  const signature = `${method} ${pathname}`;

  if (signature === BFF_ROUTES.createSession) {
    request.resume();
    sendJson(response, 201, await context.registry.create());
    return;
  }
  if (signature === BFF_ROUTES.listExperiments) {
    sendJson(response, 200, context.experiments.get());
    return;
  }
  const sendMatch = method === "POST" ? SEND_REQUEST_PATH.exec(pathname) : null;
  if (sendMatch?.[1] !== undefined) {
    await handleSendRequest(context, sendMatch[1], request, response);
    return;
  }
  const deleteMatch = method === "DELETE" ? DELETE_SESSION_PATH.exec(pathname) : null;
  if (deleteMatch?.[1] !== undefined) {
    if (!(await context.registry.remove(deleteMatch[1]))) throw new BffFailure("SESSION_NOT_FOUND");
    sendNoContent(response);
    return;
  }
  if (method === "GET" && !pathname.startsWith("/api/")) {
    await handleStatic(context, pathname, response);
    return;
  }
  throw new BffFailure("NOT_FOUND");
}

/** Creates the BFF HTTP server. Closing it also closes every sandbox session. */
export function createBffServer(options: BffServerOptions = {}): Server {
  const limits = options.limits ?? DEFAULT_LIMITS;
  const logger = options.logger ?? consoleLogger;
  const registry = createSessionRegistry({
    limits,
    openSession: () => createSandboxSession({ createToken: options.createToken, timeoutMs: limits.sandboxTimeoutMs }),
  });
  const context: RouteContext = {
    registry,
    experiments: options.experiments ?? createExperimentsCatalog(),
    limits,
    distDir: options.distDir ?? null,
  };

  const server = createHttpServer((request, response) => {
    const started = performance.now();
    response.on("finish", () => logRequest(logger, request, response.statusCode, performance.now() - started));
    route(context, request, response).catch((error: unknown) => {
      const failure = error instanceof BffFailure ? error : new BffFailure("INTERNAL");
      if (!(error instanceof BffFailure)) logger.error(JSON.stringify({ level: "error", error: errorClass(error) }));
      sendFailure(response, failure);
    });
  });
  server.on("close", () => void registry.closeAll());
  return server;
}
