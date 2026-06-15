import { NextResponse, type NextRequest } from "next/server";
import { roleSatisfies, type Role } from "@/core/auth/roles";
import { SESSION_COOKIE, verifySession } from "@/server/auth/token";

/**
 * Route-level RBAC (Brief §4: "Viewer cannot access /studio").
 *
 * This is the FIRST line of defence and runs at the edge before any page code.
 * It is NOT the only line: every privileged server action independently calls
 * `requireRole` (defence in depth), so bypassing the UI or middleware still
 * fails server-side.
 *
 * Policy:
 *   /studio/*  → requires `editor` (or higher)
 *   /preview/* → requires authentication (any role)
 * Unauthenticated users are redirected to /login with a return path.
 */

interface RouteRule {
  pattern: RegExp;
  required: Role;
}

const RULES: RouteRule[] = [
  { pattern: /^\/studio(\/|$)/, required: "editor" },
  { pattern: /^\/preview(\/|$)/, required: "viewer" },
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const rule = RULES.find((r) => r.pattern.test(pathname));
  if (!rule) return NextResponse.next();

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = await verifySession(token);

  if (!user) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (!roleSatisfies(user.role, rule.required)) {
    const deniedUrl = new URL("/denied", req.url);
    deniedUrl.searchParams.set("required", rule.required);
    deniedUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(deniedUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Run only on the protected sections (and skip static assets).
  matcher: ["/studio/:path*", "/preview/:path*"],
};
