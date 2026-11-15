import { useVariablesStore, type VariableType } from "../stores/variable";
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
export function syncSearchVariables(config: PageSearchConfig | null) {
  const fields = [...(config?.fields ?? [])].sort((left, right) => left.order - right.order);
  if (!fields.length) return;

  const { variables, setVariables } = useVariablesStore.getState();
  const next = variables.map((variable) => ({ ...variable }));
  const indexByName = new Map<string, number>();

  next.forEach((variable, index) => {
    if (!indexByName.has(variable.name)) indexByName.set(variable.name, index);
  });

  let changed = false;

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
