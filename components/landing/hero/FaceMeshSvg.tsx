"use client";

import { motion, useReducedMotion, useTransform, type MotionValue } from "framer-motion";
import { easeSignature } from "@/components/animations/variants";

interface FaceMeshSvgProps {
  /** Shared cursor motion values — used for a small, local follow that
   *  layers on top of the parent visual's overall tilt. */
  x: MotionValue<number>;
  y: MotionValue<number>;
}

/** The five structural mesh lines — brow line, cheekbones, jaw, nose
 *  bridge — kept from the original mark as the "primary" wireframe.
 *  These carry the traveling shimmer and the brighter pulsing nodes,
 *  reading as the key landmarks the fine grid below supports. */
const MESH_LINES = [
  "M66 92L120 78L174 92",
  "M120 78L120 150",
  "M66 92L54 140L78 190L120 218L162 190L186 140L174 92",
  "M78 190L120 150L162 190",
  "M54 140L120 150L186 140",
];

const MESH_NODES: Array<[number, number]> = [
  [66, 92], [174, 92], [120, 78], [120, 150],
  [54, 140], [186, 140], [78, 190], [162, 190], [120, 218],
];

/**
 * The fine analysis grid — a dense field of facial landmarks (100+)
 * sampled on a regular lattice and masked to an ellipse roughly
 * matching the bust's face region. Generated once at module load
 * with plain arithmetic (no Math.random), so server and client
 * markup always match exactly. Rendered as static geometry: it
 * inherits life from the group's shared breathing/parallax motion
 * rather than animating 100+ elements individually.
 */
interface MeshPoint {
  x: number;
  y: number;
  row: number;
  col: number;
}

function buildFineMesh(): { points: MeshPoint[]; edges: Array<[MeshPoint, MeshPoint]> } {
  const cx = 120;
  const cy = 128;
  const rx = 72;
  const ry = 114;
  const dx = 15;
  const dy = 17;

  const points: MeshPoint[] = [];
  const lookup = new Map<string, MeshPoint>();

  for (let row = -7; row <= 7; row++) {
    for (let col = -5; col <= 5; col++) {
      const px = cx + col * dx;
      const py = cy + row * dy;
      const nx = (px - cx) / rx;
      const ny = (py - cy) / ry;
      if (nx * nx + ny * ny <= 1) {
        const point: MeshPoint = {
          x: Math.round(px * 10) / 10,
          y: Math.round(py * 10) / 10,
          row,
          col,
        };
        points.push(point);
        lookup.set(`${row}_${col}`, point);
      }
    }
  }

  const edges: Array<[MeshPoint, MeshPoint]> = [];
  points.forEach((p) => {
    const right = lookup.get(`${p.row}_${p.col + 1}`);
    if (right) edges.push([p, right]);
    const down = lookup.get(`${p.row + 1}_${p.col}`);
    if (down) edges.push([p, down]);
  });

  return { points, edges };
}

const FINE_MESH = buildFineMesh();

/**
 * AXL's signature visual: a large, semi-transparent ivory/glass
 * bust — gender-neutral, serene, sculptural — with a gold analysis
 * wireframe reading over it. Volume is faked with layered gradients
 * (a warm front glow, an offset shadow, a single rim highlight) since
 * the piece stays SVG/CSS rather than adding a WebGL dependency; real
 * depth comes from the parent's CSS 3D tilt (mouse parallax) plus this
 * group's own gentle breathing scale. The bust, its features, and the
 * mesh all draw themselves in once on mount, then settle into
 * continuous, independent life: nodes pulse on their own clocks, a
 * bright highlight travels each primary mesh line, and the whole
 * group breathes and gently tracks the cursor — never fully still.
 */
