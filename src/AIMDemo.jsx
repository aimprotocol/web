import { useState, useEffect, useRef, useCallback, useMemo } from "react";

/* ═══════════════════════════════════════════
   COLORS — warm editorial palette for the event site
   + dark tech palette for the agent panel
   ═══════════════════════════════════════════ */
const SITE = {
  bg: "#faf8f5", surface: "#ffffff", border: "#e8e4de",
  text: "#1a1a1a", textDim: "#6b6560", textMuted: "#9e9890",
  accent: "#d4552a", accentSoft: "#f0ddd4",
  tag: "#2d5a3d", tagBg: "#e5f0e8",
  purple: "#6b4c9a", purpleBg: "#ede5f5",
  blue: "#2a6fa8", blueBg: "#deeaf5",
  warm: "#c48a3f", warmBg: "#f5edd8",
};
const AGENT = {
  bg: "#08080d", surface: "#111118", border: "#222233",
  text: "#e0e2ea", textDim: "#8e90a0", textMuted: "#555666",
  accent: "#6366f1", accentBright: "#a5b4fc",
  green: "#34d399", cyan: "#22d3ee", pink: "#f472b6", amber: "#fbbf24",
  white: "#f0f0f4",
};

/* ═══════════════════════════════════════════
   EVENT DATA
   ═══════════════════════════════════════════ */
const EVENTS = [
  { id: 1, title: "Granville Island Jazz Night", category: "music", vibe: "chill", setting: "outdoor", price: 25, date: "Sat, Mar 14", time: "7:00 PM", venue: "Granville Island Stage", description: "Smooth jazz under the stars with local Vancouver artists.", capacity: "intimate", img: "🎷" },
  { id: 2, title: "Kitsilano Street Food Festival", category: "food", vibe: "lively", setting: "outdoor", price: 15, date: "Sun, Mar 15", time: "11:00 AM", venue: "Kits Beach Park", description: "50+ vendors showcasing cuisines from around the world.", capacity: "large", img: "🍜" },
  { id: 3, title: "Digital Art After Dark", category: "art", vibe: "chill", setting: "indoor", price: 40, date: "Fri, Mar 13", time: "8:00 PM", venue: "Vancouver Art Gallery", description: "Immersive digital installations with ambient soundscapes.", capacity: "moderate", img: "🎨" },
  { id: 4, title: "Stanley Park Sunrise Yoga", category: "wellness", vibe: "chill", setting: "outdoor", price: 0, date: "Sat, Mar 14", time: "6:30 AM", venue: "Stanley Park Pavilion", description: "Free guided yoga session as the sun rises over the mountains.", capacity: "large", img: "🧘" },
  { id: 5, title: "Indie Game Dev Meetup", category: "tech", vibe: "chill", setting: "indoor", price: 0, date: "Thu, Mar 19", time: "6:00 PM", venue: "East Van Studios", description: "Show off your projects, meet collaborators, pizza provided.", capacity: "intimate", img: "🎮" },
  { id: 6, title: "Gastown Electronic Music Night", category: "music", vibe: "energetic", setting: "indoor", price: 35, date: "Sat, Mar 14", time: "10:00 PM", venue: "Fortune Sound Club", description: "Deep house and techno from Berlin-based DJs.", capacity: "moderate", img: "🎧" },
  { id: 7, title: "Commercial Drive Vintage Market", category: "shopping", vibe: "chill", setting: "outdoor", price: 0, date: "Sun, Mar 15", time: "10:00 AM", venue: "Commercial Drive", description: "Curated vintage clothing, records, and handmade goods.", capacity: "large", img: "👗" },
  { id: 8, title: "AI & Creative Tools Workshop", category: "tech", vibe: "chill", setting: "indoor", price: 50, date: "Sat, Mar 14", time: "1:00 PM", venue: "SFU Harbour Centre", description: "Hands-on workshop exploring AI tools for designers and artists.", capacity: "intimate", img: "🤖" },
  { id: 9, title: "Mount Seymour Night Hike", category: "outdoor", vibe: "adventurous", setting: "outdoor", price: 10, date: "Fri, Mar 13", time: "6:00 PM", venue: "Mt Seymour Trailhead", description: "Guided twilight hike with hot chocolate at the summit.", capacity: "intimate", img: "🏔️" },
  { id: 10, title: "Main Street Craft Beer Crawl", category: "food", vibe: "lively", setting: "indoor", price: 30, date: "Sat, Mar 14", time: "3:00 PM", venue: "Main Street Brewery Row", description: "Sample local craft beers across 6 award-winning breweries.", capacity: "moderate", img: "🍺" },
  { id: 11, title: "Yaletown Poetry & Wine", category: "art", vibe: "chill", setting: "indoor", price: 20, date: "Sun, Mar 15", time: "5:00 PM", venue: "Yaletown Warehouse", description: "Spoken word performances paired with BC wines.", capacity: "intimate", img: "📝" },
  { id: 12, title: "Cypress Mountain Snowshoe Tour", category: "outdoor", vibe: "adventurous", setting: "outdoor", price: 45, date: "Sun, Mar 15", time: "9:00 AM", venue: "Cypress Mountain Resort", description: "Guided snowshoe adventure through old-growth forest.", capacity: "intimate", img: "🏔️" },
];

