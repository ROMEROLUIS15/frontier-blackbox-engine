import type {
  CreateSessionResponse,
  ExperimentsResponse,
  SandboxExchange,
  SandboxRequest,
} from "../../contract/sandbox-api.ts";

/** Typed BFF client (stub, WS3). Relative URLs only; never carries a token. */
export function createSession(): Promise<CreateSessionResponse> {
  return Promise.reject(new Error("createSession: POST /api/sandbox/sessions not implemented"));
}

export function sendSandboxRequest(sessionId: string, request: SandboxRequest): Promise<SandboxExchange> {
  return Promise.reject(new Error(`sendSandboxRequest(${sessionId}, ${request.method} ${request.path}): not implemented`));
}

export function deleteSession(sessionId: string): Promise<void> {
  return Promise.reject(new Error(`deleteSession(${sessionId}): not implemented`));
}

export function listExperiments(): Promise<ExperimentsResponse> {
  return Promise.reject(new Error("listExperiments: GET /api/experiments not implemented"));
}
