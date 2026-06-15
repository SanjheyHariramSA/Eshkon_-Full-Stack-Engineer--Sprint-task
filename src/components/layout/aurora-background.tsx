import { cn } from "@/lib/utils";

/**
 * Decorative aurora/mesh background: soft, slowly-drifting gradient blobs over a
 * faint grid. Purely visual — `aria-hidden`, pointer-events-none, and the drift
 * animation is automatically disabled under `prefers-reduced-motion` (global
 * rule in globals.css). Sits behind content with negative z-index.
 */
export function AuroraBackground({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 -z-10 overflow-hidden", className)}
    >
      <div className="absolute inset-0 bg-grid-faint [background-size:36px_36px] opacity-[0.35]" />
      <div className="absolute -left-24 top-[-10%] size-[42rem] rounded-full bg-brand-500/25 blur-[120px] animate-blob-1 motion-reduce:animate-none" />
      <div className="absolute right-[-10%] top-[10%] size-[38rem] rounded-full bg-accent/25 blur-[120px] animate-blob-2 motion-reduce:animate-none" />
      <div className="absolute bottom-[-20%] left-1/3 size-[34rem] rounded-full bg-brand-400/20 blur-[120px] animate-blob-1 motion-reduce:animate-none [animation-delay:-6s]" />
      {/* Top highlight + bottom fade for depth. */}
      <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_-10%,hsl(var(--brand-50)/0.8),transparent)] dark:bg-[radial-gradient(60%_50%_at_50%_-10%,hsl(var(--brand-500)/0.18),transparent)]" />
    </div>
  );
}
