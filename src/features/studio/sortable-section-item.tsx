"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, ChevronUp, Copy, GripVertical, Trash2 } from "lucide-react";
import type { Section } from "@/core/schema";
import { resolveSectionDefinition } from "@/registry/sectionRegistry";
import { useAppDispatch } from "@/store/hooks";
import { draftPageActions } from "@/store/slices/draftPageSlice";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * A single draggable section row. Reordering is available three ways for maximum
 * accessibility:
 *   • pointer drag (PointerSensor)
 *   • keyboard drag on the grip (dnd-kit KeyboardSensor)
 *   • explicit Up/Down buttons (clear, discoverable fallback)
 */
export function SortableSectionItem({
  section,
  index,
  total,
  selected,
  onSelect,
  onRemove,
  onDuplicate,
}: {
  section: Section;
  index: number;
  total: number;
  selected: boolean;
  onSelect: () => void;
  onRemove: () => void;
  onDuplicate: () => void;
}) {
  const dispatch = useAppDispatch();
  const def = resolveSectionDefinition(section.type);
  const Icon = def?.icon;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
  });

  const summary = getSummary(section);

  const move = (dir: -1 | 1) => {
    const newIndex = index + dir;
    if (newIndex < 0 || newIndex >= total) return;
    dispatch(draftPageActions.reorderSections({ oldIndex: index, newIndex }));
  };

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "group rounded-lg border bg-card shadow-sm transition-shadow",
        selected && "ring-2 ring-ring",
        isDragging && "z-10 opacity-80 shadow-glow",
      )}
    >
      <div className="flex items-center gap-1 p-2">
        <button
          type="button"
          className="flex size-8 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-muted-foreground hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing"
          aria-label={`Reorder ${def?.label ?? section.type} section. Press space or enter to start, arrow keys to move.`}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" aria-hidden />
        </button>

        <button
          type="button"
          onClick={onSelect}
          data-testid="section-select"
          className="flex min-w-0 flex-1 items-center gap-2 rounded-md p-1 text-left focus-visible:ring-2 focus-visible:ring-ring"
          aria-pressed={selected}
        >
          {Icon ? <Icon className="size-4 shrink-0 text-primary" aria-hidden /> : null}
          <span className="min-w-0">
            <span className="block text-sm font-medium">{def?.label ?? section.type}</span>
            {summary ? (
              <span className="block truncate text-xs text-muted-foreground">{summary}</span>
            ) : null}
          </span>
        </button>
      </div>

      <div className="flex items-center justify-end gap-0.5 border-t px-2 py-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
        <Button
          size="icon"
          variant="ghost"
          className="size-7"
          aria-label="Move section up"
          disabled={index === 0}
          onClick={() => move(-1)}
        >
          <ChevronUp className="size-4" aria-hidden />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="size-7"
          aria-label="Move section down"
          disabled={index === total - 1}
          onClick={() => move(1)}
        >
          <ChevronDown className="size-4" aria-hidden />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="size-7"
          aria-label="Duplicate section"
          onClick={onDuplicate}
        >
          <Copy className="size-4" aria-hidden />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="size-7 text-destructive hover:text-destructive"
          aria-label="Remove section"
          onClick={onRemove}
        >
          <Trash2 className="size-4" aria-hidden />
        </Button>
      </div>
    </li>
  );
}

function getSummary(section: Section): string {
  const p = section.props as Record<string, unknown>;
  const candidate = p.heading ?? p.quote ?? p.label ?? p.title;
  return typeof candidate === "string" ? candidate : "";
}
