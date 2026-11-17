export interface GridItemLayout {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

/** 网格项默认宽高（列 / 行） */
export const GRID_ITEM_DEFAULT_W = 4;
export const GRID_ITEM_DEFAULT_H = 7;

/** 解包 { type, value } 形式的属性值 */
export function unwrapStaticValue<T>(value: unknown, fallback: T): T {
  if (value && typeof value === "object" && "value" in (value as Record<string, unknown>)) {
    const inner = (value as Record<string, unknown>).value;
    return (inner === undefined || inner === null ? fallback : inner) as T;
  }

  return (value === undefined || value === null ? fallback : value) as T;
}

/** 把布局数据归一化成网格项数组 */
export function normalizeGridLayout(value: unknown): GridItemLayout[] {
  if (!Array.isArray(value)) return [];

  return value.reduce<GridItemLayout[]>((items, item) => {
    if (!item || typeof item !== "object" || (item as Record<string, unknown>).i === undefined) {
      return items;
    }

    const source = item as Record<string, unknown>;
    const num = (v: unknown, fallback: number) => {
      const parsed = Number(v);
      return Number.isFinite(parsed) ? parsed : fallback;
    };

    items.push({
      i: String(source.i),
      x: Math.max(0, Math.round(num(source.x, 0))),
      y: Math.max(0, Math.round(num(source.y, 0))),
      w: Math.max(1, Math.round(num(source.w, GRID_ITEM_DEFAULT_W))),
      h: Math.max(1, Math.round(num(source.h, GRID_ITEM_DEFAULT_H))),
    });

    return items;
  }, []);
}

function isOverlap(a: GridItemLayout, b: GridItemLayout) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

/**
 * 调整某个网格项的宽高；与其它网格项重叠时把后者整体向下顺延，保证不重叠
 */
export function setGridItemSize(
  layout: GridItemLayout[],
  key: string,
  patch: { w?: number; h?: number },
  cols: number,
): GridItemLayout[] {
  const columnCount = Math.max(1, cols);
  const clampW = (value: number) => Math.min(Math.max(1, value), columnCount);
  const clampH = (value: number) => Math.max(1, value);

  const next = layout.some((item) => item.i === key)
    ? layout.map((item) =>
        item.i === key
          ? { ...item, w: clampW(patch.w ?? item.w), h: clampH(patch.h ?? item.h) }
          : item,
      )
    : [
        ...layout,
        {
          i: key,
          x: 0,
          y: layout.reduce((y, item) => Math.max(y, item.y + item.h), 0),
          w: clampW(patch.w ?? GRID_ITEM_DEFAULT_W),
          h: clampH(patch.h ?? GRID_ITEM_DEFAULT_H),
        },
      ];

  const placed: GridItemLayout[] = [];

  [...next]
    .sort((a, b) => a.y - b.y || a.x - b.x)
    .forEach((item) => {
      let y = item.y;

      while (placed.some((other) => isOverlap({ ...item, y }, other))) {
        y += 1;
      }

      placed.push({ ...item, y });
    });

  return placed;
}
