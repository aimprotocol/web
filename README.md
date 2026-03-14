# AIM Protocol — aimprotocol.org

The open standard for agent-ready websites.

## What is AIM?

**AIM** (Agent Interaction Protocol) is a per-page JSON manifest standard that describes every interactive element on a web page. AI agents discover it via meta tags, fetch plain JSON over HTTP, and can understand what's available on any page — instantly.

**AgentBeacon** is the visual component — a customizable animated pixel grid that gives humans real-time awareness of agent-page communication. The trust badge. The soul.

**AIM is the protocol. AgentBeacon is the heartbeat.**

## This Repo

This is the source for [aimprotocol.org](https://aimprotocol.org) — the landing page and beacon generator.

## Development

```bash
npm install
npm run dev
```

## Deployment

Deployed to Vercel. Pushes to `main` auto-deploy.

## Related

- [agent-beacon](https://github.com/AIM-Protocol/agent-beacon) — The drop-in script that makes any website agent-ready
- [AIM Spec](https://aimprotocol.org/spec) — The manifest specification (coming soon)

## License

MIT
