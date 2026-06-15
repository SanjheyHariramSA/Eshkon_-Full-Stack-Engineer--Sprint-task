import Link from "next/link";
import type { Metadata } from "next";
import { LayoutPanelLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AuroraBackground } from "@/components/layout/aurora-background";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const { from } = await searchParams;

  return (
    <main
      id="main-content"
      className="relative isolate flex min-h-screen items-center justify-center overflow-hidden px-4 py-12"
    >
      <AuroraBackground />
      <h1 className="sr-only">Sign in to Page Studio</h1>
      <Card className="w-full max-w-md shadow-glow">
        <CardHeader className="text-center">
          <Link
            href="/"
            className="mx-auto mb-2 inline-flex size-12 items-center justify-center rounded-xl bg-brand-gradient text-white"
          >
            <LayoutPanelLeft className="size-6" aria-hidden />
            <span className="sr-only">Page Studio home</span>
          </Link>
          <CardTitle className="text-2xl">Welcome back</CardTitle>
          <CardDescription>Sign in to access the Studio and publish releases.</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm from={from ?? "/"} />
        </CardContent>
      </Card>
    </main>
  );
}
