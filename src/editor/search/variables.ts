import type { StoreApi } from "zustand/vanilla";

import type { VariablesStore, VariableType } from "../page-store/stores/variables";
import { toSearchKey } from "./targets";
import type { PageSearchConfig, SearchControl } from "./types";

const CONTROL_TYPE: Record<SearchControl, VariableType> = {
  input: "string",
  select: "string",
  date: "date",
  dateRange: "json",
  numberRange: "json",
};

function defaultValue(control: SearchControl) {
  return control === "dateRange" || control === "numberRange" ? [] : "";
}

/**
 * 把搜索区字段同步为 scope = search 的只读变量：
 * 变量面板可见但不可编辑，事件流与属性绑定仍可正常使用
 */
export function syncSearchVariables(
  variablesApi: StoreApi<VariablesStore>,
  config: PageSearchConfig | null,
) {
  const fields = [...(config?.fields ?? [])].sort((left, right) => left.order - right.order);
  const { variables, setVariables } = variablesApi.getState();
  const names = new Set(fields.map((field) => `search.${toSearchKey(field.variable)}`));

  // 配置被删除、字段被移除或页面卸载时，一并清理不再存在的搜索变量
  const next = variables
    .filter((variable) => variable.scope !== "search" || names.has(variable.name))
    .map((variable) => ({ ...variable }));
  let changed = next.length !== variables.length;

  const indexByName = new Map<string, number>();

  next.forEach((variable, index) => {
    if (!indexByName.has(variable.name)) indexByName.set(variable.name, index);
  });

  fields.forEach((field) => {
    const key = toSearchKey(field.variable);
    const name = `search.${key}`;
    const index = indexByName.get(name);

    if (index === undefined) {
      next.push({
        name,
        type: CONTROL_TYPE[field.control],
        defaultValue: defaultValue(field.control),
        remark: `搜索项：${field.label}`,
        scope: "search",
        control: field.control,
        options: field.options,
        readonly: true,
      });
      indexByName.set(name, next.length - 1);
      changed = true;
      return;
    }

    const current = next[index];
    const optionsChanged =
      JSON.stringify(current.options ?? null) !== JSON.stringify(field.options ?? null);

    // 已有同名搜索变量时保留取值与持久化设置，只锁定作用域与面板编辑
    if (
      current.scope === "search" &&
      current.readonly &&
      current.control === field.control &&
      !optionsChanged
    ) {
      return;
    }

    next[index] = {
      ...current,
      scope: "search",
      control: field.control,
      options: field.options ?? current.options,
      readonly: true,
    };
    changed = true;
  });

  if (changed) setVariables(next);
}
