import "server-only";
import { cookies } from "next/headers";
import type { Role, SessionUser } from "@/core/auth/roles";
import { COOKIE_MAX_AGE, SESSION_COOKIE, signSession, verifySession } from "./token";

/**
 * Node-side session helpers for server components, server actions, and route
 * handlers. Reads/writes the httpOnly session cookie. Middleware uses the
 * lower-level token verifier directly (it has its own cookie access).
 */

export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  return verifySession(store.get(SESSION_COOKIE)?.value);
}

export async function createSession(user: SessionUser): Promise<void> {
  const token = await signSession(user);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export interface DemoUser extends SessionUser {
  password: string;
}

/**
 * Demo identity store. Replaces a real IdP for the assignment. Each role has a
 * ready-made login so reviewers can exercise RBAC immediately (see README).
 */
export const DEMO_USERS: Record<Role, DemoUser> = {
  viewer: {
    sub: "u_viewer",
    email: "viewer@example.com",
    name: "Vera Viewer",
    role: "viewer",
    password: "viewer",
  },
  editor: {
    sub: "u_editor",
    email: "editor@example.com",
    name: "Eddie Editor",
    role: "editor",
    password: "editor",
  },
  publisher: {
    sub: "u_publisher",
    email: "publisher@example.com",
    name: "Pat Publisher",
    role: "publisher",
    password: "publisher",
  },
};