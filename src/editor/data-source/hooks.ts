import { useEffect, useMemo } from "react";
import { resolveEntryKey, useDataSourceRuntimeStore, type DataSourceScopeOptions } from "./runtime";
import { useDataSourceStore } from "./store";
import type { DataSourceField, DataSourceSelection, DataSourceSortOrder } from "./types";

const EMPTY_ROWS: any[] = [];
const EMPTY_FIELDS: DataSourceField[] = [];

export function useDataSource(sourceId?: string, options?: DataSourceScopeOptions) {
  const scope = options?.scope;
  const mode = options?.mode;
  const consumerId = options?.consumerId;
  const entryKey = sourceId ? resolveEntryKey(sourceId, { scope, mode, consumerId }) : undefined;

  const entry = useDataSourceRuntimeStore((state) =>
    entryKey ? state.sources[entryKey] : undefined,
  );
  const load = useDataSourceRuntimeStore((state) => state.load);

  useEffect(() => {
    if (!sourceId) return;

    const runtime = useDataSourceRuntimeStore.getState();
    const binding = { scope, mode, consumerId };
    runtime.retain(sourceId, binding);
    void runtime.load(sourceId, binding);

    return () => {
      runtime.release(sourceId, binding);
    };
  }, [sourceId, scope, mode, consumerId]);

  return {
    rows: entry?.rows ?? EMPTY_ROWS,
    total: entry?.total,
    loading: entry?.loading ?? false,
    status: entry?.status ?? "idle",
    error: entry?.error,
    params: entry?.params,
    selection: entry?.selection ?? null,
    reload: () => {
      if (sourceId) void load(sourceId, { force: true, scope, mode, consumerId });
    },
    search: (values: Record<string, any>) => {
      if (sourceId) {
        void useDataSourceRuntimeStore
          .getState()
          .search(sourceId, values, { scope, mode, consumerId });
      }
    },
    clearSearch: () => {
      if (sourceId) {
        void useDataSourceRuntimeStore
          .getState()
          .clearSearch(sourceId, { scope, mode, consumerId });
      }
    },
    setSort: (sort?: { field: string; order: DataSourceSortOrder }) => {
      if (sourceId) {
        void useDataSourceRuntimeStore
          .getState()
          .setSort(sourceId, sort, { scope, mode, consumerId });
      }
    },
    select: (selection: DataSourceSelection | null) => {
      if (sourceId) {
        void useDataSourceRuntimeStore.getState().select(sourceId, selection);
      }
    },
  };
}

export function useDataSourceFields(sourceId?: string) {
  const sources = useDataSourceStore((state) => state.sources);
  return useMemo(
    () =>
      sourceId
        ? (sources.find((source) => source.id === sourceId)?.fields ?? EMPTY_FIELDS)
        : EMPTY_FIELDS,
    [sourceId, sources],
  );
}
