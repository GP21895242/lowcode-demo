import { describe, expect, it } from "vite-plus/test";

import { createEmptyDataSource, createField, createSamplePageData, inferFields } from "./schema";

describe("inferFields", () => {
  it("从行数据推断字段类型与搜索控件", () => {
    const fields = inferFields([{ id: 1, name: "订单", active: true, createdAt: "2026-01-08" }]);

    expect(fields.map((field) => field.dataKey)).toEqual(["id", "name", "active", "createdAt"]);
    expect(fields.map((field) => field.type)).toEqual(["number", "string", "boolean", "date"]);
    expect(fields.map((field) => field.searchType)).toEqual([
      "numberRange",
      "input",
      "select",
      "dateRange",
    ]);
    expect(fields.find((field) => field.dataKey === "active")).toMatchObject({
      sortable: false,
      searchable: false,
      options: [
        { label: "是", value: 1 },
        { label: "否", value: 0 },
      ],
    });
  });

  it("跳过对象类型字段并保持键顺序去重", () => {
    const fields = inferFields([
      { id: 1, meta: { a: 1 } },
      { id: 2, name: "b", meta: { a: 2 } },
    ]);

    expect(fields.map((field) => field.dataKey)).toEqual(["id", "name"]);
  });

  it("空数据返回空字段列表", () => {
    expect(inferFields([])).toEqual([]);
  });
});

describe("createField", () => {
  it("默认字段可直接用于新数据源", () => {
    expect(createField()).toMatchObject({
      label: "新字段",
      type: "string",
      visible: true,
      sortable: true,
      searchable: true,
      searchType: "input",
    });
  });

  it("允许覆盖默认值", () => {
    expect(
      createField({ dataKey: "amount", type: "number", searchType: "numberRange" }),
    ).toMatchObject({ dataKey: "amount", type: "number", searchType: "numberRange" });
  });
});

describe("createEmptyDataSource", () => {
  it("生成带主键字段的 HTTP 数据源骨架", () => {
    const source = createEmptyDataSource();

    expect(source.id).toMatch(/^ds_/);
    expect(source.kind).toBe("http");
    expect(source.primaryKey).toBe("id");
    expect(source.request).toMatchObject({ method: "GET", resultPath: "data" });
    expect(source.fields).toHaveLength(1);
    expect(source.fields[0]).toMatchObject({ dataKey: "id", sortable: false });
  });
});

describe("createSamplePageData", () => {
  it("返回订单汇总与明细两个数据源及关联关系", () => {
    const { sources, relations } = createSamplePageData("demo");

    expect(sources.map((source) => source.id)).toEqual(["ds_orders_demo", "ds_order_details_demo"]);
    expect(sources.every((source) => source.mock.data.length > 0)).toBe(true);
    expect(relations).toEqual([
      expect.objectContaining({
        sourceId: "ds_orders_demo",
        targetId: "ds_order_details_demo",
        paramKey: "region",
        enabled: true,
      }),
    ]);
  });
});
