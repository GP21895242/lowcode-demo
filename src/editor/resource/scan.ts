import type { CardTemplate } from "../card-template/types";
import type { DataSource, DataSourceField } from "../data-source/types";
import { ItemType } from "../item-type";
import type { SearchControl } from "../search/types";
import type { Component } from "../stores/components";

export type MergeConflictKind = "type" | "options" | "mock-data" | "control";

export interface MergeConflict {
  key: string;
  kind: MergeConflictKind;
  options: { label: string; value: any }[];
  resolvedWith?: any;
}

export interface SuggestionCandidate {
  /** 卡片组件 id，即卡片实例的唯一标识 */
  componentId: number;
  /** 插槽 key 或输入 key */
  key: string;
  /** 当前引用的页面数据源 */
  sourceId?: string;
  label: string;
  /** 搜索项建议使用 */
  control?: SearchControl;
  options?: { label: string; value: any }[];
}

export interface MergeSuggestion {
  id: string;
  kind: "source" | "search-field";
  confidence: "high" | "medium" | "low";
  reasons: string[];
  candidates: SuggestionCandidate[];
  conflicts: MergeConflict[];
  /** 数据源合并的候选源 id，首个默认为目标源 */
  sourceIds?: string[];
}

interface CardInstanceRef {
  componentId: number;
  templateId: string;
  slotMapping: Record<string, string>;
}

function hash(input: string) {
  let value = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    value ^= input.charCodeAt(index);
    value = Math.imul(value, 16777619);
  }
  return (value >>> 0).toString(16);
}

/** 模板占位统一替换为空占位，避免参数值影响指纹 */
function normalizeUrl(url: string) {
  return url.replace(/\{[^{}]*\}/g, "{}").trim();
}

/**
 * 数据源指纹：仅由请求签名决定，字段不参与，字段差异由冲突决策处理
 */
export function fingerprintSource(source: DataSource) {
  const request = source.request;
  return hash(
    [
      request?.method ?? "GET",
      normalizeUrl(request?.url ?? ""),
      Object.keys(request?.params ?? {})
        .sort()
        .join(","),
      Object.keys(request?.headers ?? {})
        .sort()
        .join(","),
      request?.resultPath ?? "",
    ].join("|"),
  );
}

function collectInstances(components: Component[], result: CardInstanceRef[] = []) {
  components.forEach((component) => {
    if (component.name === ItemType.CardInstance) {
      result.push({
        componentId: component.id,
        templateId: String(component.props?.templateId ?? ""),
        slotMapping: (component.props.slotMapping ?? {}) as Record<string, string>,
      });
    }
    if (component.children?.length) collectInstances(component.children, result);
  });
  return result;
}

function detectFieldConflicts(sources: DataSource[]): MergeConflict[] {
  const conflicts: MergeConflict[] = [];
  const fieldMap = new Map<string, DataSourceField[]>();

  sources.forEach((source) => {
    source.fields.forEach((field) => {
      const list = fieldMap.get(field.dataKey) ?? [];
      list.push(field);
      fieldMap.set(field.dataKey, list);
    });
  });

  fieldMap.forEach((fields, dataKey) => {
    if (fields.length < 2) return;

    const types = [...new Set(fields.map((field) => field.type))];
    if (types.length > 1) {
      conflicts.push({
        key: `type:${dataKey}`,
        kind: "type",
        options: types.map((type) => ({ label: type, value: type })),
      });
    }

    const optionSets = [...new Set(fields.map((field) => JSON.stringify(field.options ?? [])))];
    if (optionSets.length > 1) {
      conflicts.push({
        key: `options:${dataKey}`,
        kind: "options",
        options: sources.map((source) => ({ label: source.title, value: source.id })),
      });
    }
  });

  const mockSets = [...new Set(sources.map((source) => JSON.stringify(source.mock.data)))];
  if (mockSets.length > 1) {
    conflicts.push({
      key: "mock",
      kind: "mock-data",
      options: sources.map((source) => ({ label: source.title, value: source.id })),
    });
  }

  return conflicts;
}

function detectSearchControlConflict(candidates: SuggestionCandidate[]): MergeConflict[] {
  const controls = [...new Set(candidates.map((candidate) => candidate.control ?? "input"))];
  if (controls.length < 2) return [];

  return [
    {
      key: "control",
      kind: "control",
      options: controls.map((control) => ({ label: control, value: control })),
    },
  ];
}

function toSearchControl(control?: string, type?: string): SearchControl {
  if (control === "select" || control === "date" || control === "dateRange") return control;
  if (control === "numberRange") return "numberRange";
  if (control === "input") return "input";
  return type === "select" ? "select" : "input";
}

