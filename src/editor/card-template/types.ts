import type { DataSource, DataSourceRelation } from "../data-source/types";
import type { Component } from "../stores/components";
import type { Variable, VariableControl, VariableOption } from "../stores/variable";

/** 卡片输入类型 */
export type CardInputType = "text" | "number" | "boolean" | "select" | "variable" | "field";

/**
 * 输入如何进入内部实现，由模板作者定义，页面不可见
 */
export type CardInputBinding =
  | { kind: "prop"; targetNodeId: number; targetProp: string }
  | { kind: "var"; variable: string };

/** 卡片对外暴露的输入 */
export interface CardInputDef {
  key: string;
  label: string;
  type: CardInputType;
  options?: VariableOption[];
  defaultValue?: any;
  required?: boolean;
  /** type = variable 时绑定的页面变量，如 search.region */
  variable?: string;
  /** 是否可作为全局搜索区目标 */
  searchable?: boolean;
  /** 搜索区控件元数据 */
  control?: VariableControl;
  /** 输入注入内部实现的方式 */
  binding: CardInputBinding;
}

/** 卡片对外暴露的事件 */
export interface CardEventDef {
  name: string;
  label: string;
  payload?: { path: string; type: string; label: string }[];
}

/** 卡片对外暴露的方法 */
export interface CardMethodDef {
  name: string;
  label: string;
  params?: { name: string; type: string }[];
}

/** 卡片声明的数据插槽，由页面映射数据源 */
export interface CardSlotDef {
  key: string;
  label: string;
  required: boolean;
  /** 插入时复制的数据源模板 */
  defaultSource?: DataSource;
  /** 是否允许进入合并建议候选池，仅影响建议，不代表会自动合并 */
  shareable?: boolean;
}

/** 卡片对外契约，是页面可配置的唯一范围 */
export interface CardContract {
  inputs: CardInputDef[];
  events: CardEventDef[];
  methods?: CardMethodDef[];
  slots?: CardSlotDef[];
}

/** 卡片内部实现，页面不可见 */
export interface CardTemplateImpl {
  /** 卡片根（Card）子树，id 仅在模板内有效 */
  root: Component;
  /** 卡片私有数据源 */
  sources: DataSource[];
  /** 卡片内部变量 */
  variables: Variable[];
  relations: DataSourceRelation[];
}

export interface CardTemplate {
  id: string;
  name: string;
  desc?: string;
  version: number;
  contract: CardContract;
  impl: CardTemplateImpl;
  createdAt: string;
  updatedAt: string;
}

/**
 * 页面中的卡片实例节点属性，只允许契约数据与稳定的 scopeId
 */
export interface CardInstanceProps {
  templateId: string;
  /** 创建时版本，用于提示升级 */
  templateVersion: number;
  /** 插入时生成，永久稳定，联动/事件/方法均引用它 */
  scopeId: string;
  /** 仅允许 contract.inputs 的 key */
  inputValues: Record<string, any>;
  /** 仅允许 contract.slots 的 key → 页面 sourceId */
  slotMapping: Record<string, string>;
}

/** 卡片内部数据源引用占位前缀，运行时由 slotMapping 解析为页面数据源 */
export const CARD_SLOT_PREFIX = "$slot.";

export function toCardSlotRef(key: string) {
  return `${CARD_SLOT_PREFIX}${key}`;
}

export function isCardSlotRef(sourceId?: string): sourceId is string {
  return !!sourceId && sourceId.startsWith(CARD_SLOT_PREFIX);
}

export function readCardSlotKey(sourceId: string) {
  return sourceId.slice(CARD_SLOT_PREFIX.length);
}
