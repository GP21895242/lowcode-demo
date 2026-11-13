export { cn } from "cn";

/**
 * 根据点分隔的路径读取对象值。
 */
export function getByPath(obj: any, path: string | number): any {
  if (path == null || path === "") return undefined;
  return String(path)
    .split(".")
    .reduce((value, key) => (value == null ? undefined : value[key]), obj);
}

/**
 * 优先使用结构化克隆，回退到 JSON 深拷贝。
 */
export function cloneDeep<T>(value: T): T {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value)) as T;
}

/**
 * 将日期值格式化为 YYYY-MM-DD。
 */
export function formatDate(value: any): string | null {
  if (value == null || value === "") return null;

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
