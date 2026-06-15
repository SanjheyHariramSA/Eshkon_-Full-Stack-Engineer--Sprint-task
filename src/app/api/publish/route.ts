import { NextResponse, type NextRequest } from "next/server";
import { assertFullyValidPage, PageValidationError } from "@/core/validation";
import { AuthorizationError, requireRole } from "@/server/auth/rbac";
import { getReleaseStore } from "@/server/releases";
import { publishPage } from "@/server/publish/publish-service";

/**
 * REST equivalent of the publish server action — demonstrates API-route RBAC
 * (Brief §4: "Publish endpoint protected", "Non-publisher cannot publish even
 * via direct request"). Identical security posture: role check + Zod re-parse.
 *
 * Force Node runtime: the fs release store uses `node:fs`.
 */
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole("publisher");

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object" || !("page" in body)) {
      return NextResponse.json({ error: "Expected { page } in request body." }, { status: 400 });
    }

    const page = assertFullyValidPage((body as { page: unknown }).page);
    const result = await publishPage(page, { store: getReleaseStore(), publishedBy: user.email });

    return NextResponse.json({ ok: true, result }, { status: result.idempotent ? 200 : 201 });
  } catch (err) {
    if (err instanceof AuthorizationError) {
      return NextResponse.json(
        { error: err.message },
        { status: err.code === "unauthenticated" ? 401 : 403 },
      );
    }
    if (err instanceof PageValidationError) {
      return NextResponse.json({ error: err.message, issues: err.issues }, { status: 422 });
    }
    console.error("[POST /api/publish]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
