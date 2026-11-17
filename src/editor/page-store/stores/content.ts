import { createStore, type StoreApi } from "zustand/vanilla";

import { getComponentById } from "../../utils/utils";

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

export function createRootComponent(): Component {
  return { id: ROOT_COMPONENT_ID, name: "Page", props: {}, desc: "页面" };
}

/**
 * 深拷贝组件，并为拷贝出来的组件重新生成 id
 */
export function cloneComponentWithNewIds(component: Component, parentId?: number): Component {
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

/** 由设计态 store 注入的历史记录器，负责把变更前的快照写入撤销栈 */
export interface HistoryRecorder {
  record: (key: string) => void;
}

export interface ContentState {
  components: Component[];
}

export interface ContentActions {
  /**
   * 添加组件
   * @param component 组件属性
   * @param parentId 上级组件id
   */
  addComponent: (component: Component, parentId?: number) => void;
  /**
   * 更新组件属性
   */
  updateComponentProps: (componentId: number, props: any) => void;
  /**
   * 更新组件
   */
  updateComponent: (componentId: number, key: keyof Component, value: any) => void;
  /**
   * 删除组件
   */
  deleteComponent: (componentId?: number | null) => void;
  /**
   * 在指定组件的前面或后面插入一个组件
   */
  insertComponent: (
    component: Component,
    referenceId: number,
    position: "before" | "after",
  ) => void;
  /**
   * 移动组件的顺序
   */
  moveComponent: (componentId: number, referenceId: number, position: "before" | "after") => void;
  /** 直接恢复组件树，不产生历史（撤销/重做与页面加载使用） */
  restoreComponents: (components: Component[]) => void;
  /** 批量写入组件属性，不产生历史（合并事务与升级使用） */
  patchComponentProps: (patches: { componentId: number; props: any }[]) => void;
  /** 注册历史记录器，设计态 store 创建时写入 */
  setHistoryRecorder: (recorder: HistoryRecorder | null) => void;
}

export type ContentStore = ContentState & ContentActions;

/**
 * 组件树 store：运行时与设计态共用，只负责内容本身，不包含选中、历史等设计专属状态
 */
export function createContentStore(initialComponents?: Component[]): StoreApi<ContentStore> {
  let historyRecorder: HistoryRecorder | null = null;

  const record = (key: string) => {
    historyRecorder?.record(key);
  };

  return createStore<ContentStore>()((set, get) => ({
    components: initialComponents ?? [createRootComponent()],

    addComponent: (component, parentId) => {
      record("addComponent");

      set((state) => {
        // 如果有上级id，把当前组件添加到父组件的子组件中
        if (parentId) {
          const parentComponent = getComponentById(parentId, state.components);

          if (parentComponent) {
            if (parentComponent.children) {
              parentComponent.children.push(component);
            } else {
              parentComponent.children = [component];
            }
          }

          component.parentId = parentId;
          return { components: [...state.components] };
        }
        return { components: [...state.components, component] };
      });
    },

    updateComponentProps: (componentId, props) => {
      const component = getComponentById(componentId, get().components);
      if (!component) return;

      record(`updateComponentProps:${componentId}`);

      set((state) => {
        const target = getComponentById(componentId, state.components);
        if (!target) return { components: [...state.components] };

        target.props = { ...target.props, ...props };
        return { components: [...state.components] };
      });
    },

    updateComponent: (componentId, key, value) => {
      const component = getComponentById(componentId, get().components);
      if (!component) return;

      record(`updateComponent:${componentId}:${key}`);

      set((state) => {
        const target = getComponentById(componentId, state.components);
        if (target && (key === "desc" || key === "hidden")) {
          target[key] = value;
        }
        return { components: [...state.components] };
      });
    },

    deleteComponent: (componentId) => {
      if (!componentId) return;

      const state = get();
      const component = getComponentById(componentId, state.components);
      const parentComponent = component?.parentId
        ? getComponentById(component.parentId, state.components)
        : null;

      if (!component?.parentId || !parentComponent) return;

      record("deleteComponent");

      set((current) => {
        const parent = getComponentById(component.parentId as number, current.components);
        if (parent?.children) {
          parent.children = parent.children.filter((item) => item.id !== +componentId);
        }
        return { components: [...current.components] };
      });
    },

    insertComponent: (component, referenceId, position) => {
      const state = get();
      const reference = getComponentById(referenceId, state.components);
      if (!reference) return;

      const parent =
        reference.id === ROOT_COMPONENT_ID
          ? reference
          : reference.parentId
            ? getComponentById(reference.parentId, state.components)
            : null;

      if (!parent?.children && reference.id !== ROOT_COMPONENT_ID) return;
      if (reference.id !== ROOT_COMPONENT_ID) {
        const index = parent?.children?.findIndex((item) => item.id === reference.id) ?? -1;
        if (index < 0) return;
      }

      record("insertComponent");

      set((current) => {
        const target = getComponentById(referenceId, current.components);
        if (!target) return { components: [...current.components] };

        // 参照根组件时，直接插入到根组件的子节点中
        if (target.id === ROOT_COMPONENT_ID) {
          target.children ??= [];
          const index = position === "before" ? 0 : target.children.length;

          component.parentId = target.id;
          target.children.splice(index, 0, component);

          return { components: [...current.components] };
        }

        const targetParent =
          target.parentId === undefined
            ? null
            : getComponentById(target.parentId, current.components);

        if (!targetParent?.children) return { components: [...current.components] };

        const index = targetParent.children.findIndex((item) => item.id === target.id);
        if (index < 0) return { components: [...current.components] };

        component.parentId = targetParent.id;
        targetParent.children.splice(position === "before" ? index : index + 1, 0, component);

        return { components: [...current.components] };
      });
    },

    moveComponent: (componentId, referenceId, position) => {
      if (componentId === referenceId) return;

      const state = get();
      const component = getComponentById(componentId, state.components);
      const reference = getComponentById(referenceId, state.components);

      if (!component || !reference) return;

      // 不能移动到自身或自身的子组件中
      let ancestorId = reference.parentId;
      while (ancestorId) {
        if (ancestorId === component.id) return;
        ancestorId = getComponentById(ancestorId, state.components)?.parentId;
      }

      const sourceParent = component.parentId
        ? getComponentById(component.parentId, state.components)
        : null;

      if (!sourceParent?.children) return;

      const targetParent =
        reference.id === ROOT_COMPONENT_ID
          ? reference
          : reference.parentId
            ? getComponentById(reference.parentId, state.components)
            : null;

      if (!targetParent) return;

      record("moveComponent");

      set((current) => {
        const moving = getComponentById(componentId, current.components);
        const ref = getComponentById(referenceId, current.components);
        if (!moving || !ref) return { components: [...current.components] };

        const from = moving.parentId ? getComponentById(moving.parentId, current.components) : null;
        const to =
          ref.id === ROOT_COMPONENT_ID
            ? ref
            : ref.parentId
              ? getComponentById(ref.parentId, current.components)
              : null;

        if (!from?.children || !to) return { components: [...current.components] };

        from.children = from.children.filter((item) => item.id !== moving.id);
        to.children ??= [];

        const index =
          ref.id === ROOT_COMPONENT_ID
            ? position === "before"
              ? 0
              : to.children.length
            : Math.max(
                0,
                to.children.findIndex((item) => item.id === ref.id),
              ) + (position === "after" ? 1 : 0);

        moving.parentId = to.id;
        to.children.splice(index, 0, moving);

        return { components: [...current.components] };
      });
    },

    restoreComponents: (components) => set({ components }),

    patchComponentProps: (patches) => {
      if (!patches.length) return;

      set((state) => {
        patches.forEach(({ componentId, props }) => {
          const component = getComponentById(componentId, state.components);
          if (component) {
            component.props = { ...component.props, ...props };
          }
        });
        return { components: [...state.components] };
      });
    },

    setHistoryRecorder: (recorder) => {
      historyRecorder = recorder;
    },
  }));
}
