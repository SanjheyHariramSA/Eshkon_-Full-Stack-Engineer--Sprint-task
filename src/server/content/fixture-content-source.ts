import "server-only";
import type { ContentQueryOptions, ContentSource, PageSummary } from "./content-source";
import { FIXTURE_PAGES } from "./fixtures";
import type { RawPage } from "@/core/schema";

/**
 * In-memory ContentSource for local dev and e2e. Implements the same port as
 * the Contentful adapter so consumers cannot tell the difference. `preview` is
 * accepted for parity but fixtures are identical for draft/published.
 */
export class FixtureContentSource implements ContentSource {
  async getPage(slug: string, _opts: ContentQueryOptions = {}): Promise<RawPage | null> {
    void _opts;
    return FIXTURE_PAGES[slug] ?? null;
  }

  async listPages(_opts: ContentQueryOptions = {}): Promise<PageSummary[]> {
    void _opts;
    return Object.values(FIXTURE_PAGES).map(({ pageId, slug, title }) => ({
      pageId,
      slug,
      title,
    }));
  }
}
