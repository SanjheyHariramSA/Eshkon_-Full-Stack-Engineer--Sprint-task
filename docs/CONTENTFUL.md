# Contentful content model

Create two content types in your space (Settings → Content model). The adapter
(`src/server/contentful/mappers.ts`) maps these to the domain `RawPage`.

## Content type: `landingPage`

| Field ID       | Type                              | Notes                                  |
| -------------- | --------------------------------- | -------------------------------------- |
| `internalName` | Short text                        | For editors only                       |
| `slug`         | Short text (unique)               | Used by `/preview/[slug]`              |
| `title`        | Short text                        | Page `<title>` + sr-only `<h1>`        |
| `sections`     | References, many → `section`      | Ordered list of section entries        |

## Content type: `section`

| Field ID    | Type        | Validation                                          |
| ----------- | ----------- | --------------------------------------------------- |
| `sectionId` | Short text  | Stable id used by the SemVer diff to match sections |
| `type`      | Short text  | One of: `hero`, `featureGrid`, `testimonial`, `cta` |
| `props`     | JSON object | Must satisfy that type's Zod schema (`core/schema`) |

### Example `props` per type

```jsonc
// hero
{ "heading": "...", "subheading": "...", "primaryCtaLabel": "Get started",
  "primaryCtaHref": "/signup", "align": "center" }

// featureGrid
{ "heading": "...", "columns": 3,
  "features": [{ "title": "Fast", "description": "...", "icon": "Zap" }] }

// testimonial
{ "quote": "...", "author": "Jane", "role": "CTO", "company": "Acme" }

// cta
{ "heading": "...", "description": "...", "label": "Start", "href": "/signup" }
```

## Tokens

- **CDA** (Content Delivery API) token → published content.
- **CPA** (Content Preview API) token → draft content (`preview.contentful.com`).

Set both in `.env` and `USE_FIXTURE_CONTENT=false`. The Studio loads **draft** (CPA) content;
`/preview/[slug]` loads **published** by default and **draft** with `?preview=true`.

## Robustness

- Unknown `type` → renders `<UnsupportedSection/>` (does not crash the page).
- Invalid `props` → that section degrades to unsupported; the rest of the page renders.
- Structurally invalid page (e.g. missing slug) → route error boundary.
