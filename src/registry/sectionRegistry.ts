import type { ComponentType } from "react";
import { LayoutGrid, Megaphone, MessageSquareQuote, Sparkles, type LucideIcon } from "lucide-react";
import type { z } from "zod";

import { HeroSection } from "@/components/sections/hero-section";
import { FeatureGridSection } from "@/components/sections/feature-grid-section";
import { TestimonialSection } from "@/components/sections/testimonial-section";
import { CtaSection } from "@/components/sections/cta-section";

import {
  ctaPropsSchema,
  featureGridPropsSchema,
  heroPropsSchema,
  testimonialPropsSchema,
  type SectionPropsByType,
  type SectionType,
} from "@/core/schema";

/**
 * THE single section registry (Brief §1).
 *
 * Why one typed map:
 *   • `SectionRegistry` is `{ [K in SectionType]: SectionDefinition<K> }`, so
 *     deleting an entry is a TYPE ERROR (the mapped type requires every key).
 *     This satisfies "removing a registry entry breaks TS".
 *   • The renderer resolves `registry[type]`; if `type` is not a key at runtime
 *     it renders <UnsupportedSection/> instead.
 *
 * Each definition co-locates everything a section needs: its Zod schema (runtime
 * validation), its React component (rendering), a default factory (Studio "add
 * section"), and a declarative field list (drives the WYSIWYG-lite editor with
 * zero per-section form code).
 */

export type FieldKind = "text" | "textarea" | "url" | "select";

export interface FieldDescriptor {
  /** Key within the section's props object. */
  path: string;
  label: string;
  kind: FieldKind;
  required?: boolean;
  placeholder?: string;
  helpText?: string;
  options?: ReadonlyArray<{ label: string; value: string }>;
}

export interface SectionDefinition<T extends SectionType> {
  type: T;
  label: string;
  description: string;
  icon: LucideIcon;
  schema: z.ZodType<SectionPropsByType[T]>;
  component: ComponentType<{ props: SectionPropsByType[T] }>;
  /** Factory for "Add section" in the Studio — always schema-valid. */
  createDefault: () => SectionPropsByType[T];
  /** Declarative editor fields (limited prop editing per Brief §3). */
  editableFields: FieldDescriptor[];
}

type SectionRegistry = { [K in SectionType]: SectionDefinition<K> };

export const sectionRegistry: SectionRegistry = {
  hero: {
    type: "hero",
    label: "Hero",
    description: "Large headline with optional eyebrow, subheading and CTA.",
    icon: Sparkles,
    schema: heroPropsSchema,
    component: HeroSection,
    createDefault: () => ({
      eyebrow: "New",
      heading: "Your compelling headline",
      subheading: "A short supporting sentence that frames the value proposition.",
      primaryCtaLabel: "Get started",
      primaryCtaHref: "/signup",
      align: "center",
    }),
    editableFields: [
      { path: "eyebrow", label: "Eyebrow", kind: "text", placeholder: "Optional badge text" },
      { path: "heading", label: "Heading", kind: "text", required: true },
      { path: "subheading", label: "Subheading", kind: "textarea" },
      { path: "primaryCtaLabel", label: "CTA label", kind: "text" },
      {
        path: "primaryCtaHref",
        label: "CTA URL",
        kind: "url",
        placeholder: "/signup or https://…",
        helpText: "Absolute URL, root-relative path, or #anchor.",
      },
      {
        path: "align",
        label: "Alignment",
        kind: "select",
        options: [
          { label: "Center", value: "center" },
          { label: "Left", value: "left" },
        ],
      },
    ],
  },

  featureGrid: {
    type: "featureGrid",
    label: "Feature grid",
    description: "A responsive grid of feature cards.",
    icon: LayoutGrid,
    schema: featureGridPropsSchema,
    component: FeatureGridSection,
    createDefault: () => ({
      heading: "Everything you need",
      subheading: "Powerful features, thoughtfully designed.",
      columns: 3,
      features: [
        { title: "Fast", description: "Blazing performance out of the box.", icon: "Zap" },
        { title: "Secure", description: "Enterprise-grade security by default.", icon: "Shield" },
        { title: "Accessible", description: "WCAG-oriented from the start.", icon: "Accessibility" },
      ],
    }),
    editableFields: [
      { path: "heading", label: "Heading", kind: "text" },
      { path: "subheading", label: "Subheading", kind: "textarea" },
      {
        path: "columns",
        label: "Columns",
        kind: "select",
        options: [
          { label: "2", value: "2" },
          { label: "3", value: "3" },
          { label: "4", value: "4" },
        ],
      },
    ],
  },

  testimonial: {
    type: "testimonial",
    label: "Testimonial",
    description: "A customer quote with attribution.",
    icon: MessageSquareQuote,
    schema: testimonialPropsSchema,
    component: TestimonialSection,
    createDefault: () => ({
      quote: "This product transformed how our team ships.",
      author: "Alex Rivera",
      role: "Head of Product",
      company: "Acme Inc.",
    }),
    editableFields: [
      { path: "quote", label: "Quote", kind: "textarea", required: true },
      { path: "author", label: "Author", kind: "text", required: true },
      { path: "role", label: "Role", kind: "text" },
      { path: "company", label: "Company", kind: "text" },
    ],
  },

  cta: {
    type: "cta",
    label: "Call to action",
    description: "A focused conversion block with a single action.",
    icon: Megaphone,
    schema: ctaPropsSchema,
    component: CtaSection,
    createDefault: () => ({
      heading: "Ready to get started?",
      description: "Join thousands of teams building with Page Studio.",
      label: "Start free trial",
      href: "/signup",
    }),
    editableFields: [
      { path: "heading", label: "Heading", kind: "text", required: true },
      { path: "description", label: "Description", kind: "textarea" },
      { path: "label", label: "Button label", kind: "text", required: true },
      { path: "href", label: "Button URL", kind: "url", required: true, placeholder: "/signup" },
    ],
  },
};

export function getSectionDefinition<T extends SectionType>(type: T): SectionDefinition<T> {
  return sectionRegistry[type];
}

/** Runtime-safe lookup for the renderer (raw Contentful type may be unknown). */
export function resolveSectionDefinition(
  type: string,
): SectionDefinition<SectionType> | undefined {
  return (sectionRegistry as Record<string, SectionDefinition<SectionType>>)[type];
}

export const SECTION_PALETTE = Object.values(sectionRegistry).map((d) => ({
  type: d.type,
  label: d.label,
  description: d.description,
  icon: d.icon,
}));
