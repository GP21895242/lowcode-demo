import { getByPath } from "../../lib/utils";
import { ItemType } from "../item-type";
import type { Component } from "../page-store/stores/content";
import {
  buildRowScope,
  getLoopKeyField,
  getLoopScopeName,
  getLoopSourceId,
  type RowScope,
} from "./scope";

/** 展开后的同级节点描述：行内实例会重映射 id 并携带行作用域 */
export interface ExpandedComponent {
  component: Component;
  /** 该节点所处的行作用域，顶层节点为 undefined */
  scope?: RowScope;
  /** 同级唯一的 React key */
  key: string;
  /** 渲染用 id：行内实例重映射，避免同级 _id 冲突 */
  runtimeId: number;
}

interface ExpandOptions {
  scope?: RowScope;
  keyPrefix?: string;
  /** 按数据源 id 取行数据，缺省视为无数据 */
  getRows?: (sourceId: string) => any[];
}

/**
 * 行内实例的运行 id 使用负数区间，与页面组件 id（时间戳）和卡片模板 id（-1 起）
 * 隔离；按 key 缓存保证跨渲染稳定，避免标签页等组件丢失激活态。
 */
const runtimeIdMap = new Map<string, number>();
let runtimeIdSeed = -1_000_000_000;

function allocateRuntimeId(key: string) {
  const cached = runtimeIdMap.get(key);
  if (cached !== undefined) return cached;

  runtimeIdSeed -= 1;
  runtimeIdMap.set(key, runtimeIdSeed);

  return runtimeIdSeed;
}

function resolveRowKey(component: Component, row: any, index: number) {
  const keyField = getLoopKeyField(component);
  const value = keyField
    ? getByPath(row, keyField)
    : row && typeof row === "object"
      ? (row.id ?? row.key)
      : undefined;

  const fallback = value === undefined || value === null || value === "" ? index : value;

  // key 参与 React key 与运行 id 的拼接，去掉分隔符避免歧义
  return String(fallback).replace(/[/:]/g, "_");
}

/**
 * 展开一层组件列表：循环容器按数据源行展开为多个同级节点，
 * 未绑定数据源的循环容器作为透明容器处理。嵌套层级由渲染器递归继续展开。
 */
export function expandComponents(
  components: Component[],
  options: ExpandOptions = {},
): ExpandedComponent[] {
  const { scope, keyPrefix = "", getRows } = options;
  const expanded: ExpandedComponent[] = [];

  const walk = (list: Component[], currentScope: RowScope | undefined, prefix: string) => {
    list.forEach((component) => {
      if (component.name === ItemType.Loop) {
        const sourceId = getLoopSourceId(component);
        const children = component.children ?? [];

        // 未绑定数据源：不生成副本，子项按原样参与同级渲染
        if (!sourceId) {
          walk(children, currentScope, prefix);
          return;
        }

        const rows = getRows?.(sourceId) ?? [];

        rows.forEach((row, index) => {
          const rowScope = {
            ...(currentScope ?? {}),
            ...buildRowScope(row, getLoopScopeName(component)),
          };
          const nextPrefix = `${prefix}${component.id}:${resolveRowKey(component, row, index)}/`;

          walk(children, rowScope, nextPrefix);
        });

        return;
      }

      const key = `${prefix}${component.id}`;

      expanded.push({
        component,
        scope: currentScope,
        key,
        runtimeId: currentScope ? allocateRuntimeId(key) : component.id,
      });
    });
  };

  walk(components, scope, keyPrefix);

  return expanded;
}
