import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getContentSource } from "@/server/content";
import { toEditablePage, validatePage } from "@/core/validation";
import { requireRole } from "@/server/auth/rbac";
import { can } from "@/core/auth/roles";
import { getReleaseStore } from "@/server/releases";
import { ReduxProvider } from "@/components/providers/redux-provider";
import { StudioApp } from "@/features/studio/studio-app";

export const metadata: Metadata = { title: "Studio" };

/**
 * Studio route (Brief §3). Middleware already guarantees `editor`+, but we call
 * `requireRole` here too (defence in depth) and to read the user's role for
 * server-driven UI gating (publish is publisher-only).
 *
 * The initial draft is loaded from Contentful's PREVIEW (draft) content so the
 * Studio always edits the freshest authoring state.
 */
export default async function StudioPage({ params }: { params: Promise<{ slug: string }> }) {
  const user = await requireRole("editor");
  const { slug } = await params;

  const raw = await getContentSource().getPage(slug, { preview: true });
  if (!raw) notFound();

  const result = validatePage(raw);
  if (!result.ok) {
    throw new Error(`Cannot open Studio: page "${slug}" failed schema validation.`);
  }

  const initialPage = toEditablePage(result.page);
  const latest = await getReleaseStore().getLatest(slug);

  return (
    <ReduxProvider>
      <StudioApp
        initialPage={initialPage}
        canPublish={can.publish(user.role)}
        latestVersion={latest?.version ?? null}
      />
    </ReduxProvider>
  );
}
