import { GripVertical, Pencil, Trash2 } from "lucide-react";
import * as React from "react";
import { useState } from "react";

import { cn } from "../../lib/utils";

interface SortableListProps {
  items?: any[];
  onDelete?: (item: any, index: number) => void;
  itemRender?: (item: any, index: number) => React.ReactNode;
  hiddenEdit?: boolean;
  hiddenDelete?: boolean;
  onEdit?: (item: any, index: number) => void;
  hiddenDrag?: boolean;
  customItemRender?: (item: any, index: number) => React.ReactNode;
  deleteHandle?: (item: any, index: number) => boolean;
  editHandle?: (item: any, index: number) => boolean;
  onSortEnd?: (args: { oldIndex: number; newIndex: number }) => void;
}

/**
 * 使用原生 HTML5 拖拽实现的排序列表，替代 react-sortable-hoc。
 */
function SortableList({
  items = [],
  onDelete,
  itemRender,
  hiddenEdit,
  hiddenDelete,
  onEdit,
  hiddenDrag,
  customItemRender,
  deleteHandle,
  editHandle,
  onSortEnd,
}: SortableListProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  function renderDelete(item: any, index: number) {
    if (deleteHandle) {
      if (!deleteHandle(item, index)) return null;
    } else if (hiddenDelete) {
      return null;
    }

    return (
      <Trash2
        onClick={() => onDelete?.(item, index)}
        className="h-4 w-4 shrink-0 cursor-pointer text-muted-foreground hover:text-destructive"
      />
    );
  }

  function renderEdit(item: any, index: number) {
    if (editHandle) {
      if (!editHandle(item, index)) return null;
    } else if (hiddenEdit) {
      return null;
    }

    return (
      <Pencil
        className="h-4 w-4 shrink-0 cursor-pointer text-muted-foreground hover:text-primary"
        onClick={() => onEdit?.(item, index)}
      />
    );
  }

  return (
    <div>
      {items.map((value: any, index: number) => (
        <div
          key={value?.key ?? index}
          onDragOver={(event) => {
            if (dragIndex === null) return;
            event.preventDefault();
            if (dragIndex !== index) {
              onSortEnd?.({ oldIndex: dragIndex, newIndex: index });
              setDragIndex(index);
            }
          }}
          style={{ lineHeight: 1, fontSize: 14 }}
          className={cn("py-[4px] transition-opacity", dragIndex === index && "opacity-50")}
        >
          {customItemRender ? (
            customItemRender(value, index)
          ) : (
            <div className="flex items-center gap-2">
              {renderEdit(value, index)}
              {itemRender?.(value, index)}
              {renderDelete(value, index)}
              {!hiddenDrag && (
                <span
                  draggable
                  onDragStart={(event) => {
                    setDragIndex(index);
                    event.dataTransfer.effectAllowed = "move";
                  }}
                  onDragEnd={() => setDragIndex(null)}
                  className="inline-flex cursor-move items-center text-muted-foreground"
                >
                  <GripVertical className="h-4 w-4" />
                </span>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default SortableList;
