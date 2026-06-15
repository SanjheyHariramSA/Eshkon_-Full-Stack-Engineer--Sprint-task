import type { Change, Severity } from "@/core/semver/diff";
import type { Page } from "@/core/schema";

/** Shared publish contract used by the client (Redux) and the server (action). */

export interface ReleaseSnapshot {
  slug: string;
  version: string;
  /** Severity that produced this version relative to the previous release. */
  bump: Severity;
  /** Canonical content hash — drives idempotency. */
  contentHash: string;
  /** ISO timestamp the release was frozen. */
  createdAt: string;
  /** The immutable page document at publish time. */
  page: Page;
  changelog: Change[];
  /** Author identity (sub/email) captured for the audit trail. */
  publishedBy: string;
}

export interface PublishResult {
  version: string;
  bump: Severity;
  changelog: Change[];
  contentHash: string;
  createdAt: string;
  /** True when the draft was identical to the latest release (no new version). */
  idempotent: boolean;
}

export type PublishActionResult =
  | { ok: true; result: PublishResult }
  | { ok: false; error: string; code: "forbidden" | "validation" | "unknown" };
