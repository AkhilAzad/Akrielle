"use client";

import { cn } from "@/utils/utils";

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Accessible label describing what the switch controls. */
  label: string;
  /** Optional supporting line shown under the label. */
  description?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * An accessible on/off switch built on a native button with role="switch".
 * Styled in the AXL vocabulary — accent track when on, hairline surface
 * track when off. Used for app/privacy preferences (e.g. "save photos").
 */
export function ToggleSwitch({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  className,
}: ToggleSwitchProps) {
  return (
    <div className={cn("flex items-center justify-between gap-5", className)}>
      <div className="flex min-w-0 flex-col gap-1">
        <span className="text-[15px] font-medium text-ink">{label}</span>
        {description && (
          <span className="text-sm leading-relaxed text-ink-muted">
            {description}
          </span>
        )}
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-7 w-12 shrink-0 items-center rounded-pill border transition-colors duration-300 ease-signature focus-visible:outline-none",
          checked
            ? "border-accent bg-accent"
            : "border-line bg-surface-2 hover:border-ink/30",
          disabled && "cursor-not-allowed opacity-50"
        )}
      >
        <span
          className={cn(
            "inline-block h-5 w-5 rounded-full bg-white shadow-subtle transition-transform duration-300 ease-signature",
            checked ? "translate-x-6" : "translate-x-1"
          )}
          aria-hidden="true"
        />
      </button>
    </div>
  );
}
