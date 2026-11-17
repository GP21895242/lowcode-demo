import { beforeEach, describe, expect, it } from "vite-plus/test";

import type { Variable } from "../stores/variable";
import type { PageSearchConfig } from "./types";
import { readSearchValuesFromUrl, syncSearchToUrl } from "./url-sync";

const config: PageSearchConfig = {
  scope: "page",
  fields: [
    { variable: "search.region", label: "区域", control: "input", order: 0 },
    { variable: "search.keyword", label: "关键字", control: "input", order: 1 },
  ],
  targets: [],
  trigger: "submit",
};

const urlVariable = (name: string): Variable => ({
  name,
  type: "string",
  defaultValue: "",
  remark: "",
  scope: "search",
  persist: "url",
});

const variables = [urlVariable("search.region"), urlVariable("search.keyword")];

function setHash(hash: string) {
  window.history.replaceState(null, "", `/${hash}`);
}

beforeEach(() => {
  setHash("#/pages/demo/preview");
});

describe("readSearchValuesFromUrl", () => {
  it("读取 URL 中持久化的搜索值", () => {
    setHash("#/pages/demo/preview?region=%E5%8D%8E%E4%B8%9C&keyword=%E8%AE%A2%E5%8D%95");

    expect(readSearchValuesFromUrl(config, variables)).toEqual({
      "search.region": "华东",
      "search.keyword": "订单",
    });
  });

  it("没有持久化参数时返回 null", () => {
    setHash("#/pages/demo/preview?other=1");

    expect(readSearchValuesFromUrl(config, variables)).toBeNull();
  });

  it("忽略未开启 URL 持久化的变量", () => {
    setHash("#/pages/demo/preview?region=%E5%8D%8E%E4%B8%9C");

    expect(readSearchValuesFromUrl(config, [])).toBeNull();
  });

  it("无 hash 路由时返回 null", () => {
    setHash("");

    expect(readSearchValuesFromUrl(config, variables)).toBeNull();
  });
});

describe("syncSearchToUrl", () => {
  it("写入搜索值并保留其他参数", () => {
    setHash("#/pages/demo/preview?keep=1");

    syncSearchToUrl(config, variables, { "search.region": "华南", "search.keyword": "订单" });

    const params = new URLSearchParams(window.location.hash.split("?")[1]);
    expect(params.get("keep")).toBe("1");
    expect(params.get("region")).toBe("华南");
    expect(params.get("keyword")).toBe("订单");
  });

  it("空值从地址栏移除", () => {
    setHash("#/pages/demo/preview?keep=1&region=old&keyword=old");

    syncSearchToUrl(config, variables, { "search.region": "", "search.keyword": null });

    expect(window.location.hash).toBe("#/pages/demo/preview?keep=1");
  });

  it("无 hash 路由时不改写地址", () => {
    window.history.replaceState(null, "", "/");

    syncSearchToUrl(config, variables, { "search.region": "华南" });

    expect(window.location.hash).toBe("");
  });
});
