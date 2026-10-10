import { randomUUID } from "node:crypto";
import type { CreateSessionResponse, SandboxExchange, SandboxRequest } from "../contract/sandbox-api.ts";
import { BffFailure } from "./bff-failure.ts";
import type { BffLimits } from "./bff-limits.ts";
import type { SandboxSession } from "./sandbox-session.ts";

export interface SessionRegistry {
  create(): Promise<CreateSessionResponse>;
  send(sessionId: string, request: SandboxRequest): Promise<SandboxExchange>;
  /** Resolves true when a live session was removed. */
  remove(sessionId: string): Promise<boolean>;
  closeAll(): Promise<void>;
}

export interface SessionRegistryOptions {
  limits: BffLimits;
  openSession: () => Promise<SandboxSession>;
  now?: () => number;
}

interface Entry {
  session: SandboxSession;
  lastActiveAt: number;
  recentRequestTimes: number[];
}

const RATE_WINDOW_MS = 60_000;
const SWEEP_INTERVAL_MS = 30_000;

export function createSessionRegistry(options: SessionRegistryOptions): SessionRegistry {
  const { limits, openSession } = options;
  const now = options.now ?? Date.now;
  const entries = new Map<string, Entry>();
  let pendingCreations = 0;

  function isExpired(entry: Entry): boolean {
    return now() - entry.lastActiveAt >= limits.sessionTtlMs;
  }

  async function evict(sessionId: string, entry: Entry): Promise<void> {
    entries.delete(sessionId);
    await entry.session.close();
  }

  async function sweepExpired(): Promise<void> {
    const expired = [...entries].filter(([, entry]) => isExpired(entry));
    await Promise.all(expired.map(([sessionId, entry]) => evict(sessionId, entry)));
  }

  const sweeper = setInterval(() => void sweepExpired(), SWEEP_INTERVAL_MS);
  sweeper.unref();

  async function findLive(sessionId: string): Promise<Entry> {
    const entry = entries.get(sessionId);
    if (entry === undefined) throw new BffFailure("SESSION_NOT_FOUND");
    if (isExpired(entry)) {
      await evict(sessionId, entry);
      throw new BffFailure("SESSION_NOT_FOUND");
    }
    return entry;
  }

  function consumeRateAllowance(entry: Entry): void {
    const current = now();
    entry.recentRequestTimes = entry.recentRequestTimes.filter((time) => current - time < RATE_WINDOW_MS);
    if (entry.recentRequestTimes.length >= limits.maxRequestsPerMinutePerSession) {
      throw new BffFailure("RATE_LIMITED");
    }
    entry.recentRequestTimes.push(current);
  }

  async function create(): Promise<CreateSessionResponse> {
    await sweepExpired();
    if (entries.size + pendingCreations >= limits.maxSessions) throw new BffFailure("SESSION_LIMIT");
    pendingCreations += 1;
    try {
      const session = await openSession();
      const sessionId = randomUUID();
      const lastActiveAt = now();
      entries.set(sessionId, { session, lastActiveAt, recentRequestTimes: [] });
      return { sessionId, expiresAt: new Date(lastActiveAt + limits.sessionTtlMs).toISOString() };
    } finally {
      pendingCreations -= 1;
    }
  }

  async function send(sessionId: string, request: SandboxRequest): Promise<SandboxExchange> {
    const entry = await findLive(sessionId);
    consumeRateAllowance(entry);
    entry.lastActiveAt = now();
    return entry.session.forward(request);
  }

  async function remove(sessionId: string): Promise<boolean> {
    const entry = entries.get(sessionId);
    if (entry === undefined) return false;
    const live = !isExpired(entry);
    await evict(sessionId, entry);
    return live;
  }

  async function closeAll(): Promise<void> {
    clearInterval(sweeper);
    await Promise.all([...entries].map(([sessionId, entry]) => evict(sessionId, entry)));
  }

  return { create, send, remove, closeAll };
}
