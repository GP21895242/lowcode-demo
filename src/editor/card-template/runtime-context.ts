import { createContext, useContext } from "react";
import type { EventDomain } from "../utils/action";
import type { ExpandedTemplate } from "./expander";
import type { CardSourceScope } from "./scope-context";
import type { CardContract } from "./types";

export interface CardRuntimeContextValue {
  componentId: number;
  contract: CardContract;
  expanded: ExpandedTemplate;
  /** 当前生效的输入（页面配置 + 联动写入） */
  inputs: Record<string, any>;
  getData: (key: string) => any;
  resolveSource: (sourceId: string) => CardSourceScope;
  /** 输入注入产生的属性覆盖：运行时组件 id → 属性 */
  propOverrides: Record<number, Record<string, any>>;
  emit: (event: string, payload: any) => void;
  contractEvents: Set<string>;
  domain: EventDomain;
  /** 内部组件 ref 仅登记在当前实例，避免同模板多实例互相覆盖 */
  setComponentRef: (componentId: number, ref: any) => void;
}

export const CardRuntimeContext = createContext<CardRuntimeContextValue | null>(null);

export function useCardRuntime() {
  const context = useContext(CardRuntimeContext);
  if (!context) {
    throw new Error("useCardRuntime 必须在 CardRuntimeProvider 内使用");
  }
  return context;
}
