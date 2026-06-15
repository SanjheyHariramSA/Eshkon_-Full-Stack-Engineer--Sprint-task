import type { ReleaseSnapshot } from "@/core/publish/types";
import {
  ImmutableReleaseError,
  type ReleaseIndex,
  type ReleaseMeta,
  type ReleaseStore,
} from "./release-store";

/**
 * In-memory release store for unit tests and e2e (RELEASE_STORE_DRIVER=memory).
 * Same immutability contract as the fs store: re-saving a version throws.
 */
export class MemoryReleaseStore implements ReleaseStore {
  private readonly data = new Map<string, Map<string, ReleaseSnapshot>>();

  async getLatest(slug: string): Promise<ReleaseSnapshot | null> {
    const versions = this.data.get(slug);
    if (!versions || versions.size === 0) return null;
    const latest = [...versions.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    return latest[latest.length - 1] ?? null;
  }

  async getVersion(slug: string, version: string): Promise<ReleaseSnapshot | null> {
    return this.data.get(slug)?.get(version) ?? null;
  }

  async list(slug: string): Promise<ReleaseIndex> {
    const versions = this.data.get(slug);
    if (!versions) return { slug, latest: null, releases: [] };
    const ordered = [...versions.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const releases: ReleaseMeta[] = ordered.map((s) => ({
      version: s.version,
      createdAt: s.createdAt,
      bump: s.bump,
      contentHash: s.contentHash,
      publishedBy: s.publishedBy,
      summary: `${s.changelog.length} change(s)`,
    }));
    return { slug, latest: ordered[0]?.version ?? null, releases };
  }

  async save(snapshot: ReleaseSnapshot): Promise<void> {
    const versions = this.data.get(snapshot.slug) ?? new Map<string, ReleaseSnapshot>();
    if (versions.has(snapshot.version)) {
      throw new ImmutableReleaseError(snapshot.slug, snapshot.version);
    }
    versions.set(snapshot.version, snapshot);
    this.data.set(snapshot.slug, versions);
  }
}
