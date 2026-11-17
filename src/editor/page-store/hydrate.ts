import { getVariablesDefaultData } from "../utils/utils";
import type { DesignPageStores, PageDesignInput, PageStores } from "./types";

/**
 * 把页面设计数据写入运行时 store，只执行一次，不产生历史记录
 */
export function hydratePageStores(stores: PageStores, design: PageDesignInput) {
  stores.variables.getState().setVariables(design.variables ?? []);
  stores.dataSources.setState({
    sources: structuredClone(design.sources ?? []),
    relations: structuredClone(design.relations ?? []),
  });
  stores.interactions.getState().setInteractions(structuredClone(design.interactions ?? []));

  if (design.components?.length) {
    stores.content.getState().restoreComponents(structuredClone(design.components));
  }

  stores.search.getState().setConfig(design.search ?? null);

  const pageData = stores.pageData.getState();
  pageData.resetData();
  pageData.mergeData(getVariablesDefaultData(stores.variables.getState().variables));
}

/**
 * 写入设计态专属数据（建议忽略记录等）
 */
export function hydrateDesignPageStores(designStores: DesignPageStores, design: PageDesignInput) {
  designStores.suggestions.getState().setDismissedIds(design.dismissedSuggestions ?? []);
}
