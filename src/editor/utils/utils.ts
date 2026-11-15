import React from "react";
import { toSearchDataKey } from "../search/targets";
import { useComponentConfigStore } from "../stores/component-config";
import type { Component } from "../stores/components";
import type { Variable } from "../stores/variable";

/**
 * 根据 id 递归查找组件
 *
 * @param id 组件 id
 * @param components 组件数组
 * @returns 匹配的组件或 null
 */
export function getComponentById(id: number | null, components: Component[]): Component | null {
  if (!id) return null;

  for (const component of components) {
    if (component.id == id) return component;
    if (component.children && component.children.length > 0) {
      const result = getComponentById(id, component.children);
      if (result !== null) return result;
    }
  }
  return null;
}

/**
 * 获取组件从根节点到自身的路径
 *
 * @param id 组件 id
 * @param components 组件数组
 * @returns 组件路径，从根节点开始
 */
export function getComponentPath(id: number | null, components: Component[]): Component[] {
  if (!id) return [];

  const path: Component[] = [];

  function walk(list: Component[], trail: Component[]): boolean {
    for (const component of list) {
      const nextTrail = [...trail, component];

      if (component.id === +id!) {
        path.push(...nextTrail);
        return true;
      }

      if (component.children?.length && walk(component.children, nextTrail)) {
        return true;
      }
    }

    return false;
  }

  walk(components, []);

  return path;
}

/**
 * 加载远程组件
 *
 * @param url - 组件的URL地址
 * @returns 组件的默认导出对象
 */
export async function loadRemoteComponent(url: string) {
  const script = await fetch(url).then((res) => res.text());

  const module = { exports: {} };
  const exports = {};

  // 因为上面代码里用到了react，所以要把react注入进去，不然会报错
  const require = (id: string) => {
    if (id === "react") {
      return React;
    }
  };

  const process = { env: { NODE_ENV: "production" } };

  // eslint-disable-next-line no-implied-eval
  const func = new Function("module", "exports", "require", "process", script);

  func(module, exports, require, process);

  return { default: module.exports } as any;
}

/**
 * 将变量默认值组装成页面数据，用于初始化或重置运行时数据
 * @param variables 变量列表
 * @returns
 */
export const getVariablesDefaultData = (variables: Variable[]) => {
  return variables.reduce<Record<string, any>>((prev, variable) => {
    // 搜索变量统一落在 search.<key>，与 SearchBus / 表达式层保持一致
    const key = variable.scope === "search" ? toSearchDataKey(variable.name) : variable.name;
    prev[key] = variable.defaultValue;
    return prev;
  }, {});
};

/**
 * 获取组件允许拖入的组件
 * @param componentName 组件名
 * @returns
 */
export const getAcceptDrop = (componentName: string) => {
  const { componentConfig } = useComponentConfigStore.getState();

  return (
    Object.values(componentConfig)
      .filter((o) => o.allowDrag?.includes(componentName))
      .map((o) => o.name) || []
  );
};
