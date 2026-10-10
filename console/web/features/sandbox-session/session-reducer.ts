import type { SandboxExchange } from "../../../contract/sandbox-api.ts";

export type SessionStatus = "connecting" | "ready" | "error";

export interface SessionState {
  status: SessionStatus;
  sessionId: string | null;
  exchanges: SandboxExchange[];
  /** Transient user-facing message (Spanish), e.g. session replaced or request rejected. */
  notice: string | null;
  /** Set only while status is "error". */
  errorMessage: string | null;
}

export type SessionAction =
  | { type: "connecting" }
  | { type: "session-started"; sessionId: string }
  | { type: "session-failed"; message: string }
  | { type: "session-replaced"; sessionId: string; notice: string }
  | { type: "exchange-recorded"; exchange: SandboxExchange }
  | { type: "request-failed"; message: string }
  | { type: "notice-dismissed" };

export const initialSessionState: SessionState = {
  status: "connecting",
  sessionId: null,
  exchanges: [],
  notice: null,
  errorMessage: null,
};

export function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case "connecting":
      return { ...initialSessionState };
    case "session-started":
      return { ...state, status: "ready", sessionId: action.sessionId, errorMessage: null };
    case "session-failed":
      return { ...state, status: "error", sessionId: null, errorMessage: action.message };
    case "session-replaced":
      return { status: "ready", sessionId: action.sessionId, exchanges: [], notice: action.notice, errorMessage: null };
    case "exchange-recorded":
      return { ...state, exchanges: [...state.exchanges, action.exchange] };
    case "request-failed":
      return { ...state, notice: action.message };
    case "notice-dismissed":
      return { ...state, notice: null };
  }
}
