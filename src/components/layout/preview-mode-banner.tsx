import Link from "next/link";
import { Eye } from "lucide-react";

/**
 * Indicates that draft (Contentful Preview API) content is being shown, with a
 * link back to the published view. Draft/published selection itself lives in the
 * adapter; this is purely a visual affordance.
 */
export function PreviewModeBanner({ slug }: { slug: string }) {
  return (
    <div
      role="status"
      className="border-b border-amber-500/50 bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-100"
    >
      <div className="container flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
        <span className="inline-flex items-center gap-2 font-medium">
          <Eye className="size-4" aria-hidden />
          Draft preview mode — showing unpublished Contentful content
        </span>
        <Link href={`/preview/${slug}`} className="font-semibold underline underline-offset-2">
          View published version
        </Link>
      </div>
    </div>
  );
}
