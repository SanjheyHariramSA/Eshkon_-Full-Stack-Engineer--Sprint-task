import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CtaProps } from "@/core/schema";

export function CtaSection({ props }: { props: CtaProps }) {
  return (
    <section className="border-t">
      <div className="container py-20 md:py-28">
        <div className="relative overflow-hidden rounded-2xl bg-brand-gradient px-6 py-16 text-center shadow-glow md:px-16">
          <div
            className="pointer-events-none absolute inset-0 bg-grid-faint [background-size:28px_28px] opacity-20"
            aria-hidden
          />
          <div className="relative mx-auto max-w-2xl">
            <h2 className="text-balance text-3xl font-bold text-white md:text-4xl">
              {props.heading}
            </h2>
            {props.description ? (
              <p className="mt-4 text-pretty text-lg text-white/90">{props.description}</p>
            ) : null}
            <div className="mt-8 flex justify-center">
              <Button asChild size="lg" variant="secondary" className="group">
                <Link href={props.href}>
                  {props.label}
                  <ArrowRight
                    className="transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none"
                    aria-hidden
                  />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
