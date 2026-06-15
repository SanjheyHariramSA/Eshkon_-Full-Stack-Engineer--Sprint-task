import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getContentSource } from "@/server/content";
import { validatePage } from "@/core/validation";
import { PageRenderer } from "@/components/renderer/page-renderer";
import { SiteHeader } from "@/components/layout/site-header";
import { PreviewModeBanner } from "@/components/layout/preview-mode-banner";

type Params = Promise<{ slug: string }>;
type Search = Promise<{ preview?: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const raw = await getContentSource().getPage(slug);
  return { title: raw?.title ?? "Preview" };
}

/**
 * Preview route (Brief §1 + §2). Renders Contentful data through the
 * schema-driven renderer.
 *
 * Failure handling:
 *   • page not found            → notFound() (404 UI)
 *   • structural schema failure → throw → error.tsx boundary (no crash)
 *   • unknown / invalid section → <UnsupportedSection/> (handled in renderer)
 */
export default async function PreviewPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: Search;
}) {
  const { slug } = await params;
  const { preview } = await searchParams;
  const isPreview = preview === "true";

  const raw = await getContentSource().getPage(slug, { preview: isPreview });
  if (!raw) notFound();

  const result = validatePage(raw);
  if (!result.ok) {
    // Surfaced to the route error boundary. The app does not crash.
    throw new Error(`Invalid page schema for "${slug}": ${result.error}`);
  }

  return (
    <>
      <SiteHeader />
      {isPreview ? <PreviewModeBanner slug={slug} /> : null}
      <main id="main-content">
        <h1 className="sr-only">{result.page.title}</h1>
        <PageRenderer page={result.page} />
      </main>
    </>
  );
}
