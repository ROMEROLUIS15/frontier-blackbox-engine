import type { IncomingMessage } from "node:http";
import { BffFailure } from "./bff-failure.ts";

async function readCappedText(request: IncomingMessage, maxBytes: number): Promise<string> {
  const declaredLength = Number(request.headers["content-length"] ?? 0);
  if (declaredLength > maxBytes) throw new BffFailure("PAYLOAD_TOO_LARGE");

  const chunks: Buffer[] = [];
  let received = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk));
    received += buffer.length;
    if (received > maxBytes) throw new BffFailure("PAYLOAD_TOO_LARGE");
    chunks.push(buffer);
  }
  return Buffer.concat(chunks).toString("utf8");
}

/** Reads and parses a JSON body, never buffering more than `maxBytes`. */
export async function readJsonBody(request: IncomingMessage, maxBytes: number): Promise<unknown> {
  const text = await readCappedText(request, maxBytes);
  try {
    return JSON.parse(text);
  } catch {
    throw new BffFailure("INVALID_REQUEST");
  }
}
