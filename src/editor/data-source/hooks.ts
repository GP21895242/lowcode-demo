import { useEffect, useMemo, useSyncExternalStore } from "react";
import { useStore } from "zustand";

import { useCardScope } from "../card-template/scope-context";
import { useDataSourcesStore, usePageStores } from "../page-store/contexts";
import type { DataSourceBindingOptions, DataSourceLoader } from "./runtime";
import type { DataSourceField, DataSourceSelection, DataSourceSortOrder } from "./types";

const EMPTY_ROWS: any[] = [];
const EMPTY_FIELDS: DataSourceField[] = [];

interface ResolvedSource {
  sourceId: string;
  variables?: () => Record<string, any>;
  /** 该数据源归属的加载器：卡片私有源用实例 store，页面源用页面加载器 */
  runtime: DataSourceLoader;
}

/**
 * 解析数据源：卡片内部优先按卡片作用域解析插槽与私有源，页面组件直接用页面加载器
 */
function useResolvedSource(sourceId?: string): ResolvedSource | undefined {
  const pageRuntime = usePageStores().sourceLoader;
  const cardScope = useCardScope();

  return useMemo(() => {
    if (!sourceId) return undefined;
    if (!cardScope) return { sourceId, variables: undefined, runtime: pageRuntime };

    const resolved = cardScope.resolveSource(sourceId);
    return {
      sourceId: resolved.sourceId,
      variables: resolved.getVariables,
      runtime: resolved.runtime,
    };
  }, [sourceId, cardScope, pageRuntime]);
}

export function useDataSource(sourceId?: string, options?: DataSourceBindingOptions) {
  const pageRuntime = usePageStores().sourceLoader;
  const resolved = useResolvedSource(sourceId);
  const targetSourceId = resolved?.sourceId;
  const runtime = resolved?.runtime ?? pageRuntime;
  const mode = options?.mode;
  const consumerId = options?.consumerId;
  const entryKey = targetSourceId
    ? runtime.resolveEntryKey(targetSourceId, { mode, consumerId })
    : undefined;

  const entry = useStore(runtime.store, (state) =>
    entryKey ? state.sources[entryKey] : undefined,
  );

  useEffect(() => {
    if (!targetSourceId) return;

    const actions = runtime.store.getState();
    const binding = { mode, consumerId, variables: resolved?.variables?.() };
    actions.retain(targetSourceId, binding);
    void actions.load(targetSourceId, binding);

    return () => {
      actions.release(targetSourceId, binding);
    };
  }, [targetSourceId, mode, consumerId, resolved, runtime]);

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
        void runtime.store.getState().load(targetSourceId, {
          force: true,
          mode,
          consumerId,
          variables: resolved?.variables?.(),
        });
      }
    },
    search: (values: Record<string, any>) => {
      if (targetSourceId) {
        void runtime.store.getState().search(targetSourceId, values, {
          mode,
          consumerId,
          variables: resolved?.variables?.(),
        });
      }
    },
    clearSearch: () => {
      if (targetSourceId) {
        void runtime.store.getState().clearSearch(targetSourceId, {
          mode,
          consumerId,
          variables: resolved?.variables?.(),
        });
      }
    },
    setSort: (sort?: { field: string; order: DataSourceSortOrder }) => {
      if (targetSourceId) {
        void runtime.store.getState().setSort(targetSourceId, sort, {
          mode,
          consumerId,
          variables: resolved?.variables?.(),
        });
      }
    },
    select: (selection: DataSourceSelection | null) => {
      if (targetSourceId) {
        void runtime.store.getState().select(targetSourceId, selection, { mode, consumerId });
      }
    },
  };
}

export function useDataSourceFields(sourceId?: string) {
  const pageRuntime = usePageStores().sourceLoader;
  const resolved = useResolvedSource(sourceId);
  const targetSourceId = resolved?.sourceId;
  const runtime = resolved?.runtime ?? pageRuntime;
  const sources = useDataSourcesStore((state) => state.sources);

  // 卡片私有源注册后就地刷新字段元数据，页面源仍由数据源 store 驱动
  useSyncExternalStore(runtime.subscribeDefinitions, runtime.getDefinitionsVersion);

  if (!targetSourceId) return EMPTY_FIELDS;

  if (runtime !== pageRuntime) {
    return runtime.findSource(targetSourceId)?.fields ?? EMPTY_FIELDS;
  }

  return sources.find((source) => source.id === targetSourceId)?.fields ?? EMPTY_FIELDS;
}
