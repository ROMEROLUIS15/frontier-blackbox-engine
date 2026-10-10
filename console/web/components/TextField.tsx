export interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  monospace?: boolean;
  error?: string;
}

/**
 * Controlled single-line text input with label and optional inline error.
 * Use monospace for protocol messages.
 */
export function TextField({ label, value, onChange, placeholder, monospace = false, error }: TextFieldProps) {
  return (
    <label className="grid gap-1 text-xs text-text-muted">
      {label}
      <input
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={`rounded border border-border bg-surface-raised px-3 py-2 text-sm text-text ${monospace ? "font-mono" : "font-sans"}`}
      />
      {error !== undefined && <span className="text-danger">{error}</span>}
    </label>
  );
}
