import type { RawPage } from "@/core/schema";

/**
 * Port (hexagonal architecture) that the rest of the app depends on. The UI and
 * server actions know only this interface — never the Contentful SDK. Swapping
 * Contentful for a CMS, a database, or fixtures is a one-line factory change
 * (see ./index.ts) with zero changes to consumers.
 */
export interface ContentSource {
  /** Returns the raw (unvalidated) page document, or null if not found. */
  getPage(slug: string, opts?: ContentQueryOptions): Promise<RawPage | null>;
  /** Lightweight listing for navigation / studio index. */
  listPages(opts?: ContentQueryOptions): Promise<PageSummary[]>;
}

export interface ContentQueryOptions {
  /** When true, read draft content; otherwise published. */
  preview?: boolean;
}

export interface PageSummary {
  pageId: string;
  slug: string;
  title: string;
}
