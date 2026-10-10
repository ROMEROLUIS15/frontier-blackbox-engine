import { motion, useReducedMotion } from "motion/react";
import type { SandboxExchange } from "../../../contract/sandbox-api.ts";
import { EmptyState, JsonViewer, StatusBadge } from "../../components/index.ts";
import { useSandboxSession } from "../sandbox-session/SandboxSessionProvider.tsx";

function messageOf(exchange: SandboxExchange): string | null {
  const { body } = exchange.request;
  if (body === undefined) return null;
  try {
    const parsed: unknown = JSON.parse(body);
    if (typeof parsed === "object" && parsed !== null && "m" in parsed && typeof parsed.m === "string") return parsed.m;
  } catch {
    return null;
  }
  return null;
}

function TimelineEntry({ exchange, animate }: { exchange: SandboxExchange; animate: boolean }) {
  const message = messageOf(exchange);
  return (
    <motion.li
      initial={animate ? { opacity: 0, y: -8 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="grid gap-2 rounded border border-border bg-surface-raised p-3"
    >
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="font-mono text-text-muted">#{exchange.sequence}</span>
        <span className="font-mono text-text">
          {exchange.request.method} {exchange.request.path}
        </span>
        <StatusBadge status={exchange.status} />
        <span className="ml-auto font-mono text-text-muted">
          X-Req {exchange.xReq ?? "—"} · {exchange.durationMs} ms
        </span>
      </div>
      {message !== null && (
        <p className="font-mono text-xs text-accent">
          m: <span className="text-text">{message}</span>
        </p>
      )}
      <JsonViewer value={exchange.body} />
    </motion.li>
  );
}

/** Prop-less. Shows the session exchanges, newest first. */
export function RequestTimeline() {
  const { exchanges } = useSandboxSession();
  const prefersReducedMotion = useReducedMotion() === true;

  if (exchanges.length === 0) {
    return <EmptyState title="Sin intercambios todavía" hint="Envía un mensaje desde el compositor." />;
  }
  return (
    <ol className="grid gap-2">
      {[...exchanges].reverse().map((exchange) => (
        <TimelineEntry key={exchange.id} exchange={exchange} animate={!prefersReducedMotion} />
      ))}
    </ol>
  );
}
