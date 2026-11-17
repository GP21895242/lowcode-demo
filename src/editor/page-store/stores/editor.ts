import { createStore, type StoreApi } from "zustand/vanilla";

import type { DataSource, DataSourceRelation } from "../../data-source/types";
import type { PageSearchConfig } from "../../search/types";
import { getComponentById } from "../../utils/utils";
import { cloneComponentWithNewIds, type Component, type ContentStore } from "./content";
import type { DataSourcesStore } from "./data-sources";
import type { PageSearchStore } from "./search";

/** 最多保留的历史记录条数 */
const MAX_HISTORY = 50;
/** 连续同类操作的合并间隔（毫秒），避免属性输入产生过多历史 */
const HISTORY_MERGE_INTERVAL = 400;

/** 页面级历史快照；仅跨域事务（如合并）记录数据源与搜索配置 */
export interface HistorySnapshot {
  components: Component[];
  page?: {
    sources?: DataSource[];
    relations?: DataSourceRelation[];
    search?: PageSearchConfig | null;
  };
}

/** 合并事务：组件属性、数据源与搜索配置一次写入，只产生一条历史 */
export interface MergeTransaction {
  componentProps?: { componentId: number; props: any }[];
  sources?: DataSource[];
  relations?: DataSourceRelation[];
  search?: PageSearchConfig | null;
}

export interface EditorState {
  curComponentId?: number | null;
  curComponent: Component | null;
  editType: "page" | "event";
  /** 复制的组件（不持久化） */
  clipboard: Component | null;
  /** 撤销栈，保存每次变更前的页面快照 */
  past: HistorySnapshot[];
  /** 重做栈，保存撤销后的页面快照 */
  future: HistorySnapshot[];
}

export interface EditorActions {
  /**
   * 设置当前组件id
   */
  setCurComponentId: (componentId: number | null) => void;
  /**
   * 设置编辑类型
   */
  setEditType: (editType: EditorState["editType"]) => void;
  /**
   * 复制组件到剪贴板
   */
  copyComponent: (componentId: number) => void;
  /**
   * 把剪贴板中的组件粘贴到指定组件后面
   */
  pasteComponent: (referenceId: number) => Component | null;
  /**
   * 撤销上一次变更
   */
  undo: () => void;
  /**
   * 重做上一次撤销的变更
   */
  redo: () => void;
  /**
   * 以单条历史记录应用合并事务，组件与页面资源一次写入
   */
  applyMergeTransaction: (transaction: MergeTransaction) => void;
  /**
   * 批量更新组件属性，只产生一条组件历史（如卡片模板升级）
   */
  applyComponentPatches: (patches: { componentId: number; props: any }[]) => void;
}

export type EditorStore = EditorState & EditorActions;

export interface EditorStoreDeps {
  content: StoreApi<ContentStore>;
  dataSources: StoreApi<DataSourcesStore>;
  search: StoreApi<PageSearchStore>;
}

function findComponent(componentId: number | null | undefined, components: Component[]) {
  if (componentId === null || componentId === undefined) return null;
  return getComponentById(componentId, components) ?? null;
}

/**
 * 设计态 store：选中、剪贴板与历史记录，只在编辑模式下创建
 */
