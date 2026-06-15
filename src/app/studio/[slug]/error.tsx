"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertOctagon } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function StudioError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[studio] error:", error);
  }, [error]);

  return (
    <main
      id="main-content"
      role="alert"
      className="container flex min-h-screen flex-col items-center justify-center gap-6 text-center"
    >
      <AlertOctagon className="size-16 text-destructive" aria-hidden />
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">The Studio could not load this page</h1>
        <p className="mx-auto max-w-md text-muted-foreground">
          The page content failed validation, so it cannot be edited safely.
        </p>
      </div>
      <div className="flex gap-3">
        <Button onClick={reset} variant="brand">
          Try again
        </Button>
        <Button asChild variant="outline">
          <Link href="/">Back home</Link>
        </Button>
      </div>
    </main>
  );
}
