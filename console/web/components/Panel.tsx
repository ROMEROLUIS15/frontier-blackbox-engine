import type { ReactNode } from "react";

export interface PanelProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}

/**
 * Section container with a header (title, optional subtitle, optional right-aligned actions).
 * Convention: every feature renders inside a Panel; features never style their own outer frame.
 */
export function Panel({ title, subtitle, actions, children }: PanelProps) {
  return (
    <section className="rounded-panel border border-border bg-surface p-4">
      <header className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-text">{title}</h2>
          {subtitle !== undefined && <p className="text-xs text-text-muted">{subtitle}</p>}
        </div>
        {actions}
      </header>
      {children}
    </section>
  );
}
