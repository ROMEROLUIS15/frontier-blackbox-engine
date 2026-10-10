import { SANDBOX_PATH_PATTERN } from "../contract/sandbox-api.ts";
import type { SandboxMethod, SandboxRequest } from "../contract/sandbox-api.ts";

const ALLOWED_KEYS = new Set(["method", "path", "body"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSandboxMethod(value: unknown): value is SandboxMethod {
  return value === "GET" || value === "POST";
}

/** Returns a validated request, or null when the input breaks the contract or the byte limit. */
export function parseSandboxRequest(input: unknown, maxBodyBytes: number): SandboxRequest | null {
  if (!isRecord(input)) return null;
  if (Object.keys(input).some((key) => !ALLOWED_KEYS.has(key))) return null;

  const { method, path, body } = input;
  if (!isSandboxMethod(method)) return null;
  if (typeof path !== "string" || !SANDBOX_PATH_PATTERN.test(path)) return null;
  if (body === undefined) return { method, path };
  if (typeof body !== "string" || Buffer.byteLength(body, "utf8") > maxBodyBytes) return null;
  return { method, path, body };
}
