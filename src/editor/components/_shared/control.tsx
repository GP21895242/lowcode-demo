import { ItemType } from "../../item-type";

/** 基础叶子组件的可放置容器 */
export const BASIC_ALLOW_DRAG = [
  ItemType.Page,
  ItemType.Space,
  ItemType.Card,
  ItemType.Modal,
  ItemType.TabPane,
  ItemType.Carousel,
  ItemType.Loop,
  ItemType.GridLayout,
];

export function toBoolean(value: unknown, fallback = false) {
  if (value === undefined || value === null || value === "") return fallback;

  return value === true || value === "true";
}

export function toNumber(value: unknown, fallback: number) {
  const num = Number(value);

  return Number.isFinite(num) ? num : fallback;
}

/** 逗号 / 中文逗号 / 换行分隔的字符串转数组 */
export function toStringList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value !== "string") return [];

  return value
    .split(/[,，\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}
