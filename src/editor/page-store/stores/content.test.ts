import { describe, expect, it } from "vite-plus/test";

import {
  cloneComponentWithNewIds,
  createComponentId,
  createContentStore,
  ROOT_COMPONENT_ID,
  type Component,
} from "./content";

const component = (id: number, name = "Button", props: any = {}): Component => ({
  id,
  name,
  props,
  desc: name,
});

function createTree() {
  const store = createContentStore();
  const root = store.getState().components[0];

  store.getState().addComponent(component(2, "Container"), ROOT_COMPONENT_ID);
  store.getState().addComponent(component(3, "Button"), 2);
  store.getState().addComponent(component(4, "Text"), 2);

  return { store, root };
}

describe("createComponentId", () => {
  it("连续调用生成不重复的 id", () => {
    const ids = new Set(Array.from({ length: 100 }, () => createComponentId()));
    expect(ids.size).toBe(100);
  });
});

describe("组件树基础操作", () => {
  it("按 parentId 挂载子组件，缺省时挂到根数组", () => {
    const { store, root } = createTree();

    expect(root.children?.map((item) => item.id)).toEqual([2]);
    expect(root.children?.[0].children?.map((item) => item.id)).toEqual([3, 4]);
    expect(store.getState().components).toHaveLength(1);
  });

  it("更新属性时合并而不是替换", () => {
    const { store } = createTree();

    store.getState().updateComponentProps(3, { text: "提交" });
    store.getState().updateComponentProps(3, { disabled: true });

    expect(store.getState().components[0].children?.[0].children?.[0].props).toEqual({
      text: "提交",
      disabled: true,
    });
  });

  it("updateComponent 只允许 desc 与 hidden", () => {
    const { store } = createTree();

    store.getState().updateComponent(3, "desc", "按钮");
    store.getState().updateComponent(3, "name", "Hacked");

    const target = store.getState().components[0].children?.[0].children?.[0];
    expect(target?.desc).toBe("按钮");
    expect(target?.name).toBe("Button");
  });

  it("删除组件只移除其父节点下的引用", () => {
    const { store } = createTree();

    store.getState().deleteComponent(3);

    expect(store.getState().components[0].children?.[0].children?.map((item) => item.id)).toEqual([
      4,
    ]);
  });
});

describe("组件树拒绝路径", () => {
  it("根组件、未知 id 与空 id 不能删除", () => {
    const { store } = createTree();

    store.getState().deleteComponent(ROOT_COMPONENT_ID);
    store.getState().deleteComponent(404);
    store.getState().deleteComponent(null);

    expect(store.getState().components[0].children).toHaveLength(1);
  });

  it("参照不存在时插入与移动都不生效", () => {
    const { store } = createTree();

    store.getState().insertComponent(component(9), 404, "after");
    store.getState().moveComponent(3, 404, "after");

    expect(store.getState().components[0].children?.[0].children?.map((item) => item.id)).toEqual([
      3, 4,
    ]);
  });

  it("不能移动到自己或自己的子组件中", () => {
    const { store } = createTree();

    store.getState().moveComponent(2, 2, "after");
    store.getState().moveComponent(2, 3, "after");

    expect(store.getState().components[0].children?.map((item) => item.id)).toEqual([2]);
    expect(store.getState().components[0].children?.[0].children?.map((item) => item.id)).toEqual([
      3, 4,
    ]);
  });
});

describe("插入与移动", () => {
  it("在兄弟节点前后插入", () => {
    const { store } = createTree();

    store.getState().insertComponent(component(5), 3, "before");
    store.getState().insertComponent(component(6), 3, "after");

    expect(store.getState().components[0].children?.[0].children?.map((item) => item.id)).toEqual([
      5, 3, 6, 4,
    ]);
  });

  it("参照根组件时插入到子节点首尾", () => {
    const { store } = createTree();

    store.getState().insertComponent(component(5), ROOT_COMPONENT_ID, "before");
    store.getState().insertComponent(component(6), ROOT_COMPONENT_ID, "after");

    expect(store.getState().components[0].children?.map((item) => item.id)).toEqual([5, 2, 6]);
  });

  it("跨父节点移动并修正 parentId", () => {
    const { store } = createTree();

    store.getState().moveComponent(4, 2, "before");

    const rootChildren = store.getState().components[0].children ?? [];
    expect(rootChildren.map((item) => item.id)).toEqual([4, 2]);
    expect(rootChildren[0].parentId).toBe(ROOT_COMPONENT_ID);
    expect(rootChildren[1].children?.map((item) => item.id)).toEqual([3]);
  });

  it("参照根组件时移动到根数组末尾", () => {
    const { store } = createTree();

    store.getState().moveComponent(3, ROOT_COMPONENT_ID, "after");

    const rootChildren = store.getState().components[0].children ?? [];
    expect(rootChildren.map((item) => item.id)).toEqual([2, 3]);
    expect(rootChildren[1].parentId).toBe(ROOT_COMPONENT_ID);
  });
});

describe("历史记录器", () => {
  it("仅在产生变更的操作前记录", () => {
    const { store } = createTree();
    const keys: string[] = [];

    store.getState().setHistoryRecorder({ record: (key) => keys.push(key) });
    store.getState().deleteComponent(404);
    store.getState().updateComponentProps(3, { text: "x" });
    store.getState().insertComponent(component(7), 3, "after");
    store.getState().restoreComponents(store.getState().components);
    store.getState().patchComponentProps([{ componentId: 3, props: { text: "y" } }]);

    expect(keys).toEqual(["updateComponentProps:3", "insertComponent"]);
  });
});

describe("cloneComponentWithNewIds", () => {
  it("递归重写 id 并保留原有属性", () => {
    const source = component(10, "Card", { title: "A" });
    source.hidden = { type: "static", value: false };
    source.children = [component(11, "Button"), component(12, "Text")];

    const copy = cloneComponentWithNewIds(source, 99);

    expect(copy.id).not.toBe(source.id);
    expect(copy.parentId).toBe(99);
    expect(copy.props).toEqual({ title: "A" });
    expect(copy.props).not.toBe(source.props);
    expect(copy.hidden).toEqual({ type: "static", value: false });
    expect(copy.children?.map((child) => child.name)).toEqual(["Button", "Text"]);
    expect(copy.children?.[0].parentId).toBe(copy.id);
    expect(copy.children?.[1].id).not.toBe(source.children[1].id);
  });
});
