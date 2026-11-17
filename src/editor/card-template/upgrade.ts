import type { PageInteraction } from "../interaction/types";
import { ItemType } from "../item-type";
import type { Component } from "../stores/components";
import type { CardContract, CardTemplate } from "./types";

/** 单个契约差异项；带 breaking 时表示需要设计者确认 */
export interface ContractDiffItem {
  kind: "input" | "event" | "method" | "slot";
  key: string;
  label: string;
  change: "added" | "removed" | "changed";
  breaking?: string;
}

export interface ContractDiff {
  added: ContractDiffItem[];
  breaking: ContractDiffItem[];
}

export interface UpgradeCandidate {
  componentId: number;
  template: CardTemplate;
  fromVersion: number;
  toVersion: number;
  diff: ContractDiff;
  /** 升级后保留的输入值与插槽映射，破坏性配置在此清理 */
  nextInputValues: Record<string, any>;
  nextSlotMapping: Record<string, string>;
}

function kindLabel(kind: ContractDiffItem["kind"]) {
  if (kind === "input") return "输入";
  if (kind === "event") return "事件";
  if (kind === "method") return "方法";
  return "插槽";
}

/**
 * 只对比 Contract：新增可选配置安全，删除或改类型标记破坏性；
 * old 缺失（历史版本未留档）时只计算新增，删除项由实例使用情况兜底
 */
export function diffContract(oldContract: CardContract | undefined, nextContract: CardContract) {
  const added: ContractDiffItem[] = [];
  const breaking: ContractDiffItem[] = [];

  const oldInputs = new Map((oldContract?.inputs ?? []).map((input) => [input.key, input]));
  const nextInputs = new Map((nextContract.inputs ?? []).map((input) => [input.key, input]));

  oldInputs.forEach((input, key) => {
    const next = nextInputs.get(key);
    if (!next) {
      breaking.push({
        kind: "input",
        key,
        label: input.label,
        change: "removed",
        breaking: "模板已删除该输入，实例上的绑定会被清理",
      });
      return;
    }
    if (next.type !== input.type) {
      breaking.push({
        kind: "input",
        key,
        label: input.label,
        change: "changed",
        breaking: `输入类型由 ${input.type} 变为 ${next.type}`,
      });
    }
  });

  nextInputs.forEach((input, key) => {
    if (oldInputs.has(key)) return;

    const item: ContractDiffItem = {
      kind: "input",
      key,
      label: input.label,
      change: "added",
    };
    if (input.required && input.defaultValue === undefined) {
      item.breaking = "新增必填输入，升级后需要补充取值";
      breaking.push(item);
      return;
    }
    added.push(item);
  });

  const oldEvents = new Set((oldContract?.events ?? []).map((event) => event.name));
  const nextEvents = new Set((nextContract.events ?? []).map((event) => event.name));

  oldContract?.events.forEach((event) => {
    if (!nextEvents.has(event.name)) {
      breaking.push({
        kind: "event",
        key: event.name,
        label: event.label,
        change: "removed",
        breaking: "模板已删除该事件，相关联动需要手动调整",
      });
    }
  });
  nextContract.events?.forEach((event) => {
    if (!oldEvents.has(event.name)) {
      added.push({ kind: "event", key: event.name, label: event.label, change: "added" });
    }
  });

  const oldMethods = new Set((oldContract?.methods ?? []).map((method) => method.name));
  const nextMethods = new Set((nextContract.methods ?? []).map((method) => method.name));

  oldContract?.methods?.forEach((method) => {
    if (!nextMethods.has(method.name)) {
      breaking.push({
        kind: "method",
        key: method.name,
        label: method.label,
        change: "removed",
        breaking: "模板已删除该方法，相关联动需要手动调整",
      });
    }
  });
  nextContract.methods?.forEach((method) => {
    if (!oldMethods.has(method.name)) {
      added.push({ kind: "method", key: method.name, label: method.label, change: "added" });
    }
  });

  const oldSlots = new Set((oldContract?.slots ?? []).map((slot) => slot.key));
  const nextSlots = new Map((nextContract.slots ?? []).map((slot) => [slot.key, slot]));

  oldContract?.slots?.forEach((slot) => {
    if (!nextSlots.has(slot.key)) {
      breaking.push({
        kind: "slot",
        key: slot.key,
        label: slot.label,
        change: "removed",
        breaking: "模板已删除该插槽，实例上的映射会被清理",
      });
    }
  });
  nextContract.slots?.forEach((slot) => {
    if (oldSlots.has(slot.key)) return;

    const item: ContractDiffItem = {
      kind: "slot",
      key: slot.key,
      label: slot.label,
      change: "added",
    };
    if (slot.required) {
      item.breaking = "新增必填插槽，升级后需要映射数据源";
      breaking.push(item);
      return;
    }
    added.push(item);
  });

  return { added, breaking };
}

