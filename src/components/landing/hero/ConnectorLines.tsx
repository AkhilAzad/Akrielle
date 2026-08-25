"use client";

import { motion, useReducedMotion } from "framer-motion";
import { easeSignature } from "@/components/animations/variants";
import type { ScanLandmark } from "@/types/landing";

interface ConnectorLinesProps {
  landmarks: ScanLandmark[];
}

/**
 * Anchor point on the face silhouette each connector line originates
 * from — hand-placed to sit on the actual feature each reading
 * describes (brow line for face shape, cheek for undertone, eye for
 * eye shape, jaw for skin tone, chin for symmetry). Coordinates share
 * the same percentage frame as the landmark chips themselves, so a
 * straight line between the two always lands correctly regardless of
 * viewport size.
 */
const ANCHORS: Record<string, { x: number; y: number }> = {
  "face-shape": { x: 58.2, y: 21 },
  undertone: { x: 34.7, y: 47.8 },
  "eye-shape": { x: 62.6, y: 36.3 },
  "skin-tone": { x: 37.4, y: 52.2 },
  symmetry: { x: 50, y: 65.9 },
};

/**
 * Thin crimson threads linking each floating readout back to the point
 * on the face it's actually describing — the visual grammar of an
 * annotated diagram, not a HUD. Each line draws itself in exactly
 * when its chip arrives, then carries a single faint highlight that
 * travels the thread on a slow, continuous loop.
 */
export function ConnectorLines({ landmarks }: ConnectorLinesProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {landmarks.map((landmark) => {
        const anchor = ANCHORS[landmark.id];
        if (!anchor) return null;

        const d = `M${anchor.x},${anchor.y} L${landmark.x},${landmark.y}`;
        const length = Math.hypot(landmark.x - anchor.x, landmark.y - anchor.y);

        return (
          <g key={landmark.id}>
            <motion.path
              d={d}
              stroke="#DE1F35"
              strokeWidth={0.18}
              strokeOpacity={0.35}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.9, delay: landmark.delay, ease: easeSignature }}
            />

            {/* Anchor point on the face itself */}
            <motion.circle
              cx={anchor.x}
              cy={anchor.y}
              r={0.45}
              fill="#DE1F35"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 0.85, scale: 1 }}
              transition={{ duration: 0.4, delay: landmark.delay, ease: easeSignature }}
            />

            {/* A single bright highlight chasing itself along the
                thread, once it has fully drawn in. */}
            {!shouldReduceMotion && (
              <motion.path
                d={d}
                stroke="#F24858"
                strokeWidth={0.3}
                strokeLinecap="round"
                strokeDasharray={`${Math.max(length * 0.14, 2)} ${length}`}
                initial={{ strokeDashoffset: 0, opacity: 0 }}
                animate={{ strokeDashoffset: [0, -length * 2], opacity: [0, 0.9, 0] }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: landmark.delay + 0.9,
                }}
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}
