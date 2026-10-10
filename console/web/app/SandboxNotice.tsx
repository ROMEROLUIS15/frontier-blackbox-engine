/** Always-visible badge: the demo must never be mistaken for the evaluated/original service. */
export function SandboxNotice() {
  return (
    <p
      role="note"
      className="inline-flex items-center gap-2.5 rounded-full border border-warning/50 bg-warning/10 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-warning"
    >
      <span aria-hidden="true" className="sandbox-dot h-2 w-2 rounded-full bg-warning" />
      SANDBOX · réplica real en proceso — sin servicio original
    </p>
  );
}
