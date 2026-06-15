import "server-only";
import type { ContentfulClientApi, Entry, EntrySkeletonType } from "contentful";
import { getContentfulClient } from "@/server/contentful/contentfulClient";
import { mapLandingPageEntry, type LandingPageFields } from "@/server/contentful/mappers";
import type { ContentQueryOptions, ContentSource, PageSummary } from "./content-source";
import type { RawPage } from "@/core/schema";

const LANDING_PAGE_TYPE = "landingPage";

type LandingPageSkeleton = EntrySkeletonType<LandingPageFields>;
type LandingPageEntry = Entry<LandingPageSkeleton>;
/** The exact query-param type the SDK expects (generic resolved). */
type EntriesQuery = Parameters<ContentfulClientApi<undefined>["getEntries"]>[0];

/**
 * Concrete ContentSource backed by Contentful. Include depth of 2 resolves the
 * page → section links in a single request. Draft vs published is delegated
 * entirely to `getContentfulClient(preview)`.
 *
 * Field-filter keys (`fields.slug`, `select`) are typed loosely by the SDK; we
 * build the query as a plain object and cast it to the SDK's own parameter type
 * (no `any`), then map results through the anti-corruption layer.
 */
export class ContentfulContentSource implements ContentSource {
  async getPage(slug: string, opts: ContentQueryOptions = {}): Promise<RawPage | null> {
    const client = getContentfulClient(opts.preview ?? false);
    const query = {
      content_type: LANDING_PAGE_TYPE,
      "fields.slug": slug,
      include: 2,
      limit: 1,
    } as EntriesQuery;

    try {
      const res = await client.getEntries(query);
      const entry = res.items[0] as LandingPageEntry | undefined;
      return entry ? mapLandingPageEntry(entry) : null;
    } catch (err) {
      if (isMissingModelError(err)) {
        warnMissingModel();
        return null; // → route renders not-found instead of crashing
      }
      throw err;
    }
  }

  async listPages(opts: ContentQueryOptions = {}): Promise<PageSummary[]> {
    const client = getContentfulClient(opts.preview ?? false);
    const query = {
      content_type: LANDING_PAGE_TYPE,
      include: 0,
      limit: 100,
      select: ["sys.id", "fields.slug", "fields.title"],
    } as EntriesQuery;

    try {
      const res = await client.getEntries(query);
      return (res.items as LandingPageEntry[]).map((entry) => ({
        pageId: entry.sys.id,
        slug: String(entry.fields.slug ?? ""),
        title: String(entry.fields.title ?? ""),
      }));
    } catch (err) {
      if (isMissingModelError(err)) {
        warnMissingModel();
        return []; // → home renders an empty list instead of crashing
      }
      throw err;
    }
  }
}

/**
 * The space is reachable but the `landingPage` content type does not exist yet
 * (Contentful replies `unknownContentType`). Treat this as "no content" so the
 * app stays up while the model is being created — any other error propagates.
 */
function isMissingModelError(err: unknown): boolean {
  const text =
    err instanceof Error ? err.message : typeof err === "string" ? err : JSON.stringify(err ?? "");
  return /unknownContentType/i.test(text);
}

let warned = false;
function warnMissingModel() {
  if (warned) return;
  warned = true;
  console.warn(
    `[Contentful] Content type "${LANDING_PAGE_TYPE}" not found in this space.\n` +
      `Create the model (see docs/CONTENTFUL.md) or set USE_FIXTURE_CONTENT=true to use fixtures.`,
  );
}
