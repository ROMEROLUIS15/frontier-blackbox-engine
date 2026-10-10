export interface JsonViewerProps {
  value: unknown;
}

/**
 * Read-only pretty JSON. Strings are rendered raw (the BFF returns raw text when the body is not JSON).
 */
export function JsonViewer({ value }: JsonViewerProps) {
  const text = typeof value === "string" ? value : (JSON.stringify(value, null, 2) ?? "");
  return <pre className="overflow-auto rounded border border-border bg-surface-raised p-3 font-mono text-xs text-text">{text}</pre>;
}