export function createEditorStore({ content, dataSources, search }: EditorStoreDeps) {
  let record: (key: string) => void = () => {};

  const snapshotPageState = (): NonNullable<HistorySnapshot["page"]> => {
    const { sources, relations } = dataSources.getState();
    return {
      sources: structuredClone(sources),
      relations: structuredClone(relations),
      search: structuredClone(search.getState().config),
    };
  };

  const restorePageState = (page: NonNullable<HistorySnapshot["page"]>) => {
    if (page.sources) {
      dataSources.setState({ sources: structuredClone(page.sources) });
    }
    if (page.relations) {
      dataSources.setState({ relations: structuredClone(page.relations) });
    }
    if (page.search !== undefined) {
      search.getState().setConfig(page.search ? structuredClone(page.search) : null);
    }
  };

  let lastHistoryKey: string | null = null;
  let lastHistoryAt = 0;

  const store = createStore<EditorStore>()((set, get) => {
    const pushHistory = (withPage: boolean) => {
      lastHistoryKey = null;

      set((state) => ({
        past: [
          ...state.past,
          withPage
            ? {
                components: structuredClone(content.getState().components),
                page: snapshotPageState(),
              }
            : { components: structuredClone(content.getState().components) },
        ].slice(-MAX_HISTORY),
        future: [],
      }));
    };

    // 由 content 在每次变更前调用，保证快照是变更前的状态
    record = (key: string) => {
      const now = Date.now();
      const shouldMerge = key === lastHistoryKey && now - lastHistoryAt < HISTORY_MERGE_INTERVAL;

      lastHistoryKey = key;
      lastHistoryAt = now;

      if (shouldMerge) {
        set({ future: [] });
        return;
      }

      set((state) => ({
        past: [...state.past, { components: structuredClone(content.getState().components) }].slice(
          -MAX_HISTORY,
        ),
        future: [],
      }));
    };

    return {
      curComponentId: null,
      curComponent: null,
      editType: "page",
      clipboard: null,
      past: [],
      future: [],

      setCurComponentId: (componentId) =>
        set({
          curComponentId: componentId,
          curComponent: findComponent(componentId, content.getState().components),
        }),

      setEditType: (editType) => set({ editType }),

      copyComponent: (componentId) => {
        const component = findComponent(componentId, content.getState().components);
        if (!component) return;

        set({ clipboard: structuredClone(component) });
      },

      pasteComponent: (referenceId) => {
        const { clipboard } = get();
        if (!clipboard) return null;

        const component = cloneComponentWithNewIds(clipboard);
        content.getState().insertComponent(component, referenceId, "after");

        return component;
      },

      undo: () => {
        const state = get();
        const previous = state.past[state.past.length - 1];
        if (!previous) return;

        const futureSnapshot: HistorySnapshot = {
          components: structuredClone(content.getState().components),
        };
        if (previous.page) futureSnapshot.page = snapshotPageState();

        const curComponent = findComponent(state.curComponentId, previous.components);

        lastHistoryKey = null;
        set({
          past: state.past.slice(0, -1),
          future: [futureSnapshot, ...state.future].slice(0, MAX_HISTORY),
          curComponentId: curComponent ? (state.curComponentId ?? null) : null,
          curComponent,
        });

        content.getState().restoreComponents(previous.components);
        if (previous.page) restorePageState(previous.page);
      },

      redo: () => {
        const state = get();
        const next = state.future[0];
        if (!next) return;

        const pastSnapshot: HistorySnapshot = {
          components: structuredClone(content.getState().components),
        };
        if (next.page) pastSnapshot.page = snapshotPageState();

        const curComponent = findComponent(state.curComponentId, next.components);

        lastHistoryKey = null;
        set({
          past: [...state.past, pastSnapshot].slice(-MAX_HISTORY),
          future: state.future.slice(1),
          curComponentId: curComponent ? (state.curComponentId ?? null) : null,
          curComponent,
        });

        content.getState().restoreComponents(next.components);
        if (next.page) restorePageState(next.page);
      },

      applyMergeTransaction: (transaction) => {
        pushHistory(true);

        content.getState().patchComponentProps(transaction.componentProps ?? []);

        if (transaction.sources) {
          dataSources.setState({ sources: transaction.sources });
        }
        if (transaction.relations) {
          dataSources.setState({ relations: transaction.relations });
        }
        if (transaction.search !== undefined) {
          search.getState().setConfig(transaction.search);
        }
      },

      applyComponentPatches: (patches) => {
        if (!patches.length) return;

        pushHistory(false);
        content.getState().patchComponentProps(patches);
      },
    };
  });

  content.getState().setHistoryRecorder({ record });

  // 组件树变化后同步选中组件引用，避免属性面板读到旧对象
  content.subscribe((state) => {
    const { curComponentId, curComponent } = store.getState();
    if (curComponentId === null || curComponentId === undefined) return;

    const next = findComponent(curComponentId, state.components);
    if (next !== curComponent) {
      store.setState({ curComponent: next });
    }
  });

  return store;
}
