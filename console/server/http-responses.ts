import type { ServerResponse } from "node:http";
import { statusOf, toBffError } from "./bff-failure.ts";
import type { BffFailure } from "./bff-failure.ts";

const SECURITY_HEADERS = {
  "cache-control": "no-store",
  "x-content-type-options": "nosniff",
} as const;

export function sendJson(response: ServerResponse, status: number, payload: unknown): void {
  const serialized = JSON.stringify(payload);
  response.writeHead(status, {
    ...SECURITY_HEADERS,
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(serialized),
  });
  response.end(serialized);
}

export function sendNoContent(response: ServerResponse): void {
  response.writeHead(204, SECURITY_HEADERS);
  response.end();
}

export function sendFailure(response: ServerResponse, failure: BffFailure): void {
  if (response.headersSent) {
    response.end();
    return;
  }
  if (failure.code === "PAYLOAD_TOO_LARGE") response.setHeader("connection", "close");
  sendJson(response, statusOf(failure), toBffError(failure));
}

export function sendFile(response: ServerResponse, contentType: string, content: Buffer): void {
  response.writeHead(200, {
    ...SECURITY_HEADERS,
    "content-type": contentType,
    "content-length": content.length,
  });
  response.end(content);
}
