"use client";

import * as React from "react";
import type { Page } from "@/core/schema";
import { useAppDispatch } from "@/store/hooks";
import { draftPageActions } from "@/store/slices/draftPageSlice";
import { loadPersistedDraft } from "@/store/persistence";
import { StudioToolbar } from "./studio-toolbar";
import { SectionListPanel } from "./section-list-panel";
import { StudioCanvas } from "./studio-canvas";
import { SectionInspector } from "./section-inspector";
import { useAppSelector } from "@/store/hooks";
import { selectDraftStatus } from "@/store/selectors";

/**
 * Studio shell (Brief §3). Three-pane responsive layout:
 *   ┌──────────── Toolbar (sticky) ────────────┐
 *   │ Sections │      Live canvas      │ Inspect │
 *   └──────────┴───────────────────────┴─────────┘
 * On <lg the panes stack vertically; all panes are keyboard reachable.
 *
 * Bootstrap order (reload-safe drafts): a persisted local draft wins over the
 * freshly-loaded server page, but the SERVER page always becomes the `baseline`
 * so dirty-detection and the diff compare against the source of truth.
 */
export function StudioApp({
  initialPage,
  canPublish,
  latestVersion,
}: {
  initialPage: Page;
  canPublish: boolean;
  latestVersion: string | null;
}) {
  const dispatch = useAppDispatch();
  const status = useAppSelector(selectDraftStatus);
  const booted = React.useRef(false);

  React.useEffect(() => {
    if (booted.current) return;
    booted.current = true;

    const persisted = loadPersistedDraft(initialPage.slug);
    if (persisted && persisted.lastEditedAt) {
      dispatch(
        draftPageActions.hydrateDraft({
          page: persisted.page,
          baseline: initialPage, // server is the baseline of record
          lastEditedAt: persisted.lastEditedAt,
        }),
      );
    } else {
      dispatch(draftPageActions.loadSuccess({ page: initialPage }));
    }
  }, [dispatch, initialPage]);

  if (status === "idle" || status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Loading Studio…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <StudioToolbar canPublish={canPublish} latestVersion={latestVersion} />
      <main
        id="main-content"
        className="grid flex-1 grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)_360px]"
      >
        <h1 className="sr-only">Page Studio editor</h1>
        <SectionListPanel />
        <StudioCanvas />
        <SectionInspector />
      </main>
    </div>
  );
}
