# AGENTS.md — Engineering contract

Applies to every agent (human or AI) working in this repository. Each rule has a check; a rule without a
passing check is not satisfied. Repository facts: Node.js 24 + TypeScript (native type stripping), `node:http`,
zero runtime dependencies. Design: `docs/system-design.md`.

## 0. Instruction priority
1. Official challenge README (`README.md`) → 2. observed behavior of the original (`pruebas/ejemplos.jsonl`,
   `experimentos.jsonl`) → 3. approved architecture (`docs/system-design.md`) → 4. internal conventions (this file).
- A higher source wins. Any conflict between sources is reported to the team before acting; never resolve it
  silently.

## Definition of Done
A task is done only when all of these hold, with the command output reported:
- `npm test` passes, including a test for every observed behavior the task touches.
- `npm run typecheck` exits 0.
- The expected behavior was reviewed against its evidence (README line, `ejemplos.jsonl` or
  `experimentos.jsonl` line) or is tagged `// ASSUMPTION:`.
- The checks of sections 1, 2 and 4 return no matches.

## 1. Architecture
- Keep the approved layout: `src/control` (control value), `src/protocol` (parsing, validation, error catalog),
  `src/bank` (state and commands), `src/http` (the only I/O adapter), `src/main.ts` (bootstrap).
- `control` and `bank` stay pure: no `node:http`, no `process`, no I/O.
  Check: `test/boundaries.test.ts` passes (runtime import graph + forbidden globals, with a negative fixture).
- Apply SOLID where it removes real coupling; do not add interfaces, factories or layers with a single use.
- No new runtime dependency or framework without a written justification approved by the team.
  Check: `package.json` has no `dependencies` key.

## 2. TypeScript
- `tsconfig.json` keeps `"strict": true` (implies `noImplicitAny`). Check: `npm run typecheck` exits 0.
- No explicit `any`. Check: `rg -n --pcre2 '^(?!\s*//).*(:\s*any\b|<any>|\bas any\b)' src test` returns nothing.
- No type assertions in `src/` except `as const`; narrow with runtime checks instead.
  Check: `rg -n --pcre2 '^(?!\s*(import|//)).*\bas (?!const\b)([A-Z]|unknown\b|any\b)' src` returns nothing.
  Tests may assert types only on trusted fixtures (`pruebas/`, `experimentos.jsonl`) and Node APIs.
- No compiler suppressions. Check: `rg -n '@ts-ignore|@ts-nocheck|@ts-expect-error' src test` returns nothing.
- External data (HTTP body, headers, env vars) is typed `unknown` or `string | undefined` and validated at the
  boundary (`src/http`, `src/main.ts`, `src/config.ts`) before it reaches `protocol` or `bank`.

## 3. Clean code
- Intention-revealing names; small single-purpose functions; no duplicated logic (error bodies live only in
  `src/protocol/errors.ts`, the control algorithm only in `src/control/iso7064.ts`).
- No speculative generality or dead code.
- Minimal changes: touch only what the task needs; no refactors of unrelated code and no new dependencies
  unless the task requires them.
- Code, comments and identifiers in English. Response strings are the exception (see 5).
- Cross-cutting concerns live in one place each: auth and routing in `src/http/server.ts`, message parsing in
  `src/protocol/parse.ts`, error bodies in `src/protocol/errors.ts`, logging through the `Logger` passed to
  `createServer`. Check: `rg -n 'error: "E' src` matches only `src/protocol/errors.ts`.

## 4. Security
- Never print, log, commit or paste a token (team or personal). Tokens come only from environment variables
  (`TEAM_TOKEN`) or files outside the repository.
- Error responses and logs never echo request headers or secrets. Unexpected failures answer a generic body
  without stack traces or internal details.
- Logs contain only method, path (without query string), status, duration and, for failures, the error class
  name. Never headers, bodies or tokens. Check: `test/logging.test.ts` passes.
- Fail-safe state: every command validates all its inputs before its first mutation, so a rejected request
  leaves state exactly as it was (observed: rejected requests consume no `AC`/`OP` number — E:2→E:3, E:9→E:10).
- `.env*` files are never committed. Check: `.gitignore` lists `.env*`; `git ls-files | rg -i '\.env|token'`
  returns nothing.

## 5. Protocol fidelity
- HTTP status codes and JSON bodies must match the original byte for byte, including observed quirks
  (`"recieved"`, trailing space in `"comando desconocido "`, `cuentaId` vs `cuenta_id`).
- Any change to a status, body or validation order needs evidence (a line in `pruebas/ejemplos.jsonl` or
  `experimentos.jsonl`) cited in the change.
- Unverified behavior is an isolated constant or branch tagged `// ASSUMPTION:`.

## 6. State
- Deterministic: same request sequence after `POST /__reset` gives the same responses. No time, randomness or
  I/O in `bank`.
- State is isolated per accepted token. The replica accepts only `TEAM_TOKEN`, so it holds exactly one state;
  any other token gets `401 E001` and never touches state.
- Exactly one running instance (README.md:135). No autoscaling or multiple replicas.
- Atomic commands: `src/bank` is synchronous, so a command never interleaves with another request.
  Check: `rg -n 'async|await' src/bank` returns nothing.

## 7. Quality
- Pragmatic TDD: write or extend a failing test first for every observed behavior; unknown behavior is not
  blocked on tests but must carry `// ASSUMPTION:`.
- Test layers: unit (`test/control.test.ts`, `test/config.test.ts`), HTTP integration and stateful sequences
  (`test/golden.test.ts`), logging (`test/logging.test.ts`).
- Regression: every v2 `seq` in `experimentos.jsonl` (`"version":"v2"`) is replayed by a test, and the whole
  `pruebas/ejemplos.jsonl` is replayed against the v2 responses recorded in `s-ej-01-v2`.
- One command before any commit, push or deploy: `npm run verify` (typecheck + tests) exits 0.
- Deployed service: `npm run smoke` against the public URL before declaring it operational.
- Before reporting work as done, satisfy the Definition of Done.
- Never state that something works without the output of the command that proves it.

## 8. AI agents
- Stay within the authorized scope of the current task; ask before widening it.
- Never invent evidence. Label every claim as **tested** (command output or log line), **inferred** (reasoning
  from cited evidence) or **unknown**.
- Never send requests to the original service (`caja-negra-production-c64f.up.railway.app`) without explicit
  approval of the exact requests. Log every approved request in `experimentos.jsonl` (format: README.md, section
  "El log de experimentos").
- The replica must never call the original or another replica (README.md:125).
- Report results as `<command>: <observed output>`; report failures and skipped checks explicitly.

## 9. Deliverables
- Keep these in sync with the code: `docs/system-design.md`, the behavior specification
  (`docs/specification.md`, structure in README.md, section "La especificación"), and `experimentos.jsonl`.
- When a behavior changes from assumption to observed, update the code, the tests and the specification
  together.
