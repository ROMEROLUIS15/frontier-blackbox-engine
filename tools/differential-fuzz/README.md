# Differential fuzzing tools

Small Python 3 scripts (standard library only) used to compare a target service with a local reference
replica. They are standalone: nothing in `src/` or `test/` imports them.

| File | Purpose |
|---|---|
| `fuzz.py` | Generates random stateful sequences (1-12 steps over the six commands, with edge values), sends each step to the target and to the reference replica, and compares the responses. |
| `probes.py` | Runs an explicit plan of probe sequences with the same comparison. |
| `analyze.py` | Clusters the differences found in a results file. |

## Usage

```bash
# Start the local reference replica first (see the repository README), then:
python tools/differential-fuzz/fuzz.py --target <BASE_URL> --target-token-file <PATH> \
  --ref http://127.0.0.1:3000 --ref-token <LOCAL_TOKEN> \
  --seqs 300 --seed 20261011 --log experimentos.jsonl --out results.jsonl

python tools/differential-fuzz/probes.py plan.json experimentos.jsonl results.jsonl \
  --target <BASE_URL> --target-token-file <PATH> --ref http://127.0.0.1:3000 --ref-token <LOCAL_TOKEN>

python tools/differential-fuzz/analyze.py results.jsonl 3
```

The token file is read from the path you pass; no path or credential is built into the scripts, and the token
value is never printed. The scripts stop on an infrastructure error header, a failed reset or repeated network
errors.

## Rules

- Every request sent to the target must be logged: pass `--log` so each one is appended to `experimentos.jsonl`
  (format: README, section "El log de experimentos").
- Send requests to the original service only with explicit approval of the requests and the volume.
- The replica must never call the original or another replica.
- Sequence names follow `s-fz-<seed>-<number>`; the experiment guide condenses these sequences into one table row
  each.
