import { MessageComposer, RequestTimeline } from "../features/index.ts";
import { Panel } from "../components/index.ts";

/** Two-column on desktop (composer | timeline), stacked on mobile. */
export function ConsoleView() {
  return (
    <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
      <Panel title="Compositor" subtitle="Arma y envía mensajes al sandbox">
        <MessageComposer />
      </Panel>
      <Panel title="Línea de tiempo" subtitle="Solicitudes y respuestas de esta sesión">
        <RequestTimeline />
      </Panel>
    </div>
  );
}
