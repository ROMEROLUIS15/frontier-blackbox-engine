"""Differential fuzzer: random stateful sequences sent to a target (the original or a replica) and to a local
reference replica; every target request can be appended to experimentos.jsonl.

Usage:
  python fuzz.py --target URL --target-token-file PATH|--target-token-env NAME --ref URL --ref-token TOKEN
                 --seqs N --seed S [--log experimentos.jsonl] [--out results.jsonl] [--rps 4]
The token value is never printed. Stops on X-Frontier-Infra, a failed reset or 3 consecutive network errors.
"""
import argparse, json, os, random, sys, time, urllib.error, urllib.request
from datetime import datetime, timezone
from pathlib import Path

ARITY = {"PING": 0, "ALTA": 1, "CONSULTA": 1, "DEPOSITO": 2, "TRANSFER": 3, "ANULA": 1}
NAMES = ["Ana", "Beto", "Lucía", "Mateo", "Zoe", "ana", "Ana Maria", "X", "Ana2", "O'Neil", "José", "AB-1"]
EDGE_AMOUNTS = ["1", "50", "100", "999", "1000", "40000", "49999", "50000", "50001", "60000", "99999", "100000",
                "250000", "500000", "9999999999", "10000000000", "0", "-5", "0100", "1.5", "abc", "+5", " 5"]


def control(payload: str) -> int:
    digits = "".join(ch if ch.isdigit() else str(ord(ch) - 64) for ch in payload.upper() if ch.isdigit() or "A" <= ch <= "Z")
    r = 0
    for d in digits:
        r = (r * 10 + int(d)) % 97
    return 98 - (r * 100) % 97


class Gen:
    """Builds plausible banking sequences with a light model of what probably exists."""

    def __init__(self, rng: random.Random, profile: str = "base"):
        self.rng = rng
        self.hard = profile == "hard"

    def acc(self, n_acc: int) -> str:
        r = self.rng.random()
        if n_acc and r < 0.85:
            return f"AC-{self.rng.randint(1, n_acc):04d}"
        if r < 0.93:
            return f"AC-{n_acc + self.rng.randint(1, 3):04d}"  # not created yet
        return self.rng.choice(["ac-0001", "AC-1", "AC-00001", "AC-0000", "XX-0001"])

    def op(self, n_op: int) -> str:
        r = self.rng.random()
        if n_op and r < 0.85:
            return f"OP-{self.rng.randint(1, n_op):04d}"
        if r < 0.93:
            return f"OP-{n_op + self.rng.randint(1, 3):04d}"
        return self.rng.choice(["op-0001", "OP-1", "OP-0000", "AC-0001"])

    def amount(self, recent: list[int]) -> str:
        r = self.rng.random()
        if recent and r < 0.25:
            return str(self.rng.choice(recent))  # likely an exact balance or a repeated amount
        if r < 0.55:
            return self.rng.choice(EDGE_AMOUNTS)
        return str(self.rng.choice([self.rng.randint(1, 50000), self.rng.randint(1, 200000), self.rng.randint(1, 5000)]))

    def sequence(self) -> list[dict]:
        length = (self.rng.randint(6, 12) if self.hard and self.rng.random() < 0.85
                  else self.rng.choice([1, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 12]))
        n_acc = n_op = 0
        recent: list[int] = []
        steps = []
        for _ in range(length):
            cmd = self.rng.choices(["ALTA", "DEPOSITO", "TRANSFER", "ANULA", "CONSULTA", "PING", "MALFORMED"],
                                   ([16, 20, 30, 20, 11, 1, 2] if self.hard else [22, 20, 25, 13, 14, 2, 4]))[0]
            if n_acc == 0 and cmd in ("DEPOSITO", "TRANSFER", "CONSULTA") and self.rng.random() < 0.7:
                cmd = "ALTA"
            if cmd == "TRANSFER" and n_acc < 2 and self.rng.random() < 0.7:
                cmd = "ALTA" if n_acc < 2 and self.rng.random() < 0.6 else "DEPOSITO"
            if cmd == "ALTA":
                args = [self.rng.choice(["Ana", "Ana", "Beto", "Beto", "ana", "Lucía"] if self.hard else NAMES)]
                n_acc += 1  # optimistic: assume it succeeds
            elif cmd == "DEPOSITO":
                a = self.amount(recent)
                args = [self.acc(n_acc), a]
                n_op += 1
                if a.isdigit():
                    recent.append(int(a))
            elif cmd == "TRANSFER":
                src = self.acc(n_acc)
                dst = src
                if self.rng.random() >= 0.06:
                    for _ in range(5):
                        dst = self.acc(n_acc)
                        if dst != src:
                            break
                a = self.amount(recent)
                args = [src, dst, a]
                n_op += 1
            elif cmd == "ANULA":
                args = [self.op(n_op)]
            elif cmd == "CONSULTA":
                args = [self.acc(n_acc)]
            elif cmd == "PING":
                args = []
            else:
                steps.append(self.malformed(n_acc))
                continue
            name = cmd if self.rng.random() > 0.05 else cmd.lower()
            payload = ";".join([name] + args)
            ctl = str(control(payload))
            if self.rng.random() < 0.04:
                ctl = str((int(ctl) + self.rng.randint(1, 50)) % 99)
            steps.append({"m": f"{payload};{ctl}"})
        return steps

    def malformed(self, n_acc: int) -> dict:
        kind = self.rng.choice(["arity", "unknown", "empty", "badctl", "nosemi"])
        if kind == "arity":
            payload = self.rng.choice(["ALTA;Ana;Beto", "CONSULTA", "DEPOSITO;AC-0001", "TRANSFER;AC-0001;AC-0002",
                                       "ANULA;OP-0001;OP-0002", "PING;x"])
        elif kind == "unknown":
            payload = self.rng.choice(["SALDO;AC-0001", "DEPOSIT;AC-0001;100", "TRANSFERIR;AC-0001;AC-0002;5",
                                       "ANULAR;OP-0001", "CONSULTAR;AC-0001", "ALTAS;Ana", "BORRAR;AC-0001"])
        elif kind == "empty":
            payload = self.rng.choice(["ALTA;", "DEPOSITO;;100", "TRANSFER;AC-0001;;5", "ANULA;", ";CONSULTA"])
        elif kind == "badctl":
            payload = f"CONSULTA;{self.acc(n_acc)}"
            return {"m": f"{payload};{self.rng.choice(['X', '', '-1', '1000', '07'])}"}
        else:
            return {"m": self.rng.choice(["PING", "ALTA Ana", "", "CONSULTA AC-0001"])}
        return {"m": f"{payload};{control(payload)}"}


