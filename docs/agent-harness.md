# Agent Harness — Multi-Agent Engineering Workflow

Status legend: **IMPLEMENTED AND VERIFIED** (command output observed, see section 12), **IMPLEMENTED BUT NOT YET VERIFIED**, **PLANNED**.

## Control status summary

| Control | Status |
|---|---|
| Plain git worktrees isolate files between agents | **IMPLEMENTED AND VERIFIED** (probe, section 3) |
| Orca workspaces as an isolation mechanism | Not usable: verified not to isolate (section 3) |
| Ownership, protected-path, backend-untouched and secret/original-host checks (`scripts/check-workspace.ts`) | **IMPLEMENTED AND VERIFIED** (unit tests + positive and negative runs) |
| Root `npm run verify` (typecheck + tests) | **IMPLEMENTED AND VERIFIED** |
| Backend CI (`npm ci` + `npm run verify` on push to `main` and on pull requests) | **IMPLEMENTED AND VERIFIED** (one successful run observed) |
| Policy rules in `AGENTS.md` section 10 | **IMPLEMENTED AND VERIFIED** as text; compliance is by human and agent discipline |
| `feat/console` integration branch | **IMPLEMENTED AND VERIFIED** (branch exists) |
| Console scaffold and frozen contract `console/contract/sandbox-api.ts` (Phase 0) | **IMPLEMENTED BUT NOT YET VERIFIED** (in progress on `feat/console`) |
| Sandbox security model (section 5) | **PLANNED** |
| CI coverage of `console/` | **PLANNED** |
| GitHub branch protection / rulesets on `main` | **PLANNED** (not configured) |
| Railway watch paths | **PLANNED** (not configured, not verified) |
| Automatic invocation of the workspace check (hook or CI) | **PLANNED** (today it is run manually) |

## 1. Objective

Let several AI agents build the web console in parallel without corrupting the production backend or each
other's work. The harness combines three things: physical isolation (git worktrees), explicit ownership of
files (one table, one checker) and human approval at every irreversible step.

## 2. Coordination architecture

One orchestrator (Claude) plans the work, launches each writer (a Claude Sonnet sub-agent) into a specific
worktree, collects its report and integrates. Writers never talk to each other; they communicate only through
the contract and the orchestrator. Orca is the developer environment, not the isolation mechanism.

```
                    Human (approval gates)
                            |
                      Orchestrator
        +--------+----------+----------+---------+
       WS1      WS2        WS3        WS4      harness
   console/ui  console/   console/   feat/     chore/agent-
     -shell    bff-sandbox features  console   harness
        \         |          |         /
         +--------+----------+--------+
                  integrate into feat/console
                            |
              (human approval) -> main
```

## 3. Isolation via git worktrees

Layout: main checkout on `main`; `../frontier-worktrees/integration` on `feat/console`;
`../frontier-worktrees/harness` on `chore/agent-harness`. Each worktree installs its own `node_modules`.

**Orca finding (observed).** `orca worktree create --repo name:frontier-reto-2 --name isolation-probe
--base-branch feat/console --setup skip` registered a workspace whose `path` was the main checkout folder
itself, and `git worktree list` showed no new worktree. Orca workspaces for this repo therefore do not
isolate files, so they are not used for isolation.

**Plain git worktree probe (observed).** In a probe worktree created with
`git worktree add -b probe/isolation ../frontier-worktrees/probe feat/console`:
- a new file was not visible in the main checkout (`ls` answered "No such file");
- main `git status --short` showed 0 changes;
- the probe commit `fa98c20` was visible from the main repo as a branch;
- the probe had no `node_modules`, so each worktree installs its own;
- the probe worktree and branch were removed afterwards.

## 4. Responsibilities and file ownership

Source of truth: `OWNERSHIP` and `PROTECTED` in `scripts/check-workspace.ts`.

