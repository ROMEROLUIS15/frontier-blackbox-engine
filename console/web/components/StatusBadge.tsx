export interface StatusBadgeProps {
  status: number;
}

type Tone = "success" | "warning" | "danger" | "muted";

const TONE_STYLE: Record<Tone, string> = {
  success: "border-success/40 bg-success/10 text-success",
  warning: "border-warning/40 bg-warning/10 text-warning",
  danger: "border-danger/40 bg-danger/10 text-danger",
  muted: "border-border bg-surface-raised text-text-muted",
};

function toneFor(status: number): Tone {
  if (status >= 500) return "danger";
  if (status >= 400) return "warning";
  if (status >= 200 && status < 300) return "success";
  return "muted";
}

/**
 * HTTP status pill. Color by class: 2xx success, 4xx warning, 5xx danger (other: muted).
 * Always shows the numeric status.
 */
export function StatusBadge({ status }: StatusBadgeProps) {
  const tone = toneFor(status);
  return (
    <span
      data-tone={tone}
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 font-mono text-xs font-semibold tabular-nums ${TONE_STYLE[tone]}`}
    >
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}
