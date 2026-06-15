"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { loginAction, type LoginState } from "@/server/actions/auth-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ROLES } from "@/core/auth/roles";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="brand" className="w-full" disabled={pending}>
      <LogIn aria-hidden />
      {pending ? "Signing in…" : "Sign in"}
    </Button>
  );
}

/**
 * Accessible login form (Brief §7: "Forms fully labelled + accessible errors").
 * Errors are announced via role="alert" and linked with aria-describedby.
 */
export function LoginForm({ from }: { from: string }) {
  const [state, formAction] = useActionState<LoginState, FormData>(loginAction, {});
  const [showPassword, setShowPassword] = useState(false);
  const errorId = "login-error";

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <input type="hidden" name="from" value={from} />

      <div className="space-y-2">
        <Label htmlFor="role">Demo role</Label>
        <select
          id="role"
          name="role"
          defaultValue="editor"
          aria-describedby={state.error ? errorId : undefined}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {ROLES.map((role) => (
            <option key={role} value={role} className="capitalize">
              {role}
            </option>
          ))}
        </select>
        <p className="text-sm text-muted-foreground">
          Pick a role to exercise RBAC. Viewer can only preview; editor can edit; publisher can
          publish.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            aria-describedby={state.error ? errorId : "password-hint"}
            aria-invalid={state.error ? true : undefined}
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword((show) => !show)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md"
          >
            {showPassword ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
          </button>
        </div>
        <p id="password-hint" className="text-sm text-muted-foreground">
          Demo password equals the role name (e.g. <code>editor</code>).
        </p>
      </div>

      {state.error ? (
        <p id={errorId} role="alert" className="text-sm font-medium text-destructive">
          {state.error}
        </p>
      ) : null}

      <SubmitButton />
    </form>
  );
}
