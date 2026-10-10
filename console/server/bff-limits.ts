import { SANDBOX_LIMITS } from "../contract/sandbox-api.ts";

export interface BffLimits {
  maxSessions: number;
  sessionTtlMs: number;
  maxRequestBodyBytes: number;
  maxForwardedBodyBytes: number;
  sandboxTimeoutMs: number;
  maxRequestsPerMinutePerSession: number;
}

export const DEFAULT_LIMITS: BffLimits = SANDBOX_LIMITS;
