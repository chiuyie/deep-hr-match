"use client";

import { useMemo, useState, type CSSProperties, type HTMLAttributes, type ReactNode } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import type { FormFieldDefinition, FormFieldSectionGroup } from "@/lib/form-fields/types";
import { cn } from "@/lib/utils";

export type FormFieldReorderUpdate = {
  id: string;
  section: string;
  sort_order: number;
};

type ItemsBySection = Record<string, string[]>;

function sectionDroppableId(section: string) {
  return `section-drop:${section}`;
}

function sectionSortableId(section: string) {
  return `section-order:${section}`;
}

function parseSectionDroppableId(id: UniqueIdentifier): string | null {
  const value = String(id);
  return value.startsWith("section-drop:") ? value.slice("section-drop:".length) : null;
}

function parseSectionSortableId(id: UniqueIdentifier): string | null {
  const value = String(id);
  return value.startsWith("section-order:") ? value.slice("section-order:".length) : null;
}

function isSectionDrag(id: UniqueIdentifier) {
  return Boolean(parseSectionSortableId(id));
}

function buildItemsBySection(groups: FormFieldSectionGroup[]): ItemsBySection {
  const items: ItemsBySection = {};
  for (const group of groups) {
    items[group.section] = group.fields.map((field) => field.id);
  }
  return items;
}

function buildFieldsById(groups: FormFieldSectionGroup[]): Record<string, FormFieldDefinition> {
  const map: Record<string, FormFieldDefinition> = {};
  for (const group of groups) {
    for (const field of group.fields) {
      map[field.id] = field;
    }
  }
  return map;
}

export function formFieldGroupsSignature(groups: FormFieldSectionGroup[]) {
  return groups
    .map((group) => `${group.section}:${group.fields.map((field) => field.id).join(",")}`)
    .join("|");
}

function findContainer(items: ItemsBySection, id: UniqueIdentifier): string | null {
  const asSectionDrop = parseSectionDroppableId(id);
  if (asSectionDrop) return asSectionDrop;
  const asSectionSort = parseSectionSortableId(id);
  if (asSectionSort) return asSectionSort;
  const fieldId = String(id);
  for (const [section, fieldIds] of Object.entries(items)) {
    if (fieldIds.includes(fieldId)) return section;
  }
  return null;
}

function toUpdates(items: ItemsBySection, sectionOrder: string[]): FormFieldReorderUpdate[] {
  const updates: FormFieldReorderUpdate[] = [];
  for (const section of sectionOrder) {
    (items[section] ?? []).forEach((id, index) => {
      updates.push({ id, section, sort_order: index + 1 });
    });
  }
  return updates;
}

function sameItems(a: ItemsBySection, b: ItemsBySection) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function sameOrder(a: string[], b: string[]) {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

function SortableFieldCard({
  field,
  disabled,
  children,
}: {
  field: FormFieldDefinition;
  disabled?: boolean;
  children: (opts: {
    dragHandleProps: HTMLAttributes<HTMLButtonElement>;
    isDragging: boolean;
  }) => ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: field.id,
    disabled,
    data: { type: "field", fieldId: field.id },
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn("relative", isDragging && "z-20 opacity-60")}
    >
      {children({
        isDragging,
        dragHandleProps: {
          ...attributes,
          ...listeners,
        },
      })}
    </div>
  );
}

function SortableSectionShell({
  section,
  disabled,
  children,
}: {
  section: string;
  disabled?: boolean;
  children: (opts: {
    setNodeRef: (node: HTMLElement | null) => void;
    style: CSSProperties;
    isDragging: boolean;
    dragHandleProps: HTMLAttributes<HTMLButtonElement>;
  }) => ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: sectionSortableId(section),
    disabled,
    data: { type: "section", section },
  });

  return (
    <>
      {children({
        setNodeRef,
        isDragging,
        style: {
          transform: CSS.Transform.toString(transform),
          transition,
        },
        dragHandleProps: {
          ...attributes,
          ...listeners,
        },
      })}
    </>
  );
}

