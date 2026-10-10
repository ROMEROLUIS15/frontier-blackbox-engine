// @vitest-environment node
import { describe, expect, it } from "vitest";
import { parseConfig } from "./config.ts";

describe("parseConfig", () => {
  it("defaults to port 8781 without a dist dir", () => {
    expect(parseConfig({})).toEqual({ ok: true, config: { port: 8781, distDir: null } });
  });

  it("accepts a valid port and dist dir", () => {
    expect(parseConfig({ PORT: "3000", CONSOLE_DIST_DIR: "dist" })).toEqual({
      ok: true,
      config: { port: 3000, distDir: "dist" },
    });
  });

  it.each(["0", "65536", "abc", "-1", "12.5", ""])("rejects PORT=%j", (port) => {
    expect(parseConfig({ PORT: port }).ok).toBe(false);
  });

  it("rejects an empty CONSOLE_DIST_DIR", () => {
    expect(parseConfig({ CONSOLE_DIST_DIR: " " }).ok).toBe(false);
  });
});
