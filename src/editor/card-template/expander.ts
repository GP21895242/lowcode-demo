import { useMemo } from "react";
import type { DataSource, DataSourceRelation } from "../data-source/types";
import type { Component } from "../stores/components";
import type { Variable } from "../stores/variable";
import { toCardSlotRef, type CardTemplate } from "./types";

/** 展开后的模板：id 已重映射为运行时 id，数据源引用已重写为插槽占位 */
export interface ExpandedTemplate {
  templateId: string;
  version: number;
  /** 已展开的模板根节点 */
  root: Component;
  /** 模板节点 id → 运行时组件 id */
  idMap: Map<number, number>;
  sources: DataSource[];
  variables: Variable[];
  relations: DataSourceRelation[];
}

const expansionCache = new Map<string, ExpandedTemplate>();

/** 运行时 id 使用负数，与页面组件 id（时间戳）天然隔离 */
let runtimeIdSeed = -1;

function nextRuntimeId() {
  runtimeIdSeed -= 1;
  return runtimeIdSeed;
}

function isFlowNode(value: any): boolean {
  return (
    !!value &&
    typeof value === "object" &&
    typeof value.id === "string" &&
    typeof value.type === "string" &&
    Array.isArray(value.menus)
  );
}

/**
 * 重写内部事件流中的组件方法目标，改指向运行时组件 id
 */
function rewriteFlowNode(node: any, idMap: Map<number, number>): any {
  const next: any = { ...node };

  if (Array.isArray(node.children)) {
    next.children = node.children.map((child: any) => rewriteFlowNode(child, idMap));
  }

  if (node.type === "action" && node.config?.type === "ComponentMethod") {
    const targetId = node.config.config?.componentId;
    const mappedId = typeof targetId === "number" ? idMap.get(targetId) : undefined;

    if (mappedId !== undefined) {
      next.config = {
        ...node.config,
        config: { ...node.config.config, componentId: mappedId },
      };
    }
  }

  return next;
}

/**
 * 深度重写属性值：数据源引用换成插槽占位，事件流内的组件 id 换成运行时 id
 */
function rewriteValue(value: any, idMap: Map<number, number>, slotRefs: Map<string, string>): any {
  if (Array.isArray(value)) {
    return value.map((item) => rewriteValue(item, idMap, slotRefs));
  }

  if (!value || typeof value !== "object") return value;

  if (isFlowNode(value)) {
    return rewriteFlowNode(value, idMap);
  }

  if (value.type === "dataSource" && value.value?.sourceId) {
    const slotRef = slotRefs.get(value.value.sourceId);
    if (slotRef) {
      return { ...value, value: { ...value.value, sourceId: slotRef } };
    }
  }

  return Object.entries(value).reduce<Record<string, any>>((next, [key, item]) => {
    next[key] = rewriteValue(item, idMap, slotRefs);
    return next;
  }, {});
}

/** 第一遍：为模板内每个节点分配稳定的运行时 id，并克隆基础结构 */
function assignRuntimeIds(node: Component, idMap: Map<number, number>): Component {
  const runtimeId = nextRuntimeId();
  idMap.set(node.id, runtimeId);

  return {
    id: runtimeId,
    name: node.name,
    desc: node.desc,
    props: {},
    parentId: node.parentId ? idMap.get(node.parentId) : undefined,
    hidden: node.hidden ? structuredClone(node.hidden) : undefined,
    children: node.children?.map((child) => assignRuntimeIds(child, idMap)),
  };
}

/** 第二遍：重写属性，需要完整的 idMap 才能处理跨节点引用 */
function rewriteNodeProps(
  target: Component,
  source: Component,
  idMap: Map<number, number>,
  slotRefs: Map<string, string>,
) {
  target.props = rewriteValue(source.props ?? {}, idMap, slotRefs);

  source.children?.forEach((child, index) => {
    const targetChild = target.children?.[index];
    if (targetChild) rewriteNodeProps(targetChild, child, idMap, slotRefs);
  });
}

/**
 * 用插槽默认数据源 id 匹配内部数据源引用，页面映射后由运行时解析
 */
function buildSlotRefs(template: CardTemplate) {
  const slotRefs = new Map<string, string>();
  template.contract.slots?.forEach((slot) => {
    if (slot.defaultSource?.id) {
      slotRefs.set(slot.defaultSource.id, toCardSlotRef(slot.key));
    }
  });
  return slotRefs;
}

/**
 * 展开模板：只依赖模板与版本，属性注入在运行时完成
 */
export function getExpandedTemplate(template?: CardTemplate): ExpandedTemplate | null {
  if (!template) return null;

  // 版本号只在契约变化时自增，内部实现调整通过 updatedAt 触发重新展开
  const cacheKey = `${template.id}@${template.version}@${template.updatedAt}`;
  const cached = expansionCache.get(cacheKey);
  if (cached) return cached;

  const idMap = new Map<number, number>();
  const root = assignRuntimeIds(template.impl.root, idMap);
  const slotRefs = buildSlotRefs(template);
  rewriteNodeProps(root, template.impl.root, idMap, slotRefs);

  const expanded: ExpandedTemplate = {
    templateId: template.id,
    version: template.version,
    root,
    idMap,
    sources: structuredClone(template.impl.sources ?? []),
    variables: structuredClone(template.impl.variables ?? []),
    relations: structuredClone(template.impl.relations ?? []),
  };

  expansionCache.set(cacheKey, expanded);
  return expanded;
}

/**
 * 按 (templateId, version, updatedAt) 缓存展开结果，属性变化或内部实现调整都会重建
 */
export function useExpandedTemplate(template?: CardTemplate) {
  return useMemo(() => getExpandedTemplate(template), [template]);
}
