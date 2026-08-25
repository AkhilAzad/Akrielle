"use client";

import { motion, useReducedMotion, useTransform, type MotionValue } from "framer-motion";
import { HERO_PARTICLES } from "@/constants/landing";
import type { HeroParticle } from "@/types/landing";

interface ParticleFieldProps {
  /** Shared cursor motion values from the parent parallax hook. */
  x: MotionValue<number>;
  y: MotionValue<number>;
}

/**
 * A quiet field of drifting crimson/ember dust behind the face mesh.
 * Two motion layers per particle, kept deliberately separate:
 *  - an outer layer that nudges toward the cursor, scaled by a
 *    per-particle "depth" so smaller motes read as farther away
 *  - an inner layer that drifts and breathes on its own, forever,
 *    regardless of whether the cursor ever moves
 */
export function ParticleField({ x, y }: ParticleFieldProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      {HERO_PARTICLES.map((particle, index) => (
        <Particle
          key={particle.id}
          particle={particle}
          index={index}
          x={x}
          y={y}
          reduceMotion={!!shouldReduceMotion}
        />
      ))}
    </div>
  );
}

function Particle({
  particle,
  index,
  x,
  y,
  reduceMotion,
}: {
  particle: HeroParticle;
  index: number;
  x: MotionValue<number>;
  y: MotionValue<number>;
  reduceMotion: boolean;
}) {
  // Smaller / earlier particles sit "further back" and react less.
  const depth = 0.25 + (particle.size / 3) * 0.4;
  const cursorX = useTransform(x, (v) => v * depth * 0.5);
  const cursorY = useTransform(y, (v) => v * depth * 0.5);

  return (
    <motion.span
      className="absolute"
      style={{
        left: `${particle.x}%`,
        top: `${particle.y}%`,
        x: reduceMotion ? 0 : cursorX,
        y: reduceMotion ? 0 : cursorY,
      }}
    >
      <motion.span
        className="block rounded-full"
        style={{
          width: particle.size,
          height: particle.size,
          background: index % 3 === 0 ? "#DE1F35" : "#8E1420",
        }}
        animate={
          reduceMotion
            ? { opacity: 0.3 }
            : {
                x: [0, particle.driftX, 0],
                y: [0, particle.driftY, 0],
                opacity: [0.15, 0.65, 0.15],
              }
        }
        transition={
          reduceMotion
            ? undefined
            : {
                duration: particle.duration,
                delay: particle.delay,
                repeat: Infinity,
                ease: "easeInOut",
              }
        }
      />
    </motion.span>
  );
}
