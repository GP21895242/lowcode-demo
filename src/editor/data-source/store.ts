import { create } from "zustand";
import { createSamplePageData } from "./schema";
import type { DataSource, DataSourceRelation } from "./types";

interface State {
  sources: DataSource[];
  relations: DataSourceRelation[];
}

interface Action {
  setSources: (sources: DataSource[]) => void;
  addSource: (source: DataSource) => void;
  updateSource: (id: string, patch: Partial<DataSource>) => void;
  deleteSource: (id: string) => void;
  setRelations: (relations: DataSourceRelation[]) => void;
  addRelation: (relation: DataSourceRelation) => void;
  updateRelation: (id: string, patch: Partial<DataSourceRelation>) => void;
  deleteRelation: (id: string) => void;
}

const sample = createSamplePageData();

export const useDataSourceStore = create<State & Action>()((set) => ({
  sources: sample.sources,
  relations: sample.relations,

  setSources: (sources) => set({ sources }),
  addSource: (source) => set((state) => ({ sources: [...state.sources, source] })),
  updateSource: (id, patch) =>
    set((state) => ({
      sources: state.sources.map((source) => (source.id === id ? { ...source, ...patch } : source)),
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