function collectInstances(components: Component[]) {
  const instances: {
    componentId: number;
    templateId: string;
    version: number;
    inputValues: Record<string, any>;
    slotMapping: Record<string, string>;
  }[] = [];

  const walk = (nodes: Component[]) => {
    nodes.forEach((node) => {
      if (node.name === ItemType.CardInstance) {
        instances.push({
          componentId: node.id,
          templateId: String(node.props?.templateId ?? ""),
          version: Number(node.props?.templateVersion ?? 0),
          inputValues: (node.props?.inputValues ?? {}) as Record<string, any>,
          slotMapping: (node.props?.slotMapping ?? {}) as Record<string, string>,
        });
      }
      if (node.children?.length) walk(node.children);
    });
  };

  walk(components);
  return instances;
}

/**
 * 联动里引用该实例的失效配置，只提示不自动改写页面级联动
 */
function collectInteractionBreaking(
  interaction: PageInteraction,
  componentId: number,
  template: CardTemplate,
): ContractDiffItem[] {
  const items: ContractDiffItem[] = [];
  const eventKeys = new Set((template.contract.events ?? []).map((event) => event.name));
  const inputKeys = new Set((template.contract.inputs ?? []).map((input) => input.key));
  const methodKeys = new Set((template.contract.methods ?? []).map((method) => method.name));

  if (
    interaction.trigger.componentId === componentId &&
    interaction.trigger.event &&
    !eventKeys.has(interaction.trigger.event)
  ) {
    items.push({
      kind: "event",
      key: interaction.trigger.event,
      label: interaction.trigger.event,
      change: "removed",
      breaking: "联动引用的事件已不在契约中，需要手动调整",
    });
  }

  interaction.actions.forEach((action) => {
    if (action.type === "set-variable" || action.targetComponentId !== componentId) return;

    if (action.type === "set-input" && action.key && !inputKeys.has(action.key)) {
      items.push({
        kind: "input",
        key: action.key,
        label: action.key,
        change: "removed",
        breaking: "联动写入的输入已不在契约中，需要手动调整",
      });
    }
    if (action.type === "invoke" && action.method && !methodKeys.has(action.method)) {
      items.push({
        kind: "method",
        key: action.method,
        label: action.method,
        change: "removed",
        breaking: "联动调用的方法已不在契约中，需要手动调整",
      });
    }
  });

  return items;
}

/**
 * 扫描本页可升级的卡片实例：只读，不修改任何配置
 */
export function scanUpgrades(input: {
  components: Component[];
  templates: CardTemplate[];
  interactions: PageInteraction[];
}): UpgradeCandidate[] {
  const { components, templates, interactions } = input;
  const candidates: UpgradeCandidate[] = [];

  collectInstances(components).forEach((instance) => {
    const template = templates.find((item) => item.id === instance.templateId);
    if (!template || instance.version >= template.version) return;

    const oldContract = template.contractHistory?.[instance.version];
    const diff = diffContract(oldContract, template.contract);
    const inputKeys = new Set((template.contract.inputs ?? []).map((item) => item.key));
    const slotKeys = new Set((template.contract.slots ?? []).map((item) => item.key));

    // 实例未使用的删除项不影响升级，不展示避免噪音；事件与方法由联动引用单独识别
    const breaking = diff.breaking.filter((item) => {
      if (item.kind === "event" || item.kind === "method") return false;
      if (item.change === "added") return true;
      if (item.kind === "input") return item.key in instance.inputValues;
      return item.key in instance.slotMapping;
    });

    // 历史版本未留档时，以实例实际使用项兜底识别已删除配置
    if (!oldContract) {
      Object.keys(instance.inputValues).forEach((key) => {
        if (inputKeys.has(key)) return;
        breaking.push({
          kind: "input",
          key,
          label: key,
          change: "removed",
          breaking: "实例绑定的输入已不在契约中，升级后会被清理",
        });
      });
      Object.keys(instance.slotMapping).forEach((key) => {
        if (slotKeys.has(key)) return;
        breaking.push({
          kind: "slot",
          key,
          label: key,
          change: "removed",
          breaking: "实例映射的插槽已不在契约中，升级后会被清理",
        });
      });
    }

    interactions.forEach((interaction) => {
      breaking.push(...collectInteractionBreaking(interaction, instance.componentId, template));
    });

    // 同一失效配置可能被多条联动引用，按类型与 key 去重
    const seen = new Set<string>();
    const breakingItems = breaking.filter((item) => {
      const key = `${item.kind}:${item.key}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    candidates.push({
      componentId: instance.componentId,
      template,
      fromVersion: instance.version,
      toVersion: template.version,
      diff: { added: diff.added, breaking: breakingItems },
      nextInputValues: Object.fromEntries(
        Object.entries(instance.inputValues).filter(([key]) => inputKeys.has(key)),
      ),
      nextSlotMapping: Object.fromEntries(
        Object.entries(instance.slotMapping).filter(([key]) => slotKeys.has(key)),
      ),
    });
  });

  return candidates;
}

/** 升级后写回实例：同步版本号并清理失效的输入与插槽映射 */
export function buildUpgradePatches(candidates: UpgradeCandidate[]) {
  return candidates.map((candidate) => ({
    componentId: candidate.componentId,
    props: {
      templateVersion: candidate.toVersion,
      inputValues: candidate.nextInputValues,
      slotMapping: candidate.nextSlotMapping,
    },
  }));
}

export function describeDiffItem(item: ContractDiffItem) {
  return `${kindLabel(item.kind)}「${item.label || item.key}」`;
}
