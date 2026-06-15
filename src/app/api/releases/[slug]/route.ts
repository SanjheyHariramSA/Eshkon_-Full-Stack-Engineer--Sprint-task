import { NextResponse, type NextRequest } from "next/server";
import { AuthorizationError, requireRole } from "@/server/auth/rbac";
import { getReleaseStore } from "@/server/releases";

export const runtime = "nodejs";

/**
 * Lists releases for a slug (history + latest). Requires any authenticated role
 * (viewer+). A specific version can be requested with `?version=1.2.0`.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    await requireRole("viewer");
    const { slug } = await params;
    const store = getReleaseStore();

    const version = req.nextUrl.searchParams.get("version");
    if (version) {
      const snapshot = await store.getVersion(slug, version);
      return snapshot
        ? NextResponse.json(snapshot)
        : NextResponse.json({ error: "Release not found" }, { status: 404 });
    }

    return NextResponse.json(await store.list(slug));
  } catch (err) {
    if (err instanceof AuthorizationError) {
      return NextResponse.json(
        { error: err.message },
        { status: err.code === "unauthenticated" ? 401 : 403 },
      );
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
