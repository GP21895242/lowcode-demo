import { createStore, type StoreApi } from "zustand/vanilla";

import type { DataSource, DataSourceRelation } from "../../data-source/types";

export interface DataSourcesState {
  sources: DataSource[];
  relations: DataSourceRelation[];
}

export interface DataSourcesActions {
  setSources: (sources: DataSource[]) => void;
  addSource: (source: DataSource) => void;
  updateSource: (id: string, patch: Partial<DataSource>) => void;
  deleteSource: (id: string) => void;
  setRelations: (relations: DataSourceRelation[]) => void;
  addRelation: (relation: DataSourceRelation) => void;
  updateRelation: (id: string, patch: Partial<DataSourceRelation>) => void;
  deleteRelation: (id: string) => void;
}

export type DataSourcesStore = DataSourcesState & DataSourcesActions;

/**
 * 页面数据源定义 store：保存声明与关系，取数与缓存由 sourceLoader 维护
 */
export function createDataSourcesStore(
  initial: Partial<Pick<DataSourcesState, "sources" | "relations">> = {},
): StoreApi<DataSourcesStore> {
  return createStore<DataSourcesStore>()((set) => ({
    sources: initial.sources ?? [],
    relations: initial.relations ?? [],

    setSources: (sources) => set({ sources }),
    addSource: (source) => set((state) => ({ sources: [...state.sources, source] })),
    updateSource: (id, patch) =>
      set((state) => ({
        sources: state.sources.map((source) =>
          source.id === id ? { ...source, ...patch } : source,
        ),
      })),
    deleteSource: (id) =>
      set((state) => ({
        sources: state.sources.filter((source) => source.id !== id),
        relations: state.relations.filter(
          (relation) => relation.sourceId !== id && relation.targetId !== id,
        ),
      })),

    setRelations: (relations) => set({ relations }),
    addRelation: (relation) => set((state) => ({ relations: [...state.relations, relation] })),
    updateRelation: (id, patch) =>
      set((state) => ({
        relations: state.relations.map((relation) =>
          relation.id === id ? { ...relation, ...patch } : relation,
        ),
      })),
    deleteRelation: (id) =>
      set((state) => ({ relations: state.relations.filter((relation) => relation.id !== id) })),
  }));
}
