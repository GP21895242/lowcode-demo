import { getComponentPath } from "../utils/utils";
import { ItemType } from "../item-type";
import type { Component } from "../page-store/stores/content";

/** 扁平的行作用域：键形如 row.title / row.user.name，可直接与页面数据合并查表 */
export type RowScope = Record<string, any>;

export const DEFAULT_SCOPE_NAME = "row";

/** 行数据拍平的最大深度，避免异常数据导致无限递归 */
const MAX_SCOPE_DEPTH = 4;

/** 读取循环容器绑定的数据源 id */
export function getLoopSourceId(component: Component): string | undefined {
  const binding = component.props?.dataSource;
  return binding?.type === "dataSource"
    ? (binding.value?.sourceId as string | undefined)
    : undefined;
}

/** 读取变量前缀，缺省为 row */
export function getLoopScopeName(component: Component): string {
  const value = component.props?.scopeName?.value;
  return typeof value === "string" && value.trim() ? value.trim() : DEFAULT_SCOPE_NAME;
}

export function getLoopKeyField(component: Component): string | undefined {
  const value = component.props?.keyField?.value;
  return typeof value === "string" && value ? value : undefined;
}

function flatten(value: any, key: string, scope: RowScope, depth: number) {
  scope[key] = value;

  if (depth >= MAX_SCOPE_DEPTH) return;
  if (!value || typeof value !== "object" || Array.isArray(value)) return;

  Object.entries(value).forEach(([childKey, child]) => {
    flatten(child, `${key}.${childKey}`, scope, depth + 1);
  });
}

/** 把一行数据展开为扁平键，供属性看板按变量名查表 */
export function buildRowScope(row: any, scopeName = DEFAULT_SCOPE_NAME): RowScope {
  const scope: RowScope = {};
  flatten(row, scopeName, scope, 0);
  return scope;
}

/** 收集组件树中循环容器绑定的数据源 id */
export function collectLoopSourceIds(components: Component[]): string[] {
  const ids = new Set<string>();

  const visit = (list: Component[]) => {
    list.forEach((component) => {
      if (component.name === ItemType.Loop) {
        const sourceId = getLoopSourceId(component);
        if (sourceId) ids.add(sourceId);
      }

      if (component.children?.length) visit(component.children);
    });
  };

  visit(components);

  return Array.from(ids);
}

/** 查找选中组件最近的循环容器祖先（不含自身） */
export function findNearestLoop(
  componentId: number | null | undefined,
  components: Component[],
): Component | undefined {
  if (!componentId) return undefined;

  const path = getComponentPath(componentId, components);

  for (let i = path.length - 2; i >= 0; i -= 1) {
    if (path[i].name === ItemType.Loop) return path[i];
  }

  return undefined;
}
