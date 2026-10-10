import { EmptyState } from "../../components/index.ts";
import { useSandboxSession } from "../session/SandboxSessionProvider.tsx";

/** Prop-less. Reads the session provider. Stub (WS3). */
export function MessageComposer() {
  const { sessionId } = useSandboxSession();
  return <EmptyState title="Compositor pendiente" hint={sessionId ?? "Sin sesion"} />;
}
