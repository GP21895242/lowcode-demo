import { describe, expect, it } from "vite-plus/test";

import type { DataSource } from "../data-source/types";
import type { Component } from "../stores/components";
import { getExpandedTemplate } from "./expander";
import type { CardTemplate } from "./types";

function component(partial: Partial<Component> & { id: number; name: string }): Component {
  return { props: {}, ...partial };
}

function source(id: string): DataSource {
  return {
    id,
    name: id,
    title: id,
    kind: "http",
    request: { url: "/api/list", method: "GET" },
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
    mock: { enabled: false, delay: 0, data: [] },
  };
}

function template(overrides: Partial<CardTemplate> = {}): CardTemplate {
  return {
    id: "tpl-expand",
    name: "列表卡片",
    version: 1,
    contract: { inputs: [], events: [] },
    impl: {
      root: component({ id: 1, name: "Card" }),
      sources: [],
      variables: [],
      relations: [],
    },
    createdAt: "",
    updatedAt: "",
    ...overrides,
  };
}

describe("getExpandedTemplate", () => {
  it("分配负数运行时 id，并重写组件方法目标与插槽数据源引用", () => {
    const slotSource = source("s1");
    const tpl = template({
      contract: {
        inputs: [],
        events: [],
        slots: [{ key: "list", label: "列表", required: true, defaultSource: slotSource }],
      },
      impl: {
        root: component({
          id: 1,
          name: "Card",
          props: {
            dataSource: { type: "dataSource", value: { sourceId: "s1" } },
            rules: [
              {
                id: "flow-root",
                type: "root",
                menus: [],
                children: [
                  {
                    id: "flow-action",
                    type: "action",
                    menus: [],
                    config: { type: "ComponentMethod", config: { componentId: 2 } },
                  },
                ],
              },
            ],
          },
          children: [component({ id: 2, name: "Table", parentId: 1 })],
        }),
        sources: [slotSource],
        variables: [],
        relations: [],
      },
    });

    const expanded = getExpandedTemplate(tpl);
    expect(expanded).not.toBeNull();

    const child = expanded!.root.children![0];
    expect(expanded!.root.id).toBeLessThan(0);
    expect(child.id).toBeLessThan(0);
    expect(expanded!.idMap.get(1)).toBe(expanded!.root.id);
    expect(expanded!.idMap.get(2)).toBe(child.id);
    expect(child.parentId).toBe(expanded!.root.id);

    expect(expanded!.root.props.dataSource.value.sourceId).toBe("$slot.list");
    expect(expanded!.root.props.rules[0].children[0].config.config.componentId).toBe(child.id);

    // 展开过程不应改动模板本身
    expect(tpl.impl.root.id).toBe(1);
    expect(tpl.impl.root.props.dataSource.value.sourceId).toBe("s1");
  });

  it("按 templateId + version 缓存，版本变化后重新展开", () => {
    const tpl = template({ id: "tpl-cache", version: 1 });
    const first = getExpandedTemplate(tpl);
    const sameVersion = getExpandedTemplate({ ...tpl });

    expect(sameVersion).toBe(first);

    const nextVersion = getExpandedTemplate({ ...tpl, version: 2 });
    expect(nextVersion).not.toBe(first);
    expect(nextVersion!.root.id).not.toBe(first!.root.id);
  });
});
