import { createStore, type StoreApi } from "zustand/vanilla";

import type { DataSourceLoader } from "../../data-source/runtime";
import { groupSourceTargets, readSearchValues, toSearchDataKey } from "../../search/targets";
import type { PageSearchConfig } from "../../search/types";
import { syncSearchToUrl } from "../../search/url-sync";
import { syncSearchVariables } from "../../search/variables";
import type { CardRegistry } from "./cards";
import type { PageDataStore } from "./page-data";
import type { VariablesStore } from "./variables";

export interface PageSearchState {
  config: PageSearchConfig | null;
}

export interface PageSearchActions {
  /**
   * 设置当前页面的搜索区配置
   */
  setConfig: (config?: PageSearchConfig | null) => void;
  /**
   * 写入单个搜索值：pageData.search.<key>
   */
  setValue: (key: string, value: any) => void;
  /**
   * 按配置的目标组装参数并触发数据源加载
   */
  submit: (values?: Record<string, any>) => void;
  /**
   * 用变量默认值回填并重新提交
   */
  reset: () => void;
}

export type PageSearchStore = PageSearchState & PageSearchActions;

export interface PageSearchStoreDeps {
  pageData: StoreApi<PageDataStore>;
  variables: StoreApi<VariablesStore>;
  cards: CardRegistry;
  sourceLoader: DataSourceLoader;
}

/**
 * SearchBus 是 pageData 的门面，搜索值不引入第二份状态
 */
export function createPageSearchStore({
  pageData,
  variables,
  cards,
  sourceLoader,
}: PageSearchStoreDeps): StoreApi<PageSearchStore> {
  return createStore<PageSearchStore>()((set, get) => ({
    config: null,
    setConfig: (config) => {
      set({ config: config ?? null });
      // 搜索字段统一投影为只读搜索变量，保证变量面板与属性绑定可见
      syncSearchVariables(variables, config ?? null);
    },
    setValue: (key, value) => {
      pageData.getState().setData(toSearchDataKey(key), value);
    },
    submit: (values) => {
      const config = get().config;
      if (!config) return;

      const searchValues = values ?? readSearchValues(config.fields, pageData);
      const groups = groupSourceTargets(config.targets, searchValues);

      // 仅 persist = url 的搜索变量写入地址栏，刷新后可从 URL 恢复
      syncSearchToUrl(config, variables.getState().variables, searchValues);

      Object.entries(groups).forEach(([sourceId, search]) => {
        void sourceLoader.store.getState().search(sourceId, search);
      });

      // 卡片目标由卡片运行时落到实例输入，不参与数据源合并
      config.targets.forEach((target) => {
        if (target.kind === "card") {
          cards.setInput(target.componentId, target.inputKey, searchValues[target.variable]);
        }
      });
    },
    reset: () => {
      const config = get().config;
      if (!config) return;

      const { variables: definitions } = variables.getState();
      const values = config.fields.reduce<Record<string, any>>((next, field) => {
        const variable = definitions.find((item) => item.name === field.variable);
        next[field.variable] = variable?.defaultValue ?? "";
        return next;
      }, {});

      config.fields.forEach((field) => {
        get().setValue(field.variable, values[field.variable]);
      });
      get().submit(values);
    },
  }));
}
