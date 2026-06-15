# Page Studio — Engineering write-up

## Problem framing

Build an authoring tool that loads landing-page definitions from Contentful, lets authorised
users edit them, previews the rendered result, and freezes drafts into immutable, versioned
releases — with quality (tests, a11y, CI) enforced. The hard parts aren't the UI; they're the
**boundaries**: schema validation, a deterministic versioning algorithm, real RBAC, and keeping
the CMS from leaking into the app.

## Key decisions & trade-offs

1. **Pure core, adapters at the edges (hexagonal).** Everything versioning/validation lives in
   `src/core` with zero framework imports, so it's trivially unit-testable and reusable. Contentful,
   the release store, and auth are ports with swappable implementations. Trade-off: a little more
   indirection (interfaces + factories) for a lot more testability and replaceability.

2. **One typed registry as the single source of truth.** `sectionRegistry` is
   `{ [K in SectionType]: SectionDefinition<K> }`. Removing an entry is a compile error; adding a
   section type is one object literal that simultaneously wires schema, component, defaults, and the
   editor fields. The Studio form is **generated** from `editableFields` — no per-section form code.

3. **Types inferred from Zod, not duplicated.** `z.infer` makes the runtime validators and the
   compile-time types the same definition. The required-prop table the diff needs is also derived
   from the Zod shape, so it can't drift.

4. **Two distinct failure modes.** Structural page failure → route error boundary (no crash);
   a single unknown/invalid section → `<UnsupportedSection/>` while the rest renders. Conflating
   these would either crash too eagerly or hide real errors.

5. **Deterministic diff, server-authoritative publish.** The client computes a diff for instant
   feedback, but the server re-validates the page and recomputes the version. The version decision
   is pure (id-matched sections, canonical JSON, max-severity reduction) — no clocks/randomness.
   Idempotency is a content-hash gate: identical draft ⇒ no new version.

6. **Defence in depth for RBAC.** Edge middleware guards routes for fast UX; every server action
   and API route independently calls `requireRole`. The UI only *reflects* permissions. A
   non-publisher hitting `/api/publish` directly gets a 403 (covered by an e2e test).

7. **Self-contained, runnable by default.** Fixtures behind the `ContentSource` port mean reviewers
   can run everything without a Contentful account; flipping env vars switches to the live API with
   no code change. CI is hermetic (fixtures + memory store).

## Assumptions

- Section `id`/`sectionId` is stable across edits — it's the diff's matching key.
- "Edit limited props" → text/textarea/url/select fields; deep array editing (individual feature
  items) is out of scope per the brief.
- Reorder is a non-breaking **patch** (all sections still present) — documented and tested.
- A demo credential login is acceptable to demonstrate RBAC; the boundary is production-shaped.

## What is **not** included and why

| Not included | Why / path to production |
| ------------ | ------------------------ |
| Real IdP (OIDC/JWT) | Demo cookie login keeps the repo self-contained. Swap is localised to `server/auth`; middleware + `requireRole` are unchanged. |
| Durable release store on Vercel | `fs` store fits local/CI/self-hosted. The `ReleaseStore` interface is ready for a Blob/KV/S3 driver (factory in `server/releases/index.ts`). |
| Contentful seeding/write-back | Documented in `docs/CONTENTFUL.md`; the app only reads from Contentful by design (publishing writes to the release store, not back to the CMS). |
| Feature-item array editor | Brief scopes prop editing to "limited props"; the declarative field system is extensible to array editors later. |
| Rollback UI | Snapshots + history API exist (`/api/releases/[slug]`); restoring a version into the draft is a small follow-up. |

## Architecture overview · Redux · Contentful · Publish · A11y

These are covered in depth in [`../README.md`](../README.md) (§1–§5) and
[`ACCESSIBILITY.md`](ACCESSIBILITY.md); this write-up focuses on the *why*.
