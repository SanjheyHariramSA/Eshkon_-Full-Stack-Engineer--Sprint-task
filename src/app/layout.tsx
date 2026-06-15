import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeScript } from "@/components/providers/theme-script";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });

export const metadata: Metadata = {
  title: {
    default: "Page Studio",
    template: "%s · Page Studio",
  },
  description:
    "Load, edit, preview and publish schema-driven landing pages with immutable, versioned releases.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        {/* Sets the theme class before paint to avoid a flash (no-JS safe). */}
        <ThemeScript />
      </head>
      <body className="min-h-screen bg-background font-sans">
        {/* AAA 2.4.1 — bypass blocks: keyboard users jump straight to content. */}
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
