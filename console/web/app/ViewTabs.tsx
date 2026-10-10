import { useRef } from "react";
import type { KeyboardEvent } from "react";
import { motion } from "motion/react";

export type ViewId = "console" | "experiments" | "architecture";

export interface ViewDefinition {
  id: ViewId;
  label: string;
}

export const VIEWS: readonly ViewDefinition[] = [
  { id: "console", label: "Consola" },
  { id: "experiments", label: "Experimentos" },
  { id: "architecture", label: "Arquitectura" },
];

export function tabElementId(view: ViewId): string {
  return `tab-${view}`;
}

export function panelElementId(view: ViewId): string {
  return `panel-${view}`;
}

interface ViewTabsProps {
  active: ViewId;
  onChange: (view: ViewId) => void;
}

function nextIndexFor(key: string, current: number, total: number): number | null {
  if (key === "ArrowRight") return (current + 1) % total;
  if (key === "ArrowLeft") return (current - 1 + total) % total;
  if (key === "Home") return 0;
  if (key === "End") return total - 1;
  return null;
}

/** Accessible tablist (WAI-ARIA tabs pattern, automatic activation, roving tabindex). */
export function ViewTabs({ active, onChange }: ViewTabsProps) {
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const target = nextIndexFor(event.key, index, VIEWS.length);
    if (target === null) return;
    event.preventDefault();
    const view = VIEWS[target];
    if (view === undefined) return;
    onChange(view.id);
    tabRefs.current[target]?.focus();
  };

  return (
    <div role="tablist" aria-label="Vistas de la consola" className="relative flex gap-1 rounded-xl border border-border bg-surface/70 p-1 backdrop-blur-md">
      {VIEWS.map((view, index) => {
        const isActive = view.id === active;
        return (
          <button
            key={view.id}
            ref={(element) => {
              tabRefs.current[index] = element;
            }}
            type="button"
            role="tab"
            id={tabElementId(view.id)}
            aria-selected={isActive}
            aria-controls={panelElementId(view.id)}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(view.id)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={`relative flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors sm:flex-none ${
              isActive ? "text-text" : "text-text-muted hover:text-text"
            }`}
          >
            {isActive && (
              <motion.span
                layoutId="active-tab-pill"
                aria-hidden="true"
                className="absolute inset-0 rounded-lg border border-accent/40 bg-accent/15 shadow-[0_0_24px_-8px_var(--color-accent)]"
                transition={{ type: "spring", stiffness: 480, damping: 36 }}
              />
            )}
            <span className="relative">{view.label}</span>
          </button>
        );
      })}
    </div>
  );
}
