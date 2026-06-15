import type { RawPage } from "@/core/schema";

/**
 * Deterministic fixture content used when USE_FIXTURE_CONTENT=true (local dev
 * without Contentful, and all Playwright e2e runs). Mirrors exactly what the
 * Contentful adapter would return, so the renderer/studio behave identically.
 *
 * Includes one intentionally-broken section ("legacy-banner") to exercise the
 * <UnsupportedSection/> path in e2e.
 */
export const FIXTURE_PAGES: Record<string, RawPage> = {
  home: {
    pageId: "fixture-home",
    slug: "home",
    title: "Page Studio — Home",
    sections: [
      {
        id: "hero-1",
        type: "hero",
        props: {
          eyebrow: "Schema-driven",
          heading: "Build landing pages that ship themselves",
          subheading:
            "Compose pages from validated sections, preview instantly, and publish immutable, versioned releases.",
          primaryCtaLabel: "Open the Studio",
          primaryCtaHref: "/studio/home",
          align: "center",
        },
      },
      {
        id: "features-1",
        type: "featureGrid",
        props: {
          heading: "Engineered for correctness",
          subheading: "Every section is validated, typed, and registry-driven.",
          columns: 3,
          features: [
            { title: "Zod-validated", description: "Runtime + compile-time safety.", icon: "ShieldCheck" },
            { title: "Versioned", description: "Deterministic SemVer on publish.", icon: "GitBranch" },
            { title: "Accessible", description: "WCAG 2.2 AAA-oriented.", icon: "Accessibility" },
          ],
        },
      },
      {
        id: "legacy-banner",
        type: "marquee", // unknown type → renders <UnsupportedSection/>
        props: { text: "legacy section from an old model" },
      },
      {
        id: "quote-1",
        type: "testimonial",
        props: {
          quote: "Page Studio cut our launch time from days to minutes.",
          author: "Jordan Lee",
          role: "VP Engineering",
          company: "Northwind",
        },
      },
      {
        id: "cta-1",
        type: "cta",
        props: {
          heading: "Ready to publish your first release?",
          description: "It takes less than a minute.",
          label: "Get started",
          href: "/studio/home",
        },
      },
    ],
  },
  pricing: {
    pageId: "fixture-pricing",
    slug: "pricing",
    title: "Page Studio — Pricing",
    sections: [
      {
        id: "hero-pricing",
        type: "hero",
        props: {
          heading: "Simple, transparent pricing",
          subheading: "Start free. Upgrade when you grow.",
          align: "center",
        },
      },
      {
        id: "cta-pricing",
        type: "cta",
        props: {
          heading: "Talk to sales",
          label: "Contact us",
          href: "/contact",
        },
      },
    ],
  },
};
