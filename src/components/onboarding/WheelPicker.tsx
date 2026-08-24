"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { cn } from "@/utils/utils";

/** One selectable row on the wheel. */
export interface WheelOption {
  label: string;
  value: number;
}

interface WheelPickerProps {
  options: WheelOption[];
  /** Currently-selected value (controlled). */
  value: number;
  onChange: (value: number) => void;
  ariaLabel: string;
  /**
   * Draw the built-in centre band. Off when a parent (e.g. DobPicker) draws
   * one shared band spanning several wheels.
   */
  decorations?: boolean;
  className?: string;
}

/** Visible rows; must be odd so one row sits dead-centre. */
export const WHEEL_VISIBLE_ROWS = 5;
const VISIBLE_ROWS = WHEEL_VISIBLE_ROWS;
const CENTER_OFFSET = (VISIBLE_ROWS - 1) / 2; // rows above/below centre
/** Row height in rem — scales with the app's adaptive root font-size. */
export const WHEEL_ITEM_REM = 2.75;
const ITEM_REM = WHEEL_ITEM_REM;
/** How long scrolling must be quiet before we treat it as settled. */
const SETTLE_MS = 110;

function clampIndex(index: number, length: number): number {
  if (index < 0) return 0;
  if (index > length - 1) return length - 1;
  return index;
}

/**
 * An iOS-style scroll wheel, built with nothing but native scrolling +
 * CSS scroll-snap (no picker dependency — npm is locked in this project).
 *
 * The centred row is the selection. We read it back from `scrollTop` once
 * scrolling settles, and drive the wheel programmatically when `value`
 * changes from outside (e.g. the day clamps when the month changes).
 *
 * Row height is measured from the live root font-size rather than hardcoded,
 * because Lumora's adaptive layout expresses everything in rem that scales
 * with the viewport — so the pixel height differs across breakpoints.
 */
export function WheelPicker({
  options,
  value,
  onChange,
  ariaLabel,
  decorations = true,
  className,
}: WheelPickerProps) {
  const scrollRef = useRef<HTMLUListElement>(null);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafId = useRef<number | null>(null);
  // Pixel height of one row under the current root font-size.
  const [itemPx, setItemPx] = useState(0);

  const selectedIndex = useMemo(() => {
    const i = options.findIndex((o) => o.value === value);
    return i === -1 ? 0 : i;
  }, [options, value]);

  // Live index of the centred row (for highlight); commits on settle.
  const [activeIndex, setActiveIndex] = useState(selectedIndex);

  // Measure row height on mount and whenever the viewport (hence rem) changes.
  useEffect(() => {
    const measure = () => {
      const rootPx = parseFloat(
        getComputedStyle(document.documentElement).fontSize || "16"
      );
      setItemPx(ITEM_REM * (Number.isFinite(rootPx) ? rootPx : 16));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Keep the wheel's scroll position in sync with the controlled value.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || itemPx <= 0) return;
    const target = selectedIndex * itemPx;
    if (Math.abs(el.scrollTop - target) > 1) {
      el.scrollTop = target; // instant — never fights the user's own scroll
    }
    setActiveIndex(selectedIndex);
  }, [selectedIndex, itemPx]);

  const commitFromScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || itemPx <= 0) return;
    const index = clampIndex(Math.round(el.scrollTop / itemPx), options.length);
    const snappedTop = index * itemPx;
    if (Math.abs(el.scrollTop - snappedTop) > 1) {
      el.scrollTop = snappedTop;
    }
    setActiveIndex(index);
    const next = options[index];
    if (next && next.value !== value) onChange(next.value);
  }, [itemPx, options, value, onChange]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || itemPx <= 0) return;
    // Cheap live highlight, throttled to a frame.
    if (rafId.current === null) {
      rafId.current = requestAnimationFrame(() => {
        rafId.current = null;
        const el2 = scrollRef.current;
        if (!el2) return;
        setActiveIndex(
          clampIndex(Math.round(el2.scrollTop / itemPx), options.length)
        );
      });
    }
    if (settleTimer.current) clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(commitFromScroll, SETTLE_MS);
  }, [itemPx, options.length, commitFromScroll]);

  useEffect(
    () => () => {
      if (settleTimer.current) clearTimeout(settleTimer.current);
      if (rafId.current !== null) cancelAnimationFrame(rafId.current);
    },
    []
  );

  const selectByIndex = useCallback(
    (index: number) => {
      const clamped = clampIndex(index, options.length);
      const next = options[clamped];
      if (next && next.value !== value) onChange(next.value);
    },
    [options, value, onChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          selectByIndex(selectedIndex - 1);
          break;
        case "ArrowDown":
          e.preventDefault();
          selectByIndex(selectedIndex + 1);
          break;
        case "Home":
          e.preventDefault();
          selectByIndex(0);
          break;
        case "End":
          e.preventDefault();
          selectByIndex(options.length - 1);
          break;
        default:
          break;
      }
    },
    [selectByIndex, selectedIndex, options.length]
  );

  const padRem = `${CENTER_OFFSET * ITEM_REM}rem`;
  const fade =
    "linear-gradient(to bottom, transparent 0%, #000 22%, #000 78%, transparent 100%)";

  return (
    <div
      className={cn("relative", className)}
      style={{ height: `${VISIBLE_ROWS * ITEM_REM}rem` }}
    >
      {decorations && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 z-10 border-y border-line"
          style={{ top: padRem, height: `${ITEM_REM}rem` }}
        />
      )}

      <ul
        ref={scrollRef}
        role="listbox"
        aria-label={ariaLabel}
        tabIndex={0}
        // Opt this native scroll container out of the app's Lenis smooth-scroll,
        // which otherwise hijacks wheel/touch globally and prevents the wheel
        // from scrolling under mouse-wheel or finger-swipe. (No-op without Lenis.)
        data-lenis-prevent
        onScroll={handleScroll}
        onKeyDown={handleKeyDown}
        className={cn(
          "h-full snap-y snap-mandatory overflow-y-auto overscroll-contain outline-none",
          "touch-pan-y [-ms-overflow-style:none] [scrollbar-width:none]",
          "[&::-webkit-scrollbar]:hidden"
        )}
        style={{
          scrollSnapType: "y mandatory",
          WebkitMaskImage: fade,
          maskImage: fade,
        }}
      >
        <li aria-hidden="true" style={{ height: padRem }} />
        {options.map((option, index) => {
          const isActive = index === activeIndex;
          return (
            <li
              key={option.value}
              role="option"
              aria-selected={index === selectedIndex}
              onClick={() => selectByIndex(index)}
              className={cn(
                "flex snap-center cursor-pointer select-none items-center justify-center",
                "font-display tracking-tightest transition-colors duration-200",
                isActive
                  ? "text-[1.35rem] font-medium text-ink"
                  : "text-[1.05rem] text-ink-faint"
              )}
              style={{ height: `${ITEM_REM}rem` }}
            >
              {option.label}
            </li>
          );
        })}
        <li aria-hidden="true" style={{ height: padRem }} />
      </ul>
    </div>
  );
}
