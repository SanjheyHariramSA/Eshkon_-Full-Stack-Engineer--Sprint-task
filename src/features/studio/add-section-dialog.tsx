"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SECTION_PALETTE } from "@/registry/sectionRegistry";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { uiActions } from "@/store/slices/uiSlice";
import { draftPageActions } from "@/store/slices/draftPageSlice";
import type { SectionType } from "@/core/schema";

/**
 * Add-section palette. Each entry is sourced from the registry, so a new section
 * type becomes available here automatically once registered — zero duplication.
 */
export function AddSectionDialog() {
  const dispatch = useAppDispatch();
  const open = useAppSelector((s) => s.ui.addSectionOpen);

  const add = (type: SectionType) => {
    const result = dispatch(draftPageActions.addSection({ type }));
    // The reducer's prepare() generated the section id; select it for editing.
    const section = (result.payload as { section: { id: string } }).section;
    dispatch(uiActions.selectSection(section.id));
    dispatch(uiActions.setAddSectionOpen(false));
  };

  return (
    <Dialog open={open} onOpenChange={(o) => dispatch(uiActions.setAddSectionOpen(o))}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a section</DialogTitle>
          <DialogDescription>Choose a section type to append to the page.</DialogDescription>
        </DialogHeader>
        <ul role="list" className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {SECTION_PALETTE.map(({ type, label, description, icon: Icon }) => (
            <li key={type}>
              <button
                type="button"
                onClick={() => add(type)}
                className="flex h-full w-full flex-col items-start gap-2 rounded-lg border bg-card p-4 text-left transition-colors hover:border-primary hover:bg-accent/10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <span className="inline-flex size-9 items-center justify-center rounded-md bg-brand-gradient text-white">
                  <Icon className="size-5" aria-hidden />
                </span>
                <span className="font-medium">{label}</span>
                <span className="text-sm text-muted-foreground">{description}</span>
              </button>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
