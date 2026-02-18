# EPICON: Security Hardening & Production Baseline

**Branch:** `cursor/epicon-security-baseline-cfc5`
**Type:** Security / Infrastructure
**Priority:** 🔴 Critical — do not expose to public traffic without this

---

## Summary

This PR implements the EPICON Guard baseline for the Mobius Browser Shell —
the minimum security posture required before the shell receives public traffic.
It addresses the three critical blockers identified in the production readiness
audit: API key exposure, missing security headers, and CDN Tailwind dependency.

---

## Changes

### 🔐 `api/ai.ts` — Gemini API Key Proxy (NEW)

A Vercel Serverless Function that acts as a secure proxy between the browser shell
and the Gemini API. The `GEMINI_API_KEY` now lives exclusively in Vercel's
server-side environment — it is never shipped to the client.

- Validates `Origin` header against an allowlist before proxying
- Enforces a 50KB request body size limit to prevent abuse
- Allowlists permitted Gemini models and actions (prevents parameter injection)
- Returns sanitized error messages — no upstream secrets leak to the client
- Cache-Control `no-store` on all `/api/*` routes

**Migration required:** Any code in the shell that calls Gemini directly with a
client-side key must be updated to call `/api/ai?model=gemini-2.0-flash` instead.
The previous `process.env.GEMINI_API_KEY` exposure in vite.config.ts has been removed.

---

### 🛡️ `vercel.json` — Security Headers (NEW)

Server-side security headers applied to all routes via Vercel's edge network.
These are far stronger than equivalent `<meta>` tags in HTML.

| Header | Value |
|--------|-------|
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` |
| `X-Frame-Options` | `DENY` — prevents clickjacking |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | Disables camera, mic, geolocation, payment |
| `Content-Security-Policy` | Scoped allowlist (see file for full value) |
| `Cache-Control` | `immutable` on `/assets/*`, `no-store` on `/api/*` |

---

### 🎨 `index.html` — Remove CDN Tailwind

Removed `<script src="https://cdn.tailwindcss.com">`. The CDN version:
- Requires `unsafe-eval` in CSP (a significant XSS risk vector)
- Loads the entire Tailwind runtime at runtime (~350KB)
- Creates an external dependency that can change without your control

Tailwind is now bundled at build time via PostCSS (@tailwindcss/postcss). See
`postcss.config.js` and `index.css`.

Font loading switched to async (`media="print"` + `onload` pattern) to prevent
render-blocking on non-critical typefaces.

---

### ⚙️ `vite.config.ts` — Build Optimizations

- **Removed** `process.env.GEMINI_API_KEY` and `process.env.API_KEY` from `define` — keys no longer exposed to client
- Added PostCSS integration for bundled Tailwind
- Source maps disabled in production, enabled in preview
- Chunk size warning at 600KB
- Dev server proxy for `/api/ai` routes (set `VITE_AI_PROXY_TARGET` for custom target)

---

### 📦 New/Updated Config Files

- `postcss.config.js` — PostCSS with @tailwindcss/postcss + Autoprefixer
- `index.css` — Tailwind v4 entry (`@import "tailwindcss"`)
- `.env.example` — Documents GEMINI_API_KEY as server-side only
- `public/robots.txt` — Proper crawl control (replaces `<meta name="robots">`)

---

## Dependencies Added

```bash
npm install -D tailwindcss postcss autoprefixer @tailwindcss/postcss
npm install @vercel/node
```

---

## Environment Variables

Set `GEMINI_API_KEY` in **Vercel Dashboard → Project → Settings → Environment Variables**.

For local development:
```bash
cp .env.example .env.local
# Fill in GEMINI_API_KEY
vercel dev  # runs the api/ai.ts function locally on :3000
```

---

## Testing Checklist

- [ ] `vercel dev` starts without errors
- [ ] Shell loads with Tailwind styles intact (no CDN fallback)
- [ ] `/api/ai` proxy returns Gemini response when `GEMINI_API_KEY` is set
- [ ] `/api/ai` returns 500 (not the actual key) when key is missing
- [ ] `curl -I https://mobius-browser-shell.vercel.app` shows all security headers
- [ ] No `unsafe-eval` in browser console CSP violations
- [ ] Lighthouse Security audit passes
- [ ] Lab iframes (OAA, Reflections, Citizen Shield) load correctly

---

## ATLAS Integrity Note

This PR is tagged for ATLAS sentinel review. All changes are defensive — no
new attack surface introduced. The proxy narrows the trust boundary from
"entire client" to "single server-side function."

*Integrity Economics principle: secure the substrate before building the cathedral.*

---

**Labels:** `security`, `epicon`, `infrastructure`, `production-readiness`
