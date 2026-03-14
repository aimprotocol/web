import { useState, useEffect, useRef, useCallback } from "react";

/* ═══════════════════════════════════════════
   COLORS — matching the AIM marketing page
   ═══════════════════════════════════════════ */
const C = {
  bg: "#050507", surface: "#0d0d12", surfaceLight: "#141419",
  border: "#1e1e2a", accent: "#7c6aef", accentBright: "#b4a7ff",
  accentDim: "#5b4cc4", green: "#3de8a0", amber: "#f5c842",
  cyan: "#4adef0", pink: "#e86cb4", text: "#dcdde3",
  textDim: "#8e90a0", textMuted: "#555666", white: "#f0f0f4",
};

/* ═══════════════════════════════════════════
   BEACON RENDERERS — 4 visualization styles
   ═══════════════════════════════════════════ */
function bHash(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

function lerpColor(c1, c2, t) {
  return [
    Math.round(c1[0] + (c2[0] - c1[0]) * t),
    Math.round(c1[1] + (c2[1] - c1[1]) * t),
    Math.round(c1[2] + (c2[2] - c1[2]) * t),
  ];
}

// Style 1: Shimmer (default — the original)
function paintShimmer(ctx, grid, cell, t, colors) {
  const data = "aim-protocol-manifest-v01-shimmer";
  const [c1, c2, c3] = colors;
  for (let i = 0; i < grid * grid; i++) {
    const ci = i % data.length;
    const cc = data.charCodeAt(ci);
    const s = bHash(`${cc}-${i}-${Math.floor(t / 4)}`);
    const w = Math.sin(t * 0.12 + i * 0.25) * 0.15;
    const blend = (Math.sin(t * 0.04 + i * 0.08) + 1) / 2;
    const blend2 = (Math.cos(t * 0.03 + i * 0.12) + 1) / 2;
    const base = lerpColor(lerpColor(c1, c2, blend), c3, blend2);
    const noise = ((cc * 7 + s * 3) % 60 - 30);
    const r = Math.max(0, Math.min(255, base[0] * (0.4 + w) + noise));
    const g = Math.max(0, Math.min(255, base[1] * (0.35 + w) + noise * 0.7));
    const b = Math.max(0, Math.min(255, base[2] * (0.5 + w) + noise * 0.5));
    ctx.fillStyle = `rgb(${r | 0},${g | 0},${b | 0})`;
    ctx.fillRect((i % grid) * cell, Math.floor(i / grid) * cell, cell, cell);
  }
}

// Style 2: Prism — a pulsing triangle that breathes with color
function paintGeometric(ctx, grid, cell, t, colors) {
  const [c1, c2, c3] = colors;
  const cx = grid / 2;
  const cy = grid / 2;

  // Triangle vertices (rotates slowly)
  const angle = t * 0.015;
  const radius = grid * 0.42;
  const verts = [
    { x: cx + Math.cos(angle - Math.PI / 2) * radius, y: cy + Math.sin(angle - Math.PI / 2) * radius },
    { x: cx + Math.cos(angle + Math.PI * 2 / 3 - Math.PI / 2) * radius, y: cy + Math.sin(angle + Math.PI * 2 / 3 - Math.PI / 2) * radius },
    { x: cx + Math.cos(angle + Math.PI * 4 / 3 - Math.PI / 2) * radius, y: cy + Math.sin(angle + Math.PI * 4 / 3 - Math.PI / 2) * radius },
  ];

  // Point-in-triangle test using barycentric coords
  function inTriangle(px, py) {
    const d1 = (px - verts[1].x) * (verts[0].y - verts[1].y) - (verts[0].x - verts[1].x) * (py - verts[1].y);
    const d2 = (px - verts[2].x) * (verts[1].y - verts[2].y) - (verts[1].x - verts[2].x) * (py - verts[2].y);
    const d3 = (px - verts[0].x) * (verts[2].y - verts[0].y) - (verts[2].x - verts[0].x) * (py - verts[0].y);
    const hasNeg = (d1 < 0) || (d2 < 0) || (d3 < 0);
    const hasPos = (d1 > 0) || (d2 > 0) || (d3 > 0);
    return !(hasNeg && hasPos);
  }

  // Barycentric blend for color interpolation
  function baryBlend(px, py) {
    const v0x = verts[2].x - verts[0].x, v0y = verts[2].y - verts[0].y;
    const v1x = verts[1].x - verts[0].x, v1y = verts[1].y - verts[0].y;
    const v2x = px - verts[0].x, v2y = py - verts[0].y;
    const d00 = v0x * v0x + v0y * v0y;
    const d01 = v0x * v1x + v0y * v1y;
    const d02 = v0x * v2x + v0y * v2y;
    const d11 = v1x * v1x + v1y * v1y;
    const d12 = v1x * v2x + v1y * v2y;
    const inv = 1 / (d00 * d11 - d01 * d01 + 0.0001);
    const u = (d11 * d02 - d01 * d12) * inv;
    const v = (d00 * d12 - d01 * d02) * inv;
    const w = 1 - u - v;
    return [Math.max(0, Math.min(1, w)), Math.max(0, Math.min(1, v)), Math.max(0, Math.min(1, u))];
  }

  const pulse = Math.sin(t * 0.06) * 0.15 + 0.85;

  for (let i = 0; i < grid * grid; i++) {
    const x = i % grid;
    const y = Math.floor(i / grid);
    const inside = inTriangle(x + 0.5, y + 0.5);

    if (inside) {
      const [w1, w2, w3] = baryBlend(x + 0.5, y + 0.5);
      const r = (c1[0] * w1 + c2[0] * w2 + c3[0] * w3) * pulse;
      const g = (c1[1] * w1 + c2[1] * w2 + c3[1] * w3) * pulse;
      const b = (c1[2] * w1 + c2[2] * w2 + c3[2] * w3) * pulse;
      const shimmer = Math.sin(t * 0.2 + x * 0.4 + y * 0.3) * 15;
      ctx.fillStyle = `rgb(${Math.max(0, Math.min(255, (r + shimmer) | 0))},${Math.max(0, Math.min(255, (g + shimmer * 0.6) | 0))},${Math.max(0, Math.min(255, (b + shimmer * 0.3) | 0))})`;
    } else {
      // Dark background with subtle glow near edges
      const dist = Math.min(
        ...verts.map((v, vi) => {
          const nv = verts[(vi + 1) % 3];
          const edgeX = nv.x - v.x, edgeY = nv.y - v.y;
          const t2 = Math.max(0, Math.min(1, ((x - v.x) * edgeX + (y - v.y) * edgeY) / (edgeX * edgeX + edgeY * edgeY + 0.001)));
          const closestX = v.x + t2 * edgeX, closestY = v.y + t2 * edgeY;
          return Math.sqrt((x - closestX) ** 2 + (y - closestY) ** 2);
        })
      );
      const glow = Math.max(0, 1 - dist / 4) * pulse * 0.25;
      const avg = [(c1[0] + c2[0] + c3[0]) / 3, (c1[1] + c2[1] + c3[1]) / 3, (c1[2] + c2[2] + c3[2]) / 3];
      ctx.fillStyle = `rgb(${(avg[0] * glow) | 0},${(avg[1] * glow) | 0},${(avg[2] * glow) | 0})`;
    }
    ctx.fillRect(x * cell, y * cell, cell, cell);
  }
}

// Style 3: Wave — smooth flowing gradient waves
function paintWave(ctx, grid, cell, t, colors) {
  const [c1, c2, c3] = colors;
  for (let i = 0; i < grid * grid; i++) {
    const x = i % grid;
    const y = Math.floor(i / grid);
    const wave1 = Math.sin(x * 0.3 + t * 0.06) * 0.5 + 0.5;
    const wave2 = Math.cos(y * 0.25 + t * 0.05) * 0.5 + 0.5;
    const wave3 = Math.sin((x + y) * 0.2 + t * 0.04) * 0.5 + 0.5;
    const mixed = lerpColor(lerpColor(c1, c2, wave1), c3, wave2);
    const brightness = 0.3 + wave3 * 0.35;
    ctx.fillStyle = `rgb(${(mixed[0] * brightness) | 0},${(mixed[1] * brightness) | 0},${(mixed[2] * brightness) | 0})`;
    ctx.fillRect(x * cell, y * cell, cell, cell);
  }
}

// Style 4: Pulse — concentric rings radiating from center
function paintPulse(ctx, grid, cell, t, colors) {
  const [c1, c2, c3] = colors;
  const cx = grid / 2;
  const cy = grid / 2;
  for (let i = 0; i < grid * grid; i++) {
    const x = i % grid;
    const y = Math.floor(i / grid);
    const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
    const ring = Math.sin(dist * 0.8 - t * 0.1) * 0.5 + 0.5;
    const ring2 = Math.cos(dist * 0.5 - t * 0.07) * 0.5 + 0.5;
    const pick = ring > 0.6 ? c1 : ring2 > 0.5 ? c2 : c3;
    const brightness = 0.25 + ring * 0.25 + ring2 * 0.15;
    const noise = Math.sin(t * 0.2 + i * 0.1) * 10;
    ctx.fillStyle = `rgb(${Math.max(0, Math.min(255, (pick[0] * brightness + noise) | 0))},${Math.max(0, Math.min(255, (pick[1] * brightness + noise * 0.6) | 0))},${Math.max(0, Math.min(255, (pick[2] * brightness + noise * 0.3) | 0))})`;
    ctx.fillRect(x * cell, y * cell, cell, cell);
  }
}

const PAINTERS = { shimmer: paintShimmer, geometric: paintGeometric, wave: paintWave, pulse: paintPulse };

/* ═══════════════════════════════════════════
   BEACON PREVIEW COMPONENT
   ═══════════════════════════════════════════ */
function BeaconPreview({ colors, style, size = 160, grid = 20, showGlow = true }) {
  const ref = useRef(null);
  const tick = useRef(0);

  useEffect(() => {
    const cvs = ref.current;
    if (!cvs) return;
    const ctx = cvs.getContext("2d");
    const cell = size / grid;
    const rgbColors = colors.map(hexToRgb);
    const painter = PAINTERS[style] || PAINTERS.shimmer;
    let raf;
    const paint = () => {
      tick.current++;
      painter(ctx, grid, cell, tick.current, rgbColors);
      raf = requestAnimationFrame(paint);
    };
    paint();
    return () => cancelAnimationFrame(raf);
  }, [colors, style, size, grid]);

  return (
    <canvas ref={ref} width={size} height={size} style={{
      borderRadius: size > 80 ? 12 : 8,
      imageRendering: "pixelated",
      boxShadow: showGlow ? `0 0 30px ${colors[0]}55, 0 0 60px ${colors[0]}20` : `0 0 12px ${colors[0]}33`,
    }} />
  );
}

/* ═══════════════════════════════════════════
   COLOR PICKER
   ═══════════════════════════════════════════ */
function ColorPicker({ label, value, onChange }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const isValidHex = (v) => /^#[0-9a-fA-F]{6}$/.test(v);

  const commitDraft = () => {
    const normalized = draft.startsWith('#') ? draft : '#' + draft;
    if (isValidHex(normalized)) {
      onChange(normalized.toLowerCase());
    }
    setDraft(isValidHex(normalized) ? normalized.toLowerCase() : value);
    setEditing(false);
  };

  useEffect(() => { setDraft(value); }, [value]);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{
        width: 36, height: 36, borderRadius: 8, background: value,
        border: `2px solid ${C.border}`, cursor: "pointer", position: "relative",
        boxShadow: `0 0 12px ${value}44`, overflow: "hidden", flexShrink: 0,
      }}>
        <input type="color" value={value} onChange={e => onChange(e.target.value)}
          style={{
            position: "absolute", inset: -8, width: "calc(100% + 16px)",
            height: "calc(100% + 16px)", cursor: "pointer", opacity: 0,
          }} />
      </div>
      <div>
        <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12, color: C.text, fontWeight: 500 }}>{label}</div>
        {editing ? (
          <input
            type="text"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={commitDraft}
            onKeyDown={e => { if (e.key === 'Enter') commitDraft(); if (e.key === 'Escape') { setDraft(value); setEditing(false); } }}
            autoFocus
            spellCheck={false}
            style={{
              fontFamily: "'Space Mono', monospace", fontSize: 11, color: C.accentBright,
              background: C.surface, border: `1px solid ${C.accent}`, borderRadius: 4,
              padding: "2px 6px", width: 80, outline: "none",
            }}
          />
        ) : (
          <div
            onClick={(e) => { e.stopPropagation(); setEditing(true); }}
            style={{
              fontFamily: "'Space Mono', monospace", fontSize: 11, color: C.textMuted,
              cursor: "text", padding: "2px 0",
            }}
          >{value}</div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   STYLE SELECTOR
   ═══════════════════════════════════════════ */
function StyleSelector({ colors, selected, onSelect }) {
  const styles = [
    { id: "shimmer", name: "Shimmer", desc: "Organic, flowing data" },
    { id: "geometric", name: "Prism", desc: "Pulsing triangle" },
    { id: "wave", name: "Wave", desc: "Smooth gradients" },
    { id: "pulse", name: "Pulse", desc: "Radial rings" },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
      {styles.map(s => (
        <button key={s.id} onClick={() => onSelect(s.id)} style={{
          padding: 12, background: selected === s.id ? C.surfaceLight : C.surface,
          border: `2px solid ${selected === s.id ? C.accent : C.border}`,
          borderRadius: 12, cursor: "pointer", display: "flex",
          flexDirection: "column", alignItems: "center", gap: 8,
          transition: "all 0.25s",
        }}
          onMouseEnter={e => { if (selected !== s.id) e.currentTarget.style.borderColor = C.accent + "66"; }}
          onMouseLeave={e => { if (selected !== s.id) e.currentTarget.style.borderColor = C.border; }}
        >
          <BeaconPreview colors={colors} style={s.id} size={64} grid={12} showGlow={false} />
          <div>
            <div style={{
              fontFamily: "'Space Mono', monospace", fontSize: 11, fontWeight: 700,
              color: selected === s.id ? C.accentBright : C.text,
            }}>{s.name}</div>
            <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 10, color: C.textMuted }}>{s.desc}</div>
          </div>
        </button>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════
   ABOUT MODAL
   ═══════════════════════════════════════════ */
function AboutModal({ onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 100000,
        background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 16, maxWidth: 560, width: "100%", maxHeight: "80vh",
          overflow: "auto", padding: "32px 36px",
          boxShadow: `0 24px 80px rgba(0,0,0,0.5), 0 0 40px ${C.accent}11`,
        }}
      >
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "flex-start",
          marginBottom: 24,
        }}>
          <div>
            <h2 style={{
              fontFamily: "'Instrument Serif', serif", fontSize: 28, color: C.white,
              fontWeight: 400, letterSpacing: "-0.02em", marginBottom: 4,
            }}>What is AIM Protocol?</h2>
            <div style={{
              fontFamily: "'Space Mono', monospace", fontSize: 10, color: C.accent,
              letterSpacing: "0.1em", textTransform: "uppercase",
            }}>Agent Interaction Protocol</div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: "none", border: "none", color: C.textMuted, fontSize: 18,
              cursor: "pointer", padding: 4, lineHeight: 1, flexShrink: 0,
            }}
          >{'\u2715'}</button>
        </div>

        <div style={{
          fontFamily: "'Outfit', sans-serif", fontSize: 14, color: C.textDim,
          lineHeight: 1.7, display: "flex", flexDirection: "column", gap: 20,
        }}>
          <p style={{ color: C.text, fontSize: 15, fontWeight: 400 }}>
            AIM is an open standard that makes any website agent-ready. Instead of scraping
            your UI, AI agents get a structured manifest describing every interactive element
            on the page — instantly.
          </p>

          <div>
            <h3 style={{
              fontFamily: "'Space Mono', monospace", fontSize: 10, color: C.textMuted,
              letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8,
            }}>The Problem</h3>
            <ul style={{ paddingLeft: 18, display: "flex", flexDirection: "column", gap: 6 }}>
              <li>Full APIs are expensive to build and rarely cover all UI functionality</li>
              <li>Screen-scraping agents are slow, brittle, and compute-heavy</li>
              <li>There's no middle layer for agents to interact with arbitrary web pages</li>
              <li>When agents do work on websites, humans have zero visibility</li>
            </ul>
          </div>

          <div>
            <h3 style={{
              fontFamily: "'Space Mono', monospace", fontSize: 10, color: C.textMuted,
              letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8,
            }}>How It Works</h3>
            <p>
              Add one script tag to your site. The AgentBeacon auto-reads every page's
              interactive elements and generates a JSON manifest that any AIM-aware agent
              can consume. No APIs to build. No DOM scraping. No new language to learn.
            </p>
          </div>

          <div>
            <h3 style={{
              fontFamily: "'Space Mono', monospace", fontSize: 10, color: C.textMuted,
              letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8,
            }}>Why the Beacon?</h3>
            <p>
              The AgentBeacon is the human-facing signal — a small animated pixel grid that
              tells users "this page is agent-ready." Like router lights: not technically required,
              but you'd never trust a router without them. It gives you awareness when an agent
              is working on your behalf.
            </p>
          </div>

          <div>
            <h3 style={{
              fontFamily: "'Space Mono', monospace", fontSize: 10, color: C.textMuted,
              letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8,
            }}>Privacy</h3>
            <p>
              This script runs entirely in the browser. It does not transmit any data to any
              server, third party, or external service. No cookies, no network requests,
              no tracking. The beacon is purely visual.
            </p>
          </div>

          <div style={{
            padding: "14px 16px", background: C.bg, borderRadius: 8,
            border: `1px solid ${C.border}`, fontFamily: "'Space Mono', monospace",
            fontSize: 11, color: C.textMuted, fontStyle: "italic",
          }}>
            "AIM is the protocol. AgentBeacon is the heartbeat."
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   PRESET PALETTES
   ═══════════════════════════════════════════ */
const PRESETS = [
  { name: "AIM Default", colors: ["#6366f1", "#ec4899", "#06b6d4"] },
  { name: "Ember", colors: ["#ef4444", "#f97316", "#fbbf24"] },
  { name: "Forest", colors: ["#22c55e", "#059669", "#14b8a6"] },
  { name: "Ocean", colors: ["#3b82f6", "#6366f1", "#8b5cf6"] },
  { name: "Sunset", colors: ["#f43f5e", "#d946ef", "#8b5cf6"] },
  { name: "Monochrome", colors: ["#6b7280", "#9ca3af", "#d1d5db"] },
  { name: "Neon", colors: ["#22d3ee", "#a3e635", "#f472b6"] },
  { name: "Earth", colors: ["#b45309", "#92400e", "#78350f"] },
];

/* ═══════════════════════════════════════════
   MAIN GENERATOR
   ═══════════════════════════════════════════ */
export default function BeaconGenerator() {
  const [colors, setColors] = useState(["#6366f1", "#ec4899", "#06b6d4"]);
  const [style, setStyle] = useState("shimmer");
  const [size, setSize] = useState("md");
  const [position, setPosition] = useState("bottom-right");
  const [copied, setCopied] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  const sizeMap = { sm: "28px", md: "40px", lg: "56px" };

  const scriptTag = `<script src="https://aimprotocol.org/beacon.js"
  data-colors="${colors.join(",")}"
  data-style="${style}"
  data-size="${size}"
  data-position="${position}">
</script>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(scriptTag).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Space+Mono:wght@400;700&family=Outfit:wght@300;400;500;600;700&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: ${C.bg}; }
        ::selection { background: ${C.accent}44; color: ${C.white}; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 4px; }
      `}</style>

      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}

      <div style={{
        width: "100%", minHeight: "100vh", background: C.bg,
        display: "flex", flexDirection: "column", alignItems: "center",
      }}>
        {/* Top Bar */}
        <div style={{
          width: "100%", padding: "10px 24px", background: C.bg,
          borderBottom: `1px solid ${C.border}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{
              fontFamily: "'Space Mono', monospace", fontSize: 13, fontWeight: 700,
              background: `linear-gradient(135deg, ${C.accentBright}, #e86cb4)`,
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>◈ AIM Protocol</span>
            <span style={{
              fontFamily: "'Space Mono', monospace", fontSize: 9, padding: "2px 8px",
              background: `${C.accent}18`, color: C.accent, borderRadius: 4,
            }}>AGENT BEACON</span>
          </div>
          <a
            href="https://github.com/aimprotocol/web"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontFamily: "'Outfit', sans-serif", fontSize: 13, color: C.textDim,
              textDecoration: "none", transition: "color 0.2s",
            }}
            onMouseEnter={e => e.currentTarget.style.color = C.white}
            onMouseLeave={e => e.currentTarget.style.color = C.textDim}
          >GitHub</a>
        </div>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 40, marginTop: 40, padding: "0 24px" }}>
          <span style={{
            fontFamily: "'Space Mono', monospace", fontSize: 10, letterSpacing: "0.15em",
            textTransform: "uppercase", color: C.amber, display: "block", marginBottom: 12,
          }}>Beacon Generator / Open Source</span>
          <h1 style={{
            fontFamily: "'Instrument Serif', serif", fontSize: 40, fontWeight: 400,
            color: C.white, lineHeight: 1.15, letterSpacing: "-0.03em", marginBottom: 10,
          }}>
            Create <em style={{
              background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]}, ${colors[2]})`,
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              fontStyle: "italic",
            }}>your</em> beacon
          </h1>
          <p style={{
            fontFamily: "'Outfit', sans-serif", fontSize: 15, color: C.textDim,
            maxWidth: 440, lineHeight: 1.6, fontWeight: 300,
          }}>
            Customize the look, copy one script tag, paste it in your site's footer.
            Your beacon will auto-read every page — zero configuration.{" "}
            <button
              onClick={() => setShowAbout(true)}
              style={{
                background: "none", border: "none", cursor: "pointer",
                fontFamily: "'Outfit', sans-serif", fontSize: 15, fontWeight: 400,
                color: C.accentBright, padding: 0, textDecoration: "underline",
                textDecorationColor: C.accent + "44", textUnderlineOffset: 3,
                transition: "color 0.2s",
              }}
              onMouseEnter={e => e.currentTarget.style.color = C.white}
              onMouseLeave={e => e.currentTarget.style.color = C.accentBright}
            >Learn more</button>
          </p>
        </div>

        {/* Main layout */}
        <div style={{
          display: "flex", gap: 32, maxWidth: 900, width: "100%",
          flexWrap: "wrap", justifyContent: "center",
        }}>
          {/* Left: Controls */}
          <div style={{ flex: "1 1 320px", maxWidth: 380, display: "flex", flexDirection: "column", gap: 24 }}>

            {/* Colors */}
            <div>
              <div style={{
                fontFamily: "'Space Mono', monospace", fontSize: 10, color: C.textMuted,
                letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12,
              }}>Enter Your Brand Colors</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
                <ColorPicker label="Primary" value={colors[0]} onChange={v => setColors([v, colors[1], colors[2]])} />
                <ColorPicker label="Secondary" value={colors[1]} onChange={v => setColors([colors[0], v, colors[2]])} />
                <ColorPicker label="Accent" value={colors[2]} onChange={v => setColors([colors[0], colors[1], v])} />
              </div>

              {/* Presets */}
              <div style={{
                fontFamily: "'Space Mono', monospace", fontSize: 9, color: C.textMuted,
                letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8,
              }}>Presets</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {PRESETS.map(p => (
                  <button key={p.name} onClick={() => setColors([...p.colors])} style={{
                    padding: "4px 10px", background: C.surface, border: `1px solid ${C.border}`,
                    borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                    transition: "all 0.2s",
                  }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = p.colors[0]}
                    onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
                  >
                    <div style={{ display: "flex", gap: 2 }}>
                      {p.colors.map((c, i) => (
                        <div key={i} style={{ width: 8, height: 8, borderRadius: 2, background: c }} />
                      ))}
                    </div>
                    <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 10, color: C.textDim }}>{p.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Style */}
            <div>
              <div style={{
                fontFamily: "'Space Mono', monospace", fontSize: 10, color: C.textMuted,
                letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12,
              }}>Visualization Style</div>
              <StyleSelector colors={colors} selected={style} onSelect={setStyle} />
            </div>

            {/* Size & Position */}
            <div style={{ display: "flex", gap: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontFamily: "'Space Mono', monospace", fontSize: 10, color: C.textMuted,
                  letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8,
                }}>Size</div>
                <div style={{ display: "flex", gap: 6 }}>
                  {["sm", "md", "lg"].map(s => (
                    <button key={s} onClick={() => setSize(s)} style={{
                      flex: 1, padding: "8px 0", background: size === s ? C.surfaceLight : C.surface,
                      border: `1.5px solid ${size === s ? C.accent : C.border}`,
                      borderRadius: 6, color: size === s ? C.accentBright : C.textDim,
                      fontFamily: "'Space Mono', monospace", fontSize: 11, fontWeight: 700,
                      cursor: "pointer", transition: "all 0.2s", textTransform: "uppercase",
                    }}>{s}</button>
                  ))}
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontFamily: "'Space Mono', monospace", fontSize: 10, color: C.textMuted,
                  letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8,
                }}>Position</div>
                <div style={{ display: "flex", gap: 6 }}>
                  {[["bottom-right", "BR"], ["bottom-left", "BL"], ["header-right", "HR"], ["header-left", "HL"]].map(([val, label]) => (
                    <button key={val} onClick={() => setPosition(val)} style={{
                      flex: 1, padding: "8px 0", background: position === val ? C.surfaceLight : C.surface,
                      border: `1.5px solid ${position === val ? C.accent : C.border}`,
                      borderRadius: 6, color: position === val ? C.accentBright : C.textDim,
                      fontFamily: "'Space Mono', monospace", fontSize: 10, fontWeight: 700,
                      cursor: "pointer", transition: "all 0.2s",
                    }}>{label}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Preview + Code */}
          <div style={{ flex: "1 1 380px", maxWidth: 460, display: "flex", flexDirection: "column", gap: 24 }}>

            {/* Live Preview */}
            <div style={{
              padding: 32, background: C.surface, borderRadius: 16,
              border: `1px solid ${C.border}`, display: "flex",
              flexDirection: "column", alignItems: "center", gap: 20,
              position: "relative", overflow: "hidden",
              minHeight: 280,
            }}>
              {/* Simulated page background */}
              <div style={{
                position: "absolute", inset: 0, opacity: 0.03,
                background: `repeating-linear-gradient(0deg, ${C.white} 0px, ${C.white} 1px, transparent 1px, transparent 20px),
                             repeating-linear-gradient(90deg, ${C.white} 0px, ${C.white} 1px, transparent 1px, transparent 20px)`,
              }} />

              <div style={{
                fontFamily: "'Space Mono', monospace", fontSize: 10, color: C.textMuted,
                letterSpacing: "0.12em", textTransform: "uppercase",
                position: "relative", zIndex: 1,
              }}>Live Preview</div>

              <div style={{ position: "relative", zIndex: 1 }}>
                <BeaconPreview colors={colors} style={style} size={160} grid={22} />
              </div>

              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                position: "relative", zIndex: 1,
              }}>
                <div style={{
                  width: 6, height: 6, borderRadius: "50%", background: C.green,
                  boxShadow: `0 0 6px ${C.green}`,
                  animation: "pulse 2s ease-in-out infinite",
                }} />
                <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: C.green }}>
                  Broadcasting · {size.toUpperCase()} · {position}
                </span>
              </div>

              {/* Size reference */}
              <div style={{
                display: "flex", alignItems: "flex-end", gap: 12,
                position: "relative", zIndex: 1,
              }}>
                <div style={{ textAlign: "center" }}>
                  <BeaconPreview colors={colors} style={style} size={28} grid={6} showGlow={false} />
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 8, color: C.textMuted, marginTop: 4 }}>SM 28px</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <BeaconPreview colors={colors} style={style} size={40} grid={8} showGlow={false} />
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 8, color: C.textMuted, marginTop: 4 }}>MD 40px</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <BeaconPreview colors={colors} style={style} size={56} grid={10} showGlow={false} />
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 8, color: C.textMuted, marginTop: 4 }}>LG 56px</div>
                </div>
              </div>
            </div>

            {/* Script Tag Output */}
            <div style={{
              background: C.surface, borderRadius: 12,
              border: `1px solid ${C.border}`, overflow: "hidden",
            }}>
              <div style={{
                padding: "10px 16px", borderBottom: `1px solid ${C.border}`,
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <span style={{
                  fontFamily: "'Space Mono', monospace", fontSize: 11, color: C.textMuted,
                  fontWeight: 700,
                }}>Your script tag</span>
                <button onClick={handleCopy} style={{
                  padding: "5px 14px",
                  background: copied ? `${C.green}20` : `${C.accent}18`,
                  border: `1px solid ${copied ? C.green + "44" : C.accent + "33"}`,
                  borderRadius: 6, cursor: "pointer",
                  fontFamily: "'Space Mono', monospace", fontSize: 11, fontWeight: 700,
                  color: copied ? C.green : C.accentBright,
                  transition: "all 0.3s",
                }}>
                  {copied ? "✓ Copied!" : "Copy"}
                </button>
              </div>
              <pre style={{
                padding: "16px", margin: 0,
                fontFamily: "'Space Mono', monospace", fontSize: 12,
                color: C.accentBright, lineHeight: 1.6,
                whiteSpace: "pre-wrap", wordBreak: "break-all",
              }}>{scriptTag}</pre>
            </div>

            {/* What it does */}
            <div style={{
              padding: "16px 18px", background: `${C.surface}88`, borderRadius: 10,
              border: `1px solid ${C.border}`,
            }}>
              <div style={{
                fontFamily: "'Space Mono', monospace", fontSize: 9, color: C.textMuted,
                letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10,
              }}>What this does</div>
              {[
                { icon: "📡", text: "Auto-reads every page's interactive elements via DOM introspection" },
                { icon: "📄", text: "Generates an AIM manifest — no per-page config needed" },
                { icon: "👁", text: "Displays your branded beacon so users know agents can work here" },
                { icon: "🔒", text: "Read-only — observes your page, never modifies it" },
              ].map((item, i) => (
                <div key={i} style={{
                  display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 8,
                }}>
                  <span style={{ fontSize: 13, flexShrink: 0 }}>{item.icon}</span>
                  <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12, color: C.textDim, lineHeight: 1.5 }}>
                    {item.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          marginTop: 48, textAlign: "center",
          fontFamily: "'Space Mono', monospace", fontSize: 11, color: C.textMuted,
        }}>
          ◈ AIM Protocol · aimprotocol.org · One script tag. Every page. Zero config.
        </div>
      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.35} }`}</style>
    </>
  );
}