const CATEGORIES = [...new Set(EVENTS.map(e => e.category))];
const VIBES = [...new Set(EVENTS.map(e => e.vibe))];
const SETTINGS = ["indoor", "outdoor"];

/* ═══════════════════════════════════════════
   AIM MANIFEST (what agents discover)
   ═══════════════════════════════════════════ */
function buildAimManifest(filters) {
  return {
    aim_version: "0.1",
    page: {
      url: "https://discover.vancouver.events",
      title: "Discover Vancouver Events",
      description: "Find events matching your vibe, interests, and budget",
    },
    command_endpoint: "/aim/commands",
    elements: [
      { id: "filter_category", type: "multi_select", label: "Category", options: CATEGORIES, current_value: filters.category },
      { id: "filter_vibe", type: "multi_select", label: "Vibe", options: VIBES, current_value: filters.vibe },
      { id: "filter_setting", type: "select", label: "Setting", options: ["any", ...SETTINGS], current_value: filters.setting },
      { id: "filter_max_price", type: "range", label: "Max Price", min: 0, max: 100, current_value: filters.maxPrice },
      { id: "filter_capacity", type: "select", label: "Crowd Size", options: ["any", "intimate", "moderate", "large"], current_value: filters.capacity },
      { id: "sort_by", type: "select", label: "Sort By", options: ["date", "price_low", "price_high", "name"], current_value: filters.sort },
      { id: "clear_filters", type: "button", label: "Clear All Filters", action: "reset" },
    ],
    data_summary: {
      total_events: EVENTS.length,
      categories: CATEGORIES,
      price_range: { min: 0, max: Math.max(...EVENTS.map(e => e.price)) },
    },
  };
}

/* ═══════════════════════════════════════════
   BEACON CANVAS
   ═══════════════════════════════════════════ */
