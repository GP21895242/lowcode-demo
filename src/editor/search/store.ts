import { create } from "zustand";
import { setCardInput } from "../card-template/registry";
import { useDataSourceRuntimeStore } from "../data-source/runtime";
import { usePageDataStore } from "../stores/page-data";
import { useVariablesStore } from "../stores/variable";
import { groupSourceTargets, readSearchValues, toSearchDataKey } from "./targets";
import type { PageSearchConfig } from "./types";

interface State {
  config: PageSearchConfig | null;
}

interface Action {
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

/**
 * SearchBus 是 pageData 的门面，搜索值不引入第二份状态
 */
export const usePageSearchStore = create<State & Action>()((set, get) => ({
  config: null,
  setConfig: (config) => set({ config: config ?? null }),
  setValue: (key, value) => {
    usePageDataStore.getState().setData(toSearchDataKey(key), value);
  },
  submit: (values) => {
    const config = get().config;
    if (!config) return;

    const searchValues = values ?? readSearchValues(config.fields);
    const groups = groupSourceTargets(config.targets, searchValues);

    Object.entries(groups).forEach(([sourceId, search]) => {
      void useDataSourceRuntimeStore.getState().search(sourceId, search);
    });

    // 卡片目标由卡片运行时落到实例输入，不参与数据源合并
    config.targets.forEach((target) => {
      if (target.kind === "card") {
        setCardInput(target.scopeId, target.inputKey, searchValues[target.variable]);
      }
    });
  },
  reset: () => {
    const config = get().config;
    if (!config) return;

    const { variables } = useVariablesStore.getState();
    const values = config.fields.reduce<Record<string, any>>((next, field) => {
      const variable = variables.find((item) => item.name === field.variable);
      next[field.variable] = variable?.defaultValue ?? "";
      return next;
    }, {});

    config.fields.forEach((field) => {
      get().setValue(field.variable, values[field.variable]);
    });
    get().submit(values);
  },
}));
