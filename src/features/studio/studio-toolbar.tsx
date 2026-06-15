"use client";

import Link from "next/link";
import { ArrowLeft, Monitor, RotateCcw, Rocket, Smartphone, Tablet } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { uiActions, type ViewportMode } from "@/store/slices/uiSlice";
import { draftPageActions } from "@/store/slices/draftPageSlice";
import { selectDraftPage, selectIsDirty } from "@/store/selectors";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { PublishDialog } from "./publish-dialog";

const VIEWPORTS: { mode: ViewportMode; label: string; icon: typeof Monitor }[] = [
  { mode: "desktop", label: "Desktop", icon: Monitor },
  { mode: "tablet", label: "Tablet", icon: Tablet },
  { mode: "mobile", label: "Mobile", icon: Smartphone },
];

export function StudioToolbar({
  canPublish,
  latestVersion,
}: {
  canPublish: boolean;
  latestVersion: string | null;
}) {
  const dispatch = useAppDispatch();
  const page = useAppSelector(selectDraftPage);
  const isDirty = useAppSelector(selectIsDirty);
  const viewport = useAppSelector((s) => s.ui.viewport);

  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
      <div className="flex h-16 items-center gap-3 px-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/">
            <ArrowLeft aria-hidden />
            <span className="sr-only sm:not-sr-only">Exit</span>
          </Link>
        </Button>

        <Separator orientation="vertical" className="h-6" />

        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{page?.title ?? "Untitled"}</p>
          <p className="text-xs text-muted-foreground">
            /{page?.slug}
            {latestVersion ? ` · published v${latestVersion}` : " · never published"}
          </p>
        </div>

        {isDirty ? (
          <Badge variant="minor" aria-live="polite">
            Unsaved changes
          </Badge>
        ) : (
          <Badge variant="outline" aria-live="polite">
            Saved
          </Badge>
        )}

        <div className="ml-auto flex items-center gap-2">
          {/* Viewport switcher */}
          <div
            role="group"
            aria-label="Preview viewport"
            className="hidden items-center gap-1 rounded-lg border p-1 sm:flex"
          >
            {VIEWPORTS.map(({ mode, label, icon: Icon }) => (
              <Button
                key={mode}
                size="icon"
                variant={viewport === mode ? "secondary" : "ghost"}
                aria-pressed={viewport === mode}
                aria-label={`${label} preview`}
                className="size-8"
                onClick={() => dispatch(uiActions.setViewport(mode))}
              >
                <Icon className={cn("size-4")} aria-hidden />
              </Button>
            ))}
          </div>

          <Button
            variant="ghost"
            size="sm"
            disabled={!isDirty}
            onClick={() => dispatch(draftPageActions.resetDraft())}
          >
            <RotateCcw aria-hidden />
            <span className="sr-only sm:not-sr-only">Reset</span>
          </Button>

          <Button
            variant="brand"
            size="sm"
            disabled={!canPublish}
            title={canPublish ? undefined : "Requires the publisher role"}
            onClick={() => dispatch(uiActions.setPublishDialogOpen(true))}
          >
            <Rocket aria-hidden />
            Publish
          </Button>
        </div>
      </div>

      <PublishDialog canPublish={canPublish} latestVersion={latestVersion} />
    </header>
  );
}
