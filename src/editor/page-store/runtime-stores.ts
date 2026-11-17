import { createDataSourceLoader } from "../data-source/runtime";
import { createCardRegistry } from "./stores/cards";
import { createContentStore } from "./stores/content";
import { createDataSourcesStore } from "./stores/data-sources";
import { createInteractionStore } from "./stores/interactions";
import { createPageDataStore } from "./stores/page-data";
import { createRefRegistry } from "./stores/refs";
import { createPageSearchStore } from "./stores/search";
import { createVariablesStore } from "./stores/variables";
import type { PageStores, PageViewMode } from "./types";

/**
 * 创建页面运行时 store 集合：编辑与预览都会创建，
 * 数据源取数上下文直接注入内部 store，不依赖设计态
 */
export function createPageStores(mode: PageViewMode): PageStores {
  const dataSources = createDataSourcesStore();
  const variables = createVariablesStore();
  const pageData = createPageDataStore();

  const sourceLoader = createDataSourceLoader({
    getSource: (sourceId) =>
      dataSources.getState().sources.find((source) => source.id === sourceId),
    getRelations: () => dataSources.getState().relations,
    getVariables: () => pageData.getState().data,
    getMode: () => mode,
  });

  const cards = createCardRegistry();
  const search = createPageSearchStore({ pageData, variables, cards, sourceLoader });
  const content = createContentStore();
  const interactions = createInteractionStore({ pageData, cards });
  const refs = createRefRegistry();

  return {
    content,
    pageData,
    variables,
    dataSources,
    sourceLoader,
    search,
    interactions,
    refs,
    cards,
  };
}