def call(base: str, token: str, path: str, body: dict | None):
    data = None if body is None else json.dumps(body, ensure_ascii=False).encode()
    req = urllib.request.Request(base + path, data=data, method="POST",
                                 headers={"Content-Type": "application/json", "Authorization": f"Bearer {token}"})
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            return r.status, {k.lower(): v for k, v in r.headers.items()}, r.read().decode()
    except urllib.error.HTTPError as e:
        return e.code, {k.lower(): v for k, v in e.headers.items()}, e.read().decode()


def parse(text: str):
    try:
        return json.loads(text)
    except ValueError:
        return text


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--target", required=True)
    ap.add_argument("--target-token-file")
    ap.add_argument("--target-token-env")
    ap.add_argument("--ref", required=True)
    ap.add_argument("--ref-token", required=True)
    ap.add_argument("--seqs", type=int, required=True)
    ap.add_argument("--seed", type=int, required=True)
    ap.add_argument("--start", type=int, default=1, help="first sequence number (for resuming)")
    ap.add_argument("--log")
    ap.add_argument("--out", required=True)
    ap.add_argument("--rps", type=float, default=4.0)
    ap.add_argument("--profile", default="base")
    a = ap.parse_args()
    token = (Path(a.target_token_file).read_text(encoding="utf-8").strip() if a.target_token_file
             else os.environ[a.target_token_env].strip())
    rng = random.Random(a.seed)
    gen = Gen(rng, a.profile)
    seqs = [gen.sequence() for _ in range(a.start - 1 + a.seqs)][a.start - 1:]
    log = Path(a.log) if a.log else None
    next_id = (sum(1 for l in log.read_text(encoding="utf-8").splitlines() if l.strip()) + 1) if log else 0
    delay = 1.0 / a.rps
    out = open(a.out, "a", encoding="utf-8")
    net_errors = diffs = total = 0
    for k, steps in enumerate(seqs, start=a.start):
        seq = f"s-fz-{a.seed}-{k:04d}"
        call(a.ref, a.ref_token, "/__reset", None)
        time.sleep(delay)
        st, h, text = call(a.target, token, "/__reset", None)
        if h.get("x-frontier-infra") or st != 200:
            sys.exit(f"STOP at {seq}: reset -> {st} infra={h.get('x-frontier-infra')}")
        rows = [("RESET", None, st, parse(text), 200, {"ok": True}, h.get("x-req"))]
        for body in steps:
            time.sleep(delay)
            try:
                st, h, text = call(a.target, token, "/msg", body)
                net_errors = 0
            except Exception as e:  # network
                net_errors += 1
                if net_errors >= 3:
                    sys.exit(f"STOP: network errors ({e!r})")
                continue
            if h.get("x-frontier-infra"):
                sys.exit(f"STOP at {seq}: infrastructure rate limit")
            rst, _, rtext = call(a.ref, a.ref_token, "/msg", body)
            rows.append(("MSG", body, st, parse(text), rst, parse(rtext), h.get("x-req")))
        for i, (kind, body, st, resp, rst, rresp, xreq) in enumerate(rows):
            same = st == rst and resp == rresp
            total += 1
            diffs += 0 if same else 1
            out.write(json.dumps({"seq": seq, "step": i, "kind": kind, "request": body, "orig_status": st,
                                  "orig": resp, "ref_status": rst, "ref": rresp, "same": same}, ensure_ascii=False) + "\n")
            if log:
                ref_txt = "" if same else f" DIFERENCIA con la réplica ({rst} {json.dumps(rresp, ensure_ascii=False)})."
                line = {"id": next_id, "seq": seq, "x_req": int(xreq) if xreq and str(xreq).isdigit() else xreq,
                        "hipotesis": ("Fuzz diferencial: reset previo de la secuencia" if kind == "RESET"
                                      else f"Fuzz diferencial, paso {i}: ¿el original y la réplica responden igual?"),
                        "method": "POST", "path": "/__reset" if kind == "RESET" else "/msg", "auth": "team",
                        "request": body, "status": st, "response": resp,
                        "conclusion": ("Coincide con la réplica." if same else "Observado en el original." + ref_txt),
                        "version": "v2", "at": datetime.now(timezone.utc).isoformat(timespec="seconds")}
                with log.open("a", encoding="utf-8", newline="\n") as f:
                    f.write(json.dumps(line, ensure_ascii=False) + "\n")
                next_id += 1
        out.flush()
        if k % 25 == 0:
            print(f"progress: {k - a.start + 1}/{a.seqs} seqs | lines {total} | diffs {diffs}", flush=True)
    print(f"DONE: seqs {a.seqs} | lines {total} | diffs {diffs}", flush=True)


if __name__ == "__main__":
    main()
