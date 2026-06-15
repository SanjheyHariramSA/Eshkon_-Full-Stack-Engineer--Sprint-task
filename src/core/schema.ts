import { z } from "zod";

/**
 * Core schema layer — the single source of truth for the page/section shape.
 *
 * This module is framework-agnostic (no React, no Next, no Contentful). Every
 * other layer derives its types from here via `z.infer`, so the runtime
 * validators and the compile-time types can never drift apart.
 *
 * Design notes
 * ------------
 * - Section props are modelled per type with their own Zod object so we get a
 *   precise discriminated union instead of `Record<string, unknown>`.
 * - `.strict()` on prop objects means unexpected Contentful fields are surfaced
 *   as validation errors rather than silently passing through.
 * - Required vs optional props are encoded directly in Zod and re-exported as a
 *   table (`REQUIRED_PROPS`) the SemVer diff consumes — one definition, two uses.
 */

// ─── Section type union ──────────────────────────────────────────────────────
export const SECTION_TYPES = ["hero", "featureGrid", "testimonial", "cta"] as const;
export const sectionTypeSchema = z.enum(SECTION_TYPES);
export type SectionType = z.infer<typeof sectionTypeSchema>;

// ─── Reusable field primitives ───────────────────────────────────────────────
const nonEmpty = z.string().trim().min(1, "This field is required");
const optionalText = z.string().trim().optional();
/** Accepts absolute http(s) URLs or root-relative paths like "/pricing". */
const href = z
  .string()
  .trim()
  .min(1, "A link is required")
  .refine(
    (v) => /^https?:\/\//.test(v) || v.startsWith("/") || v.startsWith("#"),
    "Must be an absolute URL, a root-relative path (/...), or an anchor (#...)",
  );

// ─── Per-section prop schemas ────────────────────────────────────────────────
export const heroPropsSchema = z
  .object({
    eyebrow: optionalText,
    heading: nonEmpty,
    subheading: optionalText,
    primaryCtaLabel: optionalText,
    primaryCtaHref: href.optional(),
    // Optional (not defaulted) so the Zod input and output types match, which
    // keeps the schema assignable to z.ZodType<Props>. The component defaults
    // to "center" at render time.
    align: z.enum(["left", "center"]).optional(),
  })
  .strict();

export const featurePropsSchema = z
  .object({
    title: nonEmpty,
    description: optionalText,
    icon: optionalText, // lucide-react icon name; falls back to a default
  })
  .strict();

export const featureGridPropsSchema = z
  .object({
    heading: optionalText,
    subheading: optionalText,
    columns: z.union([z.literal(2), z.literal(3), z.literal(4)]).optional(),
    features: z.array(featurePropsSchema).min(1, "Add at least one feature"),
  })
  .strict();

export const testimonialPropsSchema = z
  .object({
    quote: nonEmpty,
    author: nonEmpty,
    role: optionalText,
    company: optionalText,
    avatarUrl: z.string().url().optional(),
  })
  .strict();

export const ctaPropsSchema = z
  .object({
    heading: nonEmpty,
    description: optionalText,
    label: nonEmpty,
    href,
  })
  .strict();

// ─── Section discriminated union ─────────────────────────────────────────────
const baseSection = { id: nonEmpty };

export const heroSectionSchema = z.object({ ...baseSection, type: z.literal("hero"), props: heroPropsSchema });
export const featureGridSectionSchema = z.object({ ...baseSection, type: z.literal("featureGrid"), props: featureGridPropsSchema }); // prettier-ignore
export const testimonialSectionSchema = z.object({ ...baseSection, type: z.literal("testimonial"), props: testimonialPropsSchema }); // prettier-ignore
export const ctaSectionSchema = z.object({ ...baseSection, type: z.literal("cta"), props: ctaPropsSchema });

export const sectionSchema = z.discriminatedUnion("type", [
  heroSectionSchema,
  featureGridSectionSchema,
  testimonialSectionSchema,
  ctaSectionSchema,
]);

// ─── Page schema ─────────────────────────────────────────────────────────────
export const pageSchema = z.object({
  pageId: nonEmpty,
  slug: nonEmpty,
  title: nonEmpty,
  sections: z.array(sectionSchema),
});

/**
 * Loose envelope used at the Contentful boundary. We validate page-level fields
 * strictly but keep each raw section as `{ id, type, props }` so one bad section
 * can degrade to <UnsupportedSection/> instead of failing the whole page. The
 * strict `sectionSchema` above is applied per-section afterwards.
 */
export const rawSectionSchema = z.object({
  id: nonEmpty,
  type: z.string().trim().min(1),
  props: z.record(z.unknown()).default({}),
});

export const rawPageSchema = z.object({
  pageId: nonEmpty,
  slug: nonEmpty,
  title: nonEmpty,
  sections: z.array(rawSectionSchema),
});

// ─── Inferred types (single source of truth) ─────────────────────────────────
export type HeroProps = z.infer<typeof heroPropsSchema>;
export type FeatureGridProps = z.infer<typeof featureGridPropsSchema>;
export type TestimonialProps = z.infer<typeof testimonialPropsSchema>;
export type CtaProps = z.infer<typeof ctaPropsSchema>;

export type SectionPropsByType = {
  hero: HeroProps;
  featureGrid: FeatureGridProps;
  testimonial: TestimonialProps;
  cta: CtaProps;
};

export type Section = z.infer<typeof sectionSchema>;
export type Page = z.infer<typeof pageSchema>;
export type RawPage = z.infer<typeof rawPageSchema>;
export type RawSection = z.infer<typeof rawSectionSchema>;

/** Per-type prop-schema lookup — used by the registry and the diff engine. */
export const PROP_SCHEMAS: { [K in SectionType]: z.ZodType<SectionPropsByType[K]> } = {
  hero: heroPropsSchema,
  featureGrid: featureGridPropsSchema,
  testimonial: testimonialPropsSchema,
  cta: ctaPropsSchema,
};

/**
 * Required-prop table derived once from the Zod shapes. A prop is "required"
 * when its schema does not accept `undefined`. The SemVer diff treats removing
 * or emptying a required prop as a MAJOR change.
 */
function requiredKeysOf(schema: z.ZodObject<z.ZodRawShape>): string[] {
  return Object.entries(schema.shape)
    .filter(([, def]) => !def.isOptional())
    .map(([key]) => key);
}

export const REQUIRED_PROPS: Record<SectionType, string[]> = {
  hero: requiredKeysOf(heroPropsSchema),
  featureGrid: requiredKeysOf(featureGridPropsSchema),
  testimonial: requiredKeysOf(testimonialPropsSchema),
  cta: requiredKeysOf(ctaPropsSchema),
};

export function isKnownSectionType(type: string): type is SectionType {
  return (SECTION_TYPES as readonly string[]).includes(type);
}
