import type { ReleaseSnapshot } from "@/core/publish/types";

/**
 * Release store port. Snapshots are IMMUTABLE: once a version is written it is
 * never overwritten (the fs implementation throws on a write to an existing
 * version). Swapping storage (filesystem ↔ S3/KV/DB) is a one-line factory
 * change with no impact on the publish service.
 */
export interface ReleaseMeta {
  version: string;
  createdAt: string;
  bump: string;
  contentHash: string;
  publishedBy: string;
  summary: string;
}

export interface ReleaseIndex {
  slug: string;
  latest: string | null;
  releases: ReleaseMeta[];
}

export interface ReleaseStore {
  /** Most recent release for a slug, or null if none has been published. */
  getLatest(slug: string): Promise<ReleaseSnapshot | null>;
  getVersion(slug: string, version: string): Promise<ReleaseSnapshot | null>;
  list(slug: string): Promise<ReleaseIndex>;
  /** Persist an immutable snapshot. MUST reject if the version already exists. */
  save(snapshot: ReleaseSnapshot): Promise<void>;
}

export class ImmutableReleaseError extends Error {
  constructor(slug: string, version: string) {
    super(`Release ${slug}@${version} already exists and is immutable.`);
    this.name = "ImmutableReleaseError";
  }
}
