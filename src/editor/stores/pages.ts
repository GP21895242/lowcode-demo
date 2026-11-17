import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { createSamplePageData } from "../data-source/schema";
import type { DataSource, DataSourceRelation } from "../data-source/types";
import type { PageInteraction } from "../interaction/types";
import type { PageSearchConfig } from "../search/types";
import type { Component } from "./components";
import { normalizeVariable, type Variable, type VariableInput } from "./variable";

const PAGES_STORAGE_KEY = "lowcode-pages";

export const PAGE_SCHEMA_VERSION = 4;

export interface PageDesign {
  schemaVersion: typeof PAGE_SCHEMA_VERSION;
  components: Component[];
  variables: Variable[];
  sources: DataSource[];
  relations: DataSourceRelation[];
  interactions?: PageInteraction[];
  search?: PageSearchConfig;
  dismissedSuggestions?: string[];
}

export interface PageRecord extends PageDesign {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

interface State {
  pages: PageRecord[];
}

interface Action {
  createPage: (name: string) => PageRecord;
  savePage: (id: string, design: PageDesign) => void;
  deletePage: (id: string) => void;
}

function createRootComponents(): Component[] {
  return [
    {
      id: 1,
      name: "Page",
      props: {},
      desc: "页面",
    },
  ];
}

function readLegacyState<T>(key: string): T | undefined {
  const value = localStorage.getItem(key);
  if (!value) return undefined;

  try {
    return (JSON.parse(value) as { state?: T }).state;
  } catch {
    return undefined;
  }
}

function normalizeVariables(variables: unknown): Variable[] {
  if (!Array.isArray(variables)) return [];
  return (variables as VariableInput[]).map(normalizeVariable);
}

/**
 * v2 → v3：卡片实例标识由 scopeId 更名为 instanceId，兼容旧节点数据
 */
function migrateComponentInstances(components: Component[]): Component[] {
  return components.map((component) => {
    const props = component.props ?? {};
    let nextProps = props;

    if ("scopeId" in props) {
      const rest = { ...props };
      const legacy = rest.scopeId;
      delete rest.scopeId;
      rest.instanceId = rest.instanceId ?? legacy;
      nextProps = rest;
    }

    return {
      ...component,
      props: nextProps,
      children: Array.isArray(component.children)
        ? migrateComponentInstances(component.children)
        : component.children,
    };
  });
}

/**
 * v3 → v4：收集卡片实例旧字符串标识（instanceId）到页面组件 id 的映射
 */
function collectInstanceComponentIds(components: Component[]): Map<string, number> {
  const mapping = new Map<string, number>();

  const walk = (nodes: Component[]) => {
    nodes.forEach((component) => {
      const props = (component.props ?? {}) as Record<string, any>;
      if (typeof props.instanceId === "string" && props.instanceId) {
        mapping.set(props.instanceId, component.id);
      }
      if (component.children?.length) walk(component.children);
    });
  };

  walk(components);
  return mapping;
}

/**
 * v3 → v4：删除组件 props 上的 instanceId，实例标识统一使用 Component.id
 */
function stripComponentInstanceIds(components: Component[]): Component[] {
  return components.map((component) => {
    const props = { ...((component.props ?? {}) as Record<string, any>) };
    delete props.instanceId;

    return {
      ...component,
      props,
      children: Array.isArray(component.children)
        ? stripComponentInstanceIds(component.children)
        : component.children,
    };
  });
}

function migrateInteractionAction(
  action: PageInteraction["actions"][number],
  instanceComponentIds: Map<string, number>,
): PageInteraction["actions"][number] | undefined {
  if (action.type === "set-variable") return action;

  const next = { ...action } as Record<string, any>;
  const componentId =
    typeof next.targetComponentId === "number"
      ? next.targetComponentId
      : instanceComponentIds.get(next.targetInstanceId ?? next.targetScopeId);

  delete next.targetScopeId;
  delete next.targetInstanceId;

  if (componentId === undefined) return undefined;

  next.targetComponentId = componentId;
  return next as PageInteraction["actions"][number];
}

function migrateInteraction(
  interaction: PageInteraction,
  instanceComponentIds: Map<string, number>,
): PageInteraction | undefined {
  const trigger = { ...interaction.trigger } as Record<string, any>;
  const componentId =
    typeof trigger.componentId === "number"
      ? trigger.componentId
      : instanceComponentIds.get(trigger.instanceId ?? trigger.scopeId);

  delete trigger.scopeId;
  delete trigger.instanceId;

  if (componentId === undefined) return undefined;

  trigger.componentId = componentId;

  return {
    ...interaction,
    trigger: trigger as PageInteraction["trigger"],
    actions: interaction.actions
      .map((action) => migrateInteractionAction(action, instanceComponentIds))
      .filter((action): action is PageInteraction["actions"][number] => Boolean(action)),
  };
}

function migrateSearchTarget(
  target: PageSearchConfig["targets"][number],
  instanceComponentIds: Map<string, number>,
): PageSearchConfig["targets"][number] | undefined {
  if (target.kind !== "card") return target;

  const next = { ...target } as Record<string, any>;
  const componentId =
    typeof next.componentId === "number"
      ? next.componentId
      : instanceComponentIds.get(next.instanceId ?? next.scopeId);

  delete next.scopeId;
  delete next.instanceId;

  if (componentId === undefined) return undefined;

  next.componentId = componentId;
  return next as PageSearchConfig["targets"][number];
}

function migrateSearch(
  search: PageSearchConfig | undefined,
  instanceComponentIds: Map<string, number>,
): PageSearchConfig | undefined {
  if (!search || !Array.isArray(search.targets)) return search;

  const targets = search.targets
    .map((target) => migrateSearchTarget(target, instanceComponentIds))
    .filter((target): target is PageSearchConfig["targets"][number] => Boolean(target));

  return { ...search, targets };
}

function createInitialPage(): PageRecord {
  const now = new Date().toISOString();
  const sample = createSamplePageData();
  const legacyComponents = readLegacyState<{ components?: Component[] }>("components")?.components;
  const legacyVariables = readLegacyState<{ variables?: VariableInput[] }>("variables")?.variables;
  const legacyDataSources = readLegacyState<{
    sources?: DataSource[];
    relations?: DataSourceRelation[];
  }>("data-sources");

  return {
    id: "page_home",
    name: "首页",
    schemaVersion: PAGE_SCHEMA_VERSION,
    createdAt: now,
    updatedAt: now,
    components: Array.isArray(legacyComponents)
      ? stripComponentInstanceIds(migrateComponentInstances(structuredClone(legacyComponents)))
      : createRootComponents(),
    variables: normalizeVariables(legacyVariables),
    sources: Array.isArray(legacyDataSources?.sources)
      ? structuredClone(legacyDataSources.sources)
      : sample.sources,
    relations: Array.isArray(legacyDataSources?.relations)
      ? structuredClone(legacyDataSources.relations)
      : sample.relations,
    interactions: [],
    dismissedSuggestions: [],
  };
}

/**
 * v1 → v2：旧变量补 type / scope，页面补 interactions / dismissedSuggestions
 * v2 → v3：卡片实例标识 scopeId 更名为 instanceId
 * v3 → v4：删除 props.instanceId，实例标识统一使用 Component.id
 */
function migratePage(page: PageRecord): PageRecord {
  const normalizedComponents = Array.isArray(page.components)
    ? migrateComponentInstances(page.components)
    : [];
  const instanceComponentIds = collectInstanceComponentIds(normalizedComponents);

  return {
    ...page,
    schemaVersion: PAGE_SCHEMA_VERSION,
    components: stripComponentInstanceIds(normalizedComponents),
    variables: normalizeVariables(page.variables),
    sources: Array.isArray(page.sources) ? page.sources : [],
    relations: Array.isArray(page.relations) ? page.relations : [],
    interactions: Array.isArray(page.interactions)
      ? page.interactions
          .map((interaction) => migrateInteraction(interaction, instanceComponentIds))
          .filter((interaction): interaction is PageInteraction => Boolean(interaction))
      : [],
    search: migrateSearch(page.search, instanceComponentIds),
    dismissedSuggestions: Array.isArray(page.dismissedSuggestions) ? page.dismissedSuggestions : [],
  };
}

function migratePages(persistedState: unknown): State {
  const state = (persistedState ?? {}) as { pages?: unknown };
  if (!Array.isArray(state.pages)) return { pages: [] };

  return { pages: (state.pages as PageRecord[]).map(migratePage) };
}

const initialPages = [createInitialPage()];

export const usePagesStore = create<State & Action>()(
  persist(
    (set, get) => ({
      pages: initialPages,
      createPage: (name) => {
        const now = new Date().toISOString();
        const page: PageRecord = {
          id: crypto.randomUUID(),
          name: name.trim(),
          schemaVersion: PAGE_SCHEMA_VERSION,
          createdAt: now,
          updatedAt: now,
          components: createRootComponents(),
          variables: [],
          sources: [],
          relations: [],
          interactions: [],
          dismissedSuggestions: [],
        };

        set({ pages: [...get().pages, page] });
        return page;
      },
      savePage: (id, design) =>
        set((state) => ({
          pages: state.pages.map((page) =>
            page.id === id
              ? {
                  ...page,
                  ...structuredClone(design),
                  updatedAt: new Date().toISOString(),
                }
              : page,
          ),
        })),
      deletePage: (id) => set((state) => ({ pages: state.pages.filter((page) => page.id !== id) })),
    }),
    {
      name: PAGES_STORAGE_KEY,
      version: PAGE_SCHEMA_VERSION,
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState, version) =>
        version >= PAGE_SCHEMA_VERSION ? (persistedState as State) : migratePages(persistedState),
    },
  ),
);

// Zustand 仅在状态变更时写入新存储键，主动保存首次迁移结果。
if (localStorage.getItem(PAGES_STORAGE_KEY) === null) {
  usePagesStore.setState({ pages: initialPages });
}
