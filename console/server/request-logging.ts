import type { IncomingMessage } from "node:http";
import type { Logger } from "../../src/http/server.ts";

const SESSION_ID_IN_PATH = /(\/sessions\/)([^/]+)/;
const LOGGED_SESSION_ID_CHARS = 8;

/** Path without query string and with any session id cut to its first characters. */
export function loggablePath(rawUrl: string): string {
  const pathname = rawUrl.split("?")[0] ?? "";
  return pathname.replace(SESSION_ID_IN_PATH, (_match, prefix: string, id: string) => {
    return `${prefix}${id.slice(0, LOGGED_SESSION_ID_CHARS)}`;
  });
}

export function logRequest(logger: Logger, request: IncomingMessage, status: number, elapsedMs: number): void {
  logger.info(
    JSON.stringify({
      level: "info",
      method: request.method ?? "",
      path: loggablePath(request.url ?? ""),
      status,
      ms: Math.round(elapsedMs * 100) / 100,
    }),
  );
}
