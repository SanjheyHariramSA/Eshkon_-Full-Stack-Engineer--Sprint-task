import type { Middleware } from "@reduxjs/toolkit";
import type { Page } from "@/core/schema";
import type { RootState } from "./store";

/**
 * Draft persistence (Brief §3: "Draft persists (reload safe)").
 *
 * Strategy: persist the `draftPage` slice to localStorage, keyed per slug, on
 * every draft mutation. On Studio mount we rehydrate if a newer local draft
 * exists. We persist both `page` and `baseline` so dirty-detection and the diff
 * survive a reload. localStorage (not the server) is the right home for an
 * unsaved draft: it's per-device, instant, and never blocks the editor.
 */

const STORAGE_PREFIX = "page-studio:draft:";
const SCHEMA_VERSION = 1;

export interface PersistedDraft {
  schemaVersion: number;
  slug: string;
  page: Page;
  baseline: Page | null;
  lastEditedAt: number | null;
}

const keyFor = (slug: string) => `${STORAGE_PREFIX}${slug}`;
const isBrowser = () => typeof window !== "undefined";

export function loadPersistedDraft(slug: string): PersistedDraft | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(keyFor(slug));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedDraft;
    if (parsed.schemaVersion !== SCHEMA_VERSION || parsed.slug !== slug) return null;
    return parsed;
  } catch {
    return null; // corrupt entry → ignore, fall back to server load
  }
}

export function clearPersistedDraft(slug: string): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(keyFor(slug));
  } catch {
    /* ignore quota / privacy-mode errors */
  }
}

function savePersistedDraft(state: RootState): void {
  if (!isBrowser()) return;
  const { slug, page, baseline, lastEditedAt } = state.draftPage;
  if (!slug || !page) return;
  // Only persist actual local edits, not pristine server loads.
  if (lastEditedAt === null) return;
  const payload: PersistedDraft = { schemaVersion: SCHEMA_VERSION, slug, page, baseline, lastEditedAt };
  try {
    window.localStorage.setItem(keyFor(slug), JSON.stringify(payload));
  } catch {
    /* ignore quota errors */
  }
}

/** Middleware: persist after any draftPage mutation. */
export const persistenceMiddleware: Middleware =
  (store) => (next) => (action) => {
    const result = next(action);
    if (typeof (action as { type?: string }).type === "string" &&
        (action as { type: string }).type.startsWith("draftPage/")) {
      savePersistedDraft(store.getState() as RootState);
    }
    return result;
  };
