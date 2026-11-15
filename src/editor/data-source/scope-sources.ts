import type { DataSource, DataSourceRelation } from "./types";

interface ScopedSourceEntry {
  sources: DataSource[];
  relations: DataSourceRelation[];
}

/**
 * 卡片私有数据源注册表：按 card:<scopeId> 隔离，实例卸载即注销
 */
const scopedSources = new Map<string, ScopedSourceEntry>();
const listeners = new Set<() => void>();
let version = 0;

function notifyListeners() {
  version += 1;
  listeners.forEach((listener) => listener());
}

/** 订阅私有源注册变化，供字段元数据在布局注册后刷新 */
export function subscribeScopedSources(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getScopedSourcesVersion() {
  return version;
}

export function registerScopedSources(
  scope: string,
  sources: DataSource[],
  relations: DataSourceRelation[] = [],
) {
  scopedSources.set(scope, { sources, relations });
  notifyListeners();
}

export function unregisterScopedSources(scope: string) {
  if (scopedSources.delete(scope)) {
    notifyListeners();
  }
}

export function findScopedSource(scope: string | undefined, sourceId: string) {
  if (!scope) return undefined;
  return scopedSources.get(scope)?.sources.find((source) => source.id === sourceId);
}

export function getScopedRelations(scope: string) {
  return scopedSources.get(scope)?.relations ?? [];
}
