import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

export interface ContextMenuItem {
  label: string;
  key: string;
}

interface ContextMenuProps {
  position?: {
    top?: number;
    left?: number;
  };
  items: ContextMenuItem[];
  open: boolean;
  onSelect: (key: string) => void;
  onClose: () => void;
}

/**
 * 事件流节点右侧的自定义浮层菜单。
 */
function ContextMenu({ position, items, open, onSelect, onClose }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (!ref.current?.contains(event.target as globalThis.Node)) {
        onClose();
      }
    }

    // 延迟绑定，避免打开菜单的同一次点击立即关闭。
    const timer = window.setTimeout(() => {
      document.addEventListener("mousedown", handlePointerDown);
    }, 0);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [open, onClose]);

  if (!open || !items.length) {
    return null;
  }

  return createPortal(
    <div
      ref={ref}
      style={{ position: "fixed", top: position?.top, left: position?.left }}
      className="z-[1200] min-w-[120px] rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
    >
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={() => onSelect(item.key)}
          className={cn(
            "block w-full cursor-pointer select-none rounded-sm px-3 py-1.5 text-left text-sm",
            "hover:bg-accent hover:text-accent-foreground",
          )}
        >
          {item.label}
        </button>
      ))}
    </div>,
    document.body,
  );
}

export default ContextMenu;
