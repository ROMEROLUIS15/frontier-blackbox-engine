import { readFileSync } from "node:fs";
import type { ExperimentRecord, ExperimentsResponse } from "../contract/sandbox-api.ts";
import { BffFailure } from "./bff-failure.ts";

export interface ExperimentsCatalog {
  get(): ExperimentsResponse;
}

export const DEFAULT_EXPERIMENTS_FILE = new URL("../../experimentos.jsonl", import.meta.url);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** undefined: absent, string: valid, null: present but not a string. */
function optionalString(value: unknown): string | undefined | null {
  if (value === undefined) return undefined;
  return typeof value === "string" ? value : null;
}

function toExperimentRecord(value: unknown): ExperimentRecord | null {
  if (!isRecord(value)) return null;
  const { id, seq, x_req, hipotesis, request, status, response, conclusion } = value;
  if (typeof id !== "number" || typeof seq !== "string" || typeof hipotesis !== "string") return null;
  if (typeof status !== "number") return null;
  if (x_req !== null && typeof x_req !== "number" && typeof x_req !== "string") return null;
  if (conclusion !== null && typeof conclusion !== "string") return null;
  if (!("request" in value) || !("response" in value)) return null;

  const method = optionalString(value.method);
  const path = optionalString(value.path);
  const auth = optionalString(value.auth);
  if (method === null || path === null || auth === null) return null;

  const record: ExperimentRecord = { id, seq, x_req, hipotesis, request, status, response, conclusion };
  if (method !== undefined) record.method = method;
  if (path !== undefined) record.path = path;
  if (auth !== undefined) record.auth = auth;
  return record;
}

function parseLine(line: string): ExperimentRecord {
  let parsed: unknown;
  try {
    parsed = JSON.parse(line);
  } catch {
    throw new BffFailure("INTERNAL");
  }
  const record = toExperimentRecord(parsed);
  if (record === null) throw new BffFailure("INTERNAL");
  return record;
}

function loadExperiments(file: URL): ExperimentsResponse {
  let content: string;
  try {
    content = readFileSync(file, "utf8");
  } catch {
    throw new BffFailure("INTERNAL");
  }
  const lines = content.split("\n").filter((line) => line.trim() !== "");
  return { experiments: lines.map(parseLine) };
}

/** Reads the JSONL file on first use and serves the validated result from memory afterwards. */
export function createExperimentsCatalog(file: URL = DEFAULT_EXPERIMENTS_FILE): ExperimentsCatalog {
  let cached: ExperimentsResponse | null = null;
  return {
    get() {
      cached ??= loadExperiments(file);
      return cached;
    },
  };
}
