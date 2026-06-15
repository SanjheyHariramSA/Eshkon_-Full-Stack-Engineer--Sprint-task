import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

/**
 * ui slice (Brief §3) — ephemeral editor UI state only. Never persisted to the
 * server; deliberately separate from `draftPage` so re-renders of selection /
 * viewport state don't churn the document model.
 */

export type ViewportMode = "desktop" | "tablet" | "mobile";

export interface UiState {
  selectedSectionId: string | null;
  addSectionOpen: boolean;
  publishDialogOpen: boolean;
  viewport: ViewportMode;
  /** Toggle the live preview vs. the structural outline in the Studio. */
  showOutline: boolean;
}

const initialState: UiState = {
  selectedSectionId: null,
  addSectionOpen: false,
  publishDialogOpen: false,
  viewport: "desktop",
  showOutline: true,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    selectSection(state, action: PayloadAction<string | null>) {
      state.selectedSectionId = action.payload;
    },
    setAddSectionOpen(state, action: PayloadAction<boolean>) {
      state.addSectionOpen = action.payload;
    },
    setPublishDialogOpen(state, action: PayloadAction<boolean>) {
      state.publishDialogOpen = action.payload;
    },
    setViewport(state, action: PayloadAction<ViewportMode>) {
      state.viewport = action.payload;
    },
    toggleOutline(state) {
      state.showOutline = !state.showOutline;
    },
  },
});

export const uiActions = uiSlice.actions;
export default uiSlice.reducer;
