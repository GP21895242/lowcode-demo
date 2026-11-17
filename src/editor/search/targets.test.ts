import { describe, expect, it } from "vite-plus/test";

import { createPageDataStore } from "../page-store/stores/page-data";
import { groupSourceTargets, readSearchValues, toSearchDataKey, toSearchKey } from "./targets";
import type { SearchFieldDef, SearchTarget } from "./types";

const field = (variable: string): SearchFieldDef => ({
  variable,
  label: variable,
  control: "input",
  order: 0,
});

describe("搜索变量命名", () => {
  it("只去掉一层 search. 前缀", () => {
    expect(toSearchKey("search.region")).toBe("region");
    expect(toSearchKey("region")).toBe("region");
    expect(toSearchKey("search.search.q")).toBe("search.q");
  });

  it("统一生成页面数据中的扁平 key", () => {
    expect(toSearchDataKey("region")).toBe("search.region");
    expect(toSearchDataKey("search.region")).toBe("search.region");
  });
});

describe("readSearchValues", () => {
  it("按字段变量读取 search.<key> 的值", () => {
    const pageData = createPageDataStore({ "search.region": "华东", "search.keyword": "订单" });

    const values = readSearchValues(
      [field("search.region"), field("keyword"), field("search.missing")],
      pageData,
    );

    expect(values).toEqual({
      "search.region": "华东",
      keyword: "订单",
      "search.missing": undefined,
    });
  });
});

describe("groupSourceTargets", () => {
  const targets: SearchTarget[] = [
    { kind: "source", sourceId: "orders", paramKey: "region", variable: "search.region" },
    { kind: "source", sourceId: "orders", paramKey: "month", variable: "search.month" },
    { kind: "source", sourceId: "details", paramKey: "region", variable: "search.region" },
    { kind: "card", componentId: 9, inputKey: "keyword", variable: "search.region" },
  ];

  it("按数据源分组并以 paramKey 作为参数名", () => {
    const groups = groupSourceTargets(targets, {
      "search.region": "华东",
      "search.month": "1月",
    });

    expect(groups).toEqual({
      orders: { region: "华东", month: "1月" },
      details: { region: "华东" },
    });
  });

  it("忽略空值与非数据源目标", () => {
    const groups = groupSourceTargets(targets, {
      "search.region": "",
      "search.month": null,
    });

    expect(groups).toEqual({});
  });
});
