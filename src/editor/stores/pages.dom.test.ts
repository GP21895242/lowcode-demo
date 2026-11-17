import { describe, expect, it } from "vite-plus/test";

import { PAGE_SCHEMA_VERSION, usePagesStore } from "./pages";

const STORAGE_KEY = "lowcode-pages";

const legacyPage = {
  id: "page_legacy",
  name: "旧页面",
  schemaVersion: 2,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  components: [
    {
      id: 1,
      name: "Page",
      props: {},
      children: [{ id: 10, name: "Card", props: { scopeId: "card-a", title: "订单卡片" } }],
    },
  ],
  variables: [{ name: "keyword", defaultValue: "abc" }],
  sources: [],
  relations: [],
  interactions: [
    {
      id: "i1",
      enabled: true,
      trigger: { type: "card-event", instanceId: "card-a", event: "click" },
      actions: [
        { type: "set-input", targetScopeId: "card-a", key: "keyword", valueFrom: "{eventData.id}" },
        { type: "set-variable", name: "selected", valueFrom: "{eventData.id}" },
        { type: "invoke", targetInstanceId: "ghost", method: "reload" },
      ],
    },
  ],
  search: {
    scope: "page",
    fields: [],
    targets: [
      { kind: "card", scopeId: "card-a", inputKey: "keyword", variable: "search.keyword" },
      { kind: "card", instanceId: "ghost", inputKey: "keyword", variable: "search.ghost" },
    ],
    trigger: "submit",
  },
};

describe("页面记录迁移", () => {
  it("v2 旧数据升级到当前版本并重写卡片实例标识", async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ state: { pages: [legacyPage] }, version: 2 }),
    );

    await usePagesStore.persist.rehydrate();

    const page = usePagesStore.getState().pages.find((item) => item.id === "page_legacy");

    expect(page?.schemaVersion).toBe(PAGE_SCHEMA_VERSION);
    expect(page?.components[0].children?.[0]).toMatchObject({
      id: 10,
      props: { title: "订单卡片" },
    });
    expect(page?.components[0].children?.[0].props).not.toHaveProperty("scopeId");
    expect(page?.components[0].children?.[0].props).not.toHaveProperty("instanceId");

    // 旧变量缺少 type / scope，迁移时补齐默认值
    expect(page?.variables).toEqual([
      expect.objectContaining({ name: "keyword", type: "string", scope: "page" }),
    ]);

    const interaction = page?.interactions?.[0];
    expect(interaction?.trigger.componentId).toBe(10);
    expect(interaction?.actions).toEqual([
      { type: "set-input", targetComponentId: 10, key: "keyword", valueFrom: "{eventData.id}" },
      { type: "set-variable", name: "selected", valueFrom: "{eventData.id}" },
    ]);

    expect(page?.search?.targets).toEqual([
      { kind: "card", componentId: 10, inputKey: "keyword", variable: "search.keyword" },
    ]);
    expect(page?.dismissedSuggestions).toEqual([]);
  });

  it("持久化数据缺少 pages 时回退为空列表", async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ state: {}, version: 2 }));

    await usePagesStore.persist.rehydrate();

    expect(usePagesStore.getState().pages).toEqual([]);
  });
});

describe("页面记录增删改", () => {
  it("创建、保存与删除页面", () => {
    const page = usePagesStore.getState().createPage("  测试页面  ");

    expect(page.name).toBe("测试页面");
    expect(page.schemaVersion).toBe(PAGE_SCHEMA_VERSION);
    expect(page.components[0].id).toBe(1);
    expect(usePagesStore.getState().pages.some((item) => item.id === page.id)).toBe(true);

    usePagesStore.getState().savePage(page.id, {
      schemaVersion: PAGE_SCHEMA_VERSION,
      components: page.components,
      variables: [],
      sources: [],
      relations: [],
    });

    const saved = usePagesStore.getState().pages.find((item) => item.id === page.id);
    expect(saved?.updatedAt).toBeTruthy();

    usePagesStore.getState().deletePage(page.id);
    expect(usePagesStore.getState().pages.some((item) => item.id === page.id)).toBe(false);
  });
});
