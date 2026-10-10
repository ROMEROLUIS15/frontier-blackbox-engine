# Deploy (Railway, single instance)

## Build and start

- Builder: Railpack (`railway.json`), no Docker. Railway always builds with a Dockerfile when it finds one, so
  the repository must not contain a `Dockerfile`.
- Node version: `engines.node` = `24.x` in `package.json` (Railpack reads `engines.node`).
- Start command: `node src/main.ts` (no build step; Node 24 strips TypeScript types natively).
- No platform health check: like the original, `GET /health` requires the bearer token (401 E001 without it,
  experimentos.jsonl:13) and answers `200 {"ok":true}` with it (experimentos.jsonl:14).

## Environment variables

- `TEAM_TOKEN` (required): the only bearer token accepted. Set it as a Railway service variable; never commit it.
  The process exits with code 1 if it is missing.
- `PORT`: provided by Railway; defaults to `3000` locally. Must be an integer 1–65535, otherwise the process exits
  with code 1. The server binds `0.0.0.0`.

## Logs

- stdout: one JSON line per request: `{"level","method","path","status","ms"}` (no query string, headers or body).
- stderr: unexpected failures as `{"level":"error","method","path","error":<class name>}`.

## Single instance only

State lives in memory. Keep exactly ONE replica (README.md:135): several replicas would each hold a different
state and break request sequences. In the Railway service settings, check before going live:

- Replicas = 1, no autoscaling or multi-region replicas.
- App sleeping / serverless disabled: each step has 5 s to answer (README.md:117).

## Local run

```sh
TEAM_TOKEN=<token> npm start
```
