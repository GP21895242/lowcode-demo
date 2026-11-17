import { getActiveDesignStores, getActivePageStores } from "../page-store/active";
import type { DesignPageStores, PageStores } from "../page-store/types";
import { PAGE_SCHEMA_VERSION, usePagesStore } from "../stores/pages";

export interface PageSaveContext {
  page: PageStores;
  design: DesignPageStores;
}

/**
 * 把当前设计器中的状态写回页面记录
 * 从页面进入卡片模板设计前也会复用，避免未保存的页面改动丢失
 */
export function saveCurrentPageDesign(
  pageId: string,
  context: PageSaveContext = {
    page: getActivePageStores(),
    design: getActiveDesignStores(),
  },
) {
  const currentPage = usePagesStore.getState().pages.find((item) => item.id === pageId);
  const { page, design } = context;
  const { sources, relations } = page.dataSources.getState();

  usePagesStore.getState().savePage(pageId, {
    schemaVersion: PAGE_SCHEMA_VERSION,
    components: page.content.getState().components,
    variables: page.variables.getState().variables,
    sources,
    relations,
    interactions: page.interactions.getState().interactions,
    search: page.search.getState().config ?? currentPage?.search,
    dismissedSuggestions: design.suggestions.getState().dismissedIds,
  });
}