/**
 * 派生合并建议：纯函数，无写入副作用；仅建议，不自动合并
 */
export function scanMerges(input: {
  components: Component[];
  sources: DataSource[];
  templates: CardTemplate[];
}): MergeSuggestion[] {
  const { components, sources, templates } = input;
  const sourceMap = new Map(sources.map((source) => [source.id, source]));
  const instances = collectInstances(components);
  const suggestions: MergeSuggestion[] = [];

  // 数据源合并候选：只统计显式声明 shareable 的插槽
  const groups = new Map<string, { refs: SuggestionCandidate[]; sourceIds: Set<string> }>();

  instances.forEach((instance) => {
    const template = templates.find((item) => item.id === instance.templateId);
    (template?.contract.slots ?? []).forEach((slot) => {
      if (!slot.shareable) return;

      const sourceId = instance.slotMapping[slot.key];
      const source = sourceId ? sourceMap.get(sourceId) : undefined;
      if (!sourceId || !source) return;

      const fingerprint = fingerprintSource(source);
      const group = groups.get(fingerprint) ?? { refs: [], sourceIds: new Set<string>() };
      group.refs.push({
        componentId: instance.componentId,
        key: slot.key,
        sourceId,
        label: `${template?.name ?? "卡片"} · ${slot.label}`,
      });
      group.sourceIds.add(sourceId);
      groups.set(fingerprint, group);
    });
  });

  groups.forEach((group, fingerprint) => {
    if (group.sourceIds.size < 2 || group.refs.length < 2) return;

    const groupSources = [...group.sourceIds]
      .map((id) => sourceMap.get(id))
      .filter((source): source is DataSource => !!source);
    const conflicts = detectFieldConflicts(groupSources);
    const reasons = [
      "请求签名一致（方法 / 地址 / 参数名 / 结果路径）",
      `${group.refs.length} 个卡片插槽引用了 ${groupSources.length} 个重复源`,
    ];
    if (conflicts.length) reasons.push(`存在 ${conflicts.length} 项字段差异需要确认`);

    suggestions.push({
      id: `source:${fingerprint}:${group.refs
        .map((ref) => `${ref.componentId}.${ref.key}`)
        .sort()
        .join(",")}`,
      kind: "source",
      confidence: conflicts.length ? "medium" : "high",
      reasons,
      candidates: group.refs,
      conflicts,
      sourceIds: [...group.sourceIds],
    });
  });

  // 搜索项合并候选：同一 key 的可搜索输入出现在多个实例中
  const searchGroups = new Map<string, SuggestionCandidate[]>();

  instances.forEach((instance) => {
    const template = templates.find((item) => item.id === instance.templateId);
    (template?.contract.inputs ?? []).forEach((input) => {
      if (!input.searchable) return;

      const list = searchGroups.get(input.key) ?? [];
      list.push({
        componentId: instance.componentId,
        key: input.key,
        label: `${template?.name ?? "卡片"} · ${input.label}`,
        control: toSearchControl(input.control, input.type),
        options: input.options,
      });
      searchGroups.set(input.key, list);
    });
  });

  searchGroups.forEach((candidates, key) => {
    const componentIds = [...new Set(candidates.map((candidate) => candidate.componentId))];
    if (componentIds.length < 2) return;

    const conflicts = detectSearchControlConflict(candidates);
    suggestions.push({
      id: `search:${key}:${componentIds.sort((left, right) => left - right).join(",")}`,
      kind: "search-field",
      confidence: conflicts.length ? "medium" : "high",
      reasons: [
        `${componentIds.length} 张卡片暴露了同名可搜索输入「${key}」`,
        "合并只新增页面搜索字段与卡片绑定，不改卡片内部控件",
      ],
      candidates,
      conflicts,
    });
  });

  return suggestions;
}

/** 统计页面数据源被引用的次数，用于数据源面板徽标 */
export function countSourceReferences(components: Component[]) {
  const counts: Record<string, number> = {};
  const add = (sourceId?: string) => {
    if (!sourceId) return;
    counts[sourceId] = (counts[sourceId] ?? 0) + 1;
  };

  const walk = (nodes: Component[]) => {
    nodes.forEach((node) => {
      if (node.name === ItemType.CardInstance) {
        Object.values((node.props?.slotMapping ?? {}) as Record<string, string>).forEach((value) =>
          add(String(value)),
        );
      } else if (node.props?.dataSource?.value?.sourceId) {
        add(String(node.props.dataSource.value.sourceId));
      }
      if (node.children?.length) walk(node.children);
    });
  };

  walk(components);
  return counts;
}
