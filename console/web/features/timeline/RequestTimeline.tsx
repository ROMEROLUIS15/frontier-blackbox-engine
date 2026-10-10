import { EmptyState } from "../../components/index.ts";
import { useSandboxSession } from "../session/SandboxSessionProvider.tsx";

/** Prop-less. Reads the session provider. Stub (WS3). */
export function RequestTimeline() {
  const { exchanges } = useSandboxSession();
  return <EmptyState title="Sin intercambios" hint={`${exchanges.length} registrados`} />;
}
