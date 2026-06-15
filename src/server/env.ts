import "server-only";
import { z } from "zod";

/**
 * Server-only environment access. Validated once at module load so a
 * misconfiguration fails fast and loudly instead of surfacing as a confusing
 * runtime error deep in the adapter. Never import this from a client component.
 */
const envSchema = z.object({
  CONTENTFUL_SPACE_ID: z.string().min(1).optional(),
  CONTENTFUL_ENVIRONMENT: z.string().min(1).default("master"),
  CONTENTFUL_CDA_TOKEN: z.string().min(1).optional(),
  CONTENTFUL_CPA_TOKEN: z.string().min(1).optional(),
  CONTENTFUL_PREVIEW: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
  AUTH_SECRET: z.string().min(16, "AUTH_SECRET must be at least 16 chars"),
  RELEASE_STORE_DRIVER: z.enum(["fs", "memory"]).default("fs"),
  USE_FIXTURE_CONTENT: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment configuration; see logs above.");
}

export const env = parsed.data;

/** True when real Contentful credentials are present. */
export const hasContentfulCredentials = Boolean(
  env.CONTENTFUL_SPACE_ID && env.CONTENTFUL_CDA_TOKEN,
);
