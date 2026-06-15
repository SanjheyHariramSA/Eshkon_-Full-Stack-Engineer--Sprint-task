import { resolveSectionDefinition } from "@/registry/sectionRegistry";
import { UnsupportedSection } from "@/components/sections/unsupported-section";
import type { ValidatedSection } from "@/core/validation";
import type { ComponentType } from "react";

/**
 * Renders a single validated section by resolving its component from the
 * registry. Unknown types and invalid props render <UnsupportedSection/> — the
 * renderer itself never throws.
 */
export function SectionRenderer({ section }: { section: ValidatedSection }) {
  if (section.status === "unsupported") {
    return (
      <UnsupportedSection
        type={section.raw.type}
        reason={section.reason}
        sectionId={section.raw.id}
      />
    );
  }

  const def = resolveSectionDefinition(section.section.type);
  if (!def) {
    // Registry entry was removed but the type is still emitted by Contentful.
    return (
      <UnsupportedSection
        type={section.section.type}
        reason="unknown-type"
        sectionId={section.section.id}
      />
    );
  }

  // Props are already validated against this exact type's schema.
  const Component = def.component as ComponentType<{ props: unknown }>;
  return <Component props={section.section.props} />;
}
