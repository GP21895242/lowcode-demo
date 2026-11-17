import { useDataSourceStore } from "../data-source/store";
import { useInteractionStore } from "../interaction/runtime";
import { useSuggestionStore } from "../resource/suggestion-store";
import { usePageSearchStore } from "../search/store";
import { useComponetsStore } from "../stores/components";
import { PAGE_SCHEMA_VERSION, usePagesStore } from "../stores/pages";
import { useVariablesStore } from "../stores/variable";

/**
 * 把当前设计器中的状态写回页面记录
 * 从页面进入卡片模板设计前也会复用，避免未保存的页面改动丢失
 */
export function saveCurrentPageDesign(pageId: string) {
  const currentPage = usePagesStore.getState().pages.find((item) => item.id === pageId);

  usePagesStore.getState().savePage(pageId, {
    schemaVersion: PAGE_SCHEMA_VERSION,
    components: useComponetsStore.getState().components,
    variables: useVariablesStore.getState().variables,
    sources: useDataSourceStore.getState().sources,
    relations: useDataSourceStore.getState().relations,
    interactions: useInteractionStore.getState().interactions,
    search: usePageSearchStore.getState().config ?? currentPage?.search,
    dismissedSuggestions: useSuggestionStore.getState().dismissedIds,
  });
}
