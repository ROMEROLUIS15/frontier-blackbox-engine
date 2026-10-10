import type { ArchitectureModule } from "./architectureModules.ts";

interface ModuleCardProps {
  module: ArchitectureModule;
  selected: boolean;
  onSelect: (id: string) => void;
}

/** Selectable node of the architecture diagram; hover and focus preview, click pins. */
export function ModuleCard({ module, selected, onSelect }: ModuleCardProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={() => onSelect(module.id)}
      onMouseEnter={() => onSelect(module.id)}
      onFocus={() => onSelect(module.id)}
      className={`w-full rounded-xl border px-4 py-3 text-left transition duration-150 hover:-translate-y-0.5 ${
        selected
          ? "border-accent/70 bg-accent/10 shadow-[0_0_28px_-10px_var(--color-accent)]"
          : "border-border bg-surface-raised/60 hover:border-accent/40"
      }`}
    >
      <span className="block font-mono text-sm font-semibold text-text">{module.name}</span>
      <span className="block text-xs text-text-muted">{module.role}</span>
    </button>
  );
}
