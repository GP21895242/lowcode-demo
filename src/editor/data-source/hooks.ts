import { useEffect, useMemo } from "react";
import { useDataSourceRuntimeStore } from "./runtime";
import { useDataSourceStore } from "./store";
import type { DataSourceField, DataSourceSelection, DataSourceSortOrder } from "./types";

const EMPTY_ROWS: any[] = [];
const EMPTY_FIELDS: DataSourceField[] = [];

export function useDataSource(sourceId?: string) {
  const entry = useDataSourceRuntimeStore((state) =>
    sourceId ? state.sources[sourceId] : undefined,
  );
  const load = useDataSourceRuntimeStore((state) => state.load);

  useEffect(() => {
    if (sourceId) void load(sourceId);
  }, [sourceId, load]);

  return {
    rows: entry?.rows ?? EMPTY_ROWS,
    total: entry?.total,
    loading: entry?.loading ?? false,
    status: entry?.status ?? "idle",
    error: entry?.error,
    params: entry?.params,
    selection: entry?.selection ?? null,
    reload: () => {
      if (sourceId) void load(sourceId, { force: true });
    },
    search: (values: Record<string, any>) => {
      if (sourceId) void useDataSourceRuntimeStore.getState().search(sourceId, values);
    },
    setSort: (sort?: { field: string; order: DataSourceSortOrder }) => {
      if (sourceId) void useDataSourceRuntimeStore.getState().setSort(sourceId, sort);
    },
    select: (selection: DataSourceSelection | null) => {
      if (sourceId) void useDataSourceRuntimeStore.getState().select(sourceId, selection);
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
