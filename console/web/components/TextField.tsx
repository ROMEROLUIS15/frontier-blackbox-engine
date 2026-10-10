import { useId } from "react";

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
  const inputId = useId();
  const errorId = `${inputId}-error`;
  const hasError = error !== undefined;
  return (
    <div className="grid gap-1.5">
      <label htmlFor={inputId} className="text-xs font-medium text-text-muted">
        {label}
      </label>
      <input
        id={inputId}
        value={value}
        placeholder={placeholder}
        aria-invalid={hasError}
        aria-describedby={hasError ? errorId : undefined}
        onChange={(event) => onChange(event.target.value)}
        className={`rounded-lg border bg-canvas/60 px-3 py-2 text-sm text-text transition placeholder:text-text-muted/60 hover:border-accent/50 focus:border-accent ${
          hasError ? "border-danger" : "border-border"
        } ${monospace ? "font-mono" : "font-sans"}`}
      />
      {hasError && (
        <span id={errorId} role="alert" className="text-xs text-danger">
          {error}
        </span>
      )}
    </div>
  );
}
