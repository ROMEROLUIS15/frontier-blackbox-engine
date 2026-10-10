/**
 * Workspace guardrail for the multi-agent console effort.
 * Usage: node scripts/check-workspace.ts --workspace <ws1|ws2|ws3|ws4|harness|release> [--base <ref>]
 * Prints one line per check (PASS/FAIL) and exits 1 on any FAIL.
 * The ownership table below is the source of truth referenced by AGENTS.md section 10.
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const ORIGINAL_HOST = "caja-negra-production-c64f.up.railway.app";
const ORIGINAL_HOST_GUARD = "ORIGINAL_HOST";
const DEFAULT_BASE = "feat/console";
const PROTECTED_BASE = "main";
const SNIPPET_LENGTH = 60;

export const OWNERSHIP = {
  ws1: ["console/web/app/**", "console/web/components/**", "console/web/styles/**"],
  ws2: ["console/server/**"],
  ws3: ["console/web/features/**", "console/web/api/**"],
  ws4: [
    "console/package.json",
    "console/package-lock.json",
    "console/tsconfig*.json",
    "console/vite.config.ts",
    "console/vitest.config.*",
    "console/web/index.html",
    "console/web/main.tsx",
    "console/contract/**",
    "console/specs/**",
    "console/.gitignore",
    "test/check-workspace.test.ts",
  ],
  harness: [
    "AGENTS.md",
    "docs/agent-harness.md",
    "scripts/check-workspace.ts",
    "test/check-workspace.test.ts",
    ".github/workflows/ci.yml",
  ],
  /** Pull requests into main: any path may change, only the protected release set may not. */
  release: ["**"],
} as const;

export const PROTECTED = [
  "src/**",
  "test/**",
  "docs/*.pdf",
  "docs/system-design*",
  "docs/architecture*",
  "docs/specification.md",
  "experimentos.jsonl",
  "pruebas/**",
  "railway.json",
  "package.json",
  "package-lock.json",
  ".github/**",
  "README.md",
] as const;

/** Backend and official deliverables: the only paths frozen for the release workspace. */
export const RELEASE_PROTECTED = [
  "src/**",
  "docs/*.pdf",
  "docs/system-design.md",
  "docs/system-design.html",
  "docs/architecture.svg",
  "docs/architecture.html",
  "docs/architecture.png",
  "docs/specification.md",
  "experimentos.jsonl",
  "pruebas/**",
  "railway.json",
  "README.md",
] as const;

/** Harness-owned files under a protected path: the harness test and the CI workflow. */
export const PROTECTED_EXCEPTIONS = ["test/check-workspace.test.ts", ".github/workflows/ci.yml"] as const;

export type WorkspaceId = keyof typeof OWNERSHIP;

