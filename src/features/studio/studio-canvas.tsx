"use client";

import { useAppSelector } from "@/store/hooks";
import { selectDraftPage } from "@/store/selectors";
import { pageToValidated } from "@/core/validation";
import { PageRenderer } from "@/components/renderer/page-renderer";
import { ErrorBoundary } from "@/components/renderer/error-boundary";
import { cn } from "@/lib/utils";

const FRAME_WIDTH: Record<string, string> = {
  desktop: "max-w-none",
  tablet: "max-w-3xl",
  mobile: "max-w-sm",
};

/**
 * Center pane: the live preview. Renders the Redux draft through the SAME
 * PageRenderer used by /preview, so "preview reflects Redux draft state" is true
 * by construction. Wrapped in an ErrorBoundary so a malformed prop can never
 * crash the editor.
 */
export function StudioCanvas() {
  const page = useAppSelector(selectDraftPage);
  const viewport = useAppSelector((s) => s.ui.viewport);

  return (
    <section
      aria-label="Live preview"
      className="overflow-y-auto bg-[radial-gradient(ellipse_100%_60%_at_50%_0%,hsl(var(--muted)),hsl(var(--muted)/0.3))] p-4 md:p-8"
    >
      <div
        className={cn(
          "mx-auto overflow-hidden rounded-xl border bg-background shadow-lg transition-[max-width] duration-300 motion-reduce:transition-none",
          FRAME_WIDTH[viewport] ?? FRAME_WIDTH.desktop,
        )}
      >
        {/* Faux browser chrome for the rendered preview. */}
        <div className="flex items-center gap-2 border-b bg-muted/60 px-4 py-2.5">
          <span className="flex gap-1.5" aria-hidden>
            <span className="size-3 rounded-full bg-red-400/80" />
            <span className="size-3 rounded-full bg-amber-400/80" />
            <span className="size-3 rounded-full bg-emerald-400/80" />
          </span>
          <span className="mx-auto flex max-w-xs flex-1 items-center justify-center truncate rounded-md bg-background/80 px-3 py-1 text-xs text-muted-foreground">
            /preview/{page?.slug ?? ""}
          </span>
        </div>
        <ErrorBoundary fallbackTitle="Preview failed to render">
          {page ? (
            <PageRenderer page={pageToValidated(page)} />
          ) : (
            <p className="p-12 text-center text-muted-foreground">No page loaded.</p>
          )}
        </ErrorBoundary>
      </div>
    </section>
  );
}
