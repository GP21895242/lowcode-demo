import { describe, expect, it } from "vite-plus/test";

import { ItemType } from "../item-type";
import type { PageInteraction } from "../interaction/types";
import type { Component } from "../stores/components";
import { buildUpgradePatches, diffContract, scanUpgrades } from "./upgrade";
import type { CardContract, CardTemplate } from "./types";

function component(partial: Partial<Component> & { id: number; name: string }): Component {
  return { props: {}, ...partial };
}

function input(key: string, type: "text" | "number" = "text"): CardContract["inputs"][number] {
  return {
    key,
    label: key.toUpperCase(),
    type,
    binding: { kind: "prop", targetNodeId: 2, targetProp: "title" },
  };
}

const oldContract: CardContract = {
  inputs: [input("a"), input("b", "number")],
  events: [{ name: "save", label: "保存" }],
  slots: [
    { key: "list", label: "列表", required: true },
    { key: "detail", label: "详情", required: false },
  ],
};

const nextContract: CardContract = {
  inputs: [input("b")],
  events: [],
  slots: [],
};

function template(overrides: Partial<CardTemplate> = {}): CardTemplate {
  return {
    id: "tpl-upgrade",
    name: "列表卡片",
    version: 2,
    contract: nextContract,
    contractHistory: { 1: oldContract },
    impl: { root: component({ id: 1, name: "Card" }), sources: [], variables: [], relations: [] },
    createdAt: "",
    updatedAt: "",
    ...overrides,
  };
}

function instance(id: number, props: Record<string, any> = {}) {
  return component({
    id,
    name: ItemType.CardInstance,
    props: {
      templateId: "tpl-upgrade",
      templateVersion: 1,
      inputValues: {},
      slotMapping: {},
      ...props,
    },
  });
}

describe("diffContract", () => {
  it("区分配置新增与破坏性变更", () => {
    const diff = diffContract(oldContract, nextContract);
    const breaking = diff.breaking.map((item) => `${item.kind}:${item.key}:${item.change}`);

    expect(breaking).toEqual(
      expect.arrayContaining(["input:a:removed", "input:b:changed", "event:save:removed"]),
    );
    expect(diff.added).toEqual([]);
  });
});

describe("scanUpgrades", () => {
  it("只列出实例实际使用的失效配置，并生成清理后的补丁", () => {
    const interactions: PageInteraction[] = [
      {
        id: "i1",
        enabled: true,
        trigger: { type: "card-event", componentId: 9, event: "save" },
        actions: [],
      },
    ];

    const candidates = scanUpgrades({
      components: [
        instance(9, {
          inputValues: { a: 1, b: 2 },
          slotMapping: { list: "s1", detail: "s2" },
        }),
      ],
      templates: [template()],
      interactions,
    });

    expect(candidates).toHaveLength(1);

    const keys = candidates[0].diff.breaking.map((item) => `${item.kind}:${item.key}`);
    expect(keys).toEqual(expect.arrayContaining(["input:a", "input:b", "slot:list", "event:save"]));
    expect(keys.filter((key) => key === "event:save")).toHaveLength(1);
    expect(candidates[0].nextInputValues).toEqual({ b: 2 });
    expect(candidates[0].nextSlotMapping).toEqual({});

    expect(buildUpgradePatches(candidates)).toEqual([
      {
        componentId: 9,
        props: { templateVersion: 2, inputValues: { b: 2 }, slotMapping: {} },
      },
    ]);
  });

  it("实例未使用的删除项不进入破坏性提示", () => {
    const candidates = scanUpgrades({
      components: [instance(10)],
      templates: [template()],
      interactions: [],
    });

    expect(candidates).toHaveLength(1);
    expect(candidates[0].diff.breaking).toEqual([]);
  });

  it("版本已是最新时不产生升级候选", () => {
    const candidates = scanUpgrades({
      components: [instance(11, { templateVersion: 2 })],
      templates: [template()],
      interactions: [],
    });

    expect(candidates).toEqual([]);
  });
});
