import { describe, expect, it } from "vite-plus/test";

import {
  GRID_ITEM_DEFAULT_H,
  GRID_ITEM_DEFAULT_W,
  normalizeGridLayout,
  setGridItemSize,
  unwrapStaticValue,
} from "./layout-utils";

describe("unwrapStaticValue", () => {
  it("解包 { type, value } 形式的属性值", () => {
    expect(unwrapStaticValue({ type: "static", value: 12 }, 0)).toBe(12);
    expect(unwrapStaticValue({ type: "static", value: null }, 0)).toBe(0);
  });

  it("直接返回普通值，空值回退到默认值", () => {
    expect(unwrapStaticValue("abc", "")).toBe("abc");
    expect(unwrapStaticValue(undefined, "fallback")).toBe("fallback");
    expect(unwrapStaticValue(null, "fallback")).toBe("fallback");
    expect(unwrapStaticValue({}, "fallback")).toEqual({});
  });
});

describe("normalizeGridLayout", () => {
  it("非数组输入返回空数组", () => {
    expect(normalizeGridLayout(null)).toEqual([]);
    expect(normalizeGridLayout({ i: "a" })).toEqual([]);
  });

  it("丢弃缺少 i 的项并归一化数值", () => {
    const layout = normalizeGridLayout([
      { i: "a", x: "2", y: -3, w: 0, h: "oops" },
      { x: 1, y: 1 },
      { i: 2, x: 1.6, y: 2.4, w: 3, h: 4 },
    ]);

    expect(layout).toEqual([
      { i: "a", x: 2, y: 0, w: 1, h: GRID_ITEM_DEFAULT_H },
      { i: "2", x: 2, y: 2, w: 3, h: 4 },
    ]);
  });

  it("缺少宽高时使用默认值", () => {
    expect(normalizeGridLayout([{ i: "a" }])).toEqual([
      { i: "a", x: 0, y: 0, w: GRID_ITEM_DEFAULT_W, h: GRID_ITEM_DEFAULT_H },
    ]);
  });
});

describe("setGridItemSize", () => {
  it("调整已有网格项的尺寸，并把重叠项整体下移", () => {
    const layout = [
      { i: "a", x: 0, y: 0, w: 4, h: 7 },
      { i: "b", x: 0, y: 7, w: 4, h: 7 },
    ];

    const next = setGridItemSize(layout, "a", { h: 10 }, 12);

    expect(next.find((item) => item.i === "a")).toMatchObject({ h: 10 });
    expect(next.find((item) => item.i === "b")).toMatchObject({ y: 10, w: 4, h: 7 });
  });

  it("宽度不超过列数", () => {
    const next = setGridItemSize([{ i: "a", x: 0, y: 0, w: 4, h: 7 }], "a", { w: 20 }, 12);
    expect(next[0].w).toBe(12);
  });

  it("目标不存在时追加到布局底部", () => {
    const next = setGridItemSize([{ i: "a", x: 0, y: 0, w: 4, h: 7 }], "new", {}, 12);

    expect(next).toHaveLength(2);
    expect(next.find((item) => item.i === "new")).toMatchObject({
      x: 0,
      y: 7,
      w: GRID_ITEM_DEFAULT_W,
      h: GRID_ITEM_DEFAULT_H,
    });
  });

  it("不修改传入的布局数组", () => {
    const layout = [{ i: "a", x: 0, y: 0, w: 4, h: 7 }];
    setGridItemSize(layout, "a", { h: 9 }, 12);
    expect(layout[0].h).toBe(7);
  });
});
