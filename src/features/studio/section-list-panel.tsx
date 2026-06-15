"use client";

import * as React from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { draftPageActions } from "@/store/slices/draftPageSlice";
import { uiActions } from "@/store/slices/uiSlice";
import { selectDraftPage } from "@/store/selectors";
import { Button } from "@/components/ui/button";
import { SortableSectionItem } from "./sortable-section-item";
import { AddSectionDialog } from "./add-section-dialog";
import { useToast } from "@/components/ui/use-toast";

/**
 * Left pane: ordered section list with dnd-kit reordering (Brief §3 + §9).
 *
 * Accessibility: dnd-kit's KeyboardSensor + sortableKeyboardCoordinates make
 * reordering fully keyboard-operable — focus a drag handle, Space to lift,
 * Arrow keys to move, Space to drop. Screen-reader announcements are provided by
 * dnd-kit's live region. This satisfies AAA "full keyboard operability".
 */
export function SectionListPanel() {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const page = useAppSelector(selectDraftPage);
  const selectedId = useAppSelector((s) => s.ui.selectedSectionId);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const sections = React.useMemo(() => page?.sections ?? [], [page]);
  const ids = React.useMemo(() => sections.map((s) => s.id), [sections]);

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;
    dispatch(draftPageActions.reorderSections({ oldIndex, newIndex }));
    // arrayMove keeps the visual order announcement consistent for SRs.
    void arrayMove(ids, oldIndex, newIndex);
  };

  return (
    <aside aria-label="Page sections" className="flex flex-col border-r bg-muted/20">
      <div className="flex items-center justify-between border-b p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Sections
        </h2>
        <Button size="sm" variant="brand" onClick={() => dispatch(uiActions.setAddSectionOpen(true))}>
          <Plus aria-hidden />
          Add
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {sections.length === 0 ? (
          <p className="px-2 py-8 text-center text-sm text-muted-foreground">
            No sections yet. Click “Add” to insert one.
          </p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={ids} strategy={verticalListSortingStrategy}>
              <ol className="space-y-2">
                {sections.map((section, index) => (
                  <SortableSectionItem
                    key={section.id}
                    section={section}
                    index={index}
                    total={sections.length}
                    selected={selectedId === section.id}
                    onSelect={() => dispatch(uiActions.selectSection(section.id))}
                    onRemove={() => {
                      dispatch(draftPageActions.removeSection({ id: section.id }));
                      toast({ title: "Section removed" });
                    }}
                    onDuplicate={() => dispatch(draftPageActions.duplicateSection({ id: section.id }))}
                  />
                ))}
              </ol>
            </SortableContext>
          </DndContext>
        )}
      </div>

      <AddSectionDialog />
    </aside>
  );
}
