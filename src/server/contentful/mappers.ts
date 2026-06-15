import "server-only";
import type { Entry, EntrySkeletonType } from "contentful";
import type { RawPage, RawSection } from "@/core/schema";

/**
 * Anti-corruption layer: translates Contentful's entry shape into our domain's
 * `RawPage`. All Contentful-specific knowledge (field names, link resolution,
 * sys metadata) lives here. The output is a plain domain object — no SDK types
 * leak past this boundary.
 *
 * Contentful content model (see README → Contentful model):
 *   landingPage: { internalName, slug, title, sections: Link<section>[] }
 *   section:     { sectionId, type, props (JSON) }
 */

export interface SectionFields {
  sectionId?: string;
  type?: string;
  props?: Record<string, unknown>;
}
export interface LandingPageFields {
  internalName?: string;
  slug?: string;
  title?: string;
  sections?: Array<Entry<EntrySkeletonType<SectionFields>>>;
}

type LandingPageEntry = Entry<EntrySkeletonType<LandingPageFields>>;
type SectionEntry = Entry<EntrySkeletonType<SectionFields>>;

export function mapLandingPageEntry(entry: LandingPageEntry): RawPage {
  const fields = entry.fields ?? {};
  const sections = Array.isArray(fields.sections) ? fields.sections : [];

  return {
    // Use the stable Contentful entry id as the canonical pageId.
    pageId: entry.sys.id,
    slug: String(fields.slug ?? ""),
    title: String(fields.title ?? ""),
    sections: sections
      .filter(isResolvedSectionLink)
      .map((section) => mapSectionEntry(section)),
  };
}

function mapSectionEntry(entry: SectionEntry): RawSection {
  const fields = entry.fields ?? {};
  return {
    // Prefer the author-controlled sectionId; fall back to the entry id so the
    // SemVer diff always has a stable key to match sections across versions.
    id: String(fields.sectionId || entry.sys.id),
    type: String(fields.type ?? "unknown"),
    props: isPlainObject(fields.props) ? fields.props : {},
  };
}

/**
 * Linked entries can be unresolved (a bare Link) when an include depth is too
 * shallow or the target is unpublished. We skip those rather than crash.
 */
function isResolvedSectionLink(value: unknown): value is SectionEntry {
  return (
    isPlainObject(value) &&
    isPlainObject((value as { sys?: unknown }).sys) &&
    (value as { sys: { type?: string } }).sys.type === "Entry"
  );
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
