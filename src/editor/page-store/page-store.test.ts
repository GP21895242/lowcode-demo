import { describe, expect, it } from "vite-plus/test";

import { createDesignPageStores } from "./design-stores";
import { createPageStores } from "./runtime-stores";
import { ROOT_COMPONENT_ID } from "./stores/content";

describe("page store 实例隔离", () => {
  it("不同页面实例的组件与页面数据互不影响", () => {
    const editStores = createPageStores("edit");
    const previewStores = createPageStores("preview");
    const designStores = createDesignPageStores(editStores);

    editStores.content
      .getState()
      .addComponent({ id: 2, name: "Button", props: {} }, ROOT_COMPONENT_ID);
    editStores.pageData.getState().setData("keyword", "order");
    editStores.dataSources.getState().addSource({ id: "source_a" } as any);

    expect(editStores.content.getState().components[0].children).toHaveLength(1);
    expect(previewStores.content.getState().components[0].children).toBeUndefined();
    expect(previewStores.pageData.getState().data.keyword).toBeUndefined();
    expect(previewStores.dataSources.getState().sources).toHaveLength(0);

    // 历史栈挂在设计态实例上，不会串到其他页面
    expect(designStores.editor.getState().past).toHaveLength(1);
  });

  it("撤销只回滚当前实例的组件树", () => {
    const stores = createPageStores("edit");
    const { editor } = createDesignPageStores(stores);

    stores.content.getState().addComponent({ id: 2, name: "Button", props: {} }, ROOT_COMPONENT_ID);
    expect(stores.content.getState().components[0].children).toHaveLength(1);

    editor.getState().undo();
    expect(stores.content.getState().components[0].children ?? []).toHaveLength(0);

    editor.getState().redo();
    expect(stores.content.getState().components[0].children).toHaveLength(1);
  });

  it("合并事务只产生一条历史并同步数据源", () => {
    const stores = createPageStores("edit");
    const { editor } = createDesignPageStores(stores);

    editor.getState().applyMergeTransaction({
      componentProps: [{ componentId: ROOT_COMPONENT_ID, props: { title: "首页" } }],
      sources: [{ id: "merged_source" } as any],
      relations: [],
    });

    expect(stores.content.getState().components[0].props.title).toBe("首页");
    expect(stores.dataSources.getState().sources).toHaveLength(1);
    expect(editor.getState().past).toHaveLength(1);

    editor.getState().undo();
    expect(stores.dataSources.getState().sources).toHaveLength(0);
  });
});