export function FaceMeshSvg({ x, y }: FaceMeshSvgProps) {
  const shouldReduceMotion = useReducedMotion();
  const followX = useTransform(x, (v) => v * 0.12);
  const followY = useTransform(y, (v) => v * 0.12);

  const draw = (delay: number, opacity = 0.9) => ({
    initial: { pathLength: 0, opacity: 0 },
    animate: { pathLength: 1, opacity },
    transition: { duration: 1.6, delay, ease: easeSignature },
  });

  return (
    <motion.div
      style={shouldReduceMotion ? undefined : { x: followX, y: followY }}
      animate={shouldReduceMotion ? undefined : { scale: [1, 1.02, 1], rotate: [0, 0.6, 0] }}
      transition={shouldReduceMotion ? undefined : { duration: 6.5, repeat: Infinity, ease: "easeInOut" }}
    >
      <svg
        viewBox="0 0 240 300"
        className="h-[70%] w-auto overflow-visible"
        fill="none"
        aria-hidden="true"
      >
        <defs>
          {/* Warm front glow — the sculpture's main volumetric fill,
              like light passing through frosted glass or ivory. */}
          <radialGradient id="faceGlow" cx="42%" cy="34%" r="72%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.55" />
            <stop offset="55%" stopColor="#F1F0EE" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#F1F0EE" stopOpacity="0" />
          </radialGradient>
          {/* A soft shadow offset to the lower-right, so the same
              single light source that creates the rim highlight also
              reads as gently modeling the far side of the face. */}
          <radialGradient id="faceShade" cx="70%" cy="74%" r="65%">
            <stop offset="0%" stopColor="#8D8D8D" stopOpacity="0.22" />
            <stop offset="60%" stopColor="#8D8D8D" stopOpacity="0.07" />
            <stop offset="100%" stopColor="#8D8D8D" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="bustGlow" x1="20%" y1="0%" x2="80%" y2="100%">
            <stop offset="0%" stopColor="#F1F0EE" stopOpacity="0.30" />
            <stop offset="100%" stopColor="#F1F0EE" stopOpacity="0.05" />
          </linearGradient>
          <filter id="softBlur" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="5" />
          </filter>
        </defs>

        {/* ---------- Bust: neck + shoulders ---------- */}
        {/* Drawn first, sits behind the head, extends past the
            nominal viewBox (svg has overflow-visible) so the piece
            reads as a bust cut at the chest, not a floating head. */}
        <motion.path
          d="M92 200C84 222 78 244 82 266C60 280 26 298 14 336L14 342L226 342L226 336C214 298 180 280 158 266C162 244 156 222 148 200C140 214 128 222 120 222C112 222 100 214 92 200Z"
          fill="url(#bustGlow)"
          stroke="none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.8, delay: 0.55, ease: easeSignature }}
        />
        <motion.path
          d="M92 200C84 222 78 244 82 266C60 280 26 298 14 336L14 342L226 342L226 336C214 298 180 280 158 266C162 244 156 222 148 200C140 214 128 222 120 222C112 222 100 214 92 200Z"
          stroke="#97501F"
          strokeWidth={1}
          strokeLinejoin="round"
          {...draw(0.3, 0.55)}
        />

        {/* ---------- Head ---------- */}
        {/* Soft volumetric fill — gives the face a quiet, translucent
            presence rather than pure line art, like a glass bust
            catching light. Fades in once the outline has drawn. */}
        <motion.path
          d="M120 10C168 10 198 52 198 108C198 176 162 250 120 250C78 250 42 176 42 108C42 52 72 10 120 10Z"
          fill="url(#faceGlow)"
          stroke="none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.8, delay: 0.5, ease: easeSignature }}
        />
        {/* Shadowed far side — offset radial, multiply-blended so it
            reads as volume rather than a flat tint. */}
        <motion.path
          d="M120 10C168 10 198 52 198 108C198 176 162 250 120 250C78 250 42 176 42 108C42 52 72 10 120 10Z"
          fill="url(#faceShade)"
          stroke="none"
          style={{ mixBlendMode: "multiply" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.8, delay: 0.6, ease: easeSignature }}
        />

        {/* Outline */}
        <motion.path
          d="M120 10C168 10 198 52 198 108C198 176 162 250 120 250C78 250 42 176 42 108C42 52 72 10 120 10Z"
          stroke="#97501F"
          strokeWidth={1.1}
          {...draw(0.2, 0.85)}
        />

        {/* Single rim highlight along the upper-left edge — the same
            light that casts faceShade catching the glass's rim,
            standing in for hair on this gender-neutral sculpture. */}
        {!shouldReduceMotion && (
          <motion.path
            d="M74 18Q46 52 43 96"
            stroke="#FFFFFF"
            strokeWidth={1.6}
            strokeLinecap="round"
            style={{ mixBlendMode: "screen" }}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: [0, 0.6, 0.35] }}
            transition={{ duration: 1.8, delay: 0.75, ease: easeSignature }}
          />
        )}

        {/* Specular highlight — a soft blurred glow near the temple,
            like studio light grazing a glass surface. Breathes on
            its own slow clock, independent of everything else. */}
        {!shouldReduceMotion && (
          <motion.ellipse
            cx={78}
            cy={112}
            rx={20}
            ry={30}
            fill="#FFFFFF"
            filter="url(#softBlur)"
            style={{ mixBlendMode: "screen" }}
            animate={{ opacity: [0.12, 0.32, 0.12] }}
            transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 1.6 }}
          />
        )}

        {/* Brows */}
        <motion.path
          d="M50 82Q66 71 84 80"
          stroke="#111111"
          strokeOpacity={0.32}
          strokeWidth={0.8}
          strokeLinecap="round"
          {...draw(0.9, 0.5)}
        />
        <motion.path
          d="M156 80Q174 71 190 82"
          stroke="#111111"
          strokeOpacity={0.32}
          strokeWidth={0.8}
          strokeLinecap="round"
          {...draw(0.95, 0.5)}
        />

        {/* Eyes — soft almond outlines, closed for a serene, resting
            expression rather than a stare. */}
        <motion.path
          d="M49 93Q66 84 83 93Q66 100 49 93Z"
          stroke="#111111"
          strokeOpacity={0.38}
          strokeWidth={0.75}
          {...draw(1.05, 0.55)}
        />
        <motion.path
          d="M157 93Q174 84 191 93Q174 100 157 93Z"
          stroke="#111111"
          strokeOpacity={0.38}
          strokeWidth={0.75}
          {...draw(1.1, 0.55)}
        />

        {/* Nose — a quiet bridge-to-base line, no harsh detail */}
        <motion.path
          d="M112 148Q120 155 128 148"
          stroke="#111111"
          strokeOpacity={0.28}
          strokeWidth={0.7}
          strokeLinecap="round"
          {...draw(1.15, 0.45)}
        />

        {/* Lips — two shallow curves, an elegant, closed rest */}
        <motion.path
          d="M96 191Q120 183 144 191"
          stroke="#111111"
          strokeOpacity={0.3}
          strokeWidth={0.75}
          strokeLinecap="round"
          {...draw(1.2, 0.5)}
        />
        <motion.path
          d="M99 193Q120 202 141 193"
          stroke="#111111"
          strokeOpacity={0.3}
          strokeWidth={0.75}
          strokeLinecap="round"
          {...draw(1.25, 0.5)}
        />

        {/* ---------- Golden facial mesh: fine grid (100+ landmarks) ---------- */}
        {/* Dense static lattice sitting behind the primary wireframe —
            reads as the full analysis field the AI is sampling. It
            moves only as part of the group's shared breathing/parallax,
            not individually, to keep 150+ elements light on the page. */}
        <g opacity={shouldReduceMotion ? 0.28 : 0.4}>
          {FINE_MESH.edges.map(([a, b], i) => (
            <line
              key={`edge-${a.row}-${a.col}-${b.row}-${b.col}-${i}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke="#B15F2C"
              strokeWidth={0.35}
              strokeOpacity={0.3}
            />
          ))}
          {FINE_MESH.points.map((p) => (
            <circle
              key={`pt-${p.row}-${p.col}`}
              cx={p.x}
              cy={p.y}
              r={0.85}
              fill="#B15F2C"
              fillOpacity={0.55}
            />
          ))}
        </g>

        {/* ---------- Golden facial mesh: primary wireframe ---------- */}
        {/* Triangulated mesh — brow line, cheekbones, jaw, nose bridge */}
        {MESH_LINES.map((d, i) => (
          <motion.path
            key={`base-${d}`}
            d={d}
            stroke="#B15F2C"
            strokeWidth={0.9}
            {...draw(0.7 + i * 0.15, 0.55)}
          />
        ))}

        {/* Traveling highlight per line — a short bright dash chasing
            itself along the same path, on an infinite loop, staggered
            so the shimmer never reads as one synchronized blink. */}
        {!shouldReduceMotion &&
          MESH_LINES.map((d, i) => (
            <motion.path
              key={`shimmer-${d}`}
              d={d}
              stroke="#CF8047"
              strokeWidth={1}
              strokeLinecap="round"
              strokeDasharray="10 120"
              initial={{ strokeDashoffset: 0, opacity: 0 }}
              animate={{ strokeDashoffset: [0, -260], opacity: [0, 0.8, 0] }}
              transition={{
                duration: 3.2 + i * 0.4,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 2.4 + i * 0.5,
              }}
            />
          ))}

        {/* Key landmark nodes — brighter and larger than the fine
            grid, each pulsing on its own independent clock once the
            entrance settles, so they read as the primary readings the
            floating cards are drawn from. */}
        {MESH_NODES.map(([cx, cy], i) => (
          <motion.g
            key={`${cx}-${cy}`}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 1.4 + i * 0.06, ease: easeSignature }}
          >
            <motion.circle
              cx={cx}
              cy={cy}
              fill="#B15F2C"
              animate={
                shouldReduceMotion
                  ? { r: 2.2, opacity: 0.9 }
                  : { r: [2.2, 3.4, 2.2], opacity: [0.9, 0.5, 0.9] }
              }
              transition={
                shouldReduceMotion
                  ? undefined
                  : {
                      duration: 2.2 + (i % 4) * 0.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 1.8 + i * 0.18,
                    }
              }
            />
          </motion.g>
        ))}
      </svg>
    </motion.div>
  );
}
