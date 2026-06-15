"use client";

import * as React from "react";
import { AlertOctagon, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: React.ReactNode;
  fallbackTitle?: string;
}
interface State {
  error: Error | null;
}

/**
 * Generic React error boundary used to satisfy "Invalid schema → error boundary
 * (no crash)". Note: Next.js App Router also has route-level `error.tsx` files
 * (see app/preview/[slug]/error.tsx); this component is for client subtrees such
 * as the Studio preview where we want a contained, recoverable failure.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: React.ErrorInfo) {
    // In a real app this would go to Sentry/Datadog.
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  reset = () => this.setState({ error: null });

  override render() {
    if (this.state.error) {
      return (
        <div
          role="alert"
          className="container my-8 rounded-xl border border-destructive/40 bg-destructive/5 p-8 text-center"
        >
          <AlertOctagon className="mx-auto mb-4 size-10 text-destructive" aria-hidden />
          <h2 className="text-xl font-semibold">
            {this.props.fallbackTitle ?? "Something went wrong"}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            The content could not be rendered. This is usually caused by invalid
            data and has been contained without crashing the page.
          </p>
          <Button onClick={this.reset} variant="outline" className="mt-6">
            <RotateCcw aria-hidden />
            Try again
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
