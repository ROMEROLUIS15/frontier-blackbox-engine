import { describe, expect, it } from "vitest";
import type { ExperimentRecord } from "../../../contract/sandbox-api.ts";
import { filterExperiments } from "./experiment-filter.ts";

const records: ExperimentRecord[] = [
  { id: 1, seq: "s-ctl-01", x_req: 1, hipotesis: "Línea base", request: { m: "PING;64" }, status: 200, response: { pong: true }, conclusion: "ok" },
  { id: 2, seq: "s-io-01", x_req: 2, hipotesis: "Body vacío", request: {}, status: 400, response: { error: "E201" }, conclusion: null },
];

describe("filterExperiments", () => {
  it("returns everything without filters", () => {
    expect(filterExperiments(records, null, "")).toHaveLength(2);
  });

  it("filters by sequence", () => {
    expect(filterExperiments(records, "s-io-01", "").map((record) => record.id)).toEqual([2]);
  });

  it("searches hypothesis, request and response case-insensitively", () => {
    expect(filterExperiments(records, null, "línea").map((record) => record.id)).toEqual([1]);
    expect(filterExperiments(records, null, "e201").map((record) => record.id)).toEqual([2]);
    expect(filterExperiments(records, null, "ping;64").map((record) => record.id)).toEqual([1]);
  });
});
