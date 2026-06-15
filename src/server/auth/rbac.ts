import "server-only";
import { roleSatisfies, type Role, type SessionUser } from "@/core/auth/roles";
import { getSession } from "./session";

/**
 * Server-side authorization guards (Brief §4: "Server-side enforcement").
 *
 * Every privileged server action / route handler calls `requireRole`. This is
 * the real security boundary — the UI hiding a button is convenience only. A
 * non-publisher hitting the publish action via a crafted request is rejected
 * here regardless of what the client sent.
 */

export class AuthorizationError extends Error {
  constructor(
    public readonly code: "unauthenticated" | "forbidden",
    message: string,
  ) {
    super(message);
    this.name = "AuthorizationError";
  }
}

/** Returns the session user if they meet `required`, else throws. */
export async function requireRole(required: Role): Promise<SessionUser> {
  const user = await getSession();
  if (!user) {
    throw new AuthorizationError("unauthenticated", "You must be signed in.");
  }
  if (!roleSatisfies(user.role, required)) {
    throw new AuthorizationError(
      "forbidden",
      `This action requires the "${required}" role; you have "${user.role}".`,
    );
  }
  return user;
}

/** Non-throwing variant for UI gating in server components. */
export async function hasRole(required: Role): Promise<boolean> {
  const user = await getSession();
  return user ? roleSatisfies(user.role, required) : false;
}
