"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";

/**
 * A glass sphere lit from the upper left, with a lavender rim. Pure CSS, decorative.
 * Place inside a `relative overflow-hidden` parent.
 */
export function Orb({ className, size = 240 }: { className?: string; size?: number }) {
  return (
    <span
      aria-hidden
      className={cn("pointer-events-none absolute rounded-full", className)}
      style={{
        width: size,
        height: size,
        background:
          "radial-gradient(circle at 32% 28%, rgb(244 236 255 / 0.95) 0%, rgb(197 167 255 / 0.8) 9%, rgb(150 63 255 / 0.75) 30%, rgb(70 22 170 / 0.85) 58%, rgb(26 9 64 / 0.95) 78%)",
        boxShadow:
          "inset -18px -24px 50px rgb(8 4 22 / 0.75), inset 6px 8px 24px rgb(229 214 255 / 0.25), 0 30px 80px -20px rgb(150 63 255 / 0.65)",
      }}
    />
  );
}

/**
 * The landing centrepiece: a sphere of light particles that slowly turns and leans toward
 * the pointer. Pauses off-screen; renders one still frame under reduced motion.
 */
export function ParticleSphere({ className, count = 3600 }: { className?: string; count?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Fibonacci sphere: evenly spread points.
    const pts: Array<[number, number, number]> = [];
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < count; i++) {
      const y = 1 - (i / (count - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const t = golden * i;
      pts.push([Math.cos(t) * r, y, Math.sin(t) * r]);
    }

    let w = 0;
    let h = 0;
    let dpr = 1;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = rect.width;
      h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(() => {
      resize();
      if (reduce) draw();
    });
    ro.observe(canvas);

    let tiltX = 0.35;
    let tiltTarget = 0.35;
    let leanY = 0;
    let leanTarget = 0;
    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width - 0.5;
      const ny = (e.clientY - rect.top) / rect.height - 0.5;
      leanTarget = Math.max(-0.5, Math.min(0.5, nx)) * 0.6;
      tiltTarget = 0.35 + Math.max(-0.5, Math.min(0.5, ny)) * 0.2;
    };
    if (!reduce) window.addEventListener("pointermove", onMove, { passive: true });

    let raf = 0;
    let running = false;
    let visible = true;
    let angle = 0.6;
    let last = performance.now();

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const R = w * 0.495;
      const cx = w / 2;
      const cy = h / 2;
      const cosA = Math.cos(angle + leanY);
      const sinA = Math.sin(angle + leanY);
      const cosT = Math.cos(tiltX);
      const sinT = Math.sin(tiltX);
      for (let i = 0; i < pts.length; i++) {
        const [px, py, pz] = pts[i];
        // rotate around Y, then tilt around X; near-orthographic so particles crowd the rim
        const x1 = px * cosA - pz * sinA;
        const z1 = px * sinA + pz * cosA;
        const y2 = py * cosT - z1 * sinT;
        const z2 = py * sinT + z1 * cosT;
        const sx = cx + x1 * R;
        const sy = cy - y2 * R;
        const depth = (z2 + 1) / 2; // 0 = far side, 1 = facing the viewer
        const rim = 1 - Math.abs(z2);
        // the near face carries volume (lit from the upper left), the far side stays faint, the silhouette glows
        const light = Math.max(0, -x1 * 0.35 + y2 * 0.45 + z2 * 0.6);
        const alpha = Math.min(0.95, 0.06 + depth * 0.32 + light * 0.3 + rim * rim * 0.5);
        const size = 0.7 + depth * 1.1 + rim * 0.5;
        ctx.fillStyle = rim > 0.82 || light > 0.75 ? `rgba(236,226,255,${alpha})` : `rgba(176,128,255,${alpha * 0.9})`;
        ctx.fillRect(sx, sy, size, size);
      }
    };

    const frame = (now: number) => {
      const dt = Math.min(now - last, 50);
      last = now;
      angle += dt * 0.00008;
      tiltX += (tiltTarget - tiltX) * 0.04;
      leanY += (leanTarget - leanY) * 0.04;
      draw();
      if (visible) raf = requestAnimationFrame(frame);
      else running = false;
    };
    const start = () => {
      if (running || reduce) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
    });
    io.observe(canvas);

    if (reduce) draw();
    else start();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
    };
  }, [count]);

  return <canvas ref={ref} aria-hidden className={cn("pointer-events-none block h-full w-full", className)} />;
}
