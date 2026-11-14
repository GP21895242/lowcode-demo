import { create } from "zustand";
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

interface State {
  components: Component[];
  curComponentId?: number | null;
  curComponent: Component | null;
  mode: "edit" | "preview";
  editType: "page" | "event";
  /** 复制的组件（不持久化） */
  clipboard: Component | null;
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
  mode: "edit",
  editType: "page",
  addComponent: (component, parentId) =>
    set((state) => {
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
        return { components: [...state.components] };
      }
      return { components: [...state.components, component] };
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
        component.props = { ...component.props, ...props };

        if (componentId === state.curComponentId) {
          return {
            curComponent: component,
            components: [...state.components],
          };
        }

        return { components: [...state.components] };
      }

      return { components: [...state.components] };
    }),
  updateComponent: (componentId: number, key: keyof Component, value: any) =>
    set((state) => {
      const component = getComponentById(componentId, state.components);
      if (component) {
        if (key === "desc") {
          component[key] = value;
        } else if (key === "hidden") {
          component[key] = value;
        }
        return { components: [...state.components] };
      }
      return { components: [...state.components] };
    }),
  setMode: (mode) => set({ mode }),
  setEditType: (editType) => set({ editType }),
  deleteComponent: (componentId) => {
    if (!componentId) return;

    const component = getComponentById(componentId, get().components);
    if (component?.parentId) {
      const parentComponent = getComponentById(component.parentId, get().components);

      if (parentComponent) {
        parentComponent.children = parentComponent?.children?.filter(
          (item) => item.id !== +componentId,
        );

        set({ components: [...get().components] });
      }
    }
  },
  insertComponent: (component, referenceId, position) =>
    set((state) => {
      const reference = getComponentById(referenceId, state.components);

      if (!reference) return {};

      // 参照根组件时，直接插入到根组件的子节点中
      if (reference.id === ROOT_COMPONENT_ID) {
        reference.children ??= [];
        const index = position === "before" ? 0 : reference.children.length;

        component.parentId = reference.id;
        reference.children.splice(index, 0, component);

        return { components: [...state.components] };
      }

      const parent = reference.parentId
        ? getComponentById(reference.parentId, state.components)
        : null;

      if (!parent) return {};

      parent.children ??= [];
      const index = parent.children.findIndex((item) => item.id === reference.id);

      if (index < 0) return {};

      component.parentId = parent.id;
      parent.children.splice(position === "before" ? index : index + 1, 0, component);

      return { components: [...state.components] };
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

      return { components: [...state.components] };
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
}));
