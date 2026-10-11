"""Run explicit probe sequences against a target service and a local reference replica; log every target request.

Usage:
  python probes.py plan.json experimentos.jsonl results.jsonl --target URL --target-token-file PATH \
                   --ref URL --ref-token TOKEN
Example target: the base URL of the service under study, such as https://service.example.test
plan.json: [{"seq": "...", "steps": [{"payload": "...", "hipotesis": "..."}]}]  (a logged reset precedes each seq)
The token value is never printed. Every request sent to the target is appended to the log file.
"""
import argparse, importlib.util, json, sys, time
from datetime import datetime, timezone
from pathlib import Path

spec = importlib.util.spec_from_file_location("fuzz", str(Path(__file__).with_name("fuzz.py")))
fz = importlib.util.module_from_spec(spec)
spec.loader.exec_module(fz)

ap = argparse.ArgumentParser()
ap.add_argument("plan")
ap.add_argument("log")
ap.add_argument("out")
ap.add_argument("--target", required=True)
ap.add_argument("--target-token-file", required=True)
ap.add_argument("--ref", required=True)
ap.add_argument("--ref-token", required=True)
a = ap.parse_args()
plan = json.load(open(a.plan, encoding="utf-8"))
log, out, ref, ref_tok, ORIG = Path(a.log), a.out, a.ref, a.ref_token, a.target
token = Path(a.target_token_file).read_text(encoding="utf-8").strip()
next_id = sum(1 for l in log.read_text(encoding="utf-8").splitlines() if l.strip()) + 1
res = open(out, "a", encoding="utf-8")
for p in plan:
    fz.call(ref, ref_tok, "/__reset", None)
    steps = [("/__reset", None, f"Reset previo de {p['seq']}")] + [
        ("/msg", {"m": f"{s['payload']};{fz.control(s['payload'])}"}, s["hipotesis"]) for s in p["steps"]]
    for path, body, hip in steps:
        time.sleep(0.25)
        st, h, text = fz.call(ORIG, token, path, body)
        if h.get("x-frontier-infra") or (path == "/__reset" and st != 200):
            sys.exit(f"STOP: {path} -> {st} infra={h.get('x-frontier-infra')}")
        rst, _, rtext = fz.call(ref, ref_tok, path, body)
        resp, rresp = fz.parse(text), fz.parse(rtext)
        same = st == rst and resp == rresp
        concl = "Coincide con la réplica." if same else f"Observado en el original. DIFERENCIA con la réplica ({rst} {json.dumps(rresp, ensure_ascii=False)})."
        xr = h.get("x-req")
        line = {"id": next_id, "seq": p["seq"], "x_req": int(xr) if xr and xr.isdigit() else xr, "hipotesis": hip,
                "method": "POST", "path": path, "auth": "team", "request": body, "status": st, "response": resp,
                "conclusion": concl, "version": "v2", "at": datetime.now(timezone.utc).isoformat(timespec="seconds")}
        with log.open("a", encoding="utf-8", newline="\n") as f:
            f.write(json.dumps(line, ensure_ascii=False) + "\n")
        res.write(json.dumps({"id": next_id, "seq": p["seq"], "request": body, "orig_status": st, "orig": resp,
                              "ref_status": rst, "ref": rresp, "same": same}, ensure_ascii=False) + "\n")
        print(f"X:{next_id} {p['seq']} {body['m'] if body else 'RESET'} -> orig {st} {json.dumps(resp, ensure_ascii=False)} | ref {rst} {'MATCH' if same else 'DIFF'}")
        next_id += 1
