"use client";

import { motion } from "framer-motion";
import { cn } from "@/utils/utils";
import { fadeUpBlur, viewportOnce } from "@/components/animations/variants";

interface ProfileSectionProps {
  /** Small uppercase kicker above the title (optional). */
  eyebrow?: string;
  /** Section title — rendered as a medium h2, lighter than SectionHeading. */
  title: string;
  /** Optional supporting line under the title. */
  description?: string;
  /** Optional right-aligned control cluster (e.g. Edit / Save buttons). */
  action?: React.ReactNode;
  children: React.ReactNode;
  /** Extra classes for the outer card. */
  className?: string;
  /** Extra classes for the body wrapper (e.g. a grid layout). */
  bodyClassName?: string;
}

/**
 * A dashboard section card for the profile page.
 *
 * Deliberately lighter than the page's top-level `SectionHeading` (which runs
 * text-4xl/5xl): these editable panels sit inside the flow as self-contained
 * cards, so they use a medium h2 and the established surface-card treatment
 * (rounded-card + hairline border + subtle shadow) seen on results cards. The
 * optional `action` slot hosts an inline Edit/Save/Cancel cluster on the same
 * baseline as the title.
 */
export function ProfileSection({
  eyebrow,
  title,
  description,
  action,
  children,
  className,
  bodyClassName,
}: ProfileSectionProps) {
  return (
    <motion.section
      variants={fadeUpBlur}
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      className={cn(
        "rounded-card border border-line bg-surface p-6 shadow-subtle sm:p-8",
        className
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-col gap-2">
          {eyebrow && (
            <span className="eyebrow">
              <span className="eyebrow-dot" aria-hidden="true" />
              {eyebrow}
            </span>
          )}
          <h2 className="text-2xl font-medium tracking-tightest text-ink">
            {title}
          </h2>
          {description && (
            <p className="max-w-xl text-[15px] leading-relaxed text-ink-muted">
              {description}
            </p>
          )}
        </div>
        {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
      </div>

      <div className="my-6 hairline" aria-hidden="true" />

      <div className={bodyClassName}>{children}</div>
    </motion.section>
  );
}
