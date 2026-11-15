import { create } from "zustand";

import { useDataSourceStore } from "../data-source/store";
import type { DataSource, DataSourceRelation } from "../data-source/types";
import { usePageSearchStore } from "../search/store";
import type { PageSearchConfig } from "../search/types";
import { getComponentById } from "../utils/utils";

/** 页面根组件 id */
export const ROOT_COMPONENT_ID = 1;

let componentIdSeed = 0;

/**
 * 生成组件的唯一 id
 */
export function createComponentId() {
  const now = Date.now();
  componentIdSeed = now > componentIdSeed ? now : componentIdSeed + 1;
  return componentIdSeed;
}

/**
 * 深拷贝组件，并为拷贝出来的组件重新生成 id
 */
function cloneComponentWithNewIds(component: Component, parentId?: number): Component {
  const id = createComponentId();

  return {
    id,
    name: component.name,
    desc: component.desc,
    props: structuredClone(component.props ?? {}),
    parentId,
    hidden: component.hidden ? structuredClone(component.hidden) : undefined,
    children: component.children?.map((child) => cloneComponentWithNewIds(child, id)),
  };
}

export interface Component {
  /**
   * 组件唯一标识
   */
  id: number;
  /**
   * 组件名称
   */
  name: string;
  /**
   * 组件属性
   */
  props: any;
  /**
   * 子组件
   */
  children?: Component[];
  /**
   * 父组件id
   */
  parentId?: number;
  /**
   * 组件描述
   */
  desc?: string;
  hidden?: {
    type: "static" | "variable";
    value: any;
  };
}

/** 最多保留的历史记录条数 */
const MAX_HISTORY = 50;
/** 连续同类操作的合并间隔（毫秒），避免属性输入产生过多历史 */
const HISTORY_MERGE_INTERVAL = 400;

let lastHistoryKey: string | null = null;
let lastHistoryAt = 0;

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

interface State {
  components: Component[];
  curComponentId?: number | null;
  curComponent: Component | null;
  mode: "edit" | "preview";
  editType: "page" | "event";
  /** 复制的组件（不持久化） */
  clipboard: Component | null;
  /** 撤销栈，保存每次变更前的页面快照 */
  past: HistorySnapshot[];
  /** 重做栈，保存撤销后的页面快照 */
  future: HistorySnapshot[];
}

function createComponentSnapshot(): HistorySnapshot {
  return { components: structuredClone(useComponetsStore.getState().components) };
}

function snapshotPageState(): NonNullable<HistorySnapshot["page"]> {
  const { sources, relations } = useDataSourceStore.getState();

  return {
    sources: structuredClone(sources),
    relations: structuredClone(relations),
    search: structuredClone(usePageSearchStore.getState().config),
  };
}

function restorePageState(page: NonNullable<HistorySnapshot["page"]>) {
  if (page.sources) {
    useDataSourceStore.setState({ sources: structuredClone(page.sources) });
  }
  if (page.relations) {
    useDataSourceStore.setState({ relations: structuredClone(page.relations) });
  }
  if (page.search !== undefined) {
    usePageSearchStore.getState().setConfig(page.search ? structuredClone(page.search) : null);
  }
}

/**
 * 生成历史记录补丁，必须在修改组件树之前调用，保证快照是变更前的状态
 * @param state 当前状态
 * @param key 操作标识，相同 key 的连续操作会合并成一条历史
 */
function createHistoryPatch(state: State, key: string): Pick<State, "past" | "future"> {
  const now = Date.now();
  const shouldMerge = key === lastHistoryKey && now - lastHistoryAt < HISTORY_MERGE_INTERVAL;

  lastHistoryKey = key;
  lastHistoryAt = now;

  if (shouldMerge) {
    return { past: state.past, future: [] };
  }

  return {
    past: [...state.past, { components: structuredClone(state.components) }].slice(-MAX_HISTORY),
    future: [],
  };
}

