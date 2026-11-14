import { cloneDeep, getByPath } from "@/lib/utils";
import type { DataSourceAdapter } from "../adapter";
import type { LoadContext, LoadParams, LoadResult } from "../types";

function isEmpty(value: any) {
  return value === undefined || value === null || value === "";
}

function delay(ms: number, signal?: AbortSignal) {
  if (ms <= 0) return Promise.resolve();
  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(new DOMException("Aborted", "AbortError"));
      },
      { once: true },
    );
  });
}

/** 搜索：字符串包含，数组按区间处理（用于日期/数字区间） */
function matchSearch(rawValue: any, keyword: any): boolean {
  if (isEmpty(keyword)) return true;
  if (Array.isArray(keyword)) {
    const [start, end] = keyword;
    if (isEmpty(start) && isEmpty(end)) return true;
    if (!isEmpty(start) && rawValue < start) return false;
    if (!isEmpty(end) && rawValue > end) return false;
    return true;
  }
  return String(rawValue ?? "")
    .toLowerCase()
    .includes(String(keyword).toLowerCase());
}

/** 联动过滤：精确匹配或数组包含 */
function matchFilter(rawValue: any, expected: any): boolean {
  if (isEmpty(expected)) return true;
  if (Array.isArray(expected)) {
    if (expected.length === 0) return true;
    return expected.some((item) => String(item) === String(rawValue));
  }
  return String(rawValue) === String(expected);
}

function sortRows(rows: any[], params: LoadParams) {
  if (!params.sort?.field) return rows;
  const { field, order } = params.sort;
  const direction = order === "desc" ? -1 : 1;
  return [...rows].sort((a, b) => {
    const left = getByPath(a, field);
    const right = getByPath(b, field);
    if (typeof left === "number" && typeof right === "number") {
      return (left - right) * direction;
    }
    return String(left ?? "").localeCompare(String(right ?? "")) * direction;
  });
}

export const mockAdapter: DataSourceAdapter = {
  kind: "mock",
  async load(source, params, ctx: LoadContext): Promise<LoadResult> {
    await delay(source.mock.delay, ctx.signal);

    let rows = cloneDeep(source.mock.data ?? []);

    rows = rows.filter((row) =>
      Object.entries(params.search).every(([key, value]) =>
        matchSearch(getByPath(row, key), value),
      ),
    );

    rows = rows.filter((row) =>
      Object.entries(params.filters).every(([key, value]) =>
        matchFilter(getByPath(row, key), value),
      ),
    );

    rows = sortRows(rows, params);
    const total = rows.length;

    if (params.page) {
      const { pageNo, pageSize } = params.page;
      const start = Math.max(0, (pageNo - 1) * pageSize);
      rows = rows.slice(start, start + pageSize);
    }

    return { rows, total };
  },
};
