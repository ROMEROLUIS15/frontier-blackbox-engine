import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from "react";
import type { ReactNode } from "react";
import type { SandboxRequest } from "../../../contract/sandbox-api.ts";
import { BffRequestError, createSession, deleteSession, sendSandboxRequest } from "../../api/sandbox-client.ts";
import { initialSessionState, sessionReducer } from "./session-reducer.ts";
import type { SessionState } from "./session-reducer.ts";

export interface SandboxSessionState extends SessionState {
  send: (request: SandboxRequest) => Promise<void>;
  startNewSession: () => Promise<void>;
  dismissNotice: () => void;
}

const SESSION_REPLACED_NOTICE = "La sesión expiró; se creó una nueva y el historial se reinició.";

const noSession: SandboxSessionState = {
  ...initialSessionState,
  send: () => Promise.resolve(),
  startNewSession: () => Promise.resolve(),
  dismissNotice: () => undefined,
};

const SandboxSessionContext = createContext<SandboxSessionState>(noSession);

function describeError(error: unknown): string {
  if (error instanceof BffRequestError) return error.message;
  return "No se pudo contactar con el servidor.";
}

function releaseSession(sessionId: string | null): void {
  if (sessionId !== null) deleteSession(sessionId).catch(() => undefined);
}

/** Owns the sandbox session id (in memory only) and the exchange history. */
export function SandboxSessionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(sessionReducer, initialSessionState);
  const sessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    createSession()
      .then(({ sessionId }) => {
        if (cancelled) return releaseSession(sessionId);
        sessionIdRef.current = sessionId;
        dispatch({ type: "session-started", sessionId });
      })
      .catch((error: unknown) => {
        if (!cancelled) dispatch({ type: "session-failed", message: describeError(error) });
      });
    return () => {
      cancelled = true;
      releaseSession(sessionIdRef.current);
      sessionIdRef.current = null;
    };
  }, []);

  const replaceSessionAndRetry = useCallback(async (request: SandboxRequest): Promise<void> => {
    const { sessionId } = await createSession();
    sessionIdRef.current = sessionId;
    dispatch({ type: "session-replaced", sessionId, notice: SESSION_REPLACED_NOTICE });
    const exchange = await sendSandboxRequest(sessionId, request);
    dispatch({ type: "exchange-recorded", exchange });
  }, []);

  const send = useCallback(
    async (request: SandboxRequest): Promise<void> => {
      const sessionId = sessionIdRef.current;
      if (sessionId === null) return;
      try {
        const exchange = await sendSandboxRequest(sessionId, request);
        dispatch({ type: "exchange-recorded", exchange });
      } catch (error) {
        try {
          if (error instanceof BffRequestError && error.code === "SESSION_NOT_FOUND") {
            await replaceSessionAndRetry(request);
          } else {
            dispatch({ type: "request-failed", message: describeError(error) });
          }
        } catch (retryError) {
          dispatch({ type: "request-failed", message: describeError(retryError) });
        }
      }
    },
    [replaceSessionAndRetry],
  );

  const startNewSession = useCallback(async (): Promise<void> => {
    releaseSession(sessionIdRef.current);
    sessionIdRef.current = null;
    dispatch({ type: "connecting" });
    try {
      const { sessionId } = await createSession();
      sessionIdRef.current = sessionId;
      dispatch({ type: "session-started", sessionId });
    } catch (error) {
      dispatch({ type: "session-failed", message: describeError(error) });
    }
  }, []);

  const dismissNotice = useCallback(() => dispatch({ type: "notice-dismissed" }), []);

  const value = useMemo<SandboxSessionState>(
    () => ({ ...state, send, startNewSession, dismissNotice }),
    [state, send, startNewSession, dismissNotice],
  );

  return <SandboxSessionContext.Provider value={value}>{children}</SandboxSessionContext.Provider>;
}

export function useSandboxSession(): SandboxSessionState {
  return useContext(SandboxSessionContext);
}
