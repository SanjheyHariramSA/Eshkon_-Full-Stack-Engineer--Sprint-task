import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { HeroProps } from "@/core/schema";

/**
 * Hero section. Pure presentational component — receives validated props only.
 * Uses <h2>: the page itself owns the single <h1> (the page title), so every
 * section heading is an h2 sibling — a predictable hierarchy regardless of the
 * order or mix of sections (AAA logical heading order).
 */
export function HeroSection({ props }: { props: HeroProps }) {
  const align = props.align ?? "center";
  return (
    <section
      className={cn(
        "relative overflow-hidden",
        "bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,hsl(var(--brand-50)),transparent)]",
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-grid-faint [background-size:32px_32px] opacity-40"
        aria-hidden
      />
      <div
        className={cn(
          "container relative flex flex-col gap-6 py-[clamp(4rem,11cqi,8rem)]",
          align === "center" ? "items-center text-center" : "items-start text-left",
        )}
      >
        {props.eyebrow ? (
          <span className="inline-flex items-center rounded-full border border-brand-500/30 bg-brand-50 px-4 py-1.5 text-sm font-medium text-primary">
            {props.eyebrow}
          </span>
        ) : null}

        <h2 className="max-w-4xl text-balance text-[clamp(2.25rem,7cqi,3.75rem)] font-bold leading-[1.08] tracking-tight">
          {props.heading}
        </h2>

        {props.subheading ? (
          <p
            className={cn(
              "max-w-2xl text-pretty text-[clamp(1.0625rem,2.6cqi,1.25rem)] text-muted-foreground",
              align === "center" && "mx-auto",
            )}
          >
            {props.subheading}
          </p>
        ) : null}

        {props.primaryCtaLabel && props.primaryCtaHref ? (
          <div className={cn("mt-4 flex flex-wrap gap-4", align === "center" && "justify-center")}>
            <Button asChild size="lg" variant="brand">
              <Link href={props.primaryCtaHref}>{props.primaryCtaLabel}</Link>
            </Button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
