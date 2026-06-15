import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PreviewNotFound() {
  return (
    <main
      id="main-content"
      className="container flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center"
    >
      <FileQuestion className="size-16 text-muted-foreground" aria-hidden />
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Page not found</h1>
        <p className="text-muted-foreground">No published page exists for this slug.</p>
      </div>
      <Button asChild variant="brand">
        <Link href="/">Back home</Link>
      </Button>
    </main>
  );
}
