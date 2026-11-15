import { create } from "zustand";
import { getByPath } from "@/lib/utils";
import { useComponetsStore } from "@/editor/stores/components";
import { usePageDataStore } from "@/editor/stores/page-data";
import { executeDataSource } from "./engine";
import { findScopedSource, getScopedRelations } from "./scope-sources";
import { useDataSourceStore } from "./store";
import type { DataSourceSelection, LoadParams, LoadResult } from "./types";

export interface SourceRuntime {
  rows: any[];
  total?: number;
  loading: boolean;
  status: "idle" | "loading" | "success" | "error";
  error?: string;
  params: LoadParams;
  selection: DataSourceSelection | null;
  loadedAt?: number;
  /** 最近一次请求的缓存 key，便于调试 */
  requestKey?: string;
}

/** 消费者绑定模式：shared 共享参数与缓存，isolated 独立参数与缓存 */
export type DataSourceBindingMode = "shared" | "isolated";

export interface DataSourceScopeOptions {
  /** page 或 card:<scopeId> */
  scope?: string;
  mode?: DataSourceBindingMode;
  consumerId?: string;
  /** 取数上下文变量，缺省使用页面数据 */
  variables?: Record<string, any>;
}

interface State {
  sources: Record<string, SourceRuntime>;
}

interface Action {
  load: (sourceId: string, options?: { force?: boolean } & DataSourceScopeOptions) => Promise<void>;
  search: (
    sourceId: string,
    values: Record<string, any>,
    options?: DataSourceScopeOptions,
  ) => Promise<void>;
  clearSearch: (sourceId: string, options?: DataSourceScopeOptions) => Promise<void>;
  setFilters: (
    sourceId: string,
    filters: Record<string, any>,
    options?: DataSourceScopeOptions,
  ) => Promise<void>;
  setSort: (
    sourceId: string,
    sort?: LoadParams["sort"],
    options?: DataSourceScopeOptions,
  ) => Promise<void>;
  select: (
    sourceId: string,
    selection: DataSourceSelection | null,
    options?: DataSourceScopeOptions,
  ) => Promise<void>;
  retain: (sourceId: string, options?: DataSourceScopeOptions) => void;
  release: (sourceId: string, options?: DataSourceScopeOptions) => void;
  invalidate: (sourceId: string, options?: DataSourceScopeOptions) => void;
  resetAll: () => void;
}

interface CacheEntry {
  entryKey: string;
  rows: any[];
  total?: number;
  loadedAt: number;
}

/** 缓存过期时间（毫秒） */
const STALE_TIME = 30_000;
/** 缓存条目上限，超出后按 LRU 回收无引用的条目 */
const CACHE_LIMIT = 100;

const cache = new Map<string, CacheEntry>();
const inFlight = new Map<string, Promise<LoadResult>>();
const refCounts = new Map<string, number>();
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

/**
 * 解析订阅条目的 key：页面作用域直接使用 sourceId，卡片作用域加前缀；
 * isolated 模式再追加消费者，保证参数与缓存互不影响。
 */
export function resolveEntryKey(sourceId: string, options?: DataSourceScopeOptions) {
  const scopeKey =
    !options?.scope || options.scope === "page" ? sourceId : `${options.scope}:${sourceId}`;
  if (options?.mode !== "isolated") return scopeKey;
  return `${scopeKey}#c=${options.consumerId ?? "default"}`;
}

function stableStringify(value: any): string {
  if (value === undefined) return "undefined";
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
    .join(",")}}`;
}

function toRequestKey(entryKey: string, params: LoadParams) {
  return `${entryKey}#${stableStringify(params)}`;
}

/**
 * merge 语义：undefined / null 表示显式清除该参数
 */
function mergeValues(base: Record<string, any>, next: Record<string, any>) {
  const merged = { ...base };
  Object.entries(next).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      delete merged[key];
    } else {
      merged[key] = value;
    }
  });
  return merged;
}

function trimCache() {
  if (cache.size <= CACHE_LIMIT) return;

  for (const [key, entry] of cache) {
    if (cache.size <= CACHE_LIMIT) break;
    if (!refCounts.get(entry.entryKey)) cache.delete(key);
  }
}

