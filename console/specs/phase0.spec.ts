import { describe, expect, it } from "vitest";
import { controlDigit } from "../../src/control/iso7064.ts";

describe("phase 0 cross-import", () => {
  it("reuses the backend control digit", () => {
    expect(controlDigit("PING")).toBe(64);
    expect(controlDigit("ALTA;Lucia")).toBe(82);
  });
});
