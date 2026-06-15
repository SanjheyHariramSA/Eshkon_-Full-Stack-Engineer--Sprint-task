import { AlertTriangle } from "lucide-react";

/**
 * Rendered when a section's `type` is not in the registry, or its props fail
 * validation. In production it degrades gracefully; in dev it surfaces the
 * reason so authors can fix the Contentful entry. It never throws.
 */
export function UnsupportedSection({
  type,
  reason,
  sectionId,
}: {
  type: string;
  reason: "unknown-type" | "invalid-props";
  sectionId?: string;
}) {
  const isDev = process.env.NODE_ENV !== "production";
  return (
    <section
      className="container py-8"
      role="region"
      aria-label={`Unsupported section${sectionId ? ` ${sectionId}` : ""}`}
    >
      <div className="flex items-start gap-3 rounded-lg border border-dashed border-amber-500/60 bg-amber-50 p-5 text-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
        <AlertTriangle className="mt-0.5 size-5 shrink-0" aria-hidden />
        <div className="space-y-1 text-sm">
          <p className="font-semibold">
            {reason === "unknown-type"
              ? `Unsupported section type: "${type}"`
              : `Section "${type}" has invalid content`}
          </p>
          {isDev ? (
            <p className="opacity-90">
              {reason === "unknown-type"
                ? "No registry entry matches this type. Add one to sectionRegistry.ts or remove the entry in Contentful."
                : "The section's props did not satisfy its schema. Check required fields in Contentful."}
            </p>
          ) : (
            <p className="opacity-90">This section is temporarily unavailable.</p>
          )}
        </div>
      </div>
    </section>
  );
}