| WS | Role | Branch | Exclusive ownership |
|---|---|---|---|
| WS1 | Frontend/UX | `console/ui-shell` | `console/web/app/**`, `console/web/components/**`, `console/web/styles/**` |
| WS2 | BFF/Sandbox | `console/bff-sandbox` | `console/server/**` |
| WS3 | Features/Data | `console/features` | `console/web/features/**`, `console/web/api/**` |
| WS4 | Integration/QA | `feat/console` | `console/package.json`, `console/package-lock.json`, `console/tsconfig*.json`, `console/vite.config.ts`, `console/vitest.config.*`, `console/web/index.html`, `console/web/main.tsx`, `console/contract/**`, `console/specs/**`, `console/.gitignore` |
| harness | Agent harness | `chore/agent-harness` | `AGENTS.md`, `docs/agent-harness.md`, `scripts/check-workspace.ts`, `test/check-workspace.test.ts` |
| Nobody (protected) | — | — | `src/**`, root `test/**` (except the harness test), `docs/*.pdf`, `docs/system-design*`, `docs/architecture*`, `docs/specification.md`, `experimentos.jsonl`, `pruebas/**`, `railway.json`, root `package.json`, `package-lock.json`, `.github/**`, `README.md` |

Status: table and checker **IMPLEMENTED AND VERIFIED**; the console workspaces themselves are **PLANNED**
until their first integration.

## 5. Shared contracts

`console/contract/sandbox-api.ts` is the single contract between frontend, features and BFF. It is frozen in
Phase 0 (before parallel work) and changed only by WS4 with human approval.
Status: **IMPLEMENTED BUT NOT YET VERIFIED** (Phase 0 is in progress on `feat/console`).

Sandbox security model — **PLANNED** (nothing below is implemented or verified yet):
- random session ids;
- a per-session replica bound to loopback, reached through a BFF-generated internal token that is never sent
  to the browser;
- limits: 20 sessions, 30 min TTL, 4 KB request body, 2 KB forwarded body, 2 s timeout, 120 requests per
  minute per session;
- no Live mode;
- the original host (`ORIGINAL_HOST` in the code) is rejected.

## 6. Security guardrails and production protection

| Guardrail | Status |
|---|---|
| `src/**` untouched: `git diff main...HEAD -- src` empty (script step `backend-untouched`) | **IMPLEMENTED AND VERIFIED** |
| Protected paths cannot be changed by any workspace (step `protected-paths`) | **IMPLEMENTED AND VERIFIED** |
| Added lines scanned for bearer tokens, GitHub tokens, private key headers, team token assignments and the original host unless the line carries `ORIGINAL_HOST` (step `secrets-and-original-host`) | **IMPLEMENTED AND VERIFIED** (unit tests on the matchers; limited to these patterns) |
| Tokens only from environment or files outside the repo (`AGENTS.md` section 4) | **IMPLEMENTED AND VERIFIED** as policy |
| No calls to the original service without approval of the exact requests (`AGENTS.md` section 8) | policy, enforced by humans and agents |
| `main` protected by GitHub | **PLANNED**: `gh api repos/ROMEROLUIS15/frontier-blackbox-engine/branches/main` reports `protected: false` and there are 0 rulesets |

Until GitHub protection exists, "main is production" is a policy kept by humans and agents.

## 7. Quality gates

Before integrating a workspace, all of these exit 0:
1. workspace tests, typecheck and build (console tooling: **PLANNED**, arrives with the scaffold);
2. `node scripts/check-workspace.ts --workspace <ws>` (all lines `PASS`);
3. root `npm run verify` (typecheck + tests) — **IMPLEMENTED AND VERIFIED**.

The Definition of Done of `AGENTS.md` plus the gates above is the acceptance bar. Gates are currently run by
the writer and re-run by the orchestrator; no automation runs the workspace check (**PLANNED**).

## 8. Integration flow

