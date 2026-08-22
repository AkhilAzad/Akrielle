"use client";

import { motion, useReducedMotion, useTransform } from "framer-motion";
import { SCAN_LANDMARKS } from "@/constants/landing";
import { useMouseParallax } from "@/hooks/useMouseParallax";
import { ParticleField } from "@/components/landing/hero/ParticleField";
import { ScanRings } from "@/components/landing/hero/ScanRings";
import { FaceMeshSvg } from "@/components/landing/hero/FaceMeshSvg";
import { ConnectorLines } from "@/components/landing/hero/ConnectorLines";
import { MetricChip } from "@/components/landing/hero/MetricChip";

/**
 * Alkline's signature hero visual — a cinematic AI face-scan of a
 * large, semi-transparent ivory/glass bust. Layout/composition is
 * unchanged from before (same grid position, same floating readout
 * cards); this pass enlarges the instrument, gives the sculpture a
 * grounding pedestal glow, and keeps the continuous, layered motion:
 * an idle breathing scale so the whole instrument feels "alive" at
 * rest, a soft illumination pulse timed to the scan beam, shared
 * cursor motion values threaded down to the particles / chips / mesh
 * so each layer parallaxes at its own depth instead of moving as one
 * flat plane, and thin gold connector lines tying each floating
 * readout back to the point on the bust it's actually describing.
 */
export function HeroVisual() {
  const shouldReduceMotion = useReducedMotion();
  const { ref, x, y } = useMouseParallax<HTMLDivElement>({
    strength: 10,
    disabled: !!shouldReduceMotion,
  });
  const rotateX = useTransform(y, (v) => -v * 0.5);
  const rotateY = useTransform(x, (v) => v * 0.5);

  return (
    <motion.div
      ref={ref}
      className="relative mx-auto aspect-square w-full max-w-[600px]"
      style={shouldReduceMotion ? undefined : { rotateX, rotateY, transformPerspective: 1000 }}
      animate={shouldReduceMotion ? undefined : { scale: [1, 1.012, 1] }}
      transition={shouldReduceMotion ? undefined : { duration: 7, repeat: Infinity, ease: "easeInOut" }}
      role="img"
      aria-label="Animated illustration of Alkline's AI facial analysis: a rotating scan of a glass bust identifying face shape, undertone, eye shape, skin tone, and symmetry"
    >
      {/* Pedestal glow — a soft ellipse of light beneath the bust so
          it reads as a sculpture on display rather than a flat
          cutout. Purely ambient; sits behind everything. */}
      <div
        className="pointer-events-none absolute inset-x-[12%] bottom-[6%] h-[14%] rounded-[100%]"
        style={{ background: "radial-gradient(ellipse, rgba(177,95,44,0.16) 0%, transparent 72%)" }}
        aria-hidden="true"
      />

      <ParticleField x={x} y={y} />
      <ScanRings />

      {/* Soft illumination pulse, timed loosely to the scan beam's
          period so the sweep reads as "lighting" the face rather
          than just a decorative line crossing it. */}
      {!shouldReduceMotion && (
        <motion.div
          className="pointer-events-none absolute inset-[18%] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(207,128,71,0.22) 0%, transparent 65%)",
          }}
          animate={{ opacity: [0.15, 0.45, 0.15] }}
          transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
          aria-hidden="true"
        />
      )}

      <div className="absolute inset-0 flex items-center justify-center">
        <FaceMeshSvg x={x} y={y} />
      </div>

      <ConnectorLines landmarks={SCAN_LANDMARKS} />

      {SCAN_LANDMARKS.map((landmark, index) => (
        <MetricChip key={landmark.id} landmark={landmark} index={index} mouseX={x} mouseY={y} />
      ))}
    </motion.div>
  );
}
