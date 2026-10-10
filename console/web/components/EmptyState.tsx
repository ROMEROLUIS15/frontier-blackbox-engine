export interface EmptyStateProps {
  title: string;
  hint?: string;
}

/** Placeholder shown when a Panel has nothing to display yet. */
export function EmptyState({ title, hint }: EmptyStateProps) {
  return (
    <div className="py-6 text-center">
      <p className="text-sm text-text">{title}</p>
      {hint !== undefined && <p className="text-xs text-text-muted">{hint}</p>}
    </div>
  );
}
