import { Terminal } from "lucide-react";
import { SandboxNotice } from "./SandboxNotice.tsx";

/** Product identity plus the explicit sandbox badge. */
export function AppHeader() {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <span className="grid h-12 w-12 place-items-center rounded-xl border border-accent/40 bg-accent/10 text-accent shadow-[0_0_32px_-10px_var(--color-accent)]">
          <Terminal aria-hidden="true" size={22} />
        </span>
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-text">Blackbox Engine</h1>
          <p className="text-sm text-text-muted">Consola de ingeniería inversa · Reto 2</p>
        </div>
      </div>
      <SandboxNotice />
    </header>
  );
}
