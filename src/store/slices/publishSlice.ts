import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Change, Severity } from "@/core/semver/diff";
import type { Page } from "@/core/schema";
import type { PublishResult } from "@/core/publish/types";
import { publishPageAction } from "@/server/actions/publish-action";

/**
 * publish slice (Brief §3) — drives the freeze/version/snapshot flow.
 *
 * `preview` holds a client-side diff (instant feedback in the publish dialog).
 * The server recomputes the diff authoritatively during `publishDraft`, so the
 * client preview is advisory only — never the source of truth for the version.
 */

export type PublishStatus = "idle" | "publishing" | "success" | "error";

export interface DiffPreview {
  bump: Severity;
  changes: Change[];
  nextVersion: string | null;
}

export interface PublishState {
  status: PublishStatus;
  error: string | null;
  preview: DiffPreview | null;
  lastResult: PublishResult | null;
}

const initialState: PublishState = {
  status: "idle",
  error: null,
  preview: null,
  lastResult: null,
};

/**
 * Async publish. Delegates to a server action which enforces RBAC, recomputes
 * the diff, and writes the immutable snapshot. The client never trusts its own
 * version computation.
 */
export const publishDraft = createAsyncThunk<
  PublishResult,
  { page: Page },
  { rejectValue: string }
>("publish/publishDraft", async ({ page }, { rejectWithValue }) => {
  const res = await publishPageAction({ page });
  if (!res.ok) return rejectWithValue(res.error);
  return res.result;
});

const publishSlice = createSlice({
  name: "publish",
  initialState,
  reducers: {
    setPreview(state, action: PayloadAction<DiffPreview | null>) {
      state.preview = action.payload;
    },
    clearPublishState(state) {
      state.status = "idle";
      state.error = null;
      state.lastResult = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(publishDraft.pending, (state) => {
        state.status = "publishing";
        state.error = null;
      })
      .addCase(publishDraft.fulfilled, (state, action) => {
        state.status = "success";
        state.lastResult = action.payload;
        state.preview = null;
      })
      .addCase(publishDraft.rejected, (state, action) => {
        state.status = "error";
        state.error = action.payload ?? action.error.message ?? "Publish failed";
      });
  },
});

export const publishActions = publishSlice.actions;
export default publishSlice.reducer;
