import { describe, expect, it } from "vite-plus/test";

import { PAGE_SCHEMA_VERSION, usePagesStore } from "../stores/pages";
import { saveCurrentPageDesign } from "../utils/page-save";
import { createDesignPageStores } from "./design-stores";
import { hydratePageStores } from "./hydrate";
import { createPageStores } from "./runtime-stores";
import { ROOT_COMPONENT_ID } from "./stores/content";

describe("页面保存往返", () => {
  it("把运行时 store 写回页面记录后可以完整还原", () => {
    const page = usePagesStore.getState().createPage("往返用例");
    const stores = createPageStores("edit");
    const designStores = createDesignPageStores(stores);

    const design = {
      components: [
        {
          id: ROOT_COMPONENT_ID,
          name: "Page",
          props: {},
          desc: "页面",
          children: [
            { id: 2, name: "Button", props: { text: "提交" }, parentId: ROOT_COMPONENT_ID },
          ],
        },
      ],
      variables: [{ name: "keyword", defaultValue: "abc" }],
      sources: [
        {
          id: "orders",
          name: "orders",
          title: "订单",
          kind: "static" as const,
          fields: [],
          mock: { enabled: true, delay: 0, data: [] },
        },
      ],
      relations: [],
      interactions: [],
      search: {
        scope: "page" as const,
        fields: [{ variable: "search.region", label: "区域", control: "input" as const, order: 0 }],
        targets: [],
        trigger: "submit" as const,
      },
      dismissedSuggestions: ["s1"],
    };

    hydratePageStores(stores, design);
    designStores.suggestions.getState().setDismissedIds(["s1"]);

    stores.content.getState().updateComponentProps(2, { text: "已保存" });

    saveCurrentPageDesign(page.id, { page: stores, design: designStores });

    const saved = usePagesStore.getState().pages.find((item) => item.id === page.id);

    expect(saved?.schemaVersion).toBe(PAGE_SCHEMA_VERSION);
    expect(saved?.components[0].children?.[0].props.text).toBe("已保存");
    expect(saved?.variables.map((item) => item.name)).toEqual(["keyword", "search.region"]);
    expect(saved?.sources.map((source) => source.id)).toEqual(["orders"]);
    expect(saved?.search?.fields).toHaveLength(1);
    expect(saved?.dismissedSuggestions).toEqual(["s1"]);

    // 新页面实例从已保存记录重新加载，得到相同状态
    const reloaded = createPageStores("preview");
    hydratePageStores(reloaded, saved!);

    expect(reloaded.content.getState().components[0].children?.[0].props.text).toBe("已保存");
    expect(reloaded.pageData.getState().data).toEqual({ keyword: "abc", "search.region": "" });
    expect(reloaded.dataSources.getState().sources.map((source) => source.id)).toEqual(["orders"]);

    usePagesStore.getState().deletePage(page.id);
  });
});
