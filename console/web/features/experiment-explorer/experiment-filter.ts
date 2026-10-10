import type { ExperimentRecord } from "../../../contract/sandbox-api.ts";

export const EXPERIMENT_SEQUENCES = ["s-diag-01", "s-ctl-01", "s-io-01", "s-amt-01", "s-ej-01"] as const;

/** Keeps records of the chosen sequence (null = all) whose text contains the query (case-insensitive). */
export function filterExperiments(records: readonly ExperimentRecord[], sequence: string | null, query: string): ExperimentRecord[] {
  const needle = query.trim().toLowerCase();
  return records.filter((record) => {
    if (sequence !== null && record.seq !== sequence) return false;
    if (needle === "") return true;
    const haystack = [record.hipotesis, record.conclusion ?? "", JSON.stringify(record.request), JSON.stringify(record.response)];
    return haystack.some((text) => text.toLowerCase().includes(needle));
  });
}
