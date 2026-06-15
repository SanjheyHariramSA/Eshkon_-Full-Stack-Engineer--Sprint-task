import Link from "next/link";
import {
  ArrowRight,
  Eye,
  GitBranch,
  Pencil,
  ShieldCheck,
  Sparkles,
  Accessibility,
} from "lucide-react";
import { getContentSource } from "@/server/content";
import { getSession } from "@/server/auth/session";
import { can } from "@/core/auth/roles";
import { SiteHeader } from "@/components/layout/site-header";
import { AuroraBackground } from "@/components/layout/aurora-background";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const HIGHLIGHTS = [
  {
    icon: ShieldCheck,
    title: "Schema-validated",
    body: "Every section is parsed with Zod — runtime safety and inferred types from one source.",
  },
  {
    icon: GitBranch,
    title: "Deterministic SemVer",
    body: "Publishing diffs the draft and bumps the version automatically — patch, minor, or major.",
  },
  {
    icon: Accessibility,
    title: "WCAG 2.2 AAA-oriented",
    body: "Keyboard-first, high-contrast, reduced-motion aware — axe-gated in CI.",
  },
];

export default async function HomePage() {
  const [pages, user] = await Promise.all([getContentSource().listPages(), getSession()]);
  const canEdit = user ? can.edit(user.role) : false;

  return (
    <>
      <SiteHeader />
      <main id="main-content">
        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <section className="relative isolate overflow-hidden">
          <AuroraBackground />
          <div className="container py-24 text-center md:py-32">
            <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/60 px-4 py-1.5 text-sm font-medium text-foreground shadow-sm backdrop-blur">
              <Sparkles className="size-4 text-primary" aria-hidden />
              Next.js · Redux · Contentful · WCAG 2.2 AAA
            </span>

            <h1 className="mx-auto mt-6 max-w-4xl text-balance text-5xl font-bold tracking-tight md:text-7xl">
              The Page Studio for <span className="text-primary">schema-driven</span> landing pages
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground md:text-xl">
              Load from Contentful, edit in a lightweight studio, preview the rendered page, and
              publish immutable, automatically-versioned releases.
            </p>

            <div className="mt-9 flex flex-wrap justify-center gap-4">
              <Button asChild size="lg" variant="brand">
                <Link href="/studio/home">
                  Open the Studio <ArrowRight aria-hidden />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="bg-background/60 backdrop-blur">
                <Link href="/preview/home">View a preview</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* ── Highlights ───────────────────────────────────────────────── */}
        <section className="container -mt-6 pb-8" aria-label="Key capabilities">
          <ul role="list" className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {HIGHLIGHTS.map(({ icon: Icon, title, body }) => (
              <li key={title}>
                <Card className="group h-full border-border/70 bg-card/70 backdrop-blur transition-all duration-200 hover:-translate-y-1 hover:shadow-glow motion-reduce:transform-none">
                  <CardHeader>
                    <span className="mb-2 inline-flex size-11 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-sm">
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <CardTitle className="text-lg">{title}</CardTitle>
                    <CardDescription className="leading-relaxed">{body}</CardDescription>
                  </CardHeader>
                </Card>
              </li>
            ))}
          </ul>
        </section>

        {/* ── Pages ────────────────────────────────────────────────────── */}
        <section className="container py-16" aria-labelledby="pages-heading">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h2 id="pages-heading" className="text-2xl font-semibold tracking-tight">
                Pages
              </h2>
              <p className="text-sm text-muted-foreground">
                {pages.length} page{pages.length === 1 ? "" : "s"} available
              </p>
            </div>
          </div>

          {pages.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center text-muted-foreground">
                No pages found. Connect Contentful (see docs/CONTENTFUL.md) or set
                <code className="mx-1 rounded bg-muted px-1.5 py-0.5">USE_FIXTURE_CONTENT=true</code>.
              </CardContent>
            </Card>
          ) : (
            <ul role="list" className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {pages.map((page) => (
                <li key={page.pageId}>
                  <Card className="group relative h-full overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-glow motion-reduce:transform-none">
                    <span
                      className="absolute inset-x-0 top-0 h-1 bg-brand-gradient opacity-0 transition-opacity group-hover:opacity-100"
                      aria-hidden
                    />
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        {page.title}
                        <ArrowRight
                          className="size-4 -translate-x-1 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100 motion-reduce:transform-none"
                          aria-hidden
                        />
                      </CardTitle>
                      <CardDescription>/{page.slug}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex gap-2">
                      <Button asChild variant="secondary" size="sm">
                        <Link href={`/preview/${page.slug}`}>
                          <Eye aria-hidden /> Preview
                        </Link>
                      </Button>
                      {canEdit && (
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/studio/${page.slug}`}>
                            <Pencil aria-hidden /> Edit
                          </Link>
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}
