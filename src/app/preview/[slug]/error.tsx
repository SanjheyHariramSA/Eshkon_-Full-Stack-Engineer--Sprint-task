"use client";

import { useEffect } from "react";
import { AlertOctagon, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Route-level error boundary for /preview/[slug] (Brief §1: "Invalid schema →
 * error boundary (no crash)"). Catches the thrown structural-validation error
 * and renders a recoverable UI instead of a white screen.
 */
export default function PreviewError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[preview] render error:", error);
  }, [error]);

  return (
    <main
      id="main-content"
      role="alert"
      className="container flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center"
    >
      <AlertOctagon className="size-16 text-destructive" aria-hidden />
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">This page could not be rendered</h1>
        <p className="mx-auto max-w-md text-muted-foreground">
          The content failed schema validation. The error has been contained — the rest of the app
          is unaffected.
        </p>
      </div>
      <Button onClick={reset} variant="brand">
        <RotateCcw aria-hidden />
        Try again
      </Button>
    </main>
  );
}
