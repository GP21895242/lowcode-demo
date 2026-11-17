import type { StoreApi } from "zustand/vanilla";

import type { PageDataStore } from "../page-store/stores/page-data";
import type { SearchFieldDef, SearchTarget } from "./types";

const SEARCH_PREFIX = "search.";

/**
 * 去掉 search. 前缀，得到搜索变量名
 */
export function toSearchKey(variable: string) {
  return variable.startsWith(SEARCH_PREFIX) ? variable.slice(SEARCH_PREFIX.length) : variable;
}

/**
 * 搜索变量在页面数据中的扁平 key，如 search.region
 */
export function toSearchDataKey(variable: string) {
  return `${SEARCH_PREFIX}${toSearchKey(variable)}`;
}

/**
 * 从页面数据读取当前搜索值
 */
export function readSearchValues(fields: SearchFieldDef[], pageData: StoreApi<PageDataStore>) {
  const data = pageData.getState().data as Record<string, any>;

  return fields.reduce<Record<string, any>>((values, field) => {
    values[field.variable] = data[toSearchDataKey(field.variable)];
    return values;
  }, {});
}

/**
 * 按数据源分组搜索参数，同源的多个字段只产生一次请求
 */
export function groupSourceTargets(targets: SearchTarget[], values: Record<string, any>) {
  const groups: Record<string, Record<string, any>> = {};

  targets.forEach((target) => {
    if (target.kind !== "source") return;

    const value = values[target.variable];
    if (value === undefined || value === null || value === "") return;

    groups[target.sourceId] ??= {};
    groups[target.sourceId][target.paramKey] = value;
  });

  return groups;
}