1. Phase 0: WS4 scaffolds `console/` and freezes the contract on `feat/console` (checkpoint, human review).
2. Writers work in their own worktrees and branches.
3. Merge order into `feat/console`: WS2, then WS3, then WS1; gates after each merge.
4. Checkpoint after Phase 0 and after the first integration.
5. `feat/console` reaches `main` only with human approval.

Status: **PLANNED** (Phase 0 in progress).

## 9. Human-in-the-loop approval points

A human must explicitly approve:
- any push;
- any merge to `main`;
- any deploy, and any Railway change;
- consuming the hidden evaluation run;
- any edit outside a workspace's ownership;
- any request to the original service.

## 10. Agile practices and Git & CI/CD strategy

These are **agile practices inspired by Scrum**, not full Scrum: no formal events or roles are evidenced.
- Sprint Goal: one stated outcome per phase.
- Prioritized backlog: each item assigned to a WS.
- Acceptance criteria per item.
- Definition of Done: the `AGENTS.md` Definition of Done plus the gates of section 7.
- Checkpoints after Phase 0 and after the first integration.
- Blockers and risks are reported by the agent as soon as found, never worked around silently.
- Human review before anything leaves `feat/console`.

Git & CI/CD strategy:
- **Why protect `main`:** it is the branch the deployed backend is built from. Deployed commit: `a2620cc`.
  Whether pushes to `main` auto-redeploy is not verified, so the safe assumption is that they might.
- **Why worktrees:** the probe showed real file isolation; Orca workspaces showed none.
- **Why `feat/console` replaces `develop`:** it is a short-lived integration branch for one effort, created
  from `main` at `6d66b2b`, avoiding a permanent second long-lived branch.
- **Review:** every change is reviewed by the orchestrator against the gates and by a human before `main`.
- **Mandatory tests:** root `npm run verify` and the workspace check. Backend CI (`.github/workflows/ci.yml`)
  runs `npm ci` + `npm run verify` on push to `main` and on pull requests; it does not cover `console/` yet
  (**PLANNED**).
- **Avoiding accidental Railway deploys:** do not merge or push to `main` until after the final evaluation.
  Railway watch paths are **PLANNED** and not verified.
- **Opening a PR to `main` requires:** all gates green, ownership check `PASS`, human approval. Approval is
  enforced by people; GitHub-enforced protection is **PLANNED**, not configured.

## 11. Risks, limitations, future improvements

- Ownership is checked by path prefix only; it does not review semantics inside an owned file.
- The secret scan covers a short list of patterns and can miss other secret formats.
- The check runs on demand; an agent can skip it. Mitigation: orchestrator re-runs it.
- The check compares against `feat/console` by default; a stale local branch changes the diff.
- Protection of `main` and deploy safety depend on discipline until GitHub protection and Railway watch paths
  exist.
- Phase 0 results are unknown at the time of writing.

Future improvements (all **PLANNED**): GitHub branch protection and required status checks; CI job that runs
the workspace check and the console tests; Railway watch paths restricted to backend files; a pre-push hook
running the check.

## 12. Evidence

Observed before this document was written:
- `gh api repos/ROMEROLUIS15/frontier-blackbox-engine/branches/main --jq '{protected}'` → `{"protected":false}`; rulesets → `0`.
- CI run `38073388174` on commit `a2620cc` → `success`.
- Root `npm run verify` before the harness → `tests 29 · pass 29 · fail 0`.
- Orca workspace and probe worktree observations: section 3.
- Branch `feat/console` created from `main` at `6d66b2b`.

Observed while building the harness (worktree `chore/agent-harness`):
- `npm run verify` with the harness test → `tests 40 · pass 40 · fail 0`, typecheck clean.
- `node scripts/check-workspace.ts --workspace harness` → `PASS ownership`, `PASS protected-paths`,
  `PASS backend-untouched`, `PASS secrets-and-original-host`.
- Final results and the commit hash are listed in the delivery report of the commit that adds this file.
