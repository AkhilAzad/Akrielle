"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Lumora's liquid cursor-reveal, ported to React.
 *
 * A base image sits underneath; a canvas on top paints a feathered brush
 * (radial-gradient stamps) onto a decaying alpha mask, and the "reveal" image
 * is composited through that mask (destination-in). The result: the pointer
 * wipes between two images, and the wipe slowly heals as the mask decays.
 *
 * The default image pair is Lumora's own hero before/after, so the effect
 * looks identical out of the box. Swap `baseSrc` / `revealSrc` for your own
 * before/after portrait (e.g. files placed in /public) when you have them.
 *
 * Under prefers-reduced-motion we render the base image only — no canvas,
 * no listeners — exactly as the original did.
 */
const ASSET_BASE_URL =
  "https://api.getlayers.ai/storage/v1/object/public/public/assets/lumora-e8b711fc68";

const BRUSH_RADIUS = 143;
const DECAY = 0.016;

interface LiquidRevealProps {
  baseSrc?: string;
  revealSrc?: string;
  alt?: string;
  className?: string;
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  w: number,
  h: number
) {
  const ir = img.width / img.height;
  const cr = w / h;
  let dw: number;
  let dh: number;
  if (ir > cr) {
    dh = h;
    dw = h * ir;
  } else {
    dw = w;
    dh = w / ir;
  }
  ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
}

export function LiquidReveal({
  baseSrc = `${ASSET_BASE_URL}/hero/after.jpg`,
  revealSrc = `${ASSET_BASE_URL}/hero/before.jpg`,
  alt = "",
  className,
}: LiquidRevealProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [reduced, setReduced] = useState(false);
  const [hinted, setHinted] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setReduced(true);
      return;
    }

    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const brush = document.createElement("canvas");
    const bctx = brush.getContext("2d");
    if (!bctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0;
    let H = 0;

    const revealImg = new Image();
    let revealReady = false;
    revealImg.onload = () => {
      revealReady = true;
    };
    revealImg.src = revealSrc;

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      W = Math.max(1, Math.round(rect.width * dpr));
      H = Math.max(1, Math.round(rect.height * dpr));
      canvas.width = W;
      canvas.height = H;
      brush.width = W;
      brush.height = H;
      bctx.clearRect(0, 0, W, H);
    };
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    const stamp = (cx: number, cy: number) => {
      const r = BRUSH_RADIUS * dpr;
      const g = bctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, "rgba(255,255,255,0.95)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      bctx.globalCompositeOperation = "source-over";
      bctx.fillStyle = g;
      bctx.beginPath();
      bctx.arc(cx, cy, r, 0, Math.PI * 2);
      bctx.fill();
    };

    const onMove = (e: PointerEvent) => {
      const rect = wrap.getBoundingClientRect();
      stamp((e.clientX - rect.left) * dpr, (e.clientY - rect.top) * dpr);
      setHinted(true);
    };
    wrap.addEventListener("pointermove", onMove, { passive: true });
    wrap.addEventListener("pointerdown", onMove, { passive: true });

    let raf = 0;
    const loop = () => {
      // Decay the mask so the reveal heals back to the base image.
      bctx.globalCompositeOperation = "destination-out";
      bctx.fillStyle = `rgba(0,0,0,${DECAY})`;
      bctx.fillRect(0, 0, W, H);
      bctx.globalCompositeOperation = "source-over";

      ctx.clearRect(0, 0, W, H);
      if (revealReady) {
        ctx.globalCompositeOperation = "source-over";
        drawCover(ctx, revealImg, W, H);
        ctx.globalCompositeOperation = "destination-in";
        ctx.drawImage(brush, 0, 0);
        ctx.globalCompositeOperation = "source-over";
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      wrap.removeEventListener("pointermove", onMove);
      wrap.removeEventListener("pointerdown", onMove);
    };
  }, [revealSrc]);

  return (
    <div
      ref={wrapRef}
      className={cn("relative overflow-hidden bg-surface", className)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={baseSrc}
        alt={alt}
        className="absolute inset-0 h-full w-full object-cover"
        draggable={false}
      />
      {!reduced && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full"
          aria-hidden="true"
        />
      )}
      {!reduced && !hinted && (
        <span className="pointer-events-none absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-pill bg-black/40 px-3 py-1.5 text-[0.6875rem] uppercase tracking-widest2 text-white/90 backdrop-blur-sm transition-opacity duration-500">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
          Move to reveal
        </span>
      )}
    </div>
  );
}
