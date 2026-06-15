import "server-only";
import type { Page } from "@/core/schema";
import {
  applyBump,
  diffPages,
  formatVersion,
  hashPage,
  INITIAL_VERSION,
  parseVersion,
} from "@/core/semver/diff";
import type { PublishResult, ReleaseSnapshot } from "@/core/publish/types";
import type { ReleaseStore } from "@/server/releases/release-store";

/**
 * Publish service (Brief §5). Pure orchestration over injected dependencies so
 * it is unit-testable without the filesystem or Next runtime.
 *
 * Flow:
 *   1. Load the latest release for the slug.
 *   2. Idempotency gate: if the draft's canonical content hash equals the latest
 *      release's hash, return that release WITHOUT writing — "same draft ≠ new
 *      version".
 *   3. Otherwise compute the deterministic diff, bump the version, freeze an
 *      immutable snapshot, and persist it.
 */

export interface PublishDeps {
  store: ReleaseStore;
  publishedBy: string;
  /** Injectable clock — only affects snapshot metadata, never the version. */
  now?: () => Date;
}

export async function publishPage(page: Page, deps: PublishDeps): Promise<PublishResult> {
  const { store, publishedBy, now = () => new Date() } = deps;

  const latest = await store.getLatest(page.slug);
  const contentHash = hashPage(page);

  // ── Idempotency: identical content ⇒ no new version ──────────────────────
  if (latest && latest.contentHash === contentHash) {
    return {
      version: latest.version,
      bump: "none",
      changelog: [],
      contentHash,
      createdAt: latest.createdAt,
      idempotent: true,
    };
  }

  // ── Deterministic diff + version bump ────────────────────────────────────
  const diff = diffPages(latest?.page ?? null, page);
  const nextVersion = latest
    ? formatVersion(applyBump(parseVersion(latest.version), diff.bump))
    : formatVersion(INITIAL_VERSION);

  const createdAt = now().toISOString();
  const snapshot: ReleaseSnapshot = {
    slug: page.slug,
    version: nextVersion,
    bump: diff.bump,
    contentHash,
    createdAt,
    page,
    changelog: diff.changes,
    publishedBy,
  };

  // Immutable write — store throws if this version already exists.
  await store.save(snapshot);

  return {
    version: nextVersion,
    bump: diff.bump,
    changelog: diff.changes,
    contentHash,
    createdAt,
    idempotent: false,
  };
}