interface Action {
  /**
   * 添加组件
   * @param component 组件属性
   * @param parentId 上级组件id
   * @returns
   */
  addComponent: (component: Component, parentId?: number) => void;
  /**
   * 设置当前组件id
   * @param componentId 当前组件id
   * @returns
   */
  setCurComponentId: (componentId: number | null) => void;
  /**
   * 更新组件属性
   * @param componentId 组件id
   * @param props 新组件属性
   * @returns
   */
  updateComponentProps: (componentId: number, props: any) => void;
  /**
   * 更新组件
   * @param componentId 组件id
   * @param key key
   * @param value value
   * @returns
   */
  updateComponent: (componentId: number, key: keyof Component, value: any) => void;
  /**
   * 设置模式
   * @param mode 模式
   * @returns
   */
  setMode: (mode: State["mode"]) => void;
  /**
   *  设置编辑类型
   * @param editType
   * @returns
   */
  setEditType: (editType: State["editType"]) => void;
  /**
   * 删除组件
   * @param componentId 组件id
   * @returns
   */
  deleteComponent: (componentId?: number | null) => void;
  /**
   * 在指定组件的前面或后面插入一个组件
   * @param component 待插入组件
   * @param referenceId 参照组件id
   * @param position 插入位置
   * @returns
   */
  insertComponent: (
    component: Component,
    referenceId: number,
    position: "before" | "after",
  ) => void;
  /**
   * 移动组件的顺序
   * @param componentId 被移动组件id
   * @param referenceId 参照组件id
   * @param position 移动到参照组件的前面或后面
   * @returns
   */
  moveComponent: (componentId: number, referenceId: number, position: "before" | "after") => void;
  /**
   * 复制组件到剪贴板
   * @param componentId 组件id
   * @returns
   */
  copyComponent: (componentId: number) => void;
  /**
   * 把剪贴板中的组件粘贴到指定组件后面
   * @param referenceId 参照组件id
   * @returns 粘贴后的组件
   */
  pasteComponent: (referenceId: number) => Component | null;
  /**
   * 撤销上一次组件变更
   */
  undo: () => void;
  /**
   * 重做上一次撤销的组件变更
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

export const useComponetsStore = create<State & Action>()((set, get) => ({
  components: [
    {
      id: 1,
      name: "Page",
      props: {},
      desc: "页面",
    },
  ],
  curComponent: null,
  clipboard: null,
  past: [],
  future: [],
  mode: "edit",
  editType: "page",
  addComponent: (component, parentId) =>
    set((state) => {
      const history = createHistoryPatch(state, "addComponent");

      // 如果有上级id，把当前组件添加到父组件的子组件中
      if (parentId) {
        // 通过父id递归查找父组件
        const parentComponent = getComponentById(parentId, state.components);

        if (parentComponent) {
          if (parentComponent?.children) {
            parentComponent?.children?.push(component);
          } else {
            parentComponent.children = [component];
          }
        }

        component.parentId = parentId;
        return { components: [...state.components], ...history };
      }
      return { components: [...state.components, component], ...history };
    }),
  setCurComponentId: (componentId) =>
    set((state) => ({
      curComponentId: componentId,
      curComponent: getComponentById(componentId, state.components),
    })),
  updateComponentProps: (componentId, props) =>
    set((state) => {
      const component = getComponentById(componentId, state.components);
      if (component) {
        const history = createHistoryPatch(state, `updateComponentProps:${componentId}`);
        component.props = { ...component.props, ...props };

        if (componentId === state.curComponentId) {
          return {
            curComponent: component,
            components: [...state.components],
            ...history,
          };
        }

        return { components: [...state.components], ...history };
      }

      return { components: [...state.components] };
    }),
  updateComponent: (componentId: number, key: keyof Component, value: any) =>
    set((state) => {
      const component = getComponentById(componentId, state.components);
      if (component) {
        const history = createHistoryPatch(state, `updateComponent:${componentId}:${key}`);

        if (key === "desc") {
          component[key] = value;
        } else if (key === "hidden") {
          component[key] = value;
        }
        return { components: [...state.components], ...history };
      }
      return { components: [...state.components] };
    }),
  setMode: (mode) => set({ mode }),
  setEditType: (editType) => set({ editType }),
  deleteComponent: (componentId) => {
    if (!componentId) return;

    const state = get();
    const component = getComponentById(componentId, state.components);
    if (component?.parentId) {
      const parentComponent = getComponentById(component.parentId, state.components);

      if (parentComponent) {
        const history = createHistoryPatch(state, "deleteComponent");

        parentComponent.children = parentComponent?.children?.filter(
          (item) => item.id !== +componentId,
        );

        set({ components: [...state.components], ...history });
      }
    }
  },
  insertComponent: (component, referenceId, position) =>
    set((state) => {
      const reference = getComponentById(referenceId, state.components);

      if (!reference) return {};

      // 参照根组件时，直接插入到根组件的子节点中
      if (reference.id === ROOT_COMPONENT_ID) {
        const history = createHistoryPatch(state, "insertComponent");

        reference.children ??= [];
        const index = position === "before" ? 0 : reference.children.length;

        component.parentId = reference.id;
        reference.children.splice(index, 0, component);

        return { components: [...state.components], ...history };
      }

      const parent = reference.parentId
        ? getComponentById(reference.parentId, state.components)
        : null;

      if (!parent) return {};

      parent.children ??= [];
      const index = parent.children.findIndex((item) => item.id === reference.id);

      if (index < 0) return {};

      const history = createHistoryPatch(state, "insertComponent");

      component.parentId = parent.id;
      parent.children.splice(position === "before" ? index : index + 1, 0, component);

      return { components: [...state.components], ...history };
    }),
  moveComponent: (componentId, referenceId, position) =>
    set((state) => {
      if (componentId === referenceId) return {};

      const component = getComponentById(componentId, state.components);
      const reference = getComponentById(referenceId, state.components);

      if (!component || !reference) return {};

      // 不能移动到自身或自身的子组件中
      let ancestorId = reference.parentId;
      while (ancestorId) {
        if (ancestorId === component.id) return {};
        ancestorId = getComponentById(ancestorId, state.components)?.parentId;
      }

      const sourceParent = component.parentId
        ? getComponentById(component.parentId, state.components)
        : null;

      if (!sourceParent?.children) return {};

      const targetParent =
        reference.id === ROOT_COMPONENT_ID
          ? reference
          : reference.parentId
            ? getComponentById(reference.parentId, state.components)
            : null;

      if (!targetParent) return {};

      const history = createHistoryPatch(state, "moveComponent");

      sourceParent.children = sourceParent.children.filter((item) => item.id !== component.id);
      targetParent.children ??= [];

      const index =
        reference.id === ROOT_COMPONENT_ID
          ? position === "before"
            ? 0
            : targetParent.children.length
          : Math.max(
              0,
              targetParent.children.findIndex((item) => item.id === reference.id),
            ) + (position === "after" ? 1 : 0);

      component.parentId = targetParent.id;
      targetParent.children.splice(index, 0, component);

      return { components: [...state.components], ...history };
    }),
  copyComponent: (componentId) => {
    const component = getComponentById(componentId, get().components);

    if (!component) return;

    set({ clipboard: structuredClone(component) });
  },
  pasteComponent: (referenceId) => {
    const { clipboard } = get();

    if (!clipboard) return null;

    const component = cloneComponentWithNewIds(clipboard);
    get().insertComponent(component, referenceId, "after");

    return component;
  },
  undo: () => {
    const state = get();
    const previous = state.past[state.past.length - 1];

    if (!previous) return;

    const curComponent = getComponentById(state.curComponentId ?? null, previous.components);
    const futureSnapshot = createComponentSnapshot();
    if (previous.page) futureSnapshot.page = snapshotPageState();

    lastHistoryKey = null;
    set({
      components: previous.components,
      past: state.past.slice(0, -1),
      future: [futureSnapshot, ...state.future].slice(0, MAX_HISTORY),
      curComponentId: curComponent ? (state.curComponentId ?? null) : null,
      curComponent,
    });

    // 仅跨域事务会携带页面资源快照，普通组件变更不触碰数据源
    if (previous.page) restorePageState(previous.page);
  },
  redo: () => {
    const state = get();
    const next = state.future[0];

    if (!next) return;

    const curComponent = getComponentById(state.curComponentId ?? null, next.components);
    const pastSnapshot = createComponentSnapshot();
    if (next.page) pastSnapshot.page = snapshotPageState();

    lastHistoryKey = null;
    set({
      components: next.components,
      past: [...state.past, pastSnapshot].slice(-MAX_HISTORY),
      future: state.future.slice(1),
      curComponentId: curComponent ? (state.curComponentId ?? null) : null,
      curComponent,
    });

    if (next.page) restorePageState(next.page);
  },
  applyMergeTransaction: (transaction) =>
    set((state) => {
      const history = {
        past: [
          ...state.past,
          { components: structuredClone(state.components), page: snapshotPageState() },
        ].slice(-MAX_HISTORY),
        future: [],
      };

      (transaction.componentProps ?? []).forEach(({ componentId, props }) => {
        const component = getComponentById(componentId, state.components);
        if (component) {
          component.props = { ...component.props, ...props };
        }
      });

      if (transaction.sources) {
        useDataSourceStore.setState({ sources: transaction.sources });
      }
      if (transaction.relations) {
        useDataSourceStore.setState({ relations: transaction.relations });
      }
      if (transaction.search !== undefined) {
        usePageSearchStore.getState().setConfig(transaction.search);
      }

      const curComponent = getComponentById(state.curComponentId ?? null, state.components);

      // 合并事务独立成一条历史，避免与后续属性输入合并
      lastHistoryKey = null;

      return {
        components: [...state.components],
        curComponent,
        ...history,
      };
    }),
  applyComponentPatches: (patches) =>
    set((state) => {
      if (!patches.length) return {};

      const history = {
        past: [...state.past, { components: structuredClone(state.components) }].slice(
          -MAX_HISTORY,
        ),
        future: [],
      };

      patches.forEach(({ componentId, props }) => {
        const component = getComponentById(componentId, state.components);
        if (component) {
          component.props = { ...component.props, ...props };
        }
      });

      const curComponent = getComponentById(state.curComponentId ?? null, state.components);

      // 升级独立成一条历史，避免与后续属性输入合并
      lastHistoryKey = null;

      return {
        components: [...state.components],
        curComponent,
        ...history,
      };
    }),
}));
