import { createSlice, nanoid, type PayloadAction } from "@reduxjs/toolkit";
import type { Page, Section, SectionType } from "@/core/schema";
import { sectionRegistry } from "@/registry/sectionRegistry";

/**
 * draftPage slice (Brief §3) — the editable working copy of a page.
 *
 * Responsibilities:
 *   • Hold the current draft `page` plus a `baseline` (the last loaded/published
 *     version) used for dirty-detection and as the "previous" input to the diff.
 *   • Expose all structural + prop mutations as reducers so NOTHING mutates the
 *     page outside Redux (Brief §3: "No direct mutation outside Redux").
 *
 * Immer (built into RTK) lets reducers be written as mutations while producing
 * immutable updates under the hood.
 */

export type DraftStatus = "idle" | "loading" | "ready" | "error";

export interface DraftPageState {
  slug: string | null;
  page: Page | null;
  /** Last server-known version of this page; basis for dirty + diff. */
  baseline: Page | null;
  status: DraftStatus;
  error: string | null;
  /** Epoch ms of last local edit; used by persistence + "unsaved" UI. */
  lastEditedAt: number | null;
}

const initialState: DraftPageState = {
  slug: null,
  page: null,
  baseline: null,
  status: "idle",
  error: null,
  lastEditedAt: null,
};

function newSection(type: SectionType): Section {
  // createDefault returns schema-valid props for the type; id is unique.
  const props = sectionRegistry[type].createDefault();
  return { id: `${type}-${nanoid(6)}`, type, props } as Section;
}

const draftPageSlice = createSlice({
  name: "draftPage",
  initialState,
  reducers: {
    loadStart(state, action: PayloadAction<{ slug: string }>) {
      state.slug = action.payload.slug;
      state.status = "loading";
      state.error = null;
    },
    /** Set both draft and baseline from a freshly-loaded server page. */
    loadSuccess(state, action: PayloadAction<{ page: Page }>) {
      state.page = action.payload.page;
      state.baseline = action.payload.page;
      state.slug = action.payload.page.slug;
      state.status = "ready";
      state.error = null;
      state.lastEditedAt = null;
    },
    loadError(state, action: PayloadAction<{ error: string }>) {
      state.status = "error";
      state.error = action.payload.error;
    },
    /** Rehydrate a persisted draft (keeps server baseline separate). */
    hydrateDraft(state, action: PayloadAction<{ page: Page; baseline: Page | null; lastEditedAt: number | null }>) {
      state.page = action.payload.page;
      state.baseline = action.payload.baseline;
      state.slug = action.payload.page.slug;
      state.status = "ready";
      state.lastEditedAt = action.payload.lastEditedAt;
    },

    addSection: {
      reducer(state, action: PayloadAction<{ section: Section; index?: number }>) {
        if (!state.page) return;
        const { section, index } = action.payload;
        if (index === undefined || index < 0 || index >= state.page.sections.length) {
          state.page.sections.push(section);
        } else {
          state.page.sections.splice(index, 0, section);
        }
        state.lastEditedAt = Date.now();
      },
      // prepare lets callers pass just a type; the section is built here.
      prepare(payload: { type: SectionType; index?: number }) {
        return { payload: { section: newSection(payload.type), index: payload.index } };
      },
    },

    removeSection(state, action: PayloadAction<{ id: string }>) {
      if (!state.page) return;
      state.page.sections = state.page.sections.filter((s) => s.id !== action.payload.id);
      state.lastEditedAt = Date.now();
    },

    duplicateSection(state, action: PayloadAction<{ id: string }>) {
      if (!state.page) return;
      const idx = state.page.sections.findIndex((s) => s.id === action.payload.id);
      if (idx === -1) return;
      const original = state.page.sections[idx]!;
      const copy = { ...original, id: `${original.type}-${nanoid(6)}` } as Section;
      state.page.sections.splice(idx + 1, 0, copy);
      state.lastEditedAt = Date.now();
    },

    /** Reorder via dnd-kit indices (arrayMove semantics). */
    reorderSections(state, action: PayloadAction<{ oldIndex: number; newIndex: number }>) {
      if (!state.page) return;
      const { oldIndex, newIndex } = action.payload;
      const list = state.page.sections;
      if (oldIndex < 0 || oldIndex >= list.length || newIndex < 0 || newIndex >= list.length) return;
      const [moved] = list.splice(oldIndex, 1);
      if (moved) list.splice(newIndex, 0, moved);
      state.lastEditedAt = Date.now();
    },

    /** Update a single prop by key (drives the declarative field editor). */
    updateSectionProp(
      state,
      action: PayloadAction<{ id: string; key: string; value: unknown }>,
    ) {
      if (!state.page) return;
      const section = state.page.sections.find((s) => s.id === action.payload.id);
      if (!section) return;
      (section.props as Record<string, unknown>)[action.payload.key] = action.payload.value;
      state.lastEditedAt = Date.now();
    },

    /** Patch multiple props at once. */
    updateSectionProps(
      state,
      action: PayloadAction<{ id: string; props: Record<string, unknown> }>,
    ) {
      if (!state.page) return;
      const section = state.page.sections.find((s) => s.id === action.payload.id);
      if (!section) return;
      Object.assign(section.props, action.payload.props);
      state.lastEditedAt = Date.now();
    },

    updatePageMeta(state, action: PayloadAction<{ title?: string }>) {
      if (!state.page) return;
      if (action.payload.title !== undefined) state.page.title = action.payload.title;
      state.lastEditedAt = Date.now();
    },

    /** Discard local edits, revert to the server baseline. */
    resetDraft(state) {
      if (state.baseline) {
        state.page = structuredCloneSafe(state.baseline);
        state.lastEditedAt = null;
      }
    },

    /** After a successful publish, the new snapshot becomes the baseline. */
    commitBaseline(state, action: PayloadAction<{ page: Page }>) {
      state.baseline = action.payload.page;
      state.page = action.payload.page;
      state.lastEditedAt = null;
    },
  },
});

function structuredCloneSafe<T>(value: T): T {
  return typeof structuredClone === "function"
    ? structuredClone(value)
    : (JSON.parse(JSON.stringify(value)) as T);
}

export const draftPageActions = draftPageSlice.actions;
export default draftPageSlice.reducer;
