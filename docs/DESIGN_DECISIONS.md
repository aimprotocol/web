# AIM Protocol — Design Decisions

**Website**: aimprotocol.org
**Full name**: AIM Protocol (Agent Interaction Protocol)
**Visual component**: AgentBeacon

---

## Naming Hierarchy

**AIM Protocol** — the open standard for agent-ready websites. Lives at `aimprotocol.org`. This is the umbrella that encompasses the spec, the tooling, and the ecosystem.

**AIM** — Agent Interaction Protocol. The core spec: the JSON manifest schema, the meta tags (`<meta name="aim">`), the `.well-known/aim.json` endpoint, the command protocol. This is the technical guts.

**AgentBeacon** — the optional visual component. A shimmering animated pixel grid embedded in web pages that gives humans real-time awareness of agent-page communication. The trust badge. The soul.

---

## Concept

AIM Protocol is two things, and we're honest about what each one does:

**1. The AIM Spec (the real invention)**
A per-page JSON manifest standard that describes every interactive element on a web page — served via meta tags, `.well-known/` endpoints, or Link headers. Agents discover it through patterns they already understand, fetch plain JSON over HTTP, and send commands back via POST. No new APIs to build. No DOM scraping. No new language to learn.

**2. The AgentBeacon (the human-facing signal)**
A small, animated pixel grid embedded in the page that visually represents the protocol in action. It serves as:
- A **trust badge**: tells humans "this page is agent-ready" (like the HTTPS padlock)
- An **awareness layer**: flashes and reacts when agents send commands, so humans can see their agent is working
- A **fallback data channel**: for screenshot-only agents that can't access the DOM, the beacon can encode the manifest visually (niche but real)

The AgentBeacon is not strictly necessary for AIM to work — an agent with DOM access never needs to "see" it. But it solves a real problem: right now, when an agent operates on a website for you, you have zero visibility. The beacon gives you awareness. Like router lights — not technically required, but you'd never trust a router without them.

**"AIM is the protocol. AgentBeacon is the heartbeat."**

---

## Problem Statement
- Full APIs are expensive to build and rarely cover all UI functionality
- Screen-scraping agents are slow, brittle, and compute-heavy
- There's no middle layer that lets agents interact with arbitrary web pages efficiently
- **When agents DO work on websites, humans have no visibility into what's happening**

## Core Principles
- **Per-page, not per-app**: Each page describes only what's available on that page right now
- **Standard patterns**: Discovery via meta tags, data via JSON, commands via HTTP POST — nothing new to learn
- **Self-contained**: No separate API infrastructure needed
- **Visible**: The AgentBeacon gives humans awareness and confidence that agent communication is happening
- **Honest**: The visual beacon is a trust signal and awareness layer, not the core protocol
- **Stateful**: Manifest updates as page state changes; agents re-read for fresh context

---

## Security Model (v0.2)

### Key Insight: No New Attack Surface
AIM does NOT create a new security boundary. A bot can already visit any page, inspect the DOM, and submit forms. AIM simply makes an existing surface more efficient — for both legitimate agents and malicious ones.

### Approach: Inherit the Page's Security
- **Authentication**: The AIM manifest is served as part of the page. If the page requires login, the manifest is only visible to authenticated users. Same cookies, same session.
- **CSRF**: Commands sent via AIM still go through the page's own form submission mechanisms (CSRF tokens, origin checks, etc.)
- **Rate limiting**: Existing server-side rate limits apply to AIM-triggered actions just like any other request.
- **CAPTCHA/bot detection**: Pages that use CAPTCHA can still require it. The manifest describes that a CAPTCHA field exists; the agent still has to deal with it.
- **Authorization**: The manifest only describes what the current user can see/do. Admin pages show admin actions; guest pages show guest actions.

### What We DON'T Need
- No new auth tokens or API keys
- No separate rate limiting infrastructure
- No AIM-specific encryption layer
- No new trust model between agent and server

### What We SHOULD Add (Future)
- **Manifest signing**: Optional cryptographic signature so agents can verify the manifest hasn't been tampered with
- **Command receipts**: After executing a command, the manifest updates to confirm success/failure

---

## Agent Discovery & Handshake (v0.3)

### Discovery Methods (agents check in order)

**1. Meta tag** (primary)
```html
<meta name="aim" href="/aim.json" />
```

**2. Well-known endpoint** (automatic)
```
/.well-known/aim.json
```

**3. Link header** (HTTP-level)
```
Link: </aim.json>; rel="aim"
```

**4. Visual AgentBeacon** (optional, for screenshot-based agents)

### Connection Flow
```
Agent arrives at page
  │
  ├─► Checks <meta name="aim"> tag
  │   └─► Found → GET /aim.json → Parse → Ready
  │
  ├─► Checks /.well-known/aim.json
  │   └─► Found → Parse → Ready
  │
  └─► Screenshot agent sees AgentBeacon
      └─► Decode pixels → Parse → Ready
```

