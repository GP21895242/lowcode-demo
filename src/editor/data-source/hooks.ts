import { useEffect, useMemo, useSyncExternalStore } from "react";
import { useCardScope } from "../card-template/scope-context";
import { findScopedSource, getScopedSourcesVersion, subscribeScopedSources } from "./scope-sources";
import { resolveEntryKey, useDataSourceRuntimeStore, type DataSourceScopeOptions } from "./runtime";
import { useDataSourceStore } from "./store";
import type { DataSourceField, DataSourceSelection, DataSourceSortOrder } from "./types";

const EMPTY_ROWS: any[] = [];
const EMPTY_FIELDS: DataSourceField[] = [];

/**
 * 解析数据源：卡片内部先按作用域解析插槽与私有源，页面组件保持原行为
 */
function useResolvedSource(sourceId?: string) {
  const cardScope = useCardScope();

  return useMemo(() => {
    if (!sourceId) return undefined;
    if (!cardScope) return { sourceId, scope: undefined, variables: undefined };
    const resolved = cardScope.resolveSource(sourceId);
    return {
      sourceId: resolved.sourceId,
      scope: resolved.scope,
      variables: resolved.getVariables,
    };
  }, [sourceId, cardScope]);
}

export function useDataSource(sourceId?: string, options?: DataSourceScopeOptions) {
  const resolved = useResolvedSource(sourceId);
  const targetSourceId = resolved?.sourceId;
  const scope = options?.scope ?? resolved?.scope;
  const mode = options?.mode;
  const consumerId = options?.consumerId;
  const entryKey = targetSourceId
    ? resolveEntryKey(targetSourceId, { scope, mode, consumerId })
    : undefined;

  const entry = useDataSourceRuntimeStore((state) =>
    entryKey ? state.sources[entryKey] : undefined,
  );
  const load = useDataSourceRuntimeStore((state) => state.load);

  useEffect(() => {
    if (!targetSourceId) return;

    const runtime = useDataSourceRuntimeStore.getState();
    const binding = { scope, mode, consumerId, variables: resolved?.variables?.() };
    runtime.retain(targetSourceId, binding);
    void runtime.load(targetSourceId, binding);

    return () => {
      runtime.release(targetSourceId, binding);
    };
  }, [targetSourceId, scope, mode, consumerId, resolved]);

  return {
    rows: entry?.rows ?? EMPTY_ROWS,
    total: entry?.total,
    loading: entry?.loading ?? false,
    status: entry?.status ?? "idle",
    error: entry?.error,
    params: entry?.params,
    selection: entry?.selection ?? null,
    reload: () => {
      if (targetSourceId) {
        void load(targetSourceId, {
          force: true,
          scope,
          mode,
          consumerId,
          variables: resolved?.variables?.(),
        });
      }
    },
    search: (values: Record<string, any>) => {
      if (targetSourceId) {
        void useDataSourceRuntimeStore.getState().search(targetSourceId, values, {
          scope,
          mode,
          consumerId,
          variables: resolved?.variables?.(),
        });
      }
    },
    clearSearch: () => {
      if (targetSourceId) {
        void useDataSourceRuntimeStore.getState().clearSearch(targetSourceId, {
          scope,
          mode,
          consumerId,
          variables: resolved?.variables?.(),
        });
      }
    },
    setSort: (sort?: { field: string; order: DataSourceSortOrder }) => {
      if (targetSourceId) {
        void useDataSourceRuntimeStore.getState().setSort(targetSourceId, sort, {
          scope,
          mode,
          consumerId,
          variables: resolved?.variables?.(),
        });
      }
    },
    select: (selection: DataSourceSelection | null) => {
      if (targetSourceId) {
        void useDataSourceRuntimeStore
          .getState()
          .select(targetSourceId, selection, { scope, mode, consumerId });
      }
    },
  };
}

export function useDataSourceFields(sourceId?: string) {
  const resolved = useResolvedSource(sourceId);
  const targetSourceId = resolved?.sourceId;
  const scope = resolved?.scope;
  const sources = useDataSourceStore((state) => state.sources);
  useSyncExternalStore(subscribeScopedSources, getScopedSourcesVersion);

  if (!targetSourceId) return EMPTY_FIELDS;

  if (scope && scope !== "page") {
    return findScopedSource(scope, targetSourceId)?.fields ?? EMPTY_FIELDS;
  }

  return sources.find((source) => source.id === targetSourceId)?.fields ?? EMPTY_FIELDS;
}
