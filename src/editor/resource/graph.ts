import type { CardTemplate } from "../card-template/types";
import type { DataSource, DataSourceRelation } from "../data-source/types";
import type { PageInteraction } from "../interaction/types";
import { ItemType } from "../item-type";
import type { Component } from "../stores/components";

export type PageGraphNodeKind = "card" | "source" | "variable";

export interface PageGraphNode {
  id: string;
  kind: PageGraphNodeKind;
  label: string;
  sublabel?: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export type PageGraphEdgeKind = "interaction" | "slot" | "relation";

export interface PageGraphEdge {
  id: string;
  from: string;
  to: string;
  kind: PageGraphEdgeKind;
  label: string;
  enabled: boolean;
}

export interface PageGraph {
  nodes: PageGraphNode[];
  edges: PageGraphEdge[];
  width: number;
  height: number;
}

const COLUMN_X: Record<PageGraphNodeKind, number> = {
  card: 24,
  source: 312,
  variable: 612,
};

const COLUMN_WIDTH: Record<PageGraphNodeKind, number> = {
  card: 240,
  source: 240,
  variable: 132,
};

const NODE_HEIGHT = 38;
const NODE_GAP = 14;
const TOP = 24;
const GRAPH_WIDTH = 768;

interface InstanceRef {
  componentId: number;
  scopeId: string;
  templateId: string;
  slotMapping: Record<string, string>;
}

function collectInstances(components: Component[]) {
  const instances: InstanceRef[] = [];

  const walk = (nodes: Component[]) => {
    nodes.forEach((node) => {
      if (node.name === ItemType.CardInstance && node.props?.scopeId) {
        instances.push({
          componentId: node.id,
          scopeId: String(node.props.scopeId),
          templateId: String(node.props.templateId ?? ""),
          slotMapping: (node.props.slotMapping ?? {}) as Record<string, string>,
        });
      }
      if (node.children?.length) walk(node.children);
    });
  };

  walk(components);
  return instances;
}

function actionLabel(action: PageInteraction["actions"][number]) {
  if (action.type === "set-input") return `写入输入 ${action.key || "?"}`;
  if (action.type === "invoke") return `调用方法 ${action.method || "?"}`;
  return `写入变量 ${action.name || "?"}`;
}

/**
 * 构建页面连线图：卡片插槽、数据源关联与卡片联动统一成只读拓扑
 */
export function buildPageGraph(input: {
  components: Component[];
  sources: DataSource[];
  relations: DataSourceRelation[];
  interactions: PageInteraction[];
  templates: CardTemplate[];
}): PageGraph {
  const { components, sources, relations, interactions, templates } = input;
  const instances = collectInstances(components);

  const cardNodes: PageGraphNode[] = instances.map((instance) => {
    const template = templates.find((item) => item.id === instance.templateId);

    return {
      id: `card:${instance.scopeId}`,
      kind: "card",
      label: template?.name ?? "未知模板",
      sublabel: instance.scopeId,
      x: COLUMN_X.card,
      y: 0,
      width: COLUMN_WIDTH.card,
      height: NODE_HEIGHT,
    };
  });

  const sourceNodes: PageGraphNode[] = sources.map((source) => ({
    id: `source:${source.id}`,
    kind: "source",
    label: source.title,
    sublabel: source.name,
    x: COLUMN_X.source,
    y: 0,
    width: COLUMN_WIDTH.source,
    height: NODE_HEIGHT,
  }));

  const variableNames = new Set<string>();
  interactions.forEach((interaction) => {
    interaction.actions.forEach((action) => {
      if (action.type === "set-variable" && action.name) variableNames.add(action.name);
    });
  });

  const variableNodes: PageGraphNode[] = [...variableNames].map((name) => ({
    id: `variable:${name}`,
    kind: "variable",
    label: name,
    x: COLUMN_X.variable,
    y: 0,
    width: COLUMN_WIDTH.variable,
    height: NODE_HEIGHT,
  }));

  const nodes = [...cardNodes, ...sourceNodes, ...variableNodes];
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));

  // 同列节点依次纵向排列
  const columnCount: Record<PageGraphNodeKind, number> = { card: 0, source: 0, variable: 0 };
  nodes.forEach((node) => {
    node.y = TOP + columnCount[node.kind] * (NODE_HEIGHT + NODE_GAP);
    columnCount[node.kind] += 1;
  });

  const edges: PageGraphEdge[] = [];

  instances.forEach((instance) => {
    Object.entries(instance.slotMapping).forEach(([key, sourceId]) => {
      const to = `source:${sourceId}`;
      if (!nodeMap.has(to)) return;

      edges.push({
        id: `slot:${instance.scopeId}:${key}`,
        from: `card:${instance.scopeId}`,
        to,
        kind: "slot",
        label: key,
        enabled: true,
      });
    });
  });

  relations.forEach((relation) => {
    const from = `source:${relation.sourceId}`;
    const to = `source:${relation.targetId}`;
    if (!nodeMap.has(from) || !nodeMap.has(to)) return;

    edges.push({
      id: `relation:${relation.id}`,
      from,
      to,
      kind: "relation",
      label: `${relation.sourceField} → ${relation.targetField}`,
      enabled: relation.enabled,
    });
  });

  interactions.forEach((interaction) => {
    const from = `card:${interaction.trigger.scopeId}`;
    if (!nodeMap.has(from)) return;

    interaction.actions.forEach((action, index) => {
      const to =
        action.type === "set-variable" ? `variable:${action.name}` : `card:${action.targetScopeId}`;
      if (!nodeMap.has(to)) return;

      edges.push({
        id: `interaction:${interaction.id}:${index}`,
        from,
        to,
        kind: "interaction",
        label: `${interaction.trigger.event || "事件"} → ${actionLabel(action)}`,
        enabled: interaction.enabled,
      });
    });
  });

  const rowCount = Math.max(columnCount.card, columnCount.source, columnCount.variable);
  const height = Math.max(TOP + rowCount * (NODE_HEIGHT + NODE_GAP) + 16, 200);

  return { nodes, edges, width: GRAPH_WIDTH, height };
}
