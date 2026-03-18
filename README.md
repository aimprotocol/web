# AIM Protocol

The open standard for agent-ready websites.

**One script tag. Every page. Zero config.**

## What is AIM?

**AIM** (Agent Interaction Protocol) is a per-page JSON manifest standard that describes every interactive element on a web page. AI agents discover it via meta tags, fetch plain JSON over HTTP, and can understand what's available on any page — instantly.

**AgentBeacon** is the visual component — a drop-in script that makes any website agent-ready. It auto-reads your site's interactive elements (forms, buttons, links, inputs) and generates a structured AIM manifest that AI agents can understand. It also displays a small animated beacon so users know their agents can interact here.

**AIM is the protocol. AgentBeacon is the heartbeat.**

- **Auto-introspects** every page's DOM — finds inputs, selects, buttons, links, ARIA elements
- **Generates an AIM manifest** — structured JSON describing what's interactive on the page
- **Displays a branded beacon** — customizable animated pixel grid, like a trust badge
- **Read-only** — observes your page, never modifies it, never sends data anywhere
- **SPA-friendly** — watches for DOM changes and re-generates the manifest automatically

## Quick Start

Add one line to your site:

```html
<script src="https://aimprotocol.org/beacon.js"></script>
```

That's it. The beacon appears, reads your page, and any AIM-aware agent can consume the manifest.

## Customization

```html
<script src="https://aimprotocol.org/beacon.js"
  data-colors="#6366f1,#ec4899,#06b6d4"
  data-style="shimmer"
  data-size="md"
  data-position="bottom-right"
  data-label="AIM enabled"
  data-visibility="peek">
</script>
```

### Options

| Attribute | Values | Default | Description |
|-----------|--------|---------|-------------|
| `data-colors` | Hex colors (comma-separated) | `#6366f1,#ec4899,#06b6d4` | Brand colors for the beacon visualization |
| `data-style` | `shimmer`, `geometric`, `wave`, `pulse` | `shimmer` | Visualization animation style |
| `data-size` | `sm` (28px), `md` (40px), `lg` (56px) | `md` | Beacon size |
| `data-position` | `bottom-right`, `bottom-left`, `header-right`, `header-left` | `bottom-right` | Beacon placement |
| `data-label` | Any text | `AIM enabled` | Label shown next to the beacon |
| `data-visibility` | `persistent`, `peek`, `hidden` | `peek` | `persistent` = always visible, `peek` = shows for 3s then fades, `hidden` = protocol only, no UI |

### Generate your beacon

Visit [aimprotocol.org](https://aimprotocol.org) to customize your beacon with a visual generator — pick colors, choose a style, and copy your script tag.

## Developer Annotations

For more control, add `data-aim-*` attributes to your HTML elements:

```html
<!-- Override auto-detected label -->
<input data-aim-label="Customer email address" type="email" />

<!-- Add context for agents -->
<button data-aim-action="Submits the order and charges the card on file">
  Place Order
</button>

<!-- Group related elements -->
<input data-aim-group="shipping-address" placeholder="Street" />
<input data-aim-group="shipping-address" placeholder="City" />

<!-- Exclude from manifest -->
<button data-aim-ignore>Internal Admin Tool</button>

<!-- Flag as requiring confirmation -->
<button data-aim-confirm data-aim-action="Permanently deletes the account">
  Delete Account
</button>
```

## How Agents Access the Manifest

### JavaScript (in-page)
```js
// Direct access
const manifest = window.__AIM_MANIFEST__;

// Listen for updates
document.addEventListener('aim:manifest-updated', (e) => {
  console.log('Manifest updated:', e.detail);
});
```

### Meta tag discovery
The beacon automatically injects a `<meta name="aim">` tag that agents can discover via standard DOM inspection.

### Console
Check your browser console for the AIM Protocol status message and element count.

## Privacy

**This script runs entirely in the browser.** It does NOT transmit any data to any server, third party, or external service. All DOM introspection and manifest generation happens locally. The beacon is purely visual.

- No cookies or localStorage
- No network requests
- No tracking
- No data collection

## Development

This repo contains both the [aimprotocol.org](https://aimprotocol.org) website and the `beacon.js` script (served at `aimprotocol.org/beacon.js`).

```bash
npm install
npm run dev
```

Deployed to Vercel. Pushes to `main` auto-deploy.

## License

MIT — do whatever you want with it.
