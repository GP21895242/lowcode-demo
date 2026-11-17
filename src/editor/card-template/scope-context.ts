import { createContext, useContext } from "react";
import type { DataSourceLoader } from "../data-source/runtime";

/** 卡片内部数据源解析结果 */
export interface CardSourceScope {
  /** 解析后的页面或卡片数据源 id，空字符串表示插槽未映射 */
  sourceId: string;
  /** 数据源定义所在加载器：$slot 映射为页面加载器，私有源为卡片实例加载器 */
  runtime: DataSourceLoader;
  /** 取数上下文变量，随数据源归属变化 */
  getVariables: () => Record<string, any>;
}

export interface CardScopeContextValue {
  componentId: number;
  /** 解析卡片内部数据源引用：$slot.<key> → 页面数据源；其余 → 卡片私有源 */
  resolveSource: (sourceId: string) => CardSourceScope;
  /** 当前卡片实例的数据源加载器，取数与缓存都限定在该实例内 */
  runtime: DataSourceLoader;
}

/**
 * 卡片作用域上下文，供数据源 hooks 隐式识别当前卡片实例
 */
export const CardScopeContext = createContext<CardScopeContextValue | null>(null);

export function useCardScope() {
  return useContext(CardScopeContext);
}
