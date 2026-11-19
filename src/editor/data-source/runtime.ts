import { createStore, type StoreApi } from "zustand/vanilla";
import { getByPath } from "@/lib/utils";
import { executeDataSource } from "./engine";
import type {
  DataSource,
  DataSourceRelation,
  DataSourceSelection,
  LoadParams,
  LoadResult,
} from "./types";

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

export interface DataSourceBindingOptions {
  mode?: DataSourceBindingMode;
  consumerId?: string;
  /** 取数上下文变量，缺省使用运行时配置的变量来源 */
  variables?: Record<string, any>;
}

interface State {
  sources: Record<string, SourceRuntime>;
}

interface Action {
  load: (
    sourceId: string,
    options?: { force?: boolean } & DataSourceBindingOptions,
  ) => Promise<void>;
  search: (
    sourceId: string,
    values: Record<string, any>,
    options?: DataSourceBindingOptions,
  ) => Promise<void>;
  clearSearch: (sourceId: string, options?: DataSourceBindingOptions) => Promise<void>;
  setFilters: (
    sourceId: string,
    filters: Record<string, any>,
    options?: DataSourceBindingOptions,
  ) => Promise<void>;
  setSort: (
    sourceId: string,
    sort?: LoadParams["sort"],
    options?: DataSourceBindingOptions,
  ) => Promise<void>;
  select: (
    sourceId: string,
    selection: DataSourceSelection | null,
    options?: DataSourceBindingOptions,
  ) => Promise<void>;
  retain: (sourceId: string, options?: DataSourceBindingOptions) => void;
  release: (sourceId: string, options?: DataSourceBindingOptions) => void;
  invalidate: (sourceId: string, options?: DataSourceBindingOptions) => void;
  resetAll: () => void;
}

export type DataSourceLoaderState = State & Action;

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
 * 解析订阅条目的 key：默认按数据源共享；isolated 模式追加消费者，
 * 保证参数与缓存互不影响。实例间隔离由各自独立的 store 保证。
 */
