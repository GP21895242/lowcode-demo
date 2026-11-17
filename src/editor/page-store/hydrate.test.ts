import { describe, expect, it } from "vite-plus/test";

import { createDesignPageStores } from "./design-stores";
import { hydrateDesignPageStores, hydratePageStores } from "./hydrate";
import { createPageStores } from "./runtime-stores";
import { ROOT_COMPONENT_ID } from "./stores/content";
import type { PageDesignInput } from "./types";

const design: PageDesignInput = {
  components: [
    {
      id: ROOT_COMPONENT_ID,
      name: "Page",
      props: {},
      desc: "页面",
      children: [
        {
          id: 2,
          name: "Card",
          props: { title: "订单" },
          parentId: ROOT_COMPONENT_ID,
          children: [],
        },
      ],
    },
  ],
  variables: [
    { name: "keyword", defaultValue: "abc" },
    { name: "search.region", scope: "search", defaultValue: "华东" },
  ],
  sources: [
    {
      id: "orders",
      name: "orders",
      title: "订单",
      fields: [],
      mock: { enabled: true, delay: 0, data: [] },
    } as any,
  ],
  relations: [],
  interactions: [
    {
      id: "i1",
      enabled: true,
      trigger: { type: "card-event", componentId: 2, event: "click" },
      actions: [{ type: "set-variable", name: "keyword", valueFrom: "{eventData.value}" }],
    },
  ],
  search: {
    scope: "page",
    fields: [{ variable: "search.region", label: "区域", control: "input", order: 0 }],
    targets: [
      { kind: "source", sourceId: "orders", paramKey: "region", variable: "search.region" },
    ],
    trigger: "submit",
  },
  dismissedSuggestions: ["s1"],
};

describe("hydratePageStores", () => {
  it("把页面设计数据写入运行时 store", () => {
    const stores = createPageStores("edit");

    hydratePageStores(stores, design);

    expect(stores.content.getState().components[0].children?.map((item) => item.id)).toEqual([2]);
    expect(stores.dataSources.getState().sources.map((source) => source.id)).toEqual(["orders"]);
    expect(stores.interactions.getState().interactions).toHaveLength(1);
    expect(stores.search.getState().config?.fields).toHaveLength(1);
    expect(stores.pageData.getState().data).toEqual({
      keyword: "abc",
      "search.region": "华东",
    });
  });

  it("写入的是深拷贝，修改 store 不会污染设计数据", () => {
    const stores = createPageStores("edit");

    hydratePageStores(stores, design);
    stores.content.getState().components[0].children![0].props.title = "变更";

    expect(design.components?.[0].children?.[0].props.title).toBe("订单");
  });

  it("重复 hydrate 会重置上一份页面数据与组件树", () => {
    const stores = createPageStores("edit");

    hydratePageStores(stores, design);
    stores.pageData.getState().setData("stale", true);

    hydratePageStores(stores, { components: design.components, variables: design.variables });

    // 去掉搜索配置后，搜索变量同步清理，只保留页面变量
    expect(stores.pageData.getState().data).toEqual({ keyword: "abc" });
    expect(stores.variables.getState().variables.map((item) => item.name)).toEqual(["keyword"]);
    expect(stores.dataSources.getState().sources).toEqual([]);
    expect(stores.search.getState().config).toBeNull();
  });

  it("设计态数据单独写入建议忽略记录", () => {
    const stores = createPageStores("edit");
    const designStores = createDesignPageStores(stores);

    hydrateDesignPageStores(designStores, design);

    expect(designStores.suggestions.getState().dismissedIds).toEqual(["s1"]);
  });
});
