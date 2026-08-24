"use client";

import { useMemo } from "react";
import { MONTHS, YEAR_SPAN } from "@/constants/onboarding";
import type { DobValue } from "@/types/onboarding";
import { clampDob, daysInMonth } from "@/lib/onboarding/date";
import {
  WheelPicker,
  WHEEL_ITEM_REM,
  WHEEL_VISIBLE_ROWS,
  type WheelOption,
} from "@/components/onboarding/WheelPicker";

interface DobPickerProps {
  value: DobValue;
  onChange: (value: DobValue) => void;
}

const CENTER_OFFSET = (WHEEL_VISIBLE_ROWS - 1) / 2;

const columnLabel =
  "text-center text-[0.6875rem] font-medium uppercase tracking-widest2 text-ink-muted";

/**
 * Date-of-birth picker: three synchronized scroll wheels (day / month / year)
 * in the established Alkline surface-panel style. A single selection band and
 * shared edge fades span all three columns so they read as one control.
 *
 * The day wheel's range follows the selected month/year, and the day clamps
 * down if the current selection no longer exists (e.g. 31 → 30, or Feb 29 in a
 * non-leap year).
 */
export function DobPicker({ value, onChange }: DobPickerProps) {
  const currentYear = useMemo(() => new Date().getFullYear(), []);

  const dayCount = daysInMonth(value.month, value.year);

  const dayOptions = useMemo<WheelOption[]>(
    () =>
      Array.from({ length: dayCount }, (_, i) => ({
        label: String(i + 1),
        value: i + 1,
      })),
    [dayCount]
  );

  const monthOptions = useMemo<WheelOption[]>(
    () => MONTHS.map((label, i) => ({ label, value: i + 1 })),
    []
  );

  const yearOptions = useMemo<WheelOption[]>(
    () =>
      Array.from({ length: YEAR_SPAN + 1 }, (_, i) => {
        const year = currentYear - i;
        return { label: String(year), value: year };
      }),
    [currentYear]
  );

  const update = (patch: Partial<DobValue>) => {
    onChange(clampDob({ ...value, ...patch }));
  };

  return (
    <div className="rounded-card-sm border border-line bg-surface p-5 sm:p-6">
      <div className="grid grid-cols-[0.85fr_1.3fr_1fr] gap-2 sm:gap-3">
        <span className={columnLabel}>Day</span>
        <span className={columnLabel}>Month</span>
        <span className={columnLabel}>Year</span>
      </div>

      {/* Wheels row — position:relative anchors the shared selection band. */}
      <div className="relative mt-2">
        {/* One band spanning all three columns. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 z-10 rounded-control border-y border-ink/15 bg-paper/40"
          style={{
            top: `${CENTER_OFFSET * WHEEL_ITEM_REM}rem`,
            height: `${WHEEL_ITEM_REM}rem`,
          }}
        />

        <div className="grid grid-cols-[0.85fr_1.3fr_1fr] gap-2 sm:gap-3">
          <WheelPicker
            options={dayOptions}
            value={value.day}
            onChange={(day) => update({ day })}
            ariaLabel="Day of birth"
            decorations={false}
          />
          <WheelPicker
            options={monthOptions}
            value={value.month}
            onChange={(month) => update({ month })}
            ariaLabel="Month of birth"
            decorations={false}
          />
          <WheelPicker
            options={yearOptions}
            value={value.year}
            onChange={(year) => update({ year })}
            ariaLabel="Year of birth"
            decorations={false}
          />
        </div>
      </div>
    </div>
  );
}
