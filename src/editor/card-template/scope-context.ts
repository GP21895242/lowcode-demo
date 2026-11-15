import { createContext, useContext } from "react";

/** 卡片内部数据源解析结果 */
export interface CardSourceScope {
  /** 解析后的页面或卡片数据源 id，空字符串表示插槽未映射 */
  sourceId: string;
  /** 数据源作用域：page 或 card:<scopeId> */
  scope: string;
  /** 取数上下文变量，随作用域变化 */
  getVariables: () => Record<string, any>;
}

export interface CardScopeContextValue {
  scopeId: string;
  /** 解析卡片内部数据源引用：$slot.<key> → 页面数据源；其余 → 卡片私有源 */
  resolveSource: (sourceId: string) => CardSourceScope;
}

/**
 * 卡片作用域上下文，供数据源 hooks 隐式识别当前卡片实例
 */
export const CardScopeContext = createContext<CardScopeContextValue | null>(null);

export function useCardScope() {
  return useContext(CardScopeContext);
}
