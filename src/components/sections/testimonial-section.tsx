import { Quote } from "lucide-react";
import type { TestimonialProps } from "@/core/schema";

export function TestimonialSection({ props }: { props: TestimonialProps }) {
  const attribution = [props.author, props.role, props.company].filter(Boolean).join(", ");
  return (
    <section className="border-t">
      <div className="container py-20 md:py-28">
        <figure className="mx-auto max-w-3xl text-center">
          <Quote className="mx-auto mb-6 size-10 text-primary" aria-hidden />
          <blockquote className="text-balance text-2xl font-medium leading-relaxed md:text-3xl">
            <p>&ldquo;{props.quote}&rdquo;</p>
          </blockquote>
          <figcaption className="mt-8 flex items-center justify-center gap-3 text-muted-foreground">
            {props.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={props.avatarUrl}
                alt=""
                width={48}
                height={48}
                className="size-12 rounded-full object-cover ring-2 ring-border"
              />
            ) : null}
            <span className="font-semibold text-foreground">{props.author}</span>
            {props.role || props.company ? (
              <span className="text-sm">
                {[props.role, props.company].filter(Boolean).join(" · ")}
              </span>
            ) : null}
          </figcaption>
          <span className="sr-only">Testimonial from {attribution}</span>
        </figure>
      </div>
    </section>
  );
}
