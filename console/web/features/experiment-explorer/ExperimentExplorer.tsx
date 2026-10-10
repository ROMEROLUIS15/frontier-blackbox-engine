import { useEffect, useState } from "react";
import type { ExperimentRecord } from "../../../contract/sandbox-api.ts";
import { listExperiments } from "../../api/sandbox-client.ts";
import { EmptyState, JsonViewer, StatusBadge, TextField } from "../../components/index.ts";
import { EXPERIMENT_SEQUENCES, filterExperiments } from "./experiment-filter.ts";

type LoadState = { phase: "loading" } | { phase: "failed"; message: string } | { phase: "loaded"; records: ExperimentRecord[] };

function ExperimentCard({ record }: { record: ExperimentRecord }) {
  return (
    <li className="grid gap-2 rounded border border-border bg-surface-raised p-3">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="font-mono text-text-muted">
          #{record.id} · {record.seq}
        </span>
        <StatusBadge status={record.status} />
      </div>
      <p className="text-sm text-text">
        <span className="text-text-muted">Hipótesis: </span>
        {record.hipotesis}
      </p>
      <div className="grid gap-2 md:grid-cols-2">
        <div className="grid gap-1">
          <p className="text-xs text-text-muted">Request</p>
          <JsonViewer value={record.request} />
        </div>
        <div className="grid gap-1">
          <p className="text-xs text-text-muted">Respuesta real</p>
          <JsonViewer value={record.response} />
        </div>
      </div>
      {record.conclusion !== null && (
        <p className="text-xs text-text-muted">
          Conclusión: <span className="text-text">{record.conclusion}</span>
        </p>
      )}
    </li>
  );
}

/** Prop-less. Read-only browser of the recorded experiments of the original service. */
export function ExperimentExplorer() {
  const [load, setLoad] = useState<LoadState>({ phase: "loading" });
  const [sequence, setSequence] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    listExperiments()
      .then(({ experiments }) => {
        if (!cancelled) setLoad({ phase: "loaded", records: experiments });
      })
      .catch(() => {
        if (!cancelled) setLoad({ phase: "failed", message: "No se pudieron cargar los experimentos." });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (load.phase === "loading") return <EmptyState title="Cargando experimentos…" />;
  if (load.phase === "failed") return <EmptyState title={load.message} />;

  const visible = filterExperiments(load.records, sequence, query);
  const chipClass = (active: boolean): string =>
    `rounded border px-2 py-1 font-mono text-xs ${active ? "border-accent text-accent" : "border-border text-text-muted"}`;

  return (
    <div className="grid gap-3">
      <p className="text-xs text-text-muted">
        Respuestas REALES registradas del servicio original (datos de solo lectura de experimentos.jsonl). No son llamadas en vivo.
      </p>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por secuencia">
        <button type="button" aria-pressed={sequence === null} className={chipClass(sequence === null)} onClick={() => setSequence(null)}>
          Todas
        </button>
        {EXPERIMENT_SEQUENCES.map((name) => (
          <button key={name} type="button" aria-pressed={sequence === name} className={chipClass(sequence === name)} onClick={() => setSequence(name)}>
            {name}
          </button>
        ))}
      </div>
      <TextField label="Buscar" value={query} onChange={setQuery} placeholder="hipótesis, mensaje, error…" />
      {visible.length === 0 ? (
        <EmptyState title="Sin resultados" hint="Prueba con otro filtro o búsqueda." />
      ) : (
        <ul className="grid gap-2">
          {visible.map((record) => (
            <ExperimentCard key={record.id} record={record} />
          ))}
        </ul>
      )}
    </div>
  );
}
