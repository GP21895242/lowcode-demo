import { describe, expect, it } from "vite-plus/test";

import type { CardTemplate } from "../card-template/types";
import type { DataSource } from "../data-source/types";
import { ItemType } from "../item-type";
import type { Component } from "../stores/components";
import { fingerprintSource, scanMerges } from "./scan";

function component(partial: Partial<Component> & { id: number; name: string }): Component {
  return { props: {}, ...partial };
}

function source(id: string, overrides: Partial<DataSource> = {}): DataSource {
  return {
    id,
    name: id,
    title: id,
    kind: "http",
    request: {
      url: "/api/list",
      method: "GET",
      params: { keyword: "{search.keyword}" },
      resultPath: "data",
    },
    fields: [
      {
        dataKey: "name",
        label: "名称",
        type: "string",
        visible: true,
        sortable: false,
        searchable: false,
      },
    ],
    mock: { enabled: false, delay: 0, data: [{ id: 1 }] },
    ...overrides,
  };
}

function template(overrides: Partial<CardTemplate> = {}): CardTemplate {
  return {
    id: "tpl-scan",
    name: "列表卡片",
    version: 1,
    contract: {
      inputs: [],
      events: [],
      slots: [{ key: "list", label: "列表", required: true, shareable: true }],
    },
    impl: { root: component({ id: 1, name: "Card" }), sources: [], variables: [], relations: [] },
    createdAt: "",
    updatedAt: "",
    ...overrides,
  };
}

function instance(id: number, scopeId: string, slotMapping: Record<string, string>) {
  return component({
    id,
    name: ItemType.CardInstance,
    props: { templateId: "tpl-scan", templateVersion: 1, scopeId, inputValues: {}, slotMapping },
  });
}

describe("fingerprintSource", () => {
  it("忽略字段差异与模板占位取值", () => {
    const left = source("a", {
      request: { url: "/api/list/{id}", method: "GET", params: { keyword: "x" } },
    });
    const right = source("b", {
      request: { url: "/api/list/{pageNo}", method: "GET", params: { keyword: "y" } },
      fields: [],
    });

    expect(fingerprintSource(left)).toBe(fingerprintSource(right));
  });

  it("请求签名不同则指纹不同", () => {
    const base = source("a");
    const otherUrl = source("b", { request: { url: "/api/other", method: "GET" } });
    const otherParams = source("c", {
      request: { url: "/api/list", method: "GET", params: { keyword: "{search.q}" } },
    });

    expect(fingerprintSource(base)).not.toBe(fingerprintSource(otherUrl));
    expect(fingerprintSource(base)).not.toBe(fingerprintSource(otherParams));
  });
});

describe("scanMerges", () => {
  it("插入相同卡片时不产生任何合并建议", () => {
    const suggestions = scanMerges({
      components: [instance(1, "scope-a", { list: "s1" }), instance(2, "scope-b", { list: "s1" })],
      sources: [source("s1")],
      templates: [template()],
    });

    expect(suggestions).toEqual([]);
  });

  it("请求签名一致但字段不同时给出中等置信度建议", () => {
    const target = source("s1");
    const duplicate = source("s2", {
      fields: [
        {
          dataKey: "name",
          label: "名称",
          type: "number",
          visible: true,
          sortable: false,
          searchable: false,
        },
      ],
    });

    const suggestions = scanMerges({
      components: [instance(1, "scope-a", { list: "s1" }), instance(2, "scope-b", { list: "s2" })],
      sources: [target, duplicate],
      templates: [template()],
    });

    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].kind).toBe("source");
    expect(suggestions[0].confidence).toBe("medium");
    expect(suggestions[0].sourceIds).toEqual(["s1", "s2"]);
    expect(suggestions[0].conflicts.map((conflict) => conflict.key)).toContain("type:name");
  });

  it("同名可搜索输入出现在多个实例时生成搜索项建议", () => {
    const searchTemplate = template({
      id: "tpl-search",
      contract: {
        inputs: [
          {
            key: "keyword",
            label: "关键词",
            type: "text",
            searchable: true,
            binding: { kind: "prop", targetNodeId: 2, targetProp: "title" },
          },
        ],
        events: [],
      },
    });

    const suggestions = scanMerges({
      components: [
        component({
          id: 1,
          name: ItemType.CardInstance,
          props: { templateId: "tpl-search", scopeId: "scope-a", slotMapping: {} },
        }),
        component({
          id: 2,
          name: ItemType.CardInstance,
          props: { templateId: "tpl-search", scopeId: "scope-b", slotMapping: {} },
        }),
      ],
      sources: [],
      templates: [searchTemplate],
    });

    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].kind).toBe("search-field");
    expect(suggestions[0].candidates).toHaveLength(2);
  });
});
