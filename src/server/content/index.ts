import "server-only";
import { env, hasContentfulCredentials } from "@/server/env";
import { ContentfulContentSource } from "./contentful-content-source";
import { FixtureContentSource } from "./fixture-content-source";
import type { ContentSource } from "./content-source";

export type { ContentSource, ContentQueryOptions, PageSummary } from "./content-source";

let instance: ContentSource | null = null;

/**
 * Composition root for content. Selects the implementation once and memoises it.
 * Fixtures win when explicitly requested OR when credentials are absent, so the
 * app is always runnable out of the box.
 */
export function getContentSource(): ContentSource {
  if (instance) return instance;
  const useFixtures = env.USE_FIXTURE_CONTENT || !hasContentfulCredentials;
  instance = useFixtures ? new FixtureContentSource() : new ContentfulContentSource();
  return instance;
}
