import { createStore, type StoreApi } from "zustand/vanilla";

import { getByPath } from "../../../lib/utils";
import type { InteractionAction, PageInteraction } from "../../interaction/types";
import type { CardRegistry } from "./cards";
import type { PageDataStore } from "./page-data";

/** 单条联动链的最大深度，超出即丢弃，避免环形触发无限执行 */
const MAX_CHAIN_DEPTH = 8;

export interface InteractionState {
  interactions: PageInteraction[];
}

export interface InteractionActions {
  setInteractions: (interactions: PageInteraction[]) => void;
  addInteraction: (interaction: PageInteraction) => void;
  updateInteraction: (id: string, patch: Partial<PageInteraction>) => void;
  deleteInteraction: (id: string) => void;
}

export type InteractionStore = InteractionState & InteractionActions;

export type CardEventEmitter = (
  componentId: number | undefined,
  event: string,
  payload: any,
) => void;

export interface InteractionStoreDeps {
  pageData: StoreApi<PageDataStore>;
  cards: CardRegistry;
}

/**
 * 解析配置中的取值表达式：`{eventData.region}` 取事件参数，`{data.search.x}` 取页面数据，
 * 不含花括号时按字面量处理
 */
export function readExpression(expression: string | undefined, context: Record<string, any>) {
  if (!expression) return undefined;

  const single = expression.trim().match(/^\{([^{}]+)\}$/);
  if (single) return getByPath(context, single[1].trim());
  if (!expression.includes("{")) return expression;

  return expression.replace(/\{([^{}]+)\}/g, (_, path: string) => {
    const value = getByPath(context, path.trim());
    if (value === undefined || value === null) return "";
    return typeof value === "object" ? JSON.stringify(value) : String(value);
  });
}

/** 联动链：已执行过的联动 id 与当前深度，用于防环 */
interface EmitChain {
  visited: Set<string>;
  depth: number;
}

interface PendingEmit {
  componentId: number;
  event: string;
  payload: any;
  chain: EmitChain;
}

/**
 * 页面级卡片联动：联动声明、执行链与待处理事件都封装在实例内，
 * 不同页面实例互不影响
 */
export function createInteractionStore({ pageData, cards }: InteractionStoreDeps) {
  const pendingEmits: PendingEmit[] = [];
  let flushScheduled = false;
  /** 当前正在执行的联动链，嵌套事件必须继承它 */
  let activeChain: EmitChain | null = null;

  const store = createStore<InteractionStore>()((set, get) => ({
    interactions: [],
    setInteractions: (interactions) => set({ interactions }),
    addInteraction: (interaction) => set({ interactions: [...get().interactions, interaction] }),
    updateInteraction: (id, patch) =>
      set({
        interactions: get().interactions.map((interaction) =>
          interaction.id === id ? { ...interaction, ...patch } : interaction,
        ),
      }),
    deleteInteraction: (id) =>
      set({ interactions: get().interactions.filter((interaction) => interaction.id !== id) }),
  }));

  const runInteractionAction = (
    action: InteractionAction,
    context: Record<string, any>,
    triggerValue: any,
  ) => {
    if (action.type === "set-input") {
      if (!action.targetComponentId || !action.key) return;
      const value = readExpression(action.valueFrom, context) ?? triggerValue;
      cards.setInput(action.targetComponentId, action.key, value);
      return;
    }

    if (action.type === "invoke") {
      if (!action.targetComponentId || !action.method) return;
      const args = readExpression(action.argsFrom, context) ?? triggerValue;
      cards.invoke(action.targetComponentId, action.method, args);
      return;
    }

    if (action.type === "set-variable") {
      if (!action.name) return;
      const value = readExpression(action.valueFrom, context) ?? triggerValue;
      pageData.getState().setData(action.name, value);
    }
  };

  const dispatchInteraction = ({ componentId, event, payload, chain }: PendingEmit) => {
    const { interactions } = store.getState();

    interactions.forEach((interaction) => {
      const { trigger } = interaction;
      if (!interaction.enabled || trigger.type !== "card-event") return;
      if (trigger.componentId !== componentId || trigger.event !== event) return;
      // 同一条链重复命中同一联动时跳过，保证 A→B→A 不会无限循环
      if (chain.visited.has(interaction.id)) return;

      const nextChain: EmitChain = {
        visited: new Set(chain.visited).add(interaction.id),
        depth: chain.depth + 1,
      };
      const triggerValue = trigger.field ? getByPath(payload, trigger.field) : payload;
      const context = {
        eventData: payload,
        initEventData: payload,
        value: triggerValue,
        data: pageData.getState().data,
      };
      const previousChain = activeChain;

      // set-input 可能再次触发卡片事件，嵌套事件需要继承当前链
      activeChain = nextChain;
      try {
        interaction.actions.forEach((action) =>
          runInteractionAction(action, context, triggerValue),
        );
      } finally {
        activeChain = previousChain;
      }
    });
  };

  const flushInteractions = () => {
    flushScheduled = false;

    while (pendingEmits.length) {
      const item = pendingEmits.shift();
      if (!item || item.chain.depth >= MAX_CHAIN_DEPTH) continue;
      dispatchInteraction(item);
    }
  };

  /** 卡片契约事件上行入口：同一微任务内的多个事件合并执行 */
  const emitCardEvent: CardEventEmitter = (componentId, event, payload) => {
    if (!componentId || !event) return;

    pendingEmits.push({
      componentId,
      event,
      payload,
      chain: activeChain ?? { visited: new Set(), depth: 0 },
    });

    if (flushScheduled) return;

    flushScheduled = true;
    queueMicrotask(flushInteractions);
  };

  return Object.assign(store, { emitCardEvent });
}
