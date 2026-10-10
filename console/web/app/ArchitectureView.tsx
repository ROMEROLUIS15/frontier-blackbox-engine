import { useState } from "react";
import { ArrowDown } from "lucide-react";
import { Panel } from "../components/index.ts";
import { CONSOLE_PATH, REPLICA_MODULES } from "./architectureModules.ts";
import type { ArchitectureModule } from "./architectureModules.ts";
import { ModuleCard } from "./ModuleCard.tsx";

const ALL_MODULES: readonly ArchitectureModule[] = [...CONSOLE_PATH, ...REPLICA_MODULES];
const CHAIN_IDS = ["server", "parse", "commands", "state"] as const;

function findModule(id: string): ArchitectureModule | undefined {
  return ALL_MODULES.find((module) => module.id === id);
}

function Connector() {
  return <ArrowDown aria-hidden="true" size={16} className="mx-auto text-accent/70" />;
}

function ModuleChain({ ids, selectedId, onSelect }: { ids: readonly string[]; selectedId: string; onSelect: (id: string) => void }) {
  return (
    <ol className="grid gap-1">
      {ids.map((id, index) => {
        const module = findModule(id);
        if (module === undefined) return null;
        return (
          <li key={id} className="grid gap-1">
            {index > 0 && <Connector />}
            <ModuleCard module={module} selected={module.id === selectedId} onSelect={onSelect} />
          </li>
        );
      })}
    </ol>
  );
}

function ModuleDetail({ module }: { module: ArchitectureModule }) {
  return (
    <aside aria-live="polite" className="rounded-xl border border-accent/30 bg-canvas/60 p-4">
      <p className="text-xs uppercase tracking-widest text-accent">{module.role}</p>
      <h3 className="mt-1 font-mono text-base font-semibold text-text">{module.name}</h3>
      <p className="mt-2 text-sm leading-relaxed text-text-muted">{module.responsibility}</p>
      <ul className="mt-3 grid gap-1 font-mono text-xs text-text-muted">
        {module.connections.map((connection) => (
          <li key={connection} className="before:mr-2 before:text-accent before:content-['›']">
            {connection}
          </li>
        ))}
      </ul>
    </aside>
  );
}

/** Interactive map of the real modules (docs/architecture.svg) and the console request path. */
export function ArchitectureView() {
  const [selectedId, setSelectedId] = useState("server");
  const selected = findModule(selectedId) ?? REPLICA_MODULES[0];

  return (
    <div className="grid gap-4">
      <Panel title="Camino de la consola" subtitle="Cada sesión del navegador obtiene su propia réplica aislada.">
        <ModuleChain ids={CONSOLE_PATH.map((module) => module.id)} selectedId={selectedId} onSelect={setSelectedId} />
      </Panel>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <Panel title="Módulos de la réplica" subtitle="Pasa el cursor o enfoca un módulo para ver su responsabilidad.">
          <div className="grid gap-4">
            <ModuleChain ids={CHAIN_IDS} selectedId={selectedId} onSelect={setSelectedId} />
            <div className="grid gap-2 sm:grid-cols-2">
              {["iso7064", "errors"].map((id) => {
                const module = findModule(id);
                return module === undefined ? null : <ModuleCard key={id} module={module} selected={id === selectedId} onSelect={setSelectedId} />;
              })}
            </div>
          </div>
        </Panel>
        <Panel title="Responsabilidad">{selected !== undefined && <ModuleDetail module={selected} />}</Panel>
      </div>
    </div>
  );
}
