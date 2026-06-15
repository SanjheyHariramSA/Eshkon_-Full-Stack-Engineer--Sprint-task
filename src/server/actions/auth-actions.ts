"use server";

import { redirect } from "next/navigation";
import { isRole, type Role } from "@/core/auth/roles";
import { createSession, destroySession, DEMO_USERS } from "@/server/auth/session";

/**
 * Auth server actions. Demo credential flow (see README): pick a role, sign a
 * session cookie. In production this would delegate to an OIDC provider, but the
 * cookie/session contract the rest of the app relies on stays identical.
 */

export interface LoginState {
  error?: string;
}

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const roleInput = String(formData.get("role") ?? "");
  const password = String(formData.get("password") ?? "");
  const from = String(formData.get("from") ?? "");

  if (!isRole(roleInput)) {
    return { error: "Please choose a valid role." };
  }
  const role: Role = roleInput;
  const user = DEMO_USERS[role];

  if (password !== user.password) {
    return { error: "Incorrect password for the selected demo role." };
  }

  await createSession({ sub: user.sub, email: user.email, name: user.name, role: user.role });
  redirect(safeRedirect(from));
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/login");
}

/** Prevent open-redirects: only allow same-origin app paths. */
function safeRedirect(from: string): string {
  if (from.startsWith("/") && !from.startsWith("//")) return from;
  return "/";
}
