import type { z } from "zod";
import {
  isKnownSectionType,
  PROP_SCHEMAS,
  rawPageSchema,
  type Page,
  type RawSection,
  type Section,
} from "./schema";

/**
 * Validation policy
 * -----------------
 * Two failure modes are handled distinctly (Brief §1):
 *
 *  1. Page-level structural failure (missing slug, sections not an array, …)
 *     → `validatePage` returns `{ ok: false }`. The route throws so the React
 *       error boundary renders — the app does not crash.
 *
 *  2. A single bad section (unknown `type` or props that fail their schema)
 *     → that section degrades to an `unsupported` entry and renders as
 *       <UnsupportedSection/>. The rest of the page renders normally.
 *
 * This keeps "invalid schema → error boundary" and "unknown section → fallback"
 * as separate, well-defined behaviours instead of one catch-all.
 */

export type ValidatedSection =
  | { status: "ok"; section: Section }
  | {
      status: "unsupported";
      raw: RawSection;
      reason: "unknown-type" | "invalid-props";
      issues?: z.ZodIssue[];
    };

export interface ValidatedPage {
  pageId: string;
  slug: string;
  title: string;
  sections: ValidatedSection[];
}

export type ValidationResult =
  | { ok: true; page: ValidatedPage }
  | { ok: false; error: string; issues: z.ZodIssue[] };

export function validatePage(input: unknown): ValidationResult {
  const envelope = rawPageSchema.safeParse(input);
  if (!envelope.success) {
    return {
      ok: false,
      error: "Page document failed structural validation",
      issues: envelope.error.issues,
    };
  }

  const { pageId, slug, title, sections } = envelope.data;
  const validated: ValidatedSection[] = sections.map((raw) => validateSection(raw));

  return { ok: true, page: { pageId, slug, title, sections: validated } };
}

export function validateSection(raw: RawSection): ValidatedSection {
  if (!isKnownSectionType(raw.type)) {
    return { status: "unsupported", raw, reason: "unknown-type" };
  }

  const parsed = PROP_SCHEMAS[raw.type].safeParse(raw.props);
  if (!parsed.success) {
    return {
      status: "unsupported",
      raw,
      reason: "invalid-props",
      issues: parsed.error.issues,
    };
  }

  // `raw.type` is narrowed to SectionType and props are validated; the cast is
  // safe because the discriminant and props now match a union member exactly.
  return {
    status: "ok",
    section: { id: raw.id, type: raw.type, props: parsed.data } as Section,
  };
}

/** Strict variant used by the publish flow: any degraded section is a hard error. */
export function assertFullyValidPage(input: unknown): Page {
  const result = validatePage(input);
  if (!result.ok) {
    throw new PageValidationError(result.error, result.issues);
  }
  const bad = result.page.sections.find((s) => s.status === "unsupported");
  if (bad && bad.status === "unsupported") {
    throw new PageValidationError(
      `Section "${bad.raw.id}" is ${bad.reason}; cannot publish a page with unsupported sections`,
      bad.issues ?? [],
    );
  }
  return {
    pageId: result.page.pageId,
    slug: result.page.slug,
    title: result.page.title,
    sections: result.page.sections
      .filter((s): s is Extract<ValidatedSection, { status: "ok" }> => s.status === "ok")
      .map((s) => s.section),
  };
}

/**
 * Wrap an already-typed `Page` (e.g. the Redux draft) as a `ValidatedPage` so it
 * can flow through the same renderer as Contentful data. Every section is marked
 * "ok" — the draft is always schema-valid because the editor only produces valid
 * mutations.
 */
export function pageToValidated(page: Page): ValidatedPage {
  return {
    pageId: page.pageId,
    slug: page.slug,
    title: page.title,
    sections: page.sections.map((section) => ({ status: "ok", section })),
  };
}

/** Reduce a validation result to a typed Page, dropping unsupported sections. */
export function toEditablePage(page: ValidatedPage): Page {
  return {
    pageId: page.pageId,
    slug: page.slug,
    title: page.title,
    sections: page.sections
      .filter((s): s is Extract<ValidatedSection, { status: "ok" }> => s.status === "ok")
      .map((s) => s.section),
  };
}

export class PageValidationError extends Error {
  constructor(
    message: string,
    public readonly issues: z.ZodIssue[],
  ) {
    super(message);
    this.name = "PageValidationError";
  }
}