export const useDataSourceRuntimeStore = create<State & Action>()((set, get) => {
  const patchEntry = (entryKey: string, patch: Partial<SourceRuntime>) => {
    set((state) => ({
      sources: {
        ...state.sources,
        [entryKey]: { ...createEntry(), ...state.sources[entryKey], ...patch },
      },
    }));
  };

  const loadWithParams = async (
    sourceId: string,
    entryKey: string,
    params: LoadParams,
    options?: { force?: boolean } & DataSourceScopeOptions,
  ) => {
    const key = toRequestKey(entryKey, params);

    // 1. 未过期缓存直接命中
    const cached = cache.get(key);
    if (!options?.force && cached && Date.now() - cached.loadedAt < STALE_TIME) {
      patchEntry(entryKey, {
        rows: cached.rows,
        total: cached.total,
        loading: false,
        status: "success",
        error: undefined,
        params,
        loadedAt: cached.loadedAt,
        requestKey: key,
      });
      return;
    }

    // 2. 复用进行中的请求（single-flight）
    const running = inFlight.get(key);
    if (running) {
      patchEntry(entryKey, {
        loading: true,
        status: "loading",
        error: undefined,
        params,
        requestKey: key,
      });
      try {
        const result = await running;
        patchEntry(entryKey, {
          rows: result.rows ?? [],
          total: result.total,
          loading: false,
          status: "success",
          loadedAt: Date.now(),
        });
      } catch {
        // 发起方负责错误状态，复用方保持等待结果
      }
      return;
    }

    // 卡片私有源优先于同名页面源，避免实例间定义串用
    const source =
      findScopedSource(options?.scope, sourceId) ??
      useDataSourceStore.getState().sources.find((item) => item.id === sourceId);
    if (!source) {
      patchEntry(entryKey, { loading: false, status: "error", error: "数据源不存在" });
      return;
    }

    controllers.get(entryKey)?.abort();
    const controller = new AbortController();
    controllers.set(entryKey, controller);

    patchEntry(entryKey, {
      loading: true,
      status: "loading",
      error: undefined,
      params,
      requestKey: key,
    });

    const promise = executeDataSource(source, params, {
      mode: useComponetsStore.getState().mode,
      signal: controller.signal,
      variables: options?.variables ?? usePageDataStore.getState().data,
    }).then((result) => {
      cache.set(key, {
        entryKey,
        rows: result.rows ?? [],
        total: result.total,
        loadedAt: Date.now(),
      });
      trimCache();
      return result;
    });

    inFlight.set(key, promise);

    try {
      const result = await promise;
      if (controller.signal.aborted) return;
      patchEntry(entryKey, {
        rows: result.rows ?? [],
        total: result.total,
        loading: false,
        status: "success",
        loadedAt: Date.now(),
      });
    } catch (error: any) {
      if (controller.signal.aborted || error?.name === "AbortError") return;
      patchEntry(entryKey, {
        loading: false,
        status: "error",
        error: error?.message ?? "数据源加载失败",
      });
    } finally {
      inFlight.delete(key);
      if (controllers.get(entryKey) === controller) {
        controllers.delete(entryKey);
      }
    }
  };

  return {
    sources: {},

    load: async (sourceId, options) => {
      const entryKey = resolveEntryKey(sourceId, options);
      const entry = get().sources[entryKey];
      if (!options?.force && entry?.loading) return;
      await loadWithParams(sourceId, entryKey, entry?.params ?? emptyParams(), options);
    },

    search: async (sourceId, values, options) => {
      const entryKey = resolveEntryKey(sourceId, options);
      const entry = get().sources[entryKey];
      await loadWithParams(
        sourceId,
        entryKey,
        {
          ...(entry?.params ?? emptyParams()),
          search: mergeValues(entry?.params.search ?? {}, values),
          page: undefined,
        },
        options,
      );
    },

    clearSearch: async (sourceId, options) => {
      const entryKey = resolveEntryKey(sourceId, options);
      const entry = get().sources[entryKey];
      await loadWithParams(
        sourceId,
        entryKey,
        { ...(entry?.params ?? emptyParams()), search: {}, page: undefined },
        options,
      );
    },

    setFilters: async (sourceId, filters, options) => {
      const entryKey = resolveEntryKey(sourceId, options);
      const entry = get().sources[entryKey];
      await loadWithParams(
        sourceId,
        entryKey,
        {
          ...(entry?.params ?? emptyParams()),
          filters: mergeValues(entry?.params.filters ?? {}, filters),
          page: undefined,
        },
        options,
      );
    },

    setSort: async (sourceId, sort, options) => {
      const entryKey = resolveEntryKey(sourceId, options);
      const entry = get().sources[entryKey];
      await loadWithParams(
        sourceId,
        entryKey,
        { ...(entry?.params ?? emptyParams()), sort },
        options,
      );
    },

    select: async (sourceId, selection, options) => {
      const entryKey = resolveEntryKey(sourceId, options);
      patchEntry(entryKey, { selection });

      // 卡片作用域只应用卡片内部关系，页面作用域只应用页面关系
      const relationList =
        options?.scope && options.scope !== "page"
          ? getScopedRelations(options.scope)
          : useDataSourceStore.getState().relations;
      const linked = relationList.filter(
        (relation) => relation.enabled && relation.sourceId === sourceId,
      );

      for (const relation of linked) {
        const targetEntry = get().sources[resolveEntryKey(relation.targetId, options)];
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

        await get().setFilters(relation.targetId, filters, options);
      }
    },

    retain: (sourceId, options) => {
      const entryKey = resolveEntryKey(sourceId, options);
      refCounts.set(entryKey, (refCounts.get(entryKey) ?? 0) + 1);
    },

    release: (sourceId, options) => {
      const entryKey = resolveEntryKey(sourceId, options);
      const next = (refCounts.get(entryKey) ?? 1) - 1;
      if (next <= 0) {
        refCounts.delete(entryKey);
      } else {
        refCounts.set(entryKey, next);
      }
    },

    invalidate: (sourceId, options) => {
      const entryKey = resolveEntryKey(sourceId, options);

      for (const [key, entry] of cache) {
        if (entry.entryKey === entryKey) cache.delete(key);
      }
      controllers.get(entryKey)?.abort();
      controllers.delete(entryKey);

      if (get().sources[entryKey]) {
        patchEntry(entryKey, {
          rows: [],
          total: undefined,
          loading: false,
          status: "idle",
          error: undefined,
          loadedAt: undefined,
        });
      }
    },

    resetAll: () => {
      controllers.forEach((controller) => controller.abort());
      controllers.clear();
      cache.clear();
      inFlight.clear();
      refCounts.clear();
      set({ sources: {} });
    },
  };
});
