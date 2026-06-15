# Page Studio

A schema-driven **Page Studio**: load landing pages from Contentful, edit them in a
lightweight WYSIWYG-lite studio, preview the rendered page, and publish **immutable,
automatically-versioned releases** — with RBAC, accessibility, and CI enforced throughout.

Built with **Next.js (App Router) · TypeScript · Redux Toolkit · Contentful · Tailwind ·
shadcn/ui · Zod · dnd-kit · Playwright + axe · GitHub Actions**.

**🔗 Live app:** https://eshkon-sanjheyhariramsa.vercel.app/

> Sign in at [`/login`](https://eshkon-sanjheyhariramsa.vercel.app/login) with a demo role
> (see [Demo logins](#demo-logins-rbac) below), then open
> [`/preview/home`](https://eshkon-sanjheyhariramsa.vercel.app/preview/home) and
> [`/studio/home`](https://eshkon-sanjheyhariramsa.vercel.app/studio/home).

---

## Quick start

```bash
# 1. Install
npm install

# 2. Configure env (works out-of-the-box with fixtures; Contentful optional)
cp .env.example .env
#   - set AUTH_SECRET (any 32-byte hex string: `openssl rand -hex 32`)
#   - leave USE_FIXTURE_CONTENT=true to run without Contentful
#   - OR add CONTENTFUL_* tokens and set USE_FIXTURE_CONTENT=false

# 3. Run
npm run dev          # http://localhost:3000
```

> **No Contentful account needed to evaluate.** When credentials are absent (or
> `USE_FIXTURE_CONTENT=true`), the app serves deterministic fixtures through the exact same
> adapter interface used for Contentful. Set real `CONTENTFUL_*` tokens to switch to the live
> integration — nothing else changes.

### Demo logins (RBAC)

| Role        | Password    | Can do                          |
| ----------- | ----------- | ------------------------------- |
| `viewer`    | `viewer`    | Preview only                    |
| `editor`    | `editor`    | Preview + edit draft            |
| `publisher` | `publisher` | Preview + edit + **publish**    |

Sign in at `/login`, then visit `/preview/home` and `/studio/home`.

### Scripts

| Command                | Purpose                                   |
| ---------------------- | ----------------------------------------- |
| `npm run dev`          | Dev server                                |
| `npm run build`        | Production build                          |
| `npm run typecheck`    | `tsc --noEmit`                            |
| `npm run lint`         | ESLint (next/core-web-vitals)             |
| `npm run test`         | Vitest unit tests (schema, diff, publish) |
| `npm run test:e2e`     | Playwright + axe e2e + a11y report        |

---

## 1. Architecture overview

Clean / hexagonal architecture. Dependencies point **inward** toward a framework-agnostic
core; adapters (Contentful, release store, auth) sit behind interfaces.

```
                         ┌─────────────────────────────┐
   /preview/[slug] ───►  │  Schema-driven Renderer     │  ◄─── /studio live canvas
                         │  (sectionRegistry resolves)  │
                         └──────────────┬──────────────┘
                                        │
        ┌───────────────────────────────▼───────────────────────────────┐
        │  CORE (pure, no framework)                                      │
        │   • schema.ts   Zod schemas + inferred types (single source)    │
        │   • validation  page/section validation policy                  │
        │   • semver/diff deterministic SemVer diff + content hash        │
        │   • auth/roles  RBAC capability model                           │
        └───────┬─────────────────────────────────────────┬─────────────┘
                │                                           │
       ┌────────▼─────────┐   ┌──────────────┐   ┌──────────▼──────────┐
       │ ContentSource    │   │ Redux store  │   │ ReleaseStore        │
       │  • Contentful    │   │ draftPage    │   │  • fs (immutable)   │
       │  • Fixtures      │   │ ui / publish │   │  • memory (tests)   │
       └──────────────────┘   └──────────────┘   └─────────────────────┘

   Security: middleware (edge) guards routes  +  server actions / API routes
             call requireRole() (defence in depth). UI only *reflects* perms.
```

**Layer rules**

- `src/core/**` imports nothing framework-specific — it's unit-tested in isolation.
- `src/components/**` and `src/features/**` depend on core + the registry, never on Contentful.
- `src/server/**` holds adapters and is the only place that touches the Contentful SDK, the
  filesystem, `next/headers`, or env secrets (`import "server-only"`).

### Folder structure

```
src/
├─ app/                       # App Router routes
│  ├─ page.tsx                # Home (lists pages)
│  ├─ login/ · denied/        # Auth + RBAC denial
│  ├─ preview/[slug]/         # Rendered page + error.tsx + not-found.tsx
│  ├─ studio/[slug]/          # Studio shell (RSC) + error.tsx
│  └─ api/
│     ├─ publish/route.ts     # Protected REST publish (Node runtime)
│     └─ releases/[slug]/     # Release history (read)
├─ core/                      # ── PURE DOMAIN ──
│  ├─ schema.ts               # Zod schemas + inferred types + required-prop table
│  ├─ validation.ts           # validate / degrade-to-unsupported policy
│  ├─ semver/                 # diff.ts + stable-json.ts
│  ├─ publish/types.ts        # shared publish contract
│  └─ auth/roles.ts           # RBAC model
├─ registry/sectionRegistry.ts# THE single typed registry
├─ components/
│  ├─ ui/                     # shadcn/ui primitives
│  ├─ sections/               # hero / featureGrid / testimonial / cta / unsupported
│  ├─ renderer/               # PageRenderer · SectionRenderer · ErrorBoundary
│  └─ layout/ · providers/
├─ features/studio/           # Studio: toolbar, list (dnd-kit), inspector, canvas, publish
├─ store/                     # Redux: slices, store, hooks, selectors, persistence
├─ server/                    # ── ADAPTERS (server-only) ──
│  ├─ contentful/             # contentfulClient.ts + mappers.ts
│  ├─ content/                # ContentSource port + impls + factory
│  ├─ auth/                   # token (edge) · session (node) · rbac guards
│  ├─ releases/               # ReleaseStore port + fs/memory impls
│  ├─ publish/                # publish-service.ts (orchestration)
│  └─ actions/                # "use server" actions (publish, auth)
└─ middleware.ts              # Edge route-level RBAC
tests/
├─ unit/                      # Vitest: schema, diff, publish-service
└─ e2e/                       # Playwright + axe: preview, studio, rbac, a11y
releases/<slug>/<version>.json# Immutable published snapshots (committed)
```

---

## 2. Redux slice responsibilities

| Slice         | Owns                                                                   | Notes |
| ------------- | --------------------------------------------------------------------- | ----- |
| **draftPage** | The editable page + a `baseline` (last server/published version)      | All structural & prop mutations are reducers → "no mutation outside Redux". Immer-backed. Persisted to localStorage (reload-safe). |
| **ui**        | Ephemeral editor UI: selected section, dialogs, viewport, outline     | Never persisted; kept separate so UI churn doesn't touch the document model. |
| **publish**   | Publish lifecycle: status, error, client diff preview, last result    | `publishDraft` async thunk → server action. Client diff is advisory; server is authoritative. |

- **Selectors** (`store/selectors.ts`) derive `isDirty` and the diff preview via the same pure
  `diffPages` used on the server — one diff implementation, two call sites.
- **Persistence** (`store/persistence.ts`) is a middleware that writes the draft per-slug on every
  `draftPage/*` action; the Studio rehydrates a newer local draft on mount.

---

## 3. Contentful model + adapter

**Content model** (see [`docs/CONTENTFUL.md`](docs/CONTENTFUL.md) for field-by-field setup):

```
landingPage  { internalName, slug (unique), title, sections: Link<section>[] }
section      { sectionId, type (hero|featureGrid|testimonial|cta), props (JSON Object) }
```

**Adapter layering** (Brief §2):

- `server/contentful/contentfulClient.ts` — the **only** place that creates Contentful clients.
  Draft vs published is a single boolean: `getContentfulClient(preview)` returns the CPA
  (preview host) or CDA client. Switching environment/preview is isolated here.
- `server/contentful/mappers.ts` — anti-corruption layer: Contentful entries → domain `RawPage`.
  No SDK type escapes this file.
- `server/content/ContentSource` — the port consumed by routes. Implementations: `Contentful`
  and `Fixture`. A factory picks one; **no Contentful logic leaks into UI/components**.

Data flows **raw → `validatePage` → renderer**. Page-level schema failures hit the route error
boundary; a single bad/unknown section degrades to `<UnsupportedSection/>` without failing the page.

---

## 4. Publish + SemVer logic

**Deterministic diff** (`core/semver/diff.ts`): sections matched by stable `id`, props compared
via canonical key-sorted JSON, severity is a pure max-reduction.

| Change                                              | Bump      |
| --------------------------------------------------- | --------- |
| text / prop value change, section reorder           | **patch** |
| section added, optional prop added                  | **minor** |
| section removed, type changed, required prop broken  | **major** |

**Publish flow** (`server/publish/publish-service.ts`):

1. Load latest release for the slug.
2. **Idempotency gate** — if the draft's canonical content hash equals the latest release's hash,
   return that release **without writing** (same draft ≠ new version).
3. Else compute the diff, bump the version, freeze an **immutable snapshot**
   (`releases/<slug>/<version>.json`), append to the changelog index.

Immutability is enforced at the OS level (`fs.writeFile` with the `wx` flag throws on an existing
version). RBAC is enforced in the server action **and** the REST route (`requireRole("publisher")`),
and the incoming page is **re-validated server-side** — the client copy is never trusted.

> **Vercel note:** the serverless filesystem is read-only (except `/tmp`), so the `fs` release
> store is for local/CI/self-hosted. For Vercel, implement `ReleaseStore` over Vercel Blob/KV or
> S3 and select it in `server/releases/index.ts` — a one-line factory change.

---

## 5. Accessibility approach

WCAG 2.2 **AAA-oriented**. Full details + evidence in [`docs/ACCESSIBILITY.md`](docs/ACCESSIBILITY.md).

- Token-based colour system with **≥7:1** body contrast in light **and** dark themes.
- Visible, high-contrast `:focus-visible` rings on every interactive element.
- One `<h1>` per page (page title); all section headings are `<h2>` → predictable order.
- Full keyboard operability incl. **section reordering** (dnd-kit keyboard sensor + explicit
  Up/Down controls).
- `prefers-reduced-motion` disables non-essential motion globally.
- Forms fully labelled with `role="alert"` + `aria-describedby` error wiring.
- Skip-to-content link; `axe` runs in CI and **fails on any critical/serious violation**,
  emitting `a11y-report.json`.

---

## 6. What is incomplete and why

See [`docs/WRITEUP.md`](docs/WRITEUP.md) §"What is not included" for the full list. Headlines:

- **Auth is a demo credential flow**, not a real IdP. The verification boundary (middleware +
  `requireRole`) is production-shaped; swapping in OIDC/JWT is localised to `server/auth`.
- **Release store is filesystem-based.** Works for local/CI; a durable driver is needed for Vercel
  (interface already abstracted).
- **Array-prop editing** (e.g. editing individual feature-grid items) is intentionally limited per
  the brief's "edit limited props"; the declarative field system supports text/textarea/url/select.
- **Contentful write-back / seeding** is documented, not scripted.

---

## Deployment (Vercel)

1. Import the repo in Vercel (framework auto-detected).
2. Set env vars: `AUTH_SECRET`, and either `USE_FIXTURE_CONTENT=true` or the `CONTENTFUL_*` set.
3. For durable releases on Vercel, wire a Blob/KV `ReleaseStore` (see §4 note).

`vercel.json` adds security headers. CI (`.github/workflows/ci.yml`) must be green on `main`.
