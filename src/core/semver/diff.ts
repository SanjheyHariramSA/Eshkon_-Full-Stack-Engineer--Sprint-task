import { REQUIRED_PROPS, type Page, type Section, type SectionType } from "../schema";
import { deepEqual, stableStringify } from "./stable-json";

/**
 * Deterministic SemVer diff (Brief §5).
 *
 * Fixed rules:
 *   • PATCH → text / prop value change, section reorder
 *   • MINOR → section added, optional prop added
 *   • MAJOR → section removed, section type changed, required prop broken
 *
 * Determinism guarantees:
 *   • Sections are matched by stable `id`, never by position.
 *   • Prop values compared via canonical (key-sorted) JSON — no key-order noise.
 *   • Severity is a pure max-reduction over a deterministically-ordered change
 *     list. No clock, no randomness, no environment reads.
 * Same (prev, next) ⇒ same version, same changelog, every time.
 */

export type Severity = "none" | "patch" | "minor" | "major";

const SEVERITY_RANK: Record<Severity, number> = { none: 0, patch: 1, minor: 2, major: 3 };

export type ChangeKind =
  | "initial-release"
  | "section-added"
  | "section-removed"
  | "section-type-changed"
  | "section-reordered"
  | "required-prop-broken"
  | "optional-prop-added"
  | "prop-changed";

export interface Change {
  kind: ChangeKind;
  severity: Severity;
  sectionId?: string;
  prop?: string;
  detail: string;
}

export interface SemVer {
  major: number;
  minor: number;
  patch: number;
}

export interface DiffResult {
  /** Highest severity across all changes. "none" ⇒ identical ⇒ idempotent. */
  bump: Severity;
  changes: Change[];
  /** Canonical hash of `next` — used by the publish flow for idempotency. */
  contentHash: string;
}

export const INITIAL_VERSION: SemVer = { major: 1, minor: 0, patch: 0 };

// ─── Version helpers ─────────────────────────────────────────────────────────
export function parseVersion(v: string): SemVer {
  const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(v.trim());
  if (!m) throw new Error(`Invalid SemVer string: "${v}"`);
  return { major: Number(m[1]), minor: Number(m[2]), patch: Number(m[3]) };
}

export function formatVersion(v: SemVer): string {
  return `${v.major}.${v.minor}.${v.patch}`;
}

export function applyBump(current: SemVer, bump: Severity): SemVer {
  switch (bump) {
    case "major":
      return { major: current.major + 1, minor: 0, patch: 0 };
    case "minor":
      return { major: current.major, minor: current.minor + 1, patch: 0 };
    case "patch":
      return { major: current.major, minor: current.minor, patch: current.patch + 1 };
    case "none":
      return current;
  }
}

// ─── Core diff ───────────────────────────────────────────────────────────────
export function diffPages(prev: Page | null, next: Page): DiffResult {
  const contentHash = hashPage(next);

  if (prev === null) {
    return {
      bump: "major",
      contentHash,
      changes: [
        {
          kind: "initial-release",
          severity: "major",
          detail: "Initial release",
        },
      ],
    };
  }

  const changes: Change[] = [];
  const prevById = indexById(prev.sections);
  const nextById = indexById(next.sections);

  // Iterate ids in a deterministic order: previous order first, then any new
  // ids in their next-order. Guarantees a stable changelog ordering.
  const orderedIds = dedupe([
    ...prev.sections.map((s) => s.id),
    ...next.sections.map((s) => s.id),
  ]);

  for (const id of orderedIds) {
    const before = prevById.get(id);
    const after = nextById.get(id);

    if (before && !after) {
      changes.push({
        kind: "section-removed",
        severity: "major",
        sectionId: id,
        detail: `Section "${id}" (${before.type}) removed`,
      });
      continue;
    }
    if (!before && after) {
      changes.push({
        kind: "section-added",
        severity: "minor",
        sectionId: id,
        detail: `Section "${id}" (${after.type}) added`,
      });
      continue;
    }
    if (before && after) {
      if (before.type !== after.type) {
        changes.push({
          kind: "section-type-changed",
          severity: "major",
          sectionId: id,
          detail: `Section "${id}" type changed: ${before.type} → ${after.type}`,
        });
        continue; // type change supersedes prop-level diffing
      }
      changes.push(...diffProps(id, before.type, before.props, after.props));
    }
  }

  // Reorder detection: same set of common ids, different relative sequence.
  if (isReordered(prev.sections, next.sections)) {
    changes.push({
      kind: "section-reordered",
      severity: "patch",
      detail: "Section order changed",
    });
  }

  return { bump: maxSeverity(changes), changes, contentHash };
}

