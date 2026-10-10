import type { ReactNode } from "react";

export interface ButtonProps {
  variant: "primary" | "ghost";
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  children: ReactNode;
}

/**
 * Action button. "primary" is the single main action of a Panel; "ghost" is secondary.
 * Defaults to type="button" so it never submits a form by accident.
 */
export function Button({ variant, onClick, type = "button", disabled = false, children }: ButtonProps) {
  const tone = variant === "primary" ? "bg-accent text-canvas" : "bg-transparent text-text border border-border";
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`rounded px-3 py-1.5 text-sm disabled:opacity-50 ${tone}`}>
      {children}
    </button>
  );
}
