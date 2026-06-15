import Link from "next/link";
import { LayoutPanelLeft, LogOut } from "lucide-react";
import { getSession } from "@/server/auth/session";
import { logoutAction } from "@/server/actions/auth-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";

/**
 * Global header. Server component — reads the session and reflects the user's
 * role. UI gating here is convenience only; the server enforces access.
 */
export async function SiteHeader() {
  const user = await getSession();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-md font-semibold tracking-tight focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <span className="inline-flex size-8 items-center justify-center rounded-lg bg-brand-gradient text-white shadow-sm">
            <LayoutPanelLeft className="size-5" aria-hidden />
          </span>
          Page Studio
        </Link>

        <nav aria-label="Primary" className="flex items-center gap-1 sm:gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/preview/home">Preview</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/studio/home">Studio</Link>
          </Button>
          <ThemeToggle />
          {user ? (
            <div className="flex items-center gap-2">
              <span className="hidden text-sm text-muted-foreground sm:inline">{user.name}</span>
              <Badge variant="secondary" className="capitalize">
                {user.role}
              </Badge>
              <form action={logoutAction}>
                <Button type="submit" variant="outline" size="sm">
                  <LogOut aria-hidden />
                  <span className="sr-only sm:not-sr-only">Sign out</span>
                </Button>
              </form>
            </div>
          ) : (
            <Button asChild size="sm" variant="brand">
              <Link href="/login">Sign in</Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
