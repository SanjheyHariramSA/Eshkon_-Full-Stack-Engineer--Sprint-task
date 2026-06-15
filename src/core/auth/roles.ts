/**
 * RBAC model (Brief §4). Pure, framework-agnostic — shared by middleware,
 * server actions, and the UI (UI uses it only to *reflect* permissions; the
 * server is the security boundary).
 *
 * Roles form a hierarchy: a higher role inherits every capability of the lower
 * ones. This keeps checks to a single `roleSatisfies(role, required)` call.
 */
export const ROLES = ["viewer", "editor", "publisher"] as const;
export type Role = (typeof ROLES)[number];

/** Higher number ⇒ more privilege. */
const ROLE_RANK: Record<Role, number> = {
  viewer: 0,
  editor: 1,
  publisher: 2,
};

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

/** True when `role` meets or exceeds the `required` role. */
export function roleSatisfies(role: Role, required: Role): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[required];
}

// Capability helpers — the vocabulary the rest of the app speaks.
export const can = {
  preview: (_role: Role) => true, // every authenticated role can preview
  edit: (role: Role) => roleSatisfies(role, "editor"),
  publish: (role: Role) => roleSatisfies(role, "publisher"),
};

export interface SessionUser {
  sub: string;
  email: string;
  name: string;
  role: Role;
}
