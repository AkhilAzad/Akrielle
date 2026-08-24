"use client";

import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Shared editable-field primitives for the profile dashboard cards.
 *
 * Styling is lifted straight from the sign-in form's `fieldClass` and the
 * profile history card's "View" pill, so the personal / appearance /
 * preferences cards all read as one consistent family without redesigning
 * anything elsewhere.
 */

/** Input / select styling, mirrored from app/signin/page.tsx. */
export const fieldClass =
  "w-full rounded-control border border-line bg-paper px-4 py-3 text-[15px] text-ink placeholder:text-ink-faint transition-colors duration-300 focus:border-accent focus-visible:outline-none";

/** Compact pill for the Edit / Cancel controls (matches ProfileHistoryCard). */
export const ghostPillClass =
  "inline-flex items-center gap-2 rounded-full border border-ink/20 px-5 py-2.5 text-sm font-medium text-ink transition-colors duration-300 hover:border-ink/50 focus-visible:outline-none disabled:opacity-50 disabled:pointer-events-none";

/** Compact filled pill for the primary Save control. */
export const solidPillClass =
  "inline-flex items-center gap-2 rounded-full bg-charcoal px-5 py-2.5 text-sm font-medium text-ivory transition-colors duration-300 hover:bg-black focus-visible:outline-none disabled:opacity-50 disabled:pointer-events-none";

/** A labeled, read-only value (view mode). Shows an em dash when unset. */
export function ReadField({ label, value }: { label: string; value: string }) {
  const shown = value && value.trim() ? value : "—";
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[0.6875rem] font-medium uppercase tracking-widest2 text-ink-faint">
        {label}
      </span>
      <span
        className={cn(
          "text-[15px]",
          shown === "—" ? "text-ink-faint" : "text-ink"
        )}
      >
        {shown}
      </span>
    </div>
  );
}

/** A labeled text input (edit mode). */
export function TextField({
  id,
  label,
  value,
  onChange,
  placeholder,
  maxLength,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-[0.6875rem] font-medium uppercase tracking-widest2 text-ink-faint"
      >
        {label}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className={fieldClass}
      />
    </div>
  );
}

/** A labeled native select with a custom chevron (edit mode). */
export function SelectField({
  id,
  label,
  value,
  onChange,
  options,
  placeholder = "Select…",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-[0.6875rem] font-medium uppercase tracking-widest2 text-ink-faint"
      >
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(fieldClass, "appearance-none pr-11")}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
          strokeWidth={1.6}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}

/** A labeled multi-select chip group (edit mode). */
export function ChipMultiSelect({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: readonly string[];
  selected: string[];
  onToggle: (option: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <span className="text-[0.6875rem] font-medium uppercase tracking-widest2 text-ink-faint">
        {label}
      </span>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isOn = selected.includes(option);
          return (
            <button
              key={option}
              type="button"
              aria-pressed={isOn}
              onClick={() => onToggle(option)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-pill border px-3.5 py-1.5 text-sm transition-colors duration-200 focus-visible:outline-none",
                isOn
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-line bg-paper text-ink-muted hover:border-ink/30"
              )}
            >
              {isOn && <Check className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />}
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}
