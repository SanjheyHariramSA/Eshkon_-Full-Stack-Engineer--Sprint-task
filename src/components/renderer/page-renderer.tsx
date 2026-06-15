import { SectionRenderer } from "./section-renderer";
import type { ValidatedPage } from "@/core/validation";

/**
 * Renders an ordered list of validated sections. Shared by /preview and the
 * Studio live preview so both surfaces are pixel-identical.
 */
export function PageRenderer({ page }: { page: ValidatedPage }) {
  if (page.sections.length === 0) {
    return (
      <div className="container py-24 text-center text-muted-foreground">
        <p>This page has no sections yet.</p>
      </div>
    );
  }
  return (
    <>
      {page.sections.map((section, index) => (
        <SectionRenderer key={sectionKey(section, index)} section={section} />
      ))}
    </>
  );
}

function sectionKey(section: ValidatedPage["sections"][number], index: number): string {
  const id = section.status === "ok" ? section.section.id : section.raw.id;
  return `${id}-${index}`;
}