function diffProps(
  sectionId: string,
  type: SectionType,
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): Change[] {
  const changes: Change[] = [];
  const required = new Set(REQUIRED_PROPS[type]);
  const keys = dedupe([...Object.keys(before), ...Object.keys(after)]);

  for (const key of keys) {
    const inBefore = key in before;
    const inAfter = key in after;

    // A genuinely new prop key — additive (Brief: "add optional prop" → MINOR).
    if (!inBefore && inAfter) {
      changes.push({
        kind: "optional-prop-added",
        severity: "minor",
        sectionId,
        prop: key,
        detail: `Prop "${key}" added to "${sectionId}"`,
      });
      continue;
    }

    // A prop key removed entirely: breaking iff it was required.
    if (inBefore && !inAfter) {
      const breaking = required.has(key);
      changes.push({
        kind: breaking ? "required-prop-broken" : "prop-changed",
        severity: breaking ? "major" : "patch",
        sectionId,
        prop: key,
        detail: breaking
          ? `Required prop "${key}" removed from "${sectionId}"`
          : `Optional prop "${key}" removed from "${sectionId}"`,
      });
      continue;
    }

    // Present in both — a value edit. Emptying a required prop is breaking
    // (Brief: "break required prop" → MAJOR); everything else is a plain
    // text/prop change (Brief: "text/prop change" → PATCH), including filling
    // a previously-empty field.
    if (inBefore && inAfter && !deepEqual(before[key], after[key])) {
      const broke = required.has(key) && hasValue(before[key]) && !hasValue(after[key]);
      changes.push({
        kind: broke ? "required-prop-broken" : "prop-changed",
        severity: broke ? "major" : "patch",
        sectionId,
        prop: key,
        detail: broke
          ? `Required prop "${key}" broken on "${sectionId}"`
          : `Prop "${key}" changed on "${sectionId}"`,
      });
    }
  }
  return changes;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function indexById(sections: Section[]): Map<string, Section> {
  return new Map(sections.map((s) => [s.id, s]));
}

function dedupe<T>(items: T[]): T[] {
  return [...new Set(items)];
}

/** A value "counts" unless it is undefined, null, "", or an empty array. */
function hasValue(v: unknown): boolean {
  if (v === undefined || v === null) return false;
  if (typeof v === "string") return v.trim().length > 0;
  if (Array.isArray(v)) return v.length > 0;
  return true;
}

function isReordered(prev: Section[], next: Section[]): boolean {
  const commonPrev = prev.map((s) => s.id).filter((id) => next.some((n) => n.id === id));
  const commonNext = next.map((s) => s.id).filter((id) => prev.some((p) => p.id === id));
  return stableStringify(commonPrev) !== stableStringify(commonNext);
}

export function maxSeverity(changes: Change[]): Severity {
  return changes.reduce<Severity>(
    (acc, c) => (SEVERITY_RANK[c.severity] > SEVERITY_RANK[acc] ? c.severity : acc),
    "none",
  );
}

/** Canonical content hash (FNV-1a 32-bit) of the page's stable JSON. */
export function hashPage(page: Page): string {
  const canonical = stableStringify({
    pageId: page.pageId,
    slug: page.slug,
    title: page.title,
    sections: page.sections.map((s) => ({ id: s.id, type: s.type, props: s.props })),
  });
  let hash = 0x811c9dc5;
  for (let i = 0; i < canonical.length; i++) {
    hash ^= canonical.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}