export const SECRET_RULES = [
  { name: "bearer token", pattern: /Bearer\s+[A-Za-z0-9._~+/-]{16,}/ },
  { name: "GitHub token", pattern: /ghp_[A-Za-z0-9]{10,}/ },
  { name: "GitHub fine-grained token", pattern: /github_pat_[A-Za-z0-9_]{10,}/ },
  { name: "private key header", pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
  { name: "team token assignment", pattern: /TEAM_TOKEN\s*=\s*["']?[^\s"']+/ },
] as const;

export function isWorkspaceId(value: string): value is WorkspaceId {
  return Object.hasOwn(OWNERSHIP, value);
}

function globToRegExp(glob: string): RegExp {
  let source = "";
  for (let i = 0; i < glob.length; i++) {
    const char = glob.charAt(i);
    if (char === "*" && glob.charAt(i + 1) === "*") {
      source += ".*";
      i++;
    } else if (char === "*") {
      source += "[^/]*";
    } else {
      source += char.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
    }
  }
  return new RegExp(`^${source}$`);
}

export function matchesAny(file: string, globs: readonly string[]): boolean {
  return globs.some((glob) => globToRegExp(glob).test(file));
}

export function protectedFor(workspace: WorkspaceId): readonly string[] {
  return workspace === "release" ? RELEASE_PROTECTED : PROTECTED;
}

export function isProtected(file: string, workspace?: WorkspaceId): boolean {
  const globs = workspace === undefined ? PROTECTED : protectedFor(workspace);
  const exempt = workspace === "release" ? [] : PROTECTED_EXCEPTIONS;
  return matchesAny(file, globs) && !exempt.some((path) => path === file);
}

export function isOwned(workspace: WorkspaceId, file: string): boolean {
  return matchesAny(file, OWNERSHIP[workspace]);
}

export function findForeignFiles(workspace: WorkspaceId, files: readonly string[]): string[] {
  return files.filter((file) => !isOwned(workspace, file));
}

export function findProtectedFiles(files: readonly string[], workspace?: WorkspaceId): string[] {
  return files.filter((file) => isProtected(file, workspace));
}

export interface SecretFinding {
  rule: string;
  snippet: string;
}

function maskedSnippet(line: string, match: RegExpMatchArray): string {
  const start = match.index ?? 0;
  const masked = line.slice(0, start) + "***" + line.slice(start + match[0].length);
  return masked.trim().slice(0, SNIPPET_LENGTH);
}

export function findSecrets(line: string): SecretFinding[] {
  const findings: SecretFinding[] = [];
  for (const rule of SECRET_RULES) {
    const match = line.match(rule.pattern);
    if (match) findings.push({ rule: rule.name, snippet: maskedSnippet(line, match) });
  }
  if (line.includes(ORIGINAL_HOST) && !line.includes(ORIGINAL_HOST_GUARD)) {
    findings.push({ rule: "original host", snippet: line.trim().slice(0, SNIPPET_LENGTH) });
  }
  return findings;
}

export interface AddedLine {
  file: string;
  text: string;
}

export function parseAddedLines(diff: string): AddedLine[] {
  const added: AddedLine[] = [];
  let file = "";
  for (const line of diff.split("\n")) {
    if (line.startsWith("+++ ")) {
      file = line.startsWith("+++ b/") ? line.slice(6) : "";
    } else if (line.startsWith("+") && file !== "") {
      added.push({ file, text: line.slice(1) });
    }
  }
  return added;
}

export function parsePorcelain(output: string): string[] {
  return output
    .split("\n")
    .filter((line) => line.length > 3)
    .map((line) => line.slice(3))
    .map((path) => (path.includes(" -> ") ? (path.split(" -> ")[1] ?? path) : path));
}

function git(args: readonly string[]): string {
  return execFileSync("git", args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
}

function nonEmptyLines(text: string): string[] {
  return text.split("\n").filter((line) => line.length > 0);
}

function collectChangedFiles(base: string): string[] {
  const committed = nonEmptyLines(git(["diff", "--name-only", `${base}...HEAD`]));
  const pending = parsePorcelain(git(["status", "--porcelain", "--untracked-files=all"]));
  return [...new Set([...committed, ...pending])].sort();
}

function collectAddedLines(base: string): AddedLine[] {
  const mergeBase = git(["merge-base", base, "HEAD"]).trim();
  const tracked = parseAddedLines(git(["diff", mergeBase, "-U0", "--no-color"]));
  const untrackedFiles = nonEmptyLines(git(["ls-files", "--others", "--exclude-standard"]));
  const untracked = untrackedFiles.flatMap((file) =>
    readFileSync(file, "utf8")
      .split("\n")
      .map((text) => ({ file, text })),
  );
  return [...tracked, ...untracked];
}

interface CheckResult {
  name: string;
  failures: string[];
}

function runChecks(workspace: WorkspaceId, base: string): CheckResult[] {
  const files = collectChangedFiles(base);
  const secretFailures = collectAddedLines(base).flatMap(({ file, text }) =>
    findSecrets(text).map(({ rule, snippet }) => `${file}: ${rule} "${snippet}"`),
  );
  const backendChanges = nonEmptyLines(git(["diff", "--name-only", `${PROTECTED_BASE}...HEAD`, "--", "src"]));
  return [
    { name: "ownership", failures: findForeignFiles(workspace, files) },
    { name: "protected-paths", failures: findProtectedFiles(files, workspace) },
    { name: "backend-untouched", failures: backendChanges },
    { name: "secrets-and-original-host", failures: secretFailures },
  ];
}

function parseArgs(argv: readonly string[]): { workspace: WorkspaceId; base: string } | string {
  const valueOf = (flag: string): string | undefined => {
    const index = argv.indexOf(flag);
    return index === -1 ? undefined : argv[index + 1];
  };
  const workspace = valueOf("--workspace") ?? "";
  if (!isWorkspaceId(workspace)) {
    return `usage: node scripts/check-workspace.ts --workspace <${Object.keys(OWNERSHIP).join("|")}> [--base <ref>]`;
  }
  return { workspace, base: valueOf("--base") ?? DEFAULT_BASE };
}

function main(argv: readonly string[]): number {
  const args = parseArgs(argv);
  if (typeof args === "string") {
    console.error(args);
    return 2;
  }
  const results = runChecks(args.workspace, args.base);
  for (const { name, failures } of results) {
    console.log(failures.length === 0 ? `PASS ${name}` : `FAIL ${name}: ${failures.join("; ")}`);
  }
  return results.every(({ failures }) => failures.length === 0) ? 0 : 1;
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = main(process.argv.slice(2));
}
