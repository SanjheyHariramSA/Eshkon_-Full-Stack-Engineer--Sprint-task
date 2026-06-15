"use client";

import * as React from "react";
import { SlidersHorizontal } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { draftPageActions } from "@/store/slices/draftPageSlice";
import { selectSelectedSection } from "@/store/selectors";
import { resolveSectionDefinition, type FieldDescriptor } from "@/registry/sectionRegistry";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { Section } from "@/core/schema";

/**
 * Right pane: declarative, schema-validated property editor (Brief §3 + §7).
 *
 * Fields are generated from the registry's `editableFields` — no per-section
 * form code. Live Zod validation surfaces accessible, field-level errors
 * (role="alert" + aria-describedby + aria-invalid), satisfying "forms fully
 * labelled + accessible errors".
 */
export function SectionInspector() {
  const section = useAppSelector(selectSelectedSection);

  if (!section) {
    return (
      <aside
        aria-label="Section properties"
        className="hidden flex-col items-center justify-center gap-3 border-l bg-muted/20 p-8 text-center text-muted-foreground lg:flex"
      >
        <SlidersHorizontal className="size-8" aria-hidden />
        <p className="text-sm">Select a section to edit its properties.</p>
      </aside>
    );
  }

  const def = resolveSectionDefinition(section.type);
  if (!def) return null;

  return (
    <aside aria-label="Section properties" className="flex flex-col border-l bg-muted/20">
      <div className="border-b p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {def.label} properties
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">{def.description}</p>
      </div>
      <InspectorForm key={section.id} section={section} fields={def.editableFields} />
    </aside>
  );
}

function InspectorForm({ section, fields }: { section: Section; fields: FieldDescriptor[] }) {
  const dispatch = useAppDispatch();
  const def = resolveSectionDefinition(section.type)!;

  // Live validation → map of prop path → first error message.
  const errors = React.useMemo(() => {
    const parsed = def.schema.safeParse(section.props);
    if (parsed.success) return {} as Record<string, string>;
    const map: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "");
      if (key && !map[key]) map[key] = issue.message;
    }
    return map;
  }, [def.schema, section.props]);

  const setValue = (field: FieldDescriptor, raw: string) => {
    const current = (section.props as Record<string, unknown>)[field.path];
    // Coerce numeric selects (e.g. featureGrid columns) back to number.
    const value = typeof current === "number" ? Number(raw) : raw;
    dispatch(draftPageActions.updateSectionProp({ id: section.id, key: field.path, value }));
  };

  return (
    <form className="flex-1 space-y-5 overflow-y-auto p-4" noValidate aria-label={`${def.label} fields`}>
      {fields.map((field) => {
        const value = (section.props as Record<string, unknown>)[field.path];
        const stringValue = value === undefined || value === null ? "" : String(value);
        const error = errors[field.path];
        const errorId = `${field.path}-error`;
        const hintId = `${field.path}-hint`;
        const describedBy = [error ? errorId : null, field.helpText ? hintId : null]
          .filter(Boolean)
          .join(" ") || undefined;

        return (
          <div key={field.path} className="space-y-1.5">
            <Label htmlFor={field.path}>
              {field.label}
              {field.required ? (
                <span className="ml-1 text-destructive" aria-hidden>
                  *
                </span>
              ) : null}
            </Label>

            {field.kind === "textarea" ? (
              <Textarea
                id={field.path}
                value={stringValue}
                placeholder={field.placeholder}
                aria-invalid={error ? true : undefined}
                aria-describedby={describedBy}
                aria-required={field.required}
                onChange={(e) => setValue(field, e.target.value)}
              />
            ) : field.kind === "select" ? (
              <select
                id={field.path}
                value={stringValue}
                aria-invalid={error ? true : undefined}
                aria-describedby={describedBy}
                onChange={(e) => setValue(field, e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {field.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : (
              <Input
                id={field.path}
                type={field.kind === "url" ? "text" : "text"}
                inputMode={field.kind === "url" ? "url" : undefined}
                value={stringValue}
                placeholder={field.placeholder}
                aria-invalid={error ? true : undefined}
                aria-describedby={describedBy}
                aria-required={field.required}
                onChange={(e) => setValue(field, e.target.value)}
              />
            )}

            {field.helpText ? (
              <p id={hintId} className="text-xs text-muted-foreground">
                {field.helpText}
              </p>
            ) : null}
            {error ? (
              <p id={errorId} role="alert" className="text-xs font-medium text-destructive">
                {error}
              </p>
            ) : null}
          </div>
        );
      })}
    </form>
  );
}
