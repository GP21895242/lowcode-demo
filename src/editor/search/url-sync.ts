import type { Variable } from "../stores/variable";
import { toSearchKey } from "./targets";
import type { PageSearchConfig, SearchFieldDef } from "./types";

/** 读取 hash 路由中的查询串（如 #/pages/x/preview?region=华东） */
function readHashQuery() {
  const hash = window.location.hash || "";
  const index = hash.indexOf("?");
  return index < 0 ? "" : hash.slice(index + 1);
}

/** 仅 persist = url 的搜索变量参与 URL 同步 */
function persistedFields(config: PageSearchConfig, variables: Variable[]): SearchFieldDef[] {
  const urlVariables = new Set(
    variables
      .filter((variable) => variable.persist === "url")
      .map((variable) => toSearchKey(variable.name)),
  );

  return config.fields.filter((field) => urlVariables.has(toSearchKey(field.variable)));
}

/**
 * 从 URL 恢复搜索值；无任何持久化参数时返回 null，避免覆盖默认值
 */
export function readSearchValuesFromUrl(config: PageSearchConfig, variables: Variable[]) {
  const params = new URLSearchParams(readHashQuery());
  const values: Record<string, any> = {};
  let found = false;

  persistedFields(config, variables).forEach((field) => {
    const key = toSearchKey(field.variable);
    if (!params.has(key)) return;

    values[field.variable] = params.get(key) ?? "";
    found = true;
  });

  return found ? values : null;
}

/**
 * 把搜索值写回 URL，使用 replaceState 避免刷新或前进后退产生多余历史
 */
export function syncSearchToUrl(
  config: PageSearchConfig,
  variables: Variable[],
  values: Record<string, any>,
) {
  const params = new URLSearchParams(readHashQuery());

  persistedFields(config, variables).forEach((field) => {
    const key = toSearchKey(field.variable);
    const value = values[field.variable];

    if (value === undefined || value === null || value === "") {
      params.delete(key);
      return;
    }
    params.set(key, typeof value === "object" ? JSON.stringify(value) : String(value));
  });

  const query = params.toString();
  const hash = window.location.hash || "";
  if (!hash) return;

  const base = hash.split("?")[0];
  const nextHash = `${base}${query ? `?${query}` : ""}`;

  if (nextHash === hash) return;

  window.history.replaceState(
    null,
    "",
    `${window.location.pathname}${window.location.search}${nextHash}`,
  );
}
