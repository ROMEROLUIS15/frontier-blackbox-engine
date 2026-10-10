import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  findForeignFiles,
  findProtectedFiles,
  findSecrets,
  isOwned,
  isProtected,
  parseAddedLines,
  parsePorcelain,
} from "../scripts/check-workspace.ts";

const FAKE_TOKEN_BODY = "A1b2C3d4E5f6G7h8I9j0";
const ORIGINAL = ["caja-negra-production-c64f", "up", "railway", "app"].join(".");

describe("ownership matching", () => {
  it("allows files inside the workspace globs", () => {
    assert.equal(isOwned("ws2", "console/server/index.ts"), true);
    assert.equal(isOwned("ws4", "console/tsconfig.app.json"), true);
    assert.equal(isOwned("ws4", "console/vitest.config.ts"), true);
    assert.equal(isOwned("harness", "AGENTS.md"), true);
  });

  it("reports files owned by another workspace as foreign", () => {
    const foreign = findForeignFiles("ws2", ["console/server/a.ts", "console/web/app/App.tsx"]);
    assert.deepEqual(foreign, ["console/web/app/App.tsx"]);
    assert.deepEqual(findForeignFiles("harness", ["README.md"]), ["README.md"]);
  });

  it("does not let a single star cross directories", () => {
    assert.equal(isOwned("ws4", "console/tsconfig/deep/x.json"), false);
  });

  it("flags protected paths and exempts the harness test", () => {
    const protectedFiles = [
      "src/main.ts",
      "test/golden.test.ts",
      "docs/system-design.md",
      "docs/brief.pdf",
      "package.json",
      "railway.json",
      ".github/workflows/other.yml",
    ];
    const allowed = ["test/check-workspace.test.ts", "docs/agent-harness.md", ".github/workflows/ci.yml"];
    assert.deepEqual(findProtectedFiles([...protectedFiles, ...allowed]), protectedFiles);
  });
});

describe("release workspace", () => {
  it("allows any path outside the backend and official deliverables", () => {
    const allowed = ["console/web/x.tsx", ".github/workflows/ci.yml", "AGENTS.md"];
    assert.deepEqual(findForeignFiles("release", allowed), []);
    assert.deepEqual(findProtectedFiles(allowed, "release"), []);
  });

  it("blocks backend and official deliverables", () => {
    const blocked = ["src/main.ts", "docs/specification.md", "railway.json", "pruebas/a.jsonl", "README.md"];
    assert.deepEqual(findProtectedFiles([...blocked, "console/web/x.tsx"], "release"), blocked);
    assert.equal(isProtected("docs/brief.pdf", "release"), true);
  });

  it("does not exempt harness files differently from other paths", () => {
    assert.equal(isProtected("package.json", "release"), false);
    assert.equal(isProtected("package.json"), true);
  });
});

describe("secret matching", () => {
  it("detects bearer tokens, GitHub tokens and private keys", () => {
    assert.equal(findSecrets(`Authorization: Bearer ${FAKE_TOKEN_BODY}`).length, 1);
    assert.equal(findSecrets(`token ghp_${FAKE_TOKEN_BODY}`).length, 1);
    assert.equal(findSecrets(`github_pat_${FAKE_TOKEN_BODY}`).length, 1);
    assert.equal(findSecrets("-----BEGIN RSA PRIVATE" + " KEY-----").length, 1);
  });

  it("detects a team token assignment with a value only", () => {
    assert.equal(findSecrets("TEAM_" + "TOKEN=abc123").length, 1);
    assert.equal(findSecrets("TEAM_" + "TOKEN=").length, 0);
  });

  it("masks the secret value in the snippet", () => {
    const [finding] = findSecrets(`Authorization: Bearer ${FAKE_TOKEN_BODY}`);
    assert.ok(finding);
    assert.ok(!finding.snippet.includes(FAKE_TOKEN_BODY));
    assert.ok(finding.snippet.length <= 60);
  });

  it("rejects the original host unless the line carries the ORIGINAL_HOST guard", () => {
    assert.equal(findSecrets(`fetch("https://${ORIGINAL}")`).length, 1);
    assert.equal(findSecrets(`const ORIGINAL_HOST = "${ORIGINAL}";`).length, 0);
  });

  it("ignores plain text", () => {
    assert.deepEqual(findSecrets("const bearer = 'short'"), []);
  });
});

describe("diff parsing", () => {
  it("keeps only added lines with their file", () => {
    const diff = ["--- a/x.ts", "+++ b/x.ts", "@@ -1 +1 @@", "-old", "+new"].join("\n");
    assert.deepEqual(parseAddedLines(diff), [{ file: "x.ts", text: "new" }]);
  });

  it("parses porcelain output including renames", () => {
    assert.deepEqual(parsePorcelain(" M a.ts\n?? b.ts\nR  c.ts -> d.ts\n"), ["a.ts", "b.ts", "d.ts"]);
  });
});
