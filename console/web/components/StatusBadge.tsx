export interface StatusBadgeProps {
  status: number;
}

function toneFor(status: number): string {
  if (status >= 500) return "text-danger";
  if (status >= 400) return "text-warning";
  if (status >= 200 && status < 300) return "text-success";
  return "text-text-muted";
}

/**
 * HTTP status pill. Color by class: 2xx success, 4xx warning, 5xx danger (other: muted).
 * Always shows the numeric status.
 */
export function StatusBadge({ status }: StatusBadgeProps) {
  return <span className={`rounded border border-border px-2 py-0.5 font-mono text-xs ${toneFor(status)}`}>{status}</span>;
}
