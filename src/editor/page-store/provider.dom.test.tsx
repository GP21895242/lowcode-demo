import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";

import { getActiveDesignStores, getActivePageStores } from "./active";
import { useContentStore, useEditorStore, usePageDataStore, usePageMode } from "./contexts";
import { PageProvider } from "./provider";
import { ROOT_COMPONENT_ID } from "./stores/content";
import type { PageDesignInput } from "./types";

const design: PageDesignInput = {
  components: [
    {
      id: ROOT_COMPONENT_ID,
      name: "Page",
      props: {},
      children: [{ id: 2, name: "Text", props: { text: "hello" } }],
    },
  ],
  variables: [{ name: "msg", defaultValue: "hi" }],
};

function EditProbe() {
  const mode = usePageMode();
  const components = useContentStore((state) => state.components);
  const past = useEditorStore((state) => state.past.length);

  return <div>{`${mode}:${components[0].children?.length ?? 0}:${past}`}</div>;
}

function PreviewProbe() {
  const mode = usePageMode();
  const data = usePageDataStore((state) => state.data);

  return <div>{`${mode}:${String(data.msg)}`}</div>;
}

describe("PageProvider 生命周期", () => {
  it("编辑模式创建设计态 store 并注入页面设计数据", () => {
    render(
      <PageProvider view="edit" design={design}>
        <EditProbe />
      </PageProvider>,
    );

    expect(screen.getByText("edit:1:0")).toBeInTheDocument();
    expect(getActiveDesignStores().editor.getState().past).toHaveLength(0);
    expect(getActivePageStores().pageData.getState().data.msg).toBe("hi");
  });

  it("卸载时释放数据源缓存并清理活动实例", () => {
    const { unmount } = render(
      <PageProvider view="edit" design={design}>
        <EditProbe />
      </PageProvider>,
    );
    const stores = getActivePageStores();
    const dispose = vi.spyOn(stores.sourceLoader, "dispose");

    unmount();

    expect(dispose).toHaveBeenCalledTimes(1);
    expect(() => getActivePageStores()).toThrow("页面 store 尚未挂载");
    expect(() => getActiveDesignStores()).toThrow();
  });

  it("预览模式不创建设计态 store", () => {
    render(
      <PageProvider view="preview" design={design}>
        <PreviewProbe />
      </PageProvider>,
    );

    expect(screen.getByText("preview:hi")).toBeInTheDocument();
    expect(() => getActiveDesignStores()).toThrow();
  });

  it("旧实例卸载不会覆盖新实例的活动引用", () => {
    const first = render(
      <PageProvider view="preview" design={design}>
        <PreviewProbe />
      </PageProvider>,
    );
    const second = render(
      <PageProvider view="preview" design={design}>
        <PreviewProbe />
      </PageProvider>,
    );
    const secondStores = getActivePageStores();

    first.unmount();

    expect(getActivePageStores()).toBe(secondStores);

    second.unmount();
    expect(() => getActivePageStores()).toThrow();
  });
});
