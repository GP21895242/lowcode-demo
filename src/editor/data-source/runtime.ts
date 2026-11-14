import { create } from "zustand";
import { getByPath } from "@/lib/utils";
import { useComponetsStore } from "@/editor/stores/components";
import { executeDataSource } from "./engine";
import { useDataSourceStore } from "./store";
import type { DataSourceSelection, LoadParams } from "./types";

export interface SourceRuntime {
  rows: any[];
  total?: number;
  loading: boolean;
  status: "idle" | "loading" | "success" | "error";
  error?: string;
  params: LoadParams;
  selection: DataSourceSelection | null;
  loadedAt?: number;
}

interface State {
  sources: Record<string, SourceRuntime>;
}

interface Action {
  load: (sourceId: string, options?: { force?: boolean }) => Promise<void>;
  search: (sourceId: string, values: Record<string, any>) => Promise<void>;
  setFilters: (sourceId: string, filters: Record<string, any>) => Promise<void>;
  setSort: (sourceId: string, sort?: LoadParams["sort"]) => Promise<void>;
  select: (sourceId: string, selection: DataSourceSelection | null) => Promise<void>;
  resetAll: () => void;
}

const controllers = new Map<string, AbortController>();

function emptyParams(): LoadParams {
  return { search: {}, filters: {} };
}

function createEntry(): SourceRuntime {
  return {
    rows: [],
    loading: false,
    status: "idle",
    params: emptyParams(),
    selection: null,
  };
}

export const useDataSourceRuntimeStore = create<State & Action>()((set, get) => {
  const patchEntry = (sourceId: string, patch: Partial<SourceRuntime>) => {
    set((state) => ({
      sources: {
        ...state.sources,
        [sourceId]: { ...createEntry(), ...state.sources[sourceId], ...patch },
      },
    }));
  };

  const loadWithParams = async (sourceId: string, params: LoadParams) => {
    const source = useDataSourceStore.getState().sources.find((item) => item.id === sourceId);
    if (!source) {
      patchEntry(sourceId, { loading: false, status: "error", error: "数据源不存在" });
      return;
    }

    controllers.get(sourceId)?.abort();
    const controller = new AbortController();
    controllers.set(sourceId, controller);

    patchEntry(sourceId, { loading: true, status: "loading", error: undefined, params });

    try {
      const result = await executeDataSource(source, params, {
        mode: useComponetsStore.getState().mode,
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      patchEntry(sourceId, {
        rows: result.rows ?? [],
        total: result.total,
        loading: false,
        status: "success",
        loadedAt: Date.now(),
      });
    } catch (error: any) {
      if (controller.signal.aborted || error?.name === "AbortError") return;
      patchEntry(sourceId, {
        loading: false,
        status: "error",
        error: error?.message ?? "数据源加载失败",
      });
    } finally {
      if (controllers.get(sourceId) === controller) {
        controllers.delete(sourceId);
      }
    }
  };

  return {
    sources: {},

    load: async (sourceId, options) => {
      const entry = get().sources[sourceId];
      if (!options?.force && (entry?.loading || entry?.status === "success")) return;
      await loadWithParams(sourceId, entry?.params ?? emptyParams());
    },

    search: async (sourceId, values) => {
      const entry = get().sources[sourceId];
      await loadWithParams(sourceId, {
        ...(entry?.params ?? emptyParams()),
        search: values,
        page: undefined,
      });
    },

    setFilters: async (sourceId, filters) => {
      const entry = get().sources[sourceId];
      await loadWithParams(sourceId, {
        ...(entry?.params ?? emptyParams()),
        filters,
        page: undefined,
      });
    },

    setSort: async (sourceId, sort) => {
      const entry = get().sources[sourceId];
      await loadWithParams(sourceId, {
        ...(entry?.params ?? emptyParams()),
        sort,
      });
    },

    select: async (sourceId, selection) => {
      patchEntry(sourceId, { selection });

      const { relations, sources } = useDataSourceStore.getState();
      const linked = relations.filter(
        (relation) => relation.enabled && relation.sourceId === sourceId,
      );

      for (const relation of linked) {
        if (!sources.some((source) => source.id === relation.targetId)) continue;

        const targetEntry = get().sources[relation.targetId];
        const filters = { ...(targetEntry?.params.filters ?? {}) };
        const key = relation.paramKey || relation.targetField;
        const value = selection
          ? (getByPath(selection.row, relation.sourceField) ?? selection.value)
          : undefined;

        if (value === undefined || value === null || value === "") {
          delete filters[key];
        } else {
          filters[key] = value;
        }

        await get().setFilters(relation.targetId, filters);
      }
    },

    resetAll: () => {
      controllers.forEach((controller) => controller.abort());
      controllers.clear();
      set({ sources: {} });
    },
  };
});
