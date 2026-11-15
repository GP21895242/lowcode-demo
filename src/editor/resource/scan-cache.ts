import type { CardTemplate } from "../card-template/types";
import type { DataSource } from "../data-source/types";
import type { Component } from "../stores/components";
import { scanMerges, type MergeSuggestion } from "./scan";

interface CacheEntry {
  components: Component[];
  sources: DataSource[];
  templates: CardTemplate[];
  result: MergeSuggestion[];
}

let cache: CacheEntry | null = null;

/**
 * 建议扫描缓存：三个 store 都是不可变更新，数组引用即版本号；
 * 引用未变时直接复用上一次结果，供工具栏、数据源面板与属性面板共享
 */
export function getMergeSuggestions(input: {
  components: Component[];
  sources: DataSource[];
  templates: CardTemplate[];
}): MergeSuggestion[] {
  const { components, sources, templates } = input;

  if (
    cache &&
    cache.components === components &&
    cache.sources === sources &&
    cache.templates === templates
  ) {
    return cache.result;
  }

  const result = scanMerges({ components, sources, templates });
  cache = { components, sources, templates, result };
  return result;
}