### AIM Manifest Schema (v0.1)
```json
{
  "aim_version": "0.1",
  "page": {
    "url": "https://example.com/signup",
    "title": "Sign Up",
    "description": "Create your account"
  },
  "command_endpoint": "/aim/commands",
  "elements": [
    {
      "id": "email_field",
      "type": "text_input",
      "label": "Email Address",
      "required": true,
      "current_value": "",
      "validation": "email"
    },
    {
      "id": "submit_btn",
      "type": "button",
      "label": "Create Account",
      "action": "submit_form"
    }
  ]
}
```

### AIM Command Schema (v0.1)
```json
POST /aim/commands
{
  "aim_version": "0.1",
  "commands": [
    {
      "target": "email_field",
      "action": "set_value",
      "value": "user@example.com"
    }
  ]
}
```

---

## Translation Layer Architecture (v0.2)

### Level 1 — DOM Auto-Introspection (Zero developer effort)
A generic JavaScript module that walks the DOM/accessibility tree, identifies interactive elements, extracts labels and values, and generates an AIM manifest automatically. Works on ANY website with zero changes.

### Level 2 — Framework Plugin (Minimal developer effort)
React/Vue/Svelte plugins that hook into the component tree for richer metadata — validation rules, conditional logic, field dependencies. One line of code to add.

### Level 3 — Developer Annotations (Optional fine-tuning)
`data-aim-*` attributes for overriding labels, grouping elements, flagging confirmations, and describing complex actions.

The levels stack: Level 1 gives you something on every page. Level 2 enriches. Level 3 fine-tunes.

---

## Packages & URLs

- `aimprotocol.org` — the standard's home
- `aimprotocol.org/spec` — the AIM manifest spec
- `aimprotocol.org/beacon` — the AgentBeacon docs
- `npm install aim-protocol` — core library (manifest generation, serving, commands)
- `npm install agent-beacon` — visual React/JS component
- GitHub org: github.com/aimprotocol

---

## Key Design Decisions Log

### Decision: Security inherits the page (v0.2)
**Context**: Sigmond raised that bots can already access websites — AIM doesn't create a new attack surface.
**Decision**: AIM inherits the page's existing security model entirely.

### Decision: Translation is the adoption key (v0.2)
**Context**: Sigmond identified that the biggest barrier to adoption is how easily UIs get translated into AIM format.
**Decision**: Three-layer translation architecture (DOM introspection → framework plugins → annotations).

### Decision: Visually stunning is a requirement (v0.2)
**Context**: Sigmond emphasized the AgentBeacon and demo must be visually compelling for adoption.
**Decision**: The AgentBeacon is a design feature sites would want to display, not just a utility.

### Decision: The beacon is the handshake, the manifest is the conversation (v0.3)
**Context**: Sigmond asked how agents learn to "speak beacon."
**Decision**: No new language needed. AIM is just JSON via meta tags. The AgentBeacon is an optional visual signal.

### Decision: Be honest about what the beacon is (v0.3)
**Context**: Sigmond asked whether the visual beacon is more of a gimmick.
**Decision**: Mostly yes — and that's okay. The real invention is AIM. The AgentBeacon solves human awareness. Like router lights: not required, but you'd never go without them.

### Decision: Naming hierarchy (v0.4)
**Context**: Explored ABP, ACP, PAI, OPI, Agent Protocol. Settled on AIM Protocol.
**Decision**: AIM Protocol (aimprotocol.org) → AIM spec → AgentBeacon visual component. Domain purchased: aimprotocol.org.

### Decision: Agent Interaction Protocol, not Manifest (v0.4.1)
**Context**: Sigmond questioned whether "Manifest" was the right term now that AIM has grown beyond just the JSON file to include discovery, commands, the beacon, and the whole ecosystem.
**Decision**: Renamed from "Agent Interaction Manifest" to "Agent Interaction Protocol." The manifest is one component within the protocol, not the whole thing. The acronym AIM stays the same. Yes, "AIM Protocol" technically expands to "Agent Interaction Protocol Protocol" — same as "ATM machine" or "HTTP protocol" — but nobody will notice or care.

### Decision: AgentBeacon goes in the site header (v0.5)
**Context**: Building the live event discovery demo, Sigmond noted the beacon naturally belongs in the nav bar.
**Decision**: The recommended placement for the AgentBeacon is the site header/navigation bar. This mirrors how the HTTPS padlock lives in the browser address bar — always visible, consistent across pages, and a recognizable pattern users learn to look for. Small size (~36px), paired with an "AIM enabled" label. Subtle but unmistakable.

### Decision: Demo uses separate pages, not tabs or scrolling (v0.5)
**Context**: Sigmond pointed out that AIM works per-page in real life, so the demo should feel per-page too.
**Decision**: Separate realistic websites, each with their own AIM manifest. The repetition of the discovery moment IS the pitch.

