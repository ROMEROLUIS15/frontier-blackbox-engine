import { Inbox } from "lucide-react";

export interface EmptyStateProps {
  title: string;
  hint?: string;
}

/** Placeholder shown when a Panel has nothing to display yet. */
export function EmptyState({ title, hint }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border px-4 py-10 text-center">
      <span className="grid h-10 w-10 place-items-center rounded-full border border-border bg-surface-raised text-accent">
        <Inbox aria-hidden="true" size={18} />
      </span>
      <p className="text-sm font-medium text-text">{title}</p>
      {hint !== undefined && <p className="max-w-sm font-mono text-xs text-text-muted">{hint}</p>}
    </div>
  );
}
