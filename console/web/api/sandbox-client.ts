import type {
  BffErrorCode,
  CreateSessionResponse,
  ExperimentRecord,
  ExperimentsResponse,
  SandboxExchange,
  SandboxRequest,
} from "../../contract/sandbox-api.ts";
import { BFF_ERROR_STATUS } from "../../contract/sandbox-api.ts";

/** Typed BFF client. Relative URLs only; never carries a token. */

export class BffRequestError extends Error {
  readonly code: BffErrorCode | "UNKNOWN";
  readonly status: number;

  constructor(code: BffErrorCode | "UNKNOWN", status: number, message: string) {
    super(message);
    this.name = "BffRequestError";
    this.code = code;
    this.status = status;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isBffErrorCode(value: unknown): value is BffErrorCode {
  return typeof value === "string" && Object.hasOwn(BFF_ERROR_STATUS, value);
}

function isCreateSessionResponse(value: unknown): value is CreateSessionResponse {
  return isRecord(value) && typeof value.sessionId === "string" && typeof value.expiresAt === "string";
}

function isSandboxMethod(value: unknown): value is SandboxRequest["method"] {
  return value === "GET" || value === "POST";
}

function isSandboxRequest(value: unknown): value is SandboxRequest {
  return (
    isRecord(value) &&
    isSandboxMethod(value.method) &&
    typeof value.path === "string" &&
    (value.body === undefined || typeof value.body === "string")
  );
}

function isSandboxExchange(value: unknown): value is SandboxExchange {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.sequence === "number" &&
    isSandboxRequest(value.request) &&
    typeof value.status === "number" &&
    (value.xReq === null || typeof value.xReq === "string") &&
    typeof value.durationMs === "number" &&
    typeof value.at === "string"
  );
}

function isExperimentRecord(value: unknown): value is ExperimentRecord {
  return (
    isRecord(value) &&
    typeof value.id === "number" &&
    typeof value.seq === "string" &&
    typeof value.hipotesis === "string" &&
    typeof value.status === "number" &&
    (value.conclusion === null || typeof value.conclusion === "string")
  );
}

function isExperimentsResponse(value: unknown): value is ExperimentsResponse {
  return isRecord(value) && Array.isArray(value.experiments) && value.experiments.every(isExperimentRecord);
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

async function toRequestError(response: Response): Promise<BffRequestError> {
  const body = await readJson(response);
  if (isRecord(body) && isRecord(body.error) && isBffErrorCode(body.error.code) && typeof body.error.message === "string") {
    return new BffRequestError(body.error.code, response.status, body.error.message);
  }
  return new BffRequestError("UNKNOWN", response.status, `Respuesta inesperada del servidor (${response.status})`);
}

async function parseOk<T>(response: Response, guard: (value: unknown) => value is T, what: string): Promise<T> {
  if (!response.ok) throw await toRequestError(response);
  const body = await readJson(response);
  if (!guard(body)) throw new BffRequestError("UNKNOWN", response.status, `Respuesta inválida: ${what}`);
  return body;
}

const jsonHeaders = { "content-type": "application/json" };

export async function createSession(): Promise<CreateSessionResponse> {
  const response = await fetch("/api/sandbox/sessions", { method: "POST" });
  return parseOk(response, isCreateSessionResponse, "sesión");
}

export async function sendSandboxRequest(sessionId: string, request: SandboxRequest): Promise<SandboxExchange> {
  const response = await fetch(`/api/sandbox/sessions/${encodeURIComponent(sessionId)}/requests`, {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify(request),
  });
  return parseOk(response, isSandboxExchange, "intercambio");
}

export async function deleteSession(sessionId: string): Promise<void> {
  const response = await fetch(`/api/sandbox/sessions/${encodeURIComponent(sessionId)}`, { method: "DELETE" });
  if (!response.ok) throw await toRequestError(response);
}

export async function listExperiments(): Promise<ExperimentsResponse> {
  const response = await fetch("/api/experiments");
  return parseOk(response, isExperimentsResponse, "experimentos");
}
