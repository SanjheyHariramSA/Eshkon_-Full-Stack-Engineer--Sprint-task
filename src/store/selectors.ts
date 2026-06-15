import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "./store";
import { diffPages } from "@/core/semver/diff";

/** Memoised selectors — keep derived logic out of components. */

export const selectDraftPage = (s: RootState) => s.draftPage.page;
export const selectBaseline = (s: RootState) => s.draftPage.baseline;
export const selectDraftStatus = (s: RootState) => s.draftPage.status;
export const selectSelectedSectionId = (s: RootState) => s.ui.selectedSectionId;

export const selectSelectedSection = createSelector(
  [selectDraftPage, selectSelectedSectionId],
  (page, id) => (page && id ? (page.sections.find((s) => s.id === id) ?? null) : null),
);

/** Is the draft different from the last loaded/published baseline? */
export const selectIsDirty = createSelector(
  [selectDraftPage, selectBaseline],
  (page, baseline) => {
    if (!page) return false;
    if (!baseline) return true;
    return diffPages(baseline, page).bump !== "none";
  },
);

/** Client-side diff preview (advisory; server is authoritative). */
export const selectDiffPreview = createSelector(
  [selectBaseline, selectDraftPage],
  (baseline, page) => (page ? diffPages(baseline, page) : null),
);
