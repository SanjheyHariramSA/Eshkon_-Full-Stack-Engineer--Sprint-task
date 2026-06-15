import "server-only";
import { createClient, type ContentfulClientApi } from "contentful";
import { env, hasContentfulCredentials } from "@/server/env";

/**
 * Contentful client factory (Brief §2: "Explicit adapter (contentfulClient.ts)").
 *
 * Two clients are created lazily and memoised:
 *   • delivery (CDA) → published content
 *   • preview  (CPA) → draft content (preview.contentful.com host)
 *
 * Choosing draft vs published is a single boolean here. NOTHING else in the app
 * decides which host/token to use — that knowledge is isolated to this file, so
 * "switching environments or preview mode is isolated to adapter" holds.
 */

let deliveryClient: ContentfulClientApi<undefined> | null = null;
let previewClient: ContentfulClientApi<undefined> | null = null;

function assertCredentials() {
  if (!hasContentfulCredentials) {
    throw new Error(
      "Contentful credentials are missing. Set CONTENTFUL_SPACE_ID and CONTENTFUL_CDA_TOKEN " +
        "(and CONTENTFUL_CPA_TOKEN for preview), or set USE_FIXTURE_CONTENT=true for local/e2e.",
    );
  }
}

export function getDeliveryClient(): ContentfulClientApi<undefined> {
  assertCredentials();
  if (!deliveryClient) {
    deliveryClient = createClient({
      space: env.CONTENTFUL_SPACE_ID!,
      environment: env.CONTENTFUL_ENVIRONMENT,
      accessToken: env.CONTENTFUL_CDA_TOKEN!,
    });
  }
  return deliveryClient;
}

export function getPreviewClient(): ContentfulClientApi<undefined> {
  assertCredentials();
  if (!env.CONTENTFUL_CPA_TOKEN) {
    throw new Error("CONTENTFUL_CPA_TOKEN is required for preview (draft) content.");
  }
  if (!previewClient) {
    previewClient = createClient({
      space: env.CONTENTFUL_SPACE_ID!,
      environment: env.CONTENTFUL_ENVIRONMENT,
      accessToken: env.CONTENTFUL_CPA_TOKEN,
      host: "preview.contentful.com",
    });
  }
  return previewClient;
}

/** Single decision point for draft vs published. */
export function getContentfulClient(preview: boolean): ContentfulClientApi<undefined> {
  return preview ? getPreviewClient() : getDeliveryClient();
}
