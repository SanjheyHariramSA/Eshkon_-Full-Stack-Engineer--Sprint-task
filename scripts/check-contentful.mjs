// Quick connectivity check: verifies the CDA token works and lists content types.
// Run: node --env-file=.env scripts/check-contentful.mjs
import { createClient } from "contentful";

const client = createClient({
  space: process.env.CONTENTFUL_SPACE_ID,
  environment: process.env.CONTENTFUL_ENVIRONMENT ?? "master",
  accessToken: process.env.CONTENTFUL_CDA_TOKEN,
});

try {
  const types = await client.getContentTypes();
  console.log(`✅ Connected to space "${process.env.CONTENTFUL_SPACE_ID}" (${process.env.CONTENTFUL_ENVIRONMENT})`);
  console.log(`   Content types found: ${types.items.length}`);
  for (const t of types.items) console.log(`   - ${t.sys.id}  (${t.name})`);
  const hasLanding = types.items.some((t) => t.sys.id === "landingPage");
  console.log(hasLanding ? "✅ landingPage type exists" : "❌ landingPage type is MISSING — create it or use fixtures");
} catch (e) {
  console.error("❌ Contentful request failed:", e.message);
  process.exit(1);
}
