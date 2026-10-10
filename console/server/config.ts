export interface ServerConfig {
  port: number;
  distDir: string | null;
}

export type ConfigResult = { ok: true; config: ServerConfig } | { ok: false; reason: string };

const DEFAULT_PORT = 8781;

function parsePort(raw: string | undefined): number | null {
  if (raw === undefined) return DEFAULT_PORT;
  if (!/^\d{1,5}$/.test(raw)) return null;
  const port = Number(raw);
  return port >= 1 && port <= 65_535 ? port : null;
}

export function parseConfig(environment: Record<string, string | undefined>): ConfigResult {
  const port = parsePort(environment.PORT);
  if (port === null) return { ok: false, reason: "PORT must be an integer between 1 and 65535." };
  const rawDistDir = environment.CONSOLE_DIST_DIR;
  if (rawDistDir !== undefined && rawDistDir.trim() === "") {
    return { ok: false, reason: "CONSOLE_DIST_DIR must not be empty when set." };
  }
  return { ok: true, config: { port, distDir: rawDistDir ?? null } };
}