function resolveEntryKey(sourceId: string, options?: DataSourceBindingOptions) {
  if (options?.mode !== "isolated") return sourceId;
  return `${sourceId}#c=${options.consumerId ?? "default"}`;
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

function trimCache(cache: Map<string, CacheEntry>, refCounts: Map<string, number>) {
  if (cache.size <= CACHE_LIMIT) return;

  for (const [key, entry] of cache) {
    if (cache.size <= CACHE_LIMIT) break;
    if (!refCounts.get(entry.entryKey)) cache.delete(key);
  }
}

interface RuntimeActionDeps {
  set: StoreApi<DataSourceLoaderState>["setState"];
  get: () => DataSourceLoaderState;
  /** 当前作用域的数据源定义 */
  getSource: (sourceId: string) => DataSource | undefined;
  getRelations: () => DataSourceRelation[];
  getVariables: () => Record<string, any>;
  getMode: () => "edit" | "preview";
  resolveKey: (sourceId: string, options?: DataSourceBindingOptions) => string;
}

/**
 * 运行时的状态与缓存在每个 store 内独立持有，天然按实例隔离
 */
function createRuntimeActions(deps: RuntimeActionDeps): Action {
  const cache = new Map<string, CacheEntry>();
  const inFlight = new Map<string, Promise<LoadResult>>();
  const refCounts = new Map<string, number>();
  const controllers = new Map<string, AbortController>();

  const patchEntry = (entryKey: string, patch: Partial<SourceRuntime>) => {
    deps.set((state) => ({
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
    options?: { force?: boolean } & DataSourceBindingOptions,
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

    // 作用域内私有源优先于同名页面源，避免实例间定义串用
    const source = deps.getSource(sourceId);
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
      mode: deps.getMode(),
      signal: controller.signal,
      variables: options?.variables ?? deps.getVariables(),
    }).then((result) => {
      cache.set(key, {
        entryKey,
        rows: result.rows ?? [],
        total: result.total,
        loadedAt: Date.now(),
      });
      trimCache(cache, refCounts);
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
    load: async (sourceId, options) => {
      const entryKey = deps.resolveKey(sourceId, options);
      const entry = deps.get().sources[entryKey];
      if (!options?.force && entry?.loading) return;
      await loadWithParams(sourceId, entryKey, entry?.params ?? emptyParams(), options);
    },

    search: async (sourceId, values, options) => {
      const entryKey = deps.resolveKey(sourceId, options);
      const entry = deps.get().sources[entryKey];
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
      const entryKey = deps.resolveKey(sourceId, options);
      const entry = deps.get().sources[entryKey];
      await loadWithParams(
        sourceId,
        entryKey,
        { ...(entry?.params ?? emptyParams()), search: {}, page: undefined },
        options,
      );
    },

    setFilters: async (sourceId, filters, options) => {
      const entryKey = deps.resolveKey(sourceId, options);
      const entry = deps.get().sources[entryKey];
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
      const entryKey = deps.resolveKey(sourceId, options);
      const entry = deps.get().sources[entryKey];
      await loadWithParams(
        sourceId,
        entryKey,
        { ...(entry?.params ?? emptyParams()), sort },
        options,
      );
    },

    select: async (sourceId, selection, options) => {
      const entryKey = deps.resolveKey(sourceId, options);
      patchEntry(entryKey, { selection });

      const linked = deps
        .getRelations()
        .filter((relation) => relation.enabled && relation.sourceId === sourceId);

      for (const relation of linked) {
        const key = relation.paramKey || relation.targetField;
        const value = selection
          ? (getByPath(selection.row, relation.sourceField) ?? selection.value)
          : undefined;
        const isEmpty = value === undefined || value === null || value === "";

        // null 表示删除该过滤条件，避免把已有过滤条件整体合并回来
        await deps.get().setFilters(relation.targetId, { [key]: isEmpty ? null : value }, options);
      }
    },

    retain: (sourceId, options) => {
      const entryKey = deps.resolveKey(sourceId, options);
      refCounts.set(entryKey, (refCounts.get(entryKey) ?? 0) + 1);
    },

    release: (sourceId, options) => {
      const entryKey = deps.resolveKey(sourceId, options);
      const next = (refCounts.get(entryKey) ?? 1) - 1;
      if (next <= 0) {
        refCounts.delete(entryKey);
      } else {
        refCounts.set(entryKey, next);
      }
    },

    invalidate: (sourceId, options) => {
      const entryKey = deps.resolveKey(sourceId, options);

      for (const [key, entry] of cache) {
        if (entry.entryKey === entryKey) cache.delete(key);
      }
      controllers.get(entryKey)?.abort();
      controllers.delete(entryKey);

      if (deps.get().sources[entryKey]) {
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
      deps.set({ sources: {} });
    },
  };
}

export interface DataSourceLoaderOptions {
  /** 数据源定义来源，缺省使用本实例注册的作用域定义 */
  getSource?: (sourceId: string) => DataSource | undefined;
  /** 关系来源，缺省使用本实例注册的作用域关系 */
  getRelations?: () => DataSourceRelation[];
  /** 取数上下文变量，缺省为空对象 */
  getVariables?: () => Record<string, any>;
  /** 当前编辑模式，缺省按预览处理 */
  getMode?: () => "edit" | "preview";
}

/** 单个数据源运行时：状态、缓存与订阅都封装独立，与其他实例天然隔离 */
export interface DataSourceLoader {
  store: StoreApi<DataSourceLoaderState>;
  resolveEntryKey: (sourceId: string, options?: DataSourceBindingOptions) => string;
  /** 注册作用域私有数据源与关系，卡片实例展开模板后写入 */
  setDefinitions: (sources: DataSource[], relations?: DataSourceRelation[]) => void;
  subscribeDefinitions: (listener: () => void) => () => void;
  getDefinitionsVersion: () => number;
  /** 仅查作用域私有源，供字段元数据使用 */
  findSource: (sourceId: string) => DataSource | undefined;
  /** 更新取数变量来源，卡片实例在布局阶段注入最新数据域 */
  setVariableResolver: (resolver?: () => Record<string, any>) => void;
  /** 卸载时中止请求并清空缓存 */
  dispose: () => void;
}

export function createDataSourceLoader(options: DataSourceLoaderOptions = {}): DataSourceLoader {
  const definitions: { sources: DataSource[]; relations: DataSourceRelation[] } = {
    sources: [],
    relations: [],
  };
  const definitionListeners = new Set<() => void>();
  let definitionVersion = 0;
  let variableResolver = options.getVariables;

  const store = createStore<DataSourceLoaderState>()((set, get) => ({
    sources: {},
    ...createRuntimeActions({
      set,
      get,
      getSource:
        options.getSource ??
        ((sourceId) => definitions.sources.find((source) => source.id === sourceId)),
      getRelations: options.getRelations ?? (() => definitions.relations),
      getVariables: () => (variableResolver ? variableResolver() : {}),
      getMode: options.getMode ?? (() => "preview"),
      resolveKey: resolveEntryKey,
    }),
  }));

  return {
    store,
    resolveEntryKey,
    setDefinitions: (sources, relations = []) => {
      definitions.sources = sources;
      definitions.relations = relations;
      definitionVersion += 1;
      definitionListeners.forEach((listener) => listener());
    },
    subscribeDefinitions: (listener) => {
      definitionListeners.add(listener);
      return () => {
        definitionListeners.delete(listener);
      };
    },
    getDefinitionsVersion: () => definitionVersion,
    findSource: (sourceId) => definitions.sources.find((source) => source.id === sourceId),
    setVariableResolver: (resolver) => {
      variableResolver = resolver;
    },
    dispose: () => {
      store.getState().resetAll();
    },
  };
}
