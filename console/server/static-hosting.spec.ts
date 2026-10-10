// @vitest-environment node
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { loadStaticAsset } from "./static-assets.ts";

const directories: string[] = [];

function createDist(): string {
  const root = mkdtempSync(join(tmpdir(), "console-dist-"));
  directories.push(root);
  const dist = join(root, "dist");
  mkdirSync(join(dist, "assets"), { recursive: true });
  writeFileSync(join(dist, "index.html"), "<html>spa</html>");
  writeFileSync(join(dist, "assets", "app.js"), "console.log(1)");
  writeFileSync(join(root, "secret.txt"), "secret");
  return dist;
}

afterEach(() => {
  for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true });
});

describe("loadStaticAsset", () => {
  it("serves existing files with their content type", async () => {
    const asset = await loadStaticAsset(createDist(), "/assets/app.js");
    expect(asset?.contentType).toContain("javascript");
    expect(asset?.content.toString()).toBe("console.log(1)");
  });

  it("falls back to index.html for SPA routes", async () => {
    const asset = await loadStaticAsset(createDist(), "/experiments/3");
    expect(asset?.content.toString()).toBe("<html>spa</html>");
  });

  it.each(["/../secret.txt", "/%2e%2e/secret.txt", "/assets/../../secret.txt", "/%00"])(
    "rejects traversal %s",
    async (path) => {
      expect(await loadStaticAsset(createDist(), path)).toBeNull();
    },
  );
});
