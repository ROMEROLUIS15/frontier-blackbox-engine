import type { ReactNode } from "react";

export interface ButtonProps {
  variant: "primary" | "ghost";
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  children: ReactNode;
}

const BASE_STYLE =
  "inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition duration-150 ease-out enabled:hover:-translate-y-px enabled:active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-45";

const VARIANT_STYLE = {
  primary:
    "bg-accent text-canvas shadow-[0_0_0_1px_rgb(255_255_255/0.12)_inset,0_6px_20px_-6px_var(--color-accent)] enabled:hover:brightness-110",
  ghost: "border border-border bg-surface-raised/40 text-text enabled:hover:border-accent/60 enabled:hover:bg-surface-raised",
} as const;

/**
 * Action button. "primary" is the single main action of a Panel; "ghost" is secondary.
 * Defaults to type="button" so it never submits a form by accident.
 */
export function Button({ variant, onClick, type = "button", disabled = false, children }: ButtonProps) {
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${BASE_STYLE} ${VARIANT_STYLE[variant]}`}>
      {children}
    </button>
  );
}
