import { useEffect, useMemo } from "react";
import { useStore } from "zustand";

import { useCardScope } from "../card-template/scope-context";
import type { DataSourceLoader } from "../data-source/runtime";
import { usePageStores } from "../page-store/contexts";

const SEPARATOR = "\u0000";
const EMPTY_ROWS: any[] = [];

interface LoopSourceRef {
  /** 属性里写的原始 id，作为返回值 key */
  sourceId: string;
  resolvedId: string;
  runtime: DataSourceLoader;
  variables?: () => Record<string, any>;
}

/**
 * 循环容器的行数据：按数据源 id 批量订阅，卡片内自动解析插槽并走实例加载器。
 * 返回 Map<原始 sourceId, rows>，未加载完成时返回空数组。
 */
export function useLoopRows(sourceIds: string[]) {
  const pageRuntime = usePageStores().sourceLoader;
  const cardScope = useCardScope();

  const key = sourceIds.join(SEPARATOR);

  const refs = useMemo<LoopSourceRef[]>(() => {
    const ids = key ? key.split(SEPARATOR) : [];

    return ids.map((sourceId) => {
      if (!cardScope) {
        return { sourceId, resolvedId: sourceId, runtime: pageRuntime };
      }

      const resolved = cardScope.resolveSource(sourceId);

      return {
        sourceId,
        resolvedId: resolved.sourceId,
        runtime: resolved.runtime,
        variables: resolved.getVariables,
      };
    });
  }, [key, cardScope, pageRuntime]);

  const cardRuntime = cardScope?.runtime ?? pageRuntime;
  const pageSources = useStore(pageRuntime.store, (state) => state.sources);
  const cardSources = useStore(cardRuntime.store, (state) => state.sources);

  useEffect(() => {
    const releases: (() => void)[] = [];

    refs.forEach((ref) => {
      if (!ref.resolvedId) return;

      const actions = ref.runtime.store.getState();
      const binding = { variables: ref.variables?.() };

      actions.retain(ref.resolvedId, binding);
      void actions.load(ref.resolvedId, binding);

      releases.push(() => actions.release(ref.resolvedId, binding));
    });

    return () => releases.forEach((release) => release());
  }, [refs]);

  return useMemo(() => {
    const rows = new Map<string, any[]>();

    refs.forEach((ref) => {
      if (!ref.resolvedId) return;

      const entryKey = ref.runtime.resolveEntryKey(ref.resolvedId);
      const sources = ref.runtime === pageRuntime ? pageSources : cardSources;

      rows.set(ref.sourceId, sources[entryKey]?.rows ?? EMPTY_ROWS);
    });

    return rows;
  }, [refs, pageSources, cardSources, pageRuntime]);
}
