import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { createSamplePageData } from "../data-source/schema";
import type { DataSource, DataSourceRelation } from "../data-source/types";
import type { PageInteraction } from "../interaction/types";
import type { PageSearchConfig } from "../search/types";
import type { Component } from "./components";
import { normalizeVariable, type Variable, type VariableInput } from "./variable";

const PAGES_STORAGE_KEY = "lowcode-pages";

export const PAGE_SCHEMA_VERSION = 2;

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
      ? structuredClone(legacyComponents)
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
 */
function migratePage(page: PageRecord): PageRecord {
  return {
    ...page,
    schemaVersion: PAGE_SCHEMA_VERSION,
    components: Array.isArray(page.components) ? page.components : [],
    variables: normalizeVariables(page.variables),
    sources: Array.isArray(page.sources) ? page.sources : [],
    relations: Array.isArray(page.relations) ? page.relations : [],
    interactions: Array.isArray(page.interactions) ? page.interactions : [],
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
