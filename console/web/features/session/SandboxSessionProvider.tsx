import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import type { SandboxExchange } from "../../../contract/sandbox-api.ts";

export interface SandboxSessionState {
  sessionId: string | null;
  exchanges: SandboxExchange[];
}

const emptySession: SandboxSessionState = { sessionId: null, exchanges: [] };

const SandboxSessionContext = createContext<SandboxSessionState>(emptySession);

/** Owns the sandbox session id (in memory only) and the exchange history. Stub (WS3). */
export function SandboxSessionProvider({ children }: { children: ReactNode }) {
  return <SandboxSessionContext.Provider value={emptySession}>{children}</SandboxSessionContext.Provider>;
}

export function useSandboxSession(): SandboxSessionState {
  return useContext(SandboxSessionContext);
}