function SectionDropZone({
  section,
  children,
}: {
  section: string;
  children: ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: sectionDroppableId(section),
    data: { type: "section-drop", section },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "min-h-[3.5rem] space-y-3 rounded-xl transition-colors",
        isOver && "bg-sky-50/70 ring-2 ring-sky-200 ring-inset"
      )}
    >
      {children}
    </div>
  );
}

export function SortableFormFieldSections({
  groups,
  disabled = false,
  onReorder,
  onSectionReorder,
  renderField,
  renderSectionChrome,
}: {
  groups: FormFieldSectionGroup[];
  disabled?: boolean;
  onReorder: (updates: FormFieldReorderUpdate[]) => void;
  onSectionReorder?: (titles: string[]) => void;
  renderField: (
    field: FormFieldDefinition,
    opts: {
      dragHandleProps: HTMLAttributes<HTMLButtonElement>;
      isDragging: boolean;
    }
  ) => ReactNode;
  renderSectionChrome: (args: {
    section: string;
    fieldCount: number;
    children: ReactNode;
    sectionDragHandle?: HTMLAttributes<HTMLButtonElement>;
    isSectionDragging?: boolean;
  }) => ReactNode;
}) {
  const initialSectionOrder = useMemo(() => groups.map((group) => group.section), [groups]);
  const fieldsById = useMemo(() => buildFieldsById(groups), [groups]);
  const initialItems = useMemo(() => buildItemsBySection(groups), [groups]);

  const [sectionOrder, setSectionOrder] = useState<string[]>(initialSectionOrder);
  const [sectionBaseline, setSectionBaseline] = useState<string[]>(initialSectionOrder);
  const [items, setItems] = useState<ItemsBySection>(initialItems);
  const [baseline, setBaseline] = useState<ItemsBySection>(initialItems);
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  );

  const activeField = activeId && !isSectionDrag(activeId) ? fieldsById[String(activeId)] : undefined;
  const activeSection = activeId ? parseSectionSortableId(activeId) : null;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over || disabled) return;
    if (isSectionDrag(active.id)) return;

    setItems((current) => {
      const activeContainer = findContainer(current, active.id);
      const overContainer = findContainer(current, over.id);
      if (!activeContainer || !overContainer || activeContainer === overContainer) {
        return current;
      }

      const activeItems = current[activeContainer] ?? [];
      const overItems = current[overContainer] ?? [];
      const activeIndex = activeItems.indexOf(String(active.id));
      if (activeIndex < 0) return current;

      const overSectionId = parseSectionDroppableId(over.id) ?? parseSectionSortableId(over.id);
      let newIndex = overItems.length;
      if (!overSectionId) {
        const overIndex = overItems.indexOf(String(over.id));
        newIndex = overIndex >= 0 ? overIndex : overItems.length;
      }

      return {
        ...current,
        [activeContainer]: activeItems.filter((id) => id !== String(active.id)),
        [overContainer]: [
          ...overItems.slice(0, newIndex),
          String(active.id),
          ...overItems.slice(newIndex),
        ],
      };
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);

    if (!over || disabled) {
      setItems(baseline);
      setSectionOrder(sectionBaseline);
      return;
    }

    if (isSectionDrag(active.id)) {
      const activeSectionName = parseSectionSortableId(active.id);
      const overSectionName =
        parseSectionSortableId(over.id) ??
        parseSectionDroppableId(over.id) ??
        findContainer(items, over.id);
      if (!activeSectionName || !overSectionName) {
        setSectionOrder(sectionBaseline);
        return;
      }

      const oldIndex = sectionOrder.indexOf(activeSectionName);
      const newIndex = sectionOrder.indexOf(overSectionName);
      if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) {
        return;
      }

      const nextOrder = arrayMove(sectionOrder, oldIndex, newIndex);
      setSectionOrder(nextOrder);
      if (!sameOrder(nextOrder, sectionBaseline)) {
        setSectionBaseline(nextOrder);
        onSectionReorder?.(nextOrder);
      }
      return;
    }

    setItems((current) => {
      const activeContainer = findContainer(current, active.id);
      const overContainer = findContainer(current, over.id);
      if (!activeContainer || !overContainer) {
        return baseline;
      }

      let nextItems = current;
      if (activeContainer === overContainer) {
        const sectionItems = current[activeContainer] ?? [];
        const oldIndex = sectionItems.indexOf(String(active.id));
        const overSectionId = parseSectionDroppableId(over.id) ?? parseSectionSortableId(over.id);
        const newIndex = overSectionId
          ? sectionItems.length - 1
          : sectionItems.indexOf(String(over.id));

        if (oldIndex >= 0 && newIndex >= 0 && oldIndex !== newIndex) {
          nextItems = {
            ...current,
            [activeContainer]: arrayMove(sectionItems, oldIndex, newIndex),
          };
        }
      }

      if (!sameItems(nextItems, baseline)) {
        const updates = toUpdates(nextItems, sectionOrder);
        queueMicrotask(() => {
          setBaseline(nextItems);
          onReorder(updates);
        });
      }
      return nextItems;
    });
  }

  const sectionSortableIds = sectionOrder.map((section) => sectionSortableId(section));

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={() => {
        setActiveId(null);
        setItems(baseline);
        setSectionOrder(sectionBaseline);
      }}
    >
      <SortableContext
        items={sectionSortableIds}
        strategy={verticalListSortingStrategy}
        disabled={disabled || !onSectionReorder}
      >
        {sectionOrder.map((section) => {
          const fieldIds = items[section] ?? [];
          return (
            <SortableSectionShell
              key={section}
              section={section}
              disabled={disabled || !onSectionReorder}
            >
              {({ setNodeRef, style, isDragging, dragHandleProps }) => (
                <div
                  ref={setNodeRef}
                  style={style}
                  className={cn(isDragging && "relative z-30 opacity-70")}
                >
                  {renderSectionChrome({
                    section,
                    fieldCount: fieldIds.length,
                    sectionDragHandle: onSectionReorder ? dragHandleProps : undefined,
                    isSectionDragging: isDragging,
                    children: (
                      <SortableContext
                        id={sectionDroppableId(section)}
                        items={fieldIds}
                        strategy={verticalListSortingStrategy}
                        disabled={disabled}
                      >
                        <SectionDropZone section={section}>
                          {fieldIds.length === 0 ? (
                            <p className="rounded-xl border border-dashed border-slate-200 bg-white px-3 py-4 text-sm text-slate-500">
                              {disabled
                                ? "No fields in this section."
                                : "Drop a field here, or add one below."}
                            </p>
                          ) : (
                            fieldIds.map((fieldId) => {
                              const field = fieldsById[fieldId];
                              if (!field) return null;
                              return (
                                <SortableFieldCard
                                  key={fieldId}
                                  field={field}
                                  disabled={disabled}
                                >
                                  {(opts) => renderField(field, opts)}
                                </SortableFieldCard>
                              );
                            })
                          )}
                        </SectionDropZone>
                      </SortableContext>
                    ),
                  })}
                </div>
              )}
            </SortableSectionShell>
          );
        })}
      </SortableContext>

      <DragOverlay>
        {activeField ? (
          <div className="rounded-xl border border-sky-200 bg-white px-3 py-2.5 shadow-lg">
            <div className="flex items-center gap-2">
              <GripVertical className="h-4 w-4 text-slate-400" />
              <p className="text-sm font-medium text-slate-800">{activeField.label}</p>
            </div>
          </div>
        ) : activeSection ? (
          <div className="rounded-xl border border-sky-200 bg-white px-4 py-3 shadow-lg">
            <div className="flex items-center gap-2">
              <GripVertical className="h-4 w-4 text-slate-400" />
              <p className="text-sm font-semibold text-slate-800">{activeSection}</p>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

export function FieldDragHandle(
  props: HTMLAttributes<HTMLButtonElement> & { disabled?: boolean }
) {
  const { disabled, className, ...rest } = props;
  return (
    <button
      type="button"
      disabled={disabled}
      className={cn(
        "inline-flex h-7 w-7 shrink-0 cursor-grab items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-800 active:cursor-grabbing disabled:pointer-events-none disabled:opacity-40",
        className
      )}
      {...rest}
    >
      <GripVertical className="h-3.5 w-3.5" />
    </button>
  );
}
