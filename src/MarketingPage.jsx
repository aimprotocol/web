import { useState, useEffect, useRef, useCallback } from "react";

/* ═══════════════════════════════════════════
   DESIGN: Cinematic dark, the beacon is the HERO.
   Think: a sci-fi artifact floating in space.
   Font: Instrument Serif (editorial drama) + Space Mono (technical credibility)
   ═══════════════════════════════════════════ */

const C = {
  bg: "#050507",
  surface: "#0d0d12",
  surfaceLight: "#141419",
  border: "#1e1e2a",
  accent: "#7c6aef",
  accentBright: "#b4a7ff",
  accentDim: "#5b4cc4",
  green: "#3de8a0",
  amber: "#f5c842",
  cyan: "#4adef0",
  pink: "#e86cb4",
  text: "#dcdde3",
  textDim: "#8e90a0",
  textMuted: "#555666",
  white: "#f0f0f4",
};

/* ═══════════════════════════════════════════
   THE BEACON — large, cinematic, alive
   ═══════════════════════════════════════════ */
function bHash(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function HeroBeacon({ size = 320, grid = 28 }) {
  const ref = useRef(null);
  const tick = useRef(0);
  const manifest = JSON.stringify({
    v: "0.1", page: "AgentBeacon", elements: 6,
    fields: ["name", "email", "company", "plan", "terms", "submit"],
    ts: "live",
  });

  useEffect(() => {
    const cvs = ref.current;
    if (!cvs) return;
    const ctx = cvs.getContext("2d");
    const cell = size / grid;
    let raf;

    const paint = () => {
      tick.current++;
      const t = tick.current;

      for (let i = 0; i < grid * grid; i++) {
        const ci = i % manifest.length;
        const cc = manifest.charCodeAt(ci);
        const s = bHash(`${cc}-${i}-${Math.floor(t / 5)}`);

        const wx = Math.sin(t * 0.06 + (i % grid) * 0.2) * 20;
        const wy = Math.cos(t * 0.05 + Math.floor(i / grid) * 0.18) * 15;
        const pulse = Math.sin(t * 0.03 + i * 0.01) * 0.3 + 0.7;

        const r = ((cc * 5 + s * 2 + t) % 150 + 30 + wx) * pulse | 0;
        const g = ((cc * 9 + s * 4 + i * 2) % 120 + 20 + wy) * pulse | 0;
        const b = ((cc * 13 + s * 6 + t * 0.7) % 200 + 55) * pulse | 0;

        ctx.fillStyle = `rgb(${Math.max(0, Math.min(255, r))},${Math.max(0, Math.min(255, g))},${Math.max(0, Math.min(255, b))})`;
        ctx.fillRect((i % grid) * cell, Math.floor(i / grid) * cell, cell, cell);
      }
      raf = requestAnimationFrame(paint);
    };
    paint();
    return () => cancelAnimationFrame(raf);
  }, [size, grid, manifest]);

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <div style={{
        position: "absolute", inset: -40, borderRadius: 30,
        background: `radial-gradient(circle, ${C.accent}18 0%, transparent 70%)`,
        filter: "blur(30px)", pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", inset: -20, borderRadius: 20,
        background: `radial-gradient(circle, ${C.accentBright}10 0%, transparent 60%)`,
        filter: "blur(15px)", pointerEvents: "none",
      }} />

      <canvas
        ref={ref} width={size} height={size}
        style={{
          borderRadius: 16, imageRendering: "pixelated",
          boxShadow: `
            0 0 40px ${C.accent}40,
            0 0 80px ${C.accent}20,
            0 0 160px ${C.accent}10,
            inset 0 0 30px ${C.accent}15
          `,
          position: "relative", zIndex: 1,
        }}
      />

      {[
        { top: -4, left: -4 }, { top: -4, right: -4 },
        { bottom: -4, left: -4 }, { bottom: -4, right: -4 },
      ].map((pos, i) => (
        <div key={i} style={{
          position: "absolute", width: 8, height: 8, ...pos,
          border: `1.5px solid ${C.accentBright}55`, zIndex: 2,
          borderRadius: i === 0 ? "4px 0 0 0" : i === 1 ? "0 4px 0 0" : i === 2 ? "0 0 0 4px" : "0 0 4px 0",
          borderRight: i === 0 || i === 2 ? "none" : undefined,
          borderLeft: i === 1 || i === 3 ? "none" : undefined,
          borderBottom: i === 0 || i === 1 ? "none" : undefined,
          borderTop: i === 2 || i === 3 ? "none" : undefined,
        }} />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════
   SMALL BEACON for section accents
   ═══════════════════════════════════════════ */
export function MiniBeacon({ size = 48, grid = 8 }) {
  const ref = useRef(null);
  const tick = useRef(0);

  useEffect(() => {
    const cvs = ref.current;
    if (!cvs) return;
    const ctx = cvs.getContext("2d");
    const cell = size / grid;
    let raf;
    const paint = () => {
      tick.current++;
      const t = tick.current;
      for (let i = 0; i < grid * grid; i++) {
        const wave = Math.sin(t * 0.08 + i * 0.3) * 0.4 + 0.6;
        const r = (Math.sin(t * 0.05 + i * 0.2) * 60 + 100) * wave | 0;
        const g = (Math.sin(t * 0.04 + i * 0.15) * 50 + 70) * wave | 0;
        const b = (Math.sin(t * 0.06 + i * 0.25) * 80 + 160) * wave | 0;
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect((i % grid) * cell, Math.floor(i / grid) * cell, cell, cell);
      }
      raf = requestAnimationFrame(paint);
    };
    paint();
    return () => cancelAnimationFrame(raf);
  }, [size, grid]);

  return (
    <canvas ref={ref} width={size} height={size} style={{
      borderRadius: 6, imageRendering: "pixelated",
      boxShadow: `0 0 16px ${C.accent}33`,
    }} />
  );
}
