const DEFAULT_PORT = 3000;

/** Parses the PORT environment variable; returns null when it is set but not a valid TCP port. */
export function parsePort(raw: string | undefined): number | null {
  if (raw === undefined) return DEFAULT_PORT;
  if (!/^\d+$/.test(raw)) return null;
  const port = Number(raw);
  return port >= 1 && port <= 65535 ? port : null;
}
