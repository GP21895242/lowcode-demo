import { createEditorStore } from "./stores/editor";
import { createSuggestionStore } from "./stores/suggestions";
import type { DesignPageStores, PageStores } from "./types";

/**
 * 设计专属 store：依赖运行时 store 提供历史快照所需的页面资源
 */
export function createDesignPageStores(stores: PageStores): DesignPageStores {
  const editor = createEditorStore({
    content: stores.content,
    dataSources: stores.dataSources,
    search: stores.search,
  });
  const suggestions = createSuggestionStore();

  return { editor, suggestions };
}
