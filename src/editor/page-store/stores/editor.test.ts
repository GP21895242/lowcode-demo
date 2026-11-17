import { afterEach, describe, expect, it, vi } from "vite-plus/test";

import { createDesignPageStores } from "../design-stores";
import { createPageStores } from "../runtime-stores";
import { ROOT_COMPONENT_ID } from "./content";

function setup() {
  const stores = createPageStores("edit");
  const design = createDesignPageStores(stores);

  return { stores, editor: design.editor, suggestions: design.suggestions };
}

afterEach(() => {
  vi.restoreAllMocks();
});

/** 每次读取时间都前进 10 秒，避免同键操作被合并成一条历史 */
function useSlowClock() {
  let now = 1_000_000;
  vi.spyOn(Date, "now").mockImplementation(() => {
    now += 10_000;
    return now;
  });
}

describe("撤销与重做", () => {
  it("按操作逆序回滚并支持重做", () => {
    useSlowClock();
    const { stores, editor } = setup();
    const { content } = stores;

    content.getState().addComponent({ id: 2, name: "A", props: {} }, ROOT_COMPONENT_ID);
    content.getState().addComponent({ id: 3, name: "B", props: {} }, ROOT_COMPONENT_ID);

    editor.getState().undo();
    expect(content.getState().components[0].children?.map((item) => item.id)).toEqual([2]);

    editor.getState().undo();
    expect(content.getState().components[0].children ?? []).toHaveLength(0);

    editor.getState().redo();
    expect(content.getState().components[0].children?.map((item) => item.id)).toEqual([2]);

    editor.getState().redo();
    expect(content.getState().components[0].children?.map((item) => item.id)).toEqual([2, 3]);
  });

  it("空的撤销栈与重做栈不报错", () => {
    const { stores, editor } = setup();

    editor.getState().undo();
    editor.getState().redo();

    expect(editor.getState().past).toHaveLength(0);
    expect(stores.content.getState().components).toHaveLength(1);
  });

  it("只保留最近 50 条历史", () => {
    useSlowClock();
    const { stores, editor } = setup();

    for (let index = 0; index < 55; index += 1) {
      stores.content
        .getState()
        .addComponent({ id: 100 + index, name: "Item", props: {} }, ROOT_COMPONENT_ID);
    }

    expect(editor.getState().past).toHaveLength(50);
  });

  it("同键的连续操作在间隔内合并为一条历史", () => {
    const { stores, editor } = setup();
    let now = 1_000;
    vi.spyOn(Date, "now").mockImplementation(() => now);

    const { content } = stores;
    content.getState().addComponent({ id: 2, name: "Input", props: {} }, ROOT_COMPONENT_ID);

    content.getState().updateComponentProps(2, { value: "a" });
    now += 100;
    content.getState().updateComponentProps(2, { value: "ab" });
    now += 100;
    content.getState().updateComponentProps(2, { value: "abc" });

    expect(editor.getState().past).toHaveLength(2);

    now += 1_000;
    content.getState().updateComponentProps(2, { value: "abcd" });
    expect(editor.getState().past).toHaveLength(3);
  });
});

describe("选中组件与剪贴板", () => {
  it("组件树变化后 curComponent 指向最新对象", () => {
    const { stores, editor } = setup();
    const { content } = stores;

    content.getState().addComponent({ id: 2, name: "Button", props: {} }, ROOT_COMPONENT_ID);
    editor.getState().setCurComponentId(2);

    content.getState().updateComponentProps(2, { text: "提交" });

    expect(editor.getState().curComponent?.props.text).toBe("提交");
    expect(editor.getState().curComponent).toBe(
      stores.content.getState().components[0].children?.[0],
    );
  });

  it("撤销删除选中组件后清空选中", () => {
    const { stores, editor } = setup();
    const { content } = stores;

    content.getState().addComponent({ id: 2, name: "Button", props: {} }, ROOT_COMPONENT_ID);
    editor.getState().setCurComponentId(2);

    editor.getState().undo();

    expect(editor.getState().curComponentId).toBeNull();
    expect(editor.getState().curComponent).toBeNull();
  });

  it("复制粘贴时生成新的组件 id", () => {
    const { stores, editor } = setup();
    const { content } = stores;

    content.getState().addComponent({ id: 2, name: "Button", props: { text: "A" } }, 1);
    editor.getState().copyComponent(2);

    const pasted = editor.getState().pasteComponent(2);

    expect(pasted?.id).not.toBe(2);
    expect(pasted?.props).toEqual({ text: "A" });
    expect(content.getState().components[0].children?.map((item) => item.id)).toEqual([
      2,
      pasted?.id,
    ]);
  });

  it("剪贴板为空时粘贴返回 null", () => {
    const { editor } = setup();
    expect(editor.getState().pasteComponent(ROOT_COMPONENT_ID)).toBeNull();
  });
});

describe("合并事务与批量补丁", () => {
  it("合并事务只产生一条历史并可通过撤销回滚页面资源", () => {
    const { stores, editor } = setup();

    editor.getState().applyMergeTransaction({
      componentProps: [{ componentId: ROOT_COMPONENT_ID, props: { title: "首页" } }],
      sources: [{ id: "merged" } as any],
      relations: [],
    });

    expect(editor.getState().past).toHaveLength(1);
    expect(editor.getState().past[0].page).toBeDefined();
    expect(stores.content.getState().components[0].props.title).toBe("首页");
    expect(stores.dataSources.getState().sources).toHaveLength(1);

    editor.getState().undo();

    expect(stores.content.getState().components[0].props.title).toBeUndefined();
    expect(stores.dataSources.getState().sources).toHaveLength(0);
  });

  it("批量组件补丁只产生一条历史，空补丁不产生历史", () => {
    const { stores, editor } = setup();
    const { content } = stores;

    content.getState().addComponent({ id: 2, name: "Card", props: { v: 1 } }, ROOT_COMPONENT_ID);
    content.getState().addComponent({ id: 3, name: "Card", props: { v: 1 } }, ROOT_COMPONENT_ID);
    const historyBefore = editor.getState().past.length;

    editor.getState().applyComponentPatches([]);
    expect(editor.getState().past).toHaveLength(historyBefore);

    editor.getState().applyComponentPatches([
      { componentId: 2, props: { v: 2 } },
      { componentId: 3, props: { v: 3 } },
    ]);

    expect(editor.getState().past).toHaveLength(historyBefore + 1);
    expect(content.getState().components[0].children?.map((item) => item.props.v)).toEqual([2, 3]);
  });
});
