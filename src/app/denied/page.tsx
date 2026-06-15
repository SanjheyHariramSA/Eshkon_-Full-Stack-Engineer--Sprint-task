import Link from "next/link";
import type { Metadata } from "next";
import { ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Access denied" };

export default async function DeniedPage({
  searchParams,
}: {
  searchParams: Promise<{ required?: string; from?: string }>;
}) {
  const { required, from } = await searchParams;

  return (
    <main
      id="main-content"
      className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center"
    >
      <ShieldX className="size-16 text-destructive" aria-hidden />
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Access denied</h1>
        <p className="max-w-md text-muted-foreground">
          {required
            ? `You need the “${required}” role to open ${from ?? "this page"}.`
            : "You don't have permission to view this page."}{" "}
          Sign in with a higher-privilege demo account to continue.
        </p>
      </div>
      <div className="flex gap-3">
        <Button asChild variant="brand">
          <Link href={`/login${from ? `?from=${encodeURIComponent(from)}` : ""}`}>
            Switch account
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/">Back home</Link>
        </Button>
      </div>
    </main>
  );
}
