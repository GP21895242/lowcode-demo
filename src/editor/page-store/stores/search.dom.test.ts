import { describe, expect, it, vi } from "vite-plus/test";

import { createCardRegistry } from "../../page-store/stores/cards";
import { createPageDataStore } from "../../page-store/stores/page-data";
import { createVariablesStore } from "../../page-store/stores/variables";
import { createPageSearchStore } from "./search";
import type { PageSearchConfig } from "../../search/types";

const config: PageSearchConfig = {
  scope: "page",
  fields: [
    { variable: "search.region", label: "区域", control: "input", order: 0 },
    { variable: "search.keyword", label: "关键字", control: "input", order: 1 },
  ],
  targets: [
    { kind: "source", sourceId: "orders", paramKey: "region", variable: "search.region" },
    { kind: "card", componentId: 9, inputKey: "keyword", variable: "search.keyword" },
  ],
  trigger: "submit",
};

function setup() {
  const pageData = createPageDataStore();
  const variables = createVariablesStore([
    { name: "search.region", scope: "search", defaultValue: "华东" },
    { name: "search.keyword", scope: "search", defaultValue: "" },
  ]);
  const cards = createCardRegistry();
  const setInput = vi.fn();
  cards.register({
    componentId: 9,
    templateId: "tpl",
    templateName: "卡片",
    setInput,
    getInputs: () => ({}),
    reload: vi.fn(),
    invoke: vi.fn(),
  });

  const search = vi.fn().mockResolvedValue(undefined);
  const sourceLoader = { store: { getState: () => ({ search }) } } as any;

  const store = createPageSearchStore({ pageData, variables, cards, sourceLoader });

  return { store, pageData, variables, setInput, search };
}

describe("页面搜索 store", () => {
  it("setValue 写入 pageData 的 search.<key>", () => {
    const { store, pageData } = setup();

    store.getState().setValue("region", "华南");

    expect(pageData.getState().data["search.region"]).toBe("华南");
  });

  it("setConfig 把搜索字段同步为只读搜索变量", () => {
    const { store, variables } = setup();

    store.getState().setConfig(config);

    const region = variables.getState().variables.find((item) => item.name === "search.region");
    expect(region).toMatchObject({ scope: "search", readonly: true, control: "input" });
  });

  it("submit 按数据源分组请求并写入卡片输入", () => {
    const { store, search, setInput } = setup();
    store.getState().setConfig(config);

    store.getState().submit({ "search.region": "华东", "search.keyword": "订单" });

    expect(search).toHaveBeenCalledWith("orders", { region: "华东" });
    expect(setInput).toHaveBeenCalledWith("keyword", "订单");
  });

  it("未传值时从页面数据读取搜索值", () => {
    const { store, pageData, search } = setup();
    store.getState().setConfig(config);
    pageData.getState().setData("search.region", "华北");

    store.getState().submit();

    expect(search).toHaveBeenCalledWith("orders", { region: "华北" });
  });

  it("没有配置时 submit 不发起请求", () => {
    const { store, search } = setup();

    store.getState().submit();

    expect(search).not.toHaveBeenCalled();
  });

  it("reset 用变量默认值回填并重新提交", () => {
    const { store, pageData, search } = setup();
    store.getState().setConfig(config);

    store.getState().reset();

    expect(pageData.getState().data["search.region"]).toBe("华东");
    expect(pageData.getState().data["search.keyword"]).toBe("");
    expect(search).toHaveBeenCalledWith("orders", { region: "华东" });
  });
});