### Decision: Drop-in script tag, read-only first (v0.6)
**Context**: Sigmond asked if someone could just grab the beacon code from GitHub, put it in their footer, and have it auto-read every page without custom per-page setup.
**Decision**: YES. The beacon ships as a single `<script>` tag that auto-introspects the DOM on every page. No configuration needed. Read-only in v1 (broadcasts what's on the page, doesn't accept commands). This is the Level 1 translation layer packaged as a one-liner. Zero risk for site owners, maximum adoption potential.

### Decision: Beacon generator on the landing page (v0.6)
**Context**: Sigmond suggested letting people customize their beacon with brand colors and visualization styles.
**Decision**: A generator tool on aimprotocol.org where you pick colors, choose a style, preview your beacon live, and copy the script tag. Turns adoption into a creative, shareable act. Every site's beacon looks slightly different, making it feel owned.

---

## Site Architecture (v0.5)

### aimprotocol.org
The cinematic marketing/landing page. Dark theme, floating beacon hero, honest architecture reveal, "Try the Demo" CTA.

### Demo Pages (linked from landing page)
Each is a standalone, realistic-looking website with:
- Its own visual design (warm editorial, clean e-commerce, etc. — NOT the dark AIM theme)
- An AgentBeacon in a consistent position (bottom-right floating + dismissible toast on first visit)
- A real AIM manifest that the agent reads
- An AI-powered agent panel that interprets natural language preferences

**Demo 1: Event Discovery** — "discover.vancouver" — find events by vibe, category, budget, setting
**Demo 2: Restaurant Booking** — find and book a table by cuisine, dietary needs, party size, ambiance
**Demo 3: Online Store** — browse clothing/products by style, size, price, occasion

The key storytelling moment: the beacon changes on every page but the agent always knows what to do. One standard, infinite contexts.

---

## Drop-in Beacon Architecture (v0.6)

### The Adoption Breakthrough
The AgentBeacon should work as a single script tag — no configuration, no per-page manifest writing, no custom setup. Drop it in your footer and it works on every page automatically.

### How It Works
```html
<script src="https://aimprotocol.org/beacon.js"
        data-colors="#6366f1,#f472b6"
        data-style="shimmer"
        data-position="bottom-right">
</script>
```

The script:
1. Injects the AgentBeacon visual element at the configured position
2. Auto-introspects the current page's DOM (Level 1 translation)
3. Generates an AIM manifest from detected interactive elements
4. Injects a `<meta name="aim">` tag pointing to the manifest
5. Serves the manifest data to any agent that requests it
6. Updates the manifest in real-time as page state changes (SPA-friendly)
7. The beacon visual reflects the current manifest data

### Read-Only First (v1)
The initial version is read-only: the beacon broadcasts what's on the page but does NOT accept commands from agents. This massively simplifies:
- **Security**: No new execution surface. The beacon is purely informational.
- **Trust**: Site owners have zero risk adding it. It's like adding analytics — it observes, it doesn't act.
- **Adoption**: "It just tells agents what's here" is an easy sell vs "it lets agents control your page."

Command support (bidirectional) can be a future opt-in upgrade.

### Configuration Options
- `data-colors` — brand colors (1-3 hex values) that tint the beacon visualization
- `data-style` — visualization style: "shimmer" (default), "geometric", "wave", "pulse"
- `data-position` — placement: "bottom-right" (default), "bottom-left", "header-right", "header-left"
- `data-size` — "sm" (28px), "md" (40px), "lg" (56px)
- `data-label` — optional text label, e.g., "AIM enabled"
- `data-toast` — show a dismissible introduction toast on first visit: "true" (default), "false"

### Beacon Generator (on aimprotocol.org)
A tool on the landing page where visitors can:
1. Pick brand colors (color picker or enter hex codes)
2. Choose a visualization style from 3-4 options (live preview of each)
3. Select size and position
4. See a live preview of THEIR personalized beacon
5. Copy the ready-to-use script tag

This turns adoption into a creative act. People screenshot and share their custom beacons. Every site's beacon looks slightly different, making it feel owned rather than generic.

---

## Open Questions
- [ ] Compression format for manifest (gzip? brotli? custom?)
- [ ] Error correction for visual channel (Reed-Solomon?)
- [ ] Pages with 50+ interactive elements (pagination? priority?)
- [ ] Should the AgentBeacon be aria-hidden?
- [ ] Real encode/decode pipeline for visual channel
- [ ] npm package structure finalization
- [ ] Browser extension for the agent side?
- [ ] Manifest versioning / schema registry
- [ ] Dynamic manifests for SPAs
- [ ] Formal spec writing (RFC-style?)
- [ ] Agent framework outreach strategy
- [ ] Should the AIM manifest include event/product DATA or just filters? (current demo includes data_summary)
- [ ] Standard beacon sizes: recommend 28-48px in nav, 100-200px standalone?
