"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const LINKS = [
  { href: "/preview/home", label: "Preview" },
  { href: "/studio/home", label: "Studio" },
];

/**
 * Mobile primary-nav disclosure (shown < sm; the inline links take over at sm+).
 *
 * Accessible disclosure pattern (not an ARIA menu, so no arrow-key contract to
 * fake): the trigger exposes `aria-expanded` + `aria-controls`; the panel is a
 * labelled <nav> of plain links. Escape closes and returns focus to the trigger;
 * an outside click or following a link also closes it. Full keyboard operability
 * (Brief §7).
 */
export function MobileNav() {
  const [open, setOpen] = React.useState(false);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const pathname = usePathname();

  // Close after navigating (closing in the link's onClick would unmount it
  // mid-click and can swallow the navigation).
  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  React.useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node;
      if (!panelRef.current?.contains(target) && !triggerRef.current?.contains(target)) {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  return (
    <div className="relative sm:hidden">
      <Button
        ref={triggerRef}
        variant="ghost"
        size="icon"
        aria-label={open ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={open}
        aria-controls="mobile-nav-panel"
        onClick={() => setOpen((prev) => !prev)}
      >
        {open ? <X aria-hidden /> : <Menu aria-hidden />}
      </Button>

      {open ? (
        <div
          ref={panelRef}
          id="mobile-nav-panel"
          className="absolute right-0 top-full z-50 mt-2 w-40 overflow-hidden rounded-lg border bg-popover p-1 text-popover-foreground shadow-lg animate-fade-in"
        >
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block rounded-md px-3 py-2 text-sm font-medium hover:bg-muted focus-visible:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {link.label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
