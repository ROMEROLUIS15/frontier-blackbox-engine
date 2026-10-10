import { BFF_ERROR_STATUS } from "../contract/sandbox-api.ts";
import type { BffError, BffErrorCode } from "../contract/sandbox-api.ts";

const GENERIC_MESSAGES: Record<BffErrorCode, string> = {
  INVALID_REQUEST: "The request is not valid.",
  PAYLOAD_TOO_LARGE: "The request body is too large.",
  SESSION_NOT_FOUND: "The sandbox session does not exist or has expired.",
  SESSION_LIMIT: "The maximum number of sandbox sessions has been reached.",
  RATE_LIMITED: "Too many requests for this sandbox session.",
  SANDBOX_TIMEOUT: "The sandbox did not answer in time.",
  NOT_FOUND: "Route not found.",
  INTERNAL: "Internal error.",
  NOT_IMPLEMENTED: "Not implemented.",
};

/** A failure that maps to one contract error code and a fixed, non-sensitive message. */
export class BffFailure extends Error {
  readonly code: BffErrorCode;

  constructor(code: BffErrorCode) {
    super(GENERIC_MESSAGES[code]);
    this.name = "BffFailure";
    this.code = code;
  }
}

export function statusOf(failure: BffFailure): number {
  return BFF_ERROR_STATUS[failure.code];
}

export function toBffError(failure: BffFailure): BffError {
  return { error: { code: failure.code, message: failure.message } };
}
