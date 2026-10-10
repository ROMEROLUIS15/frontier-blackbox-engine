import { useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { ExperimentExplorer, SandboxSessionProvider } from "../features/index.ts";
import { Panel } from "../components/index.ts";
import { AppFooter } from "./AppFooter.tsx";
import { AppHeader } from "./AppHeader.tsx";
import { ArchitectureView } from "./ArchitectureView.tsx";
import { ConsoleView } from "./ConsoleView.tsx";
import { ViewTabs, panelElementId, tabElementId } from "./ViewTabs.tsx";
import type { ViewId } from "./ViewTabs.tsx";

function ActiveView({ view }: { view: ViewId }) {
  if (view === "console") return <ConsoleView />;
  if (view === "experiments") {
    return (
      <Panel title="Experimentos" subtitle="Registro de hipótesis contra el servicio original">
        <ExperimentExplorer />
      </Panel>
    );
  }
  return <ArchitectureView />;
}

/** Application shell (owned by WS1): header, tabs, active view and footer. */
export function App() {
  const [view, setView] = useState<ViewId>("console");

  return (
    <SandboxSessionProvider>
      <MotionConfig reducedMotion="user">
        <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">
          <AppHeader />
          <ViewTabs active={view} onChange={setView} />
          <main className="flex-1">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={view}
                role="tabpanel"
                id={panelElementId(view)}
                aria-labelledby={tabElementId(view)}
                tabIndex={0}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
              >
                <ActiveView view={view} />
              </motion.div>
            </AnimatePresence>
          </main>
          <AppFooter />
        </div>
      </MotionConfig>
    </SandboxSessionProvider>
  );
}
