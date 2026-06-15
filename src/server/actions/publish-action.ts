"use server";

import { revalidatePath } from "next/cache";
import type { Page } from "@/core/schema";
import { assertFullyValidPage, PageValidationError } from "@/core/validation";
import type { PublishActionResult } from "@/core/publish/types";
import { AuthorizationError, requireRole } from "@/server/auth/rbac";
import { getReleaseStore } from "@/server/releases";
import { publishPage } from "@/server/publish/publish-service";

/**
 * Publish server action (Brief §4 + §5).
 *
 * Security: this is a real server boundary. RBAC is enforced HERE, not in the
 * UI — a non-publisher invoking this directly (e.g. crafted fetch) is rejected
 * by `requireRole("publisher")`. The incoming `page` is fully re-validated with
 * Zod (`assertFullyValidPage`) so the server never trusts client-supplied data.
 */
export async function publishPageAction(input: { page: Page }): Promise<PublishActionResult> {
  try {
    const user = await requireRole("publisher");

    // Re-validate server-side; the client copy is untrusted.
    const page = assertFullyValidPage(input.page);

    const result = await publishPage(page, {
      store: getReleaseStore(),
      publishedBy: user.email,
    });

    // Published content drives /preview; refresh its cache.
    revalidatePath(`/preview/${page.slug}`);

    return { ok: true, result };
  } catch (err) {
    if (err instanceof AuthorizationError) {
      return { ok: false, error: err.message, code: "forbidden" };
    }
    if (err instanceof PageValidationError) {
      return { ok: false, error: err.message, code: "validation" };
    }
    console.error("[publishPageAction] unexpected error", err);
    return { ok: false, error: "Publish failed unexpectedly.", code: "unknown" };
  }
}
