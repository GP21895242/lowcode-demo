import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { createSamplePageData } from "../data-source/schema";
import type { DataSource, DataSourceRelation } from "../data-source/types";
import type { Component } from "./components";
import type { Variable } from "./variable";

const PAGES_STORAGE_KEY = "lowcode-pages";

export interface PageDesign {
  components: Component[];
  variables: Variable[];
  sources: DataSource[];
  relations: DataSourceRelation[];
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

function createInitialPage(): PageRecord {
  const now = new Date().toISOString();
  const sample = createSamplePageData();
  const legacyComponents = readLegacyState<{ components?: Component[] }>("components")?.components;
  const legacyVariables = readLegacyState<{ variables?: Variable[] }>("variables")?.variables;
  const legacyDataSources = readLegacyState<{
    sources?: DataSource[];
    relations?: DataSourceRelation[];
  }>("data-sources");

  return {
    id: "page_home",
    name: "首页",
    createdAt: now,
    updatedAt: now,
    components: Array.isArray(legacyComponents)
      ? structuredClone(legacyComponents)
      : createRootComponents(),
    variables: Array.isArray(legacyVariables) ? structuredClone(legacyVariables) : [],
    sources: Array.isArray(legacyDataSources?.sources)
      ? structuredClone(legacyDataSources.sources)
      : sample.sources,
    relations: Array.isArray(legacyDataSources?.relations)
      ? structuredClone(legacyDataSources.relations)
      : sample.relations,
  };
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
          createdAt: now,
          updatedAt: now,
          components: createRootComponents(),
          variables: [],
          sources: [],
          relations: [],
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
      version: 1,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

// Zustand 仅在状态变更时写入新存储键，主动保存首次迁移结果。
if (localStorage.getItem(PAGES_STORAGE_KEY) === null) {
  usePagesStore.setState({ pages: initialPages });
}
