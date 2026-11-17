import { GripVertical } from "lucide-react";
import React, { useCallback, useMemo, useState } from "react";
import ReactGridLayout, {
  useContainerWidth,
  verticalCompactor,
  type Layout,
  type LayoutItem,
} from "react-grid-layout";
import "react-grid-layout/css/styles.css";

import type { CommonComponentProps } from "../../interface";
import { useComponetsStore } from "../../stores/components";

interface GridLayoutBaseProps extends CommonComponentProps {
  /** 编辑态：显示空状态提示，并把布局写回组件属性 */
  editable?: boolean;
}

const DEFAULT_COLS = 12;
const DEFAULT_ROW_HEIGHT = 24;
const DEFAULT_ITEM_W = 4;
const DEFAULT_ITEM_H = 7;
const GRID_MARGIN: [number, number] = [8, 8];

function toFiniteNumber(value: unknown, fallback: number) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function toPositiveNumber(value: unknown, fallback: number) {
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? num : fallback;
}

/** 把持久化的布局数据归一化成 react-grid-layout 需要的结构 */
function normalizeLayout(value: unknown): LayoutItem[] {
  if (!Array.isArray(value)) return [];

  return value.reduce<LayoutItem[]>((items, item) => {
    if (!item || typeof item !== "object" || (item as LayoutItem).i === undefined) return items;

    const source = item as LayoutItem;
    items.push({
      i: String(source.i),
      x: Math.max(0, Math.round(toFiniteNumber(source.x, 0))),
      y: Math.max(0, Math.round(toFiniteNumber(source.y, 0))),
      w: Math.max(1, Math.round(toFiniteNumber(source.w, DEFAULT_ITEM_W))),
      h: Math.max(1, Math.round(toFiniteNumber(source.h, DEFAULT_ITEM_H))),
    });

    return items;
  }, []);
}

function serializeLayout(layout: LayoutItem[]) {
  return JSON.stringify(
    [...layout]
      .sort((a, b) => a.i.localeCompare(b.i))
      .map((item) => [item.i, item.x, item.y, item.w, item.h]),
  );
}

function GridLayoutBase({
  _id,
  cols,
  rowHeight,
  layout,
  children,
  editable = false,
}: GridLayoutBaseProps) {
  const updateComponentProps = useComponetsStore((state) => state.updateComponentProps);
  const { width, containerRef, mounted } = useContainerWidth({ initialWidth: 960 });

  const columnCount = Math.max(1, Math.round(toPositiveNumber(cols, DEFAULT_COLS)));
  const rowHeightPx = toPositiveNumber(rowHeight, DEFAULT_ROW_HEIGHT);
  const storedLayout = useMemo(() => normalizeLayout(layout), [layout]);

  // 画布子组件由编辑器渲染，key 即组件 id
  const entries = useMemo(() => {
    const list = Array.isArray(children) ? children : children == null ? [] : [children];

    return list
      .filter((child): child is React.ReactElement => React.isValidElement(child))
      .map((child, index) => ({
        key: child.key != null ? String(child.key) : `grid-item-${index}`,
        child,
      }));
  }, [children]);

  // 已保存的布局优先，新拖入的组件按顺序追加到末尾
  const computedLayout = useMemo(() => {
    const stored = new Map(storedLayout.map((item) => [item.i, item]));
    const result: LayoutItem[] = [];
    let nextY = 0;

    entries.forEach(({ key }) => {
      const item = stored.get(key);

      if (!item) return;

      result.push(item);
      nextY = Math.max(nextY, item.y + item.h);
    });

    entries.forEach(({ key }) => {
      if (stored.has(key)) return;

      result.push({
        i: key,
        x: 0,
        y: nextY,
        w: Math.min(DEFAULT_ITEM_W, columnCount),
        h: DEFAULT_ITEM_H,
      });
      nextY += DEFAULT_ITEM_H;
    });

    return result;
  }, [columnCount, entries, storedLayout]);

  // 网格项之间禁止重叠：拖动时遇到碰撞停留在最后一个不重叠的位置；
  // 缩放时放开限制，让相邻网格项让位，保证每个网格项都能自由 resize
  const noOverlapCompactor = useMemo(() => ({ ...verticalCompactor, preventCollision: true }), []);
  const [resizing, setResizing] = useState(false);
  const compactor = resizing ? verticalCompactor : noOverlapCompactor;

  // 拖拽/缩放结束后把最终布局写回组件属性（预览态仅本地生效，不回写）
  const handleLayoutChange = useCallback(
    (nextLayout: Layout) => {
      if (!editable) return;

      const layoutMap = new Map(nextLayout.map((item) => [item.i, item]));

      const next = entries.reduce<LayoutItem[]>((items, entry) => {
        const item = layoutMap.get(entry.key);

        if (item) {
          items.push({ i: entry.key, x: item.x, y: item.y, w: item.w, h: item.h });
        }

        return items;
      }, []);

      if (next.length !== entries.length) return;
      if (serializeLayout(next) === serializeLayout(storedLayout)) return;

      updateComponentProps(_id, { layout: { type: "static", value: next } });
    },
    [_id, editable, entries, storedLayout, updateComponentProps],
  );

  // 网格拖动过程中同步画布选中遮罩
  const notifyLayoutChange = useCallback(() => {
    window.dispatchEvent(new Event("editor:layout-change"));
  }, []);

  return (
    <div ref={containerRef} className="flex min-h-0 w-full flex-1 flex-col">
      {editable && entries.length === 0 ? (
        <div className="flex min-h-24 flex-1 items-center justify-center rounded-md border border-dashed border-border bg-muted/20 text-xs text-muted-foreground">
          拖入组件到自由布局
        </div>
      ) : null}

      {entries.length > 0 && mounted ? (
        <ReactGridLayout
          width={width}
          layout={computedLayout}
          gridConfig={{ cols: columnCount, rowHeight: rowHeightPx, margin: GRID_MARGIN }}
          dragConfig={{ enabled: true, handle: ".editor-grid-drag-handle" }}
          resizeConfig={{ enabled: true, handles: ["se"] }}
          compactor={compactor}
          autoSize
          className="editor-grid-layout"
          onLayoutChange={handleLayoutChange}
          onDrag={notifyLayoutChange}
          onResize={notifyLayoutChange}
          onResizeStart={() => setResizing(true)}
          onResizeStop={() => setResizing(false)}
        >
          {entries.map(({ key, child }) => (
            <div key={key} className="editor-grid-item relative">
              {/* 悬停时显示拖拽把手 */}
              <div
                className="editor-grid-drag-handle absolute top-1 right-1 z-10 flex size-5 cursor-grab items-center justify-center rounded-sm border border-border bg-background/90 text-muted-foreground shadow-sm active:cursor-grabbing"
                title="拖动改变位置"
              >
                <GripVertical className="size-3" />
              </div>
              {/* 内容溢出时裁剪并出现滚动条；p-px 给卡片外边框（ring）留出空间，避免被裁掉 */}
              <div className="h-full min-h-0 w-full overflow-auto p-px">{child}</div>
            </div>
          ))}
        </ReactGridLayout>
      ) : null}
    </div>
  );
}

export default GridLayoutBase;