function bHash(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function BeaconCanvas({ manifest, flash, size = 100, grid = 16 }) {
  const ref = useRef(null);
  const tick = useRef(0);
  const flashT = useRef(0);
  useEffect(() => { flashT.current = 35; }, [flash]);

  useEffect(() => {
    const cvs = ref.current;
    if (!cvs) return;
    const ctx = cvs.getContext("2d");
    const cell = size / grid;
    const json = JSON.stringify(manifest);
    let raf;
    const paint = () => {
      tick.current++;
      const t = tick.current;
      const isF = flashT.current > 0;
      if (isF) flashT.current--;
      const fi = isF ? flashT.current / 35 : 0;
      for (let i = 0; i < grid * grid; i++) {
        const ci = i % json.length;
        const cc = json.charCodeAt(ci);
        const s = bHash(`${cc}-${i}-${Math.floor(t / 4)}`);
        const w = Math.sin(t * 0.1 + i * 0.22) * 14;
        let r, g, b;
        if (isF) {
          const p = Math.sin(t * 0.5 + i * 0.12) * 0.4 + 0.6;
          r = (52 * (1 - fi) + (cc * 5 + s * 3) % 160 * fi + w) | 0;
          g = (211 * (1 - fi) * p + (cc * 9 + s) % 120 * fi) | 0;
          b = (153 * (1 - fi) + (cc * 11 + s * 5) % 180 * fi) | 0;
        } else {
          r = ((cc * 5 + s * 3 + t * 2) % 160 + 35 + w) | 0;
          g = ((cc * 9 + s * 4 + i * 2) % 130 + 25) | 0;
          b = ((cc * 11 + s * 6 + t) % 190 + 50) | 0;
        }
        ctx.fillStyle = `rgb(${Math.max(0, Math.min(255, r))},${Math.max(0, Math.min(255, g))},${Math.max(0, Math.min(255, b))})`;
        ctx.fillRect((i % grid) * cell, Math.floor(i / grid) * cell, cell, cell);
      }
      raf = requestAnimationFrame(paint);
    };
    paint();
    return () => cancelAnimationFrame(raf);
  }, [manifest, size, grid]);

  return <canvas ref={ref} width={size} height={size} style={{
    borderRadius: 8, imageRendering: "pixelated",
    boxShadow: `0 0 20px ${AGENT.accent}44, 0 0 50px ${AGENT.accent}15`,
  }} />;
}

/* ═══════════════════════════════════════════
   EVENT SITE (Left Panel)
   ═══════════════════════════════════════════ */
function EventSite({ filters, setFilters, filteredEvents, manifest, flash }) {
  const catColors = {
    music: { bg: "#fce4ec", text: "#c62828" }, food: { bg: "#fff3e0", text: "#e65100" },
    art: { bg: SITE.purpleBg, text: SITE.purple }, wellness: { bg: "#e0f2f1", text: "#00695c" },
    tech: { bg: SITE.blueBg, text: SITE.blue }, shopping: { bg: "#fce4ec", text: "#ad1457" },
    outdoor: { bg: SITE.tagBg, text: SITE.tag },
  };

  return (
    <div style={{
      flex: "1 1 55%", background: SITE.bg, overflow: "auto", minWidth: 0,
      borderRight: `1px solid ${SITE.border}`,
    }}>
      {/* Nav */}
      <nav style={{
        padding: "14px 24px", borderBottom: `1px solid ${SITE.border}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 20 }}>📍</span>
          <span style={{ fontFamily: "'Source Serif 4', serif", fontSize: 18, fontWeight: 700, color: SITE.text }}>
            discover.vancouver
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <BeaconCanvas manifest={manifest} flash={flash} size={36} grid={8} />
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: SITE.textMuted }}>
            AIM<br />enabled
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ padding: "28px 24px 20px" }}>
        <h1 style={{
          fontFamily: "'Source Serif 4', serif", fontSize: 32, fontWeight: 700,
          color: SITE.text, letterSpacing: "-0.03em", lineHeight: 1.15, margin: 0,
        }}>
          What's happening in<br />
          <span style={{ color: SITE.accent }}>Vancouver</span> this week
        </h1>
        <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 14, color: SITE.textDim, marginTop: 8, lineHeight: 1.5 }}>
          {filteredEvents.length} of {EVENTS.length} events · Filtered by your preferences
        </p>
      </div>

      {/* Filter chips */}
      <div style={{ padding: "0 24px 16px", display: "flex", flexWrap: "wrap", gap: 6 }}>
        {filters.category.length > 0 && filters.category.map(c => (
          <span key={c} style={{
            padding: "4px 10px", borderRadius: 99, fontSize: 11,
            fontFamily: "'Outfit', sans-serif", fontWeight: 500,
            background: (catColors[c] || {}).bg || SITE.accentSoft,
            color: (catColors[c] || {}).text || SITE.accent,
            display: "flex", alignItems: "center", gap: 4,
          }}>
            {c}
            <span style={{ cursor: "pointer", opacity: 0.6 }} onClick={() =>
              setFilters(f => ({ ...f, category: f.category.filter(x => x !== c) }))
            }>×</span>
          </span>
        ))}
        {filters.vibe.length > 0 && filters.vibe.map(v => (
          <span key={v} style={{
            padding: "4px 10px", borderRadius: 99, fontSize: 11,
            fontFamily: "'Outfit', sans-serif", fontWeight: 500,
            background: "#e8e4f8", color: "#5b4a8a",
          }}>{v} vibe</span>
        ))}
        {filters.setting !== "any" && (
          <span style={{ padding: "4px 10px", borderRadius: 99, fontSize: 11, fontFamily: "'Outfit', sans-serif", background: SITE.tagBg, color: SITE.tag }}>
            {filters.setting}
          </span>
        )}
        {filters.maxPrice < 100 && (
          <span style={{ padding: "4px 10px", borderRadius: 99, fontSize: 11, fontFamily: "'Outfit', sans-serif", background: SITE.warmBg, color: SITE.warm }}>
            Under ${filters.maxPrice}
          </span>
        )}
      </div>

      {/* Events Grid */}
      <div style={{ padding: "0 24px 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {filteredEvents.length === 0 ? (
          <div style={{ gridColumn: "1 / -1", padding: 40, textAlign: "center", color: SITE.textMuted, fontFamily: "'Outfit', sans-serif" }}>
            No events match your current filters. Try broadening your search.
          </div>
        ) : filteredEvents.map(ev => (
          <div key={ev.id} style={{
            background: SITE.surface, borderRadius: 12, border: `1px solid ${SITE.border}`,
            overflow: "hidden", transition: "transform 0.2s, box-shadow 0.2s", cursor: "pointer",
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.08)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
          >
            <div style={{
              height: 80, background: (catColors[ev.category] || {}).bg || "#f0f0f0",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36,
            }}>
              {ev.img}
            </div>
            <div style={{ padding: "12px 14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <span style={{
                  padding: "2px 7px", borderRadius: 4, fontSize: 9,
                  fontFamily: "'DM Mono', monospace", fontWeight: 500, textTransform: "uppercase",
                  background: (catColors[ev.category] || {}).bg || "#eee",
                  color: (catColors[ev.category] || {}).text || "#666",
                }}>{ev.category}</span>
                <span style={{ fontSize: 9, fontFamily: "'DM Mono', monospace", color: SITE.textMuted }}>
                  {ev.setting}
                </span>
              </div>
              <h3 style={{
                fontFamily: "'Source Serif 4', serif", fontSize: 14, fontWeight: 600,
                color: SITE.text, margin: "0 0 4px", lineHeight: 1.3,
              }}>{ev.title}</h3>
              <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, color: SITE.textDim, lineHeight: 1.4, margin: "0 0 8px" }}>
                {ev.description}
              </p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: SITE.textDim }}>
                  {ev.date} · {ev.time}
                </span>
                <span style={{
                  fontFamily: "'DM Mono', monospace", fontSize: 12, fontWeight: 700,
                  color: ev.price === 0 ? SITE.tag : SITE.text,
                }}>
                  {ev.price === 0 ? "Free" : `$${ev.price}`}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   AGENT PANEL (Right)
   ═══════════════════════════════════════════ */
function AgentPanel({ manifest, filters, setFilters, onFlash, filteredEvents }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { role: "agent", text: "I've connected to discover.vancouver via AIM Protocol. I can see 12 events across 7 categories. Tell me what you're in the mood for and I'll find the right ones." }
  ]);
  const [loading, setLoading] = useState(false);
  const [showManifest, setShowManifest] = useState(false);
  const chatRef = useRef(null);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(m => [...m, { role: "user", text: userMsg }]);
    setLoading(true);

    try {
      const systemPrompt = `You are an AI agent interacting with a website via the AIM Protocol. The website is an event discovery page in Vancouver.

Here is the AIM manifest (the available filters and current state):
${JSON.stringify(manifest, null, 2)}

Here are all the events available:
${JSON.stringify(EVENTS.map(e => ({ id: e.id, title: e.title, category: e.category, vibe: e.vibe, setting: e.setting, price: e.price, date: e.date, capacity: e.capacity })), null, 2)}

The user will describe their preferences in natural language. You must:
1. Interpret their preferences
2. Decide which AIM filters to apply
3. Respond with ONLY a JSON object (no markdown, no backticks) in this exact format:
{
  "commands": [
    {"target": "filter_category", "action": "set_value", "value": ["music","food"]},
    {"target": "filter_vibe", "action": "set_value", "value": ["chill"]},
    {"target": "filter_setting", "action": "set_value", "value": "outdoor"},
    {"target": "filter_max_price", "action": "set_value", "value": 50},
    {"target": "filter_capacity", "action": "set_value", "value": "any"}
  ],
  "explanation": "A brief, friendly explanation of what you found and why these filters match their request. Reference specific events by name if relevant."
}

Rules:
- For categories and vibes, use arrays (can be empty [] for "all")
- For setting and capacity, use "any" for no filter
- For max_price, use 100 for no limit
- Be conversational and helpful in the explanation
- If the request is vague, make reasonable assumptions and explain them`;

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: userMsg }],
          system: systemPrompt,
        }),
      });

      const data = await res.json();
      const text = data.content?.map(c => c.text || "").join("") || "";
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);

      // Apply commands
      const newFilters = { ...filters };
      for (const cmd of parsed.commands) {
        if (cmd.target === "filter_category") newFilters.category = cmd.value || [];
        if (cmd.target === "filter_vibe") newFilters.vibe = cmd.value || [];
        if (cmd.target === "filter_setting") newFilters.setting = cmd.value || "any";
        if (cmd.target === "filter_max_price") newFilters.maxPrice = cmd.value ?? 100;
        if (cmd.target === "filter_capacity") newFilters.capacity = cmd.value || "any";
      }

      // Stagger the filter applications for visual effect
      for (let i = 0; i < parsed.commands.length; i++) {
        setTimeout(() => onFlash(f => f + 1), i * 200);
      }

      setTimeout(() => {
        setFilters(newFilters);
        setMessages(m => [...m, { role: "agent", text: parsed.explanation, commands: parsed.commands }]);
        setLoading(false);
      }, parsed.commands.length * 200 + 100);

    } catch (err) {
      console.error(err);
      setMessages(m => [...m, { role: "agent", text: "I had trouble processing that. Could you rephrase? I can filter by category, vibe, setting (indoor/outdoor), price, and crowd size." }]);
      setLoading(false);
    }
  };

  return (
    <div style={{
      flex: "1 1 38%", background: AGENT.bg, display: "flex", flexDirection: "column",
      minWidth: 0, overflow: "hidden", maxWidth: 420,
    }}>
      {/* Header */}
      <div style={{
        padding: "12px 20px", borderBottom: `1px solid ${AGENT.border}`,
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <div style={{ width: 7, height: 7, borderRadius: "50%", background: AGENT.green, boxShadow: `0 0 8px ${AGENT.green}`, animation: "pulse 2s ease-in-out infinite" }} />
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, fontWeight: 700, color: AGENT.white }}>Your Agent</span>
        <div style={{ flex: 1 }} />
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: AGENT.green, textTransform: "uppercase", letterSpacing: "0.08em" }}>AIM Connected</span>
      </div>

      {/* Manifest toggle */}
      <div style={{ padding: "8px 20px", borderBottom: `1px solid ${AGENT.border}` }}>
        <button onClick={() => setShowManifest(!showManifest)} style={{
          background: "none", border: `1px solid ${AGENT.border}`, borderRadius: 6,
          padding: "5px 10px", color: AGENT.textDim, fontSize: 10, cursor: "pointer",
          fontFamily: "'DM Mono', monospace", transition: "all 0.2s", width: "100%", textAlign: "left",
        }}
          onMouseEnter={e => e.target.style.borderColor = AGENT.accent}
          onMouseLeave={e => e.target.style.borderColor = AGENT.border}
        >
          {showManifest ? "▼" : "▶"} View AIM Manifest ({manifest.elements.length} elements)
        </button>
        {showManifest && (
          <pre style={{
            fontFamily: "'DM Mono', monospace", fontSize: 9, color: AGENT.accentBright,
            background: AGENT.surface, padding: 10, borderRadius: 6, marginTop: 6,
            overflow: "auto", maxHeight: 160, lineHeight: 1.5, whiteSpace: "pre-wrap",
            border: `1px solid ${AGENT.border}`,
          }}>
            {JSON.stringify(manifest, null, 2)}
          </pre>
        )}
      </div>

      {/* Chat */}
      <div ref={chatRef} style={{ flex: 1, overflow: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
            maxWidth: "88%",
          }}>
            {msg.role === "agent" && (
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: AGENT.accent, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Agent
              </div>
            )}
            <div style={{
              padding: "10px 14px", borderRadius: 12,
              background: msg.role === "user" ? AGENT.accent : AGENT.surface,
              color: msg.role === "user" ? AGENT.white : AGENT.text,
              fontFamily: "'Outfit', sans-serif", fontSize: 13, lineHeight: 1.6,
              border: msg.role === "agent" ? `1px solid ${AGENT.border}` : "none",
              borderTopLeftRadius: msg.role === "agent" ? 4 : 12,
              borderTopRightRadius: msg.role === "user" ? 4 : 12,
            }}>
              {msg.text}
            </div>
            {msg.commands && (
              <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: 4 }}>
                {msg.commands.map((cmd, j) => (
                  <span key={j} style={{
                    fontFamily: "'DM Mono', monospace", fontSize: 9, padding: "2px 6px",
                    borderRadius: 4, background: `${AGENT.accent}18`, color: AGENT.accentBright,
                  }}>
                    {cmd.target.replace("filter_", "")} → {JSON.stringify(cmd.value)}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div style={{ alignSelf: "flex-start" }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: AGENT.accent, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>Agent</div>
            <div style={{
              padding: "10px 14px", borderRadius: 12, borderTopLeftRadius: 4,
              background: AGENT.surface, border: `1px solid ${AGENT.border}`,
              fontFamily: "'DM Mono', monospace", fontSize: 12, color: AGENT.textDim,
            }}>
              Interpreting preferences & applying AIM filters...
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{
        padding: "12px 20px", borderTop: `1px solid ${AGENT.border}`,
        display: "flex", gap: 8,
      }}>
        <input
          type="text" value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSend()}
          placeholder="Tell me what you're in the mood for..."
          style={{
            flex: 1, padding: "10px 14px", background: AGENT.surface,
            border: `1px solid ${AGENT.border}`, borderRadius: 8,
            color: AGENT.text, fontSize: 13, fontFamily: "'Outfit', sans-serif",
            outline: "none",
          }}
          onFocus={e => e.target.style.borderColor = AGENT.accent}
          onBlur={e => e.target.style.borderColor = AGENT.border}
        />
        <button onClick={handleSend} disabled={loading} style={{
          padding: "10px 18px", background: loading ? AGENT.border : AGENT.accent,
          color: AGENT.white, border: "none", borderRadius: 8, fontSize: 13,
          fontFamily: "'Outfit', sans-serif", fontWeight: 600, cursor: loading ? "wait" : "pointer",
          transition: "all 0.2s",
        }}>
          Send
        </button>
      </div>

      {/* Suggestions */}
      <div style={{
        padding: "8px 20px 14px", display: "flex", gap: 6, flexWrap: "wrap",
        borderTop: `1px solid ${AGENT.border}`,
      }}>
        {[
          "Something chill outdoors this weekend",
          "Free events I can walk to",
          "A fun date night under $40",
          "Anything artsy or creative",
        ].map(s => (
          <button key={s} onClick={() => { setInput(s); }} style={{
            padding: "4px 10px", background: `${AGENT.accent}12`, border: `1px solid ${AGENT.accent}22`,
            borderRadius: 6, color: AGENT.accentBright, fontSize: 10,
            fontFamily: "'DM Mono', monospace", cursor: "pointer", transition: "all 0.2s",
          }}
            onMouseEnter={e => e.target.style.borderColor = `${AGENT.accent}55`}
            onMouseLeave={e => e.target.style.borderColor = `${AGENT.accent}22`}
          >{s}</button>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN APP
   ═══════════════════════════════════════════ */
export default function AIMDemo() {
  const [filters, setFilters] = useState({
    category: [], vibe: [], setting: "any", maxPrice: 100, capacity: "any", sort: "date",
  });
  const [flash, setFlash] = useState(0);

  const filteredEvents = useMemo(() => {
    let evts = [...EVENTS];
    if (filters.category.length > 0) evts = evts.filter(e => filters.category.includes(e.category));
    if (filters.vibe.length > 0) evts = evts.filter(e => filters.vibe.includes(e.vibe));
    if (filters.setting !== "any") evts = evts.filter(e => e.setting === filters.setting);
    if (filters.maxPrice < 100) evts = evts.filter(e => e.price <= filters.maxPrice);
    if (filters.capacity !== "any") evts = evts.filter(e => e.capacity === filters.capacity);
    if (filters.sort === "price_low") evts.sort((a, b) => a.price - b.price);
    if (filters.sort === "price_high") evts.sort((a, b) => b.price - a.price);
    if (filters.sort === "name") evts.sort((a, b) => a.title.localeCompare(b.title));
    return evts;
  }, [filters]);

  const manifest = useMemo(() => buildAimManifest(filters), [filters]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,wght@0,400;0,600;0,700;1,400&family=Outfit:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: ${AGENT.bg}; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.35} }
      `}</style>

      <div style={{
        width: "100%", height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden",
      }}>
        {/* Top Bar */}
        <div style={{
          padding: "8px 24px", background: AGENT.bg,
          borderBottom: `1px solid ${AGENT.border}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{
              fontFamily: "'DM Mono', monospace", fontSize: 13, fontWeight: 700,
              background: `linear-gradient(135deg, ${AGENT.accentBright}, ${AGENT.pink})`,
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>◈ AIM Protocol</span>
            <span style={{
              fontFamily: "'DM Mono', monospace", fontSize: 9, padding: "2px 8px",
              background: `${AGENT.accent}18`, color: AGENT.accent, borderRadius: 4,
            }}>LIVE DEMO</span>
          </div>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: AGENT.textMuted }}>
            aimprotocol.org · Natural language → AIM commands → Website actions
          </span>
        </div>

        {/* Split */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          <EventSite
            filters={filters} setFilters={setFilters}
            filteredEvents={filteredEvents} manifest={manifest} flash={flash}
          />
          <AgentPanel
            manifest={manifest} filters={filters} setFilters={setFilters}
            onFlash={setFlash} filteredEvents={filteredEvents}
          />
        </div>
      </div>
    </>
  );
}
