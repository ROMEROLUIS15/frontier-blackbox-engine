import { ExperimentExplorer, MessageComposer, RequestTimeline, SandboxSessionProvider } from "../features/index.ts";
import { Panel } from "../components/index.ts";

/** Application shell (owned by WS1): only lays the feature components out. */
export function App() {
  return (
    <SandboxSessionProvider>
      <main className="min-h-screen bg-canvas p-6 font-sans text-text">
        <div className="mx-auto grid max-w-6xl gap-4">
          <Panel title="Compositor">
            <MessageComposer />
          </Panel>
          <Panel title="Linea de tiempo">
            <RequestTimeline />
          </Panel>
          <Panel title="Experimentos">
            <ExperimentExplorer />
          </Panel>
        </div>
      </main>
    </SandboxSessionProvider>
  );
}
