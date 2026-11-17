import { describe, expect, it } from "vite-plus/test";

import { cloneDeep, formatDate, getByPath } from "./utils";

describe("getByPath", () => {
  it("按点分隔路径读取嵌套值", () => {
    const data = { a: { b: [{ c: 3 }] }, list: [10, 20] };

    expect(getByPath(data, "a.b.0.c")).toBe(3);
    expect(getByPath(data, "list.1")).toBe(20);
    expect(getByPath(data, 1)).toBeUndefined();
  });

  it("路径为空或不存在时返回 undefined", () => {
    expect(getByPath({ a: 1 }, "")).toBeUndefined();
    expect(getByPath({ a: 1 }, "a.b.c")).toBeUndefined();
    expect(getByPath(null, "a")).toBeUndefined();
  });
});

describe("cloneDeep", () => {
  it("返回与原对象互不影响的新对象", () => {
    const source = { list: [1, 2], nested: { ok: true } };
    const copy = cloneDeep(source);

    copy.list.push(3);
    copy.nested.ok = false;

    expect(source).toEqual({ list: [1, 2], nested: { ok: true } });
  });
});

describe("formatDate", () => {
  it("空值返回 null", () => {
    expect(formatDate(null)).toBeNull();
    expect(formatDate("")).toBeNull();
  });

  it("格式化 Date 与日期字符串", () => {
    expect(formatDate(new Date(2026, 0, 5))).toBe("2026-01-05");
    expect(formatDate(new Date(2026, 10, 18))).toBe("2026-11-18");
  });

  it("无法解析的值原样返回字符串", () => {
    expect(formatDate("not-a-date")).toBe("not-a-date");
  });
});
