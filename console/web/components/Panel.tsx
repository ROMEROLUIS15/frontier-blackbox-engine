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
    <section className="relative overflow-hidden rounded-panel border border-border bg-surface/70 p-5 shadow-[0_1px_0_0_rgb(255_255_255/0.04)_inset,0_24px_48px_-28px_rgb(0_0_0/0.8)] backdrop-blur-md">
      <span aria-hidden="true" className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent" />
      <header className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold tracking-wide text-text">{title}</h2>
          {subtitle !== undefined && <p className="mt-0.5 text-xs text-text-muted">{subtitle}</p>}
        </div>
        {actions}
      </header>
      {children}
    </section>
  );
}
