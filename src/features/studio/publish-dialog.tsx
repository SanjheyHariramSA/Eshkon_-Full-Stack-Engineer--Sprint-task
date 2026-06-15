"use client";

import * as React from "react";
import { Loader2, Rocket } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { uiActions } from "@/store/slices/uiSlice";
import { draftPageActions } from "@/store/slices/draftPageSlice";
import { publishDraft } from "@/store/slices/publishSlice";
import { selectDiffPreview, selectDraftPage } from "@/store/selectors";
import { clearPersistedDraft } from "@/store/persistence";
import { applyBump, formatVersion, parseVersion, type Severity } from "@/core/semver/diff";
import { useToast } from "@/components/ui/use-toast";

const BUMP_COPY: Record<Severity, string> = {
  major: "Major — breaking change (section removed, type changed, or required prop broken)",
  minor: "Minor — additive change (section or optional prop added)",
  patch: "Patch — content/prop change",
  none: "No changes detected",
};

export function PublishDialog({
  canPublish,
  latestVersion,
}: {
  canPublish: boolean;
  latestVersion: string | null;
}) {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const open = useAppSelector((s) => s.ui.publishDialogOpen);
  const status = useAppSelector((s) => s.publish.status);
  const page = useAppSelector(selectDraftPage);
  const diff = useAppSelector(selectDiffPreview);

  const nextVersion = React.useMemo(() => {
    if (!diff) return null;
    if (!latestVersion) return "1.0.0"; // initial release
    if (diff.bump === "none") return latestVersion;
    return formatVersion(applyBump(parseVersion(latestVersion), diff.bump));
  }, [diff, latestVersion]);

  const onPublish = async () => {
    if (!page) return;
    const action = await dispatch(publishDraft({ page }));
    if (publishDraft.fulfilled.match(action)) {
      const { version, idempotent } = action.payload;
      dispatch(draftPageActions.commitBaseline({ page }));
      clearPersistedDraft(page.slug);
      dispatch(uiActions.setPublishDialogOpen(false));
      toast({
        variant: "success",
        title: idempotent ? "No changes to publish" : `Published v${version}`,
        description: idempotent
          ? `Draft is identical to v${version}; no new release created.`
          : `Immutable release v${version} created.`,
      });
    } else {
      toast({
        variant: "destructive",
        title: "Publish failed",
        description: (action.payload as string) ?? "Please try again.",
      });
    }
  };

  const noChanges = diff?.bump === "none";

  return (
    <Dialog open={open} onOpenChange={(o) => dispatch(uiActions.setPublishDialogOpen(o))}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Publish release</DialogTitle>
          <DialogDescription>
            Freeze the current draft into an immutable, versioned release. The version is computed
            deterministically from the diff.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-4">
            <div>
              <p className="text-sm text-muted-foreground">Next version</p>
              <p className="text-2xl font-bold tabular-nums">
                {latestVersion ? `v${latestVersion}` : "—"} → {nextVersion ? `v${nextVersion}` : "—"}
              </p>
            </div>
            {diff ? (
              <Badge
                variant={diff.bump === "none" ? "outline" : (diff.bump as "major" | "minor" | "patch")}
                className="uppercase"
              >
                {diff.bump}
              </Badge>
            ) : null}
          </div>

          <p className="text-sm text-muted-foreground">{diff ? BUMP_COPY[diff.bump] : ""}</p>

          <div>
            <h3 className="mb-2 text-sm font-semibold">
              Changelog ({diff?.changes.length ?? 0})
            </h3>
            {diff && diff.changes.length > 0 ? (
              <ul className="max-h-56 space-y-1.5 overflow-y-auto rounded-lg border p-3 text-sm">
                {diff.changes.map((c, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Badge
                      variant={c.severity === "none" ? "outline" : (c.severity as "major" | "minor" | "patch")}
                      className="mt-0.5 shrink-0 uppercase"
                    >
                      {c.severity}
                    </Badge>
                    <span>{c.detail}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                No differences from the last release.
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => dispatch(uiActions.setPublishDialogOpen(false))}>
            Cancel
          </Button>
          <Button
            variant="brand"
            onClick={onPublish}
            disabled={!canPublish || status === "publishing" || noChanges}
          >
            {status === "publishing" ? (
              <Loader2 className="animate-spin" aria-hidden />
            ) : (
              <Rocket aria-hidden />
            )}
            {status === "publishing" ? "Publishing…" : "Publish release"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
