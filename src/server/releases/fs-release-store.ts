import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { ReleaseSnapshot } from "@/core/publish/types";
import {
  ImmutableReleaseError,
  type ReleaseIndex,
  type ReleaseMeta,
  type ReleaseStore,
} from "./release-store";

/**
 * Filesystem-backed release store (Brief §5).
 *
 * Layout:
 *   releases/<slug>/<version>.json   ← immutable snapshot
 *   releases/<slug>/index.json       ← derived index (latest + history)
 *
 * Immutability: `save` opens version files with the "wx" flag, which fails if
 * the file already exists. Combined with idempotent publish (the service never
 * even attempts a write when content is unchanged) this guarantees a version is
 * written exactly once.
 *
 * Vercel note: the serverless filesystem is read-only except /tmp, so on Vercel
 * you'd select a durable driver (S3/KV) via the factory. Filesystem is ideal for
 * local dev, CI, and self-hosted deploys, and keeps the audit trail in-repo.
 */
export class FsReleaseStore implements ReleaseStore {
  constructor(private readonly rootDir = path.join(process.cwd(), "releases")) {}

  private dirFor(slug: string) {
    return path.join(this.rootDir, sanitizeSlug(slug));
  }
  private fileFor(slug: string, version: string) {
    return path.join(this.dirFor(slug), `${version}.json`);
  }
  private indexFile(slug: string) {
    return path.join(this.dirFor(slug), "index.json");
  }

  async getLatest(slug: string): Promise<ReleaseSnapshot | null> {
    const index = await this.list(slug);
    if (!index.latest) return null;
    return this.getVersion(slug, index.latest);
  }

  async getVersion(slug: string, version: string): Promise<ReleaseSnapshot | null> {
    try {
      const raw = await fs.readFile(this.fileFor(slug, version), "utf8");
      return JSON.parse(raw) as ReleaseSnapshot;
    } catch {
      return null;
    }
  }

  async list(slug: string): Promise<ReleaseIndex> {
    try {
      const raw = await fs.readFile(this.indexFile(slug), "utf8");
      return JSON.parse(raw) as ReleaseIndex;
    } catch {
      return { slug, latest: null, releases: [] };
    }
  }

  async save(snapshot: ReleaseSnapshot): Promise<void> {
    const { slug, version } = snapshot;
    await fs.mkdir(this.dirFor(slug), { recursive: true });

    // "wx" → write, fail if exists. Enforces immutability at the OS level.
    try {
      await fs.writeFile(this.fileFor(slug, version), JSON.stringify(snapshot, null, 2), {
        flag: "wx",
      });
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "EEXIST") {
        throw new ImmutableReleaseError(slug, version);
      }
      throw err;
    }

    await this.appendToIndex(snapshot);
  }

  private async appendToIndex(snapshot: ReleaseSnapshot): Promise<void> {
    const index = await this.list(snapshot.slug);
    const meta: ReleaseMeta = {
      version: snapshot.version,
      createdAt: snapshot.createdAt,
      bump: snapshot.bump,
      contentHash: snapshot.contentHash,
      publishedBy: snapshot.publishedBy,
      summary: summarize(snapshot),
    };
    index.releases = [meta, ...index.releases.filter((r) => r.version !== meta.version)];
    index.latest = snapshot.version;
    await fs.writeFile(this.indexFile(snapshot.slug), JSON.stringify(index, null, 2), "utf8");
  }
}

function summarize(snapshot: ReleaseSnapshot): string {
  const counts = snapshot.changelog.reduce<Record<string, number>>((acc, c) => {
    acc[c.severity] = (acc[c.severity] ?? 0) + 1;
    return acc;
  }, {});
  const parts = Object.entries(counts).map(([sev, n]) => `${n} ${sev}`);
  return parts.length ? parts.join(", ") : "no changes";
}

function sanitizeSlug(slug: string): string {
  // Defence against path traversal; slugs are validated upstream but belt+braces.
  return slug.replace(/[^a-zA-Z0-9-_]/g, "_");
}
