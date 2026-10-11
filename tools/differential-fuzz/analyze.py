"""Cluster differences from a fuzz results file. Usage: python analyze.py results.jsonl [max_examples]"""
import collections, json, sys

rows = [json.loads(l) for l in open(sys.argv[1], encoding="utf-8")]
max_ex = int(sys.argv[2]) if len(sys.argv) > 2 else 3
by_seq = collections.defaultdict(list)
for r in rows:
    by_seq[r["seq"]].append(r)


def cmd(r):
    m = (r["request"] or {}).get("m") if isinstance(r["request"], dict) else None
    return (m.split(";")[0].upper() if isinstance(m, str) and m else "RESET")


def label(status, body):
    if isinstance(body, dict) and "error" in body:
        return f"{status} {body['error']}" + (" +sug" if "sugerencia" in body else "")
    return f"{status} " + (",".join(sorted(body.keys())) if isinstance(body, dict) else repr(body)[:20])


diffs = [r for r in rows if not r["same"]]
first = {}
for seq, rs in by_seq.items():
    d = [r for r in rs if not r["same"]]
    if d:
        first[seq] = d[0]
print(f"lines {len(rows)} | diff lines {len(diffs)} | seqs {len(by_seq)} | seqs with a diff {len(first)}")
clusters = collections.defaultdict(list)
for seq, r in first.items():  # cluster by the FIRST divergence of each sequence (later ones may cascade)
    clusters[(cmd(r), label(r["orig_status"], r["orig"]), label(r["ref_status"], r["ref"]))].append((seq, r))
for key, items in sorted(clusters.items(), key=lambda kv: -len(kv[1])):
    print(f"\n[{len(items)}] cmd={key[0]} | original={key[1]} | replica={key[2]}")
    for seq, r in items[:max_ex]:
        ctx = [x["request"]["m"] for x in by_seq[seq][1:r["step"]] if isinstance(x["request"], dict)]
        print(f"  {seq} step {r['step']}: {r['request']}")
        print(f"     orig {r['orig_status']} {json.dumps(r['orig'], ensure_ascii=False)} | ref {r['ref_status']} {json.dumps(r['ref'], ensure_ascii=False)}")
        print(f"     before: {ctx}")
