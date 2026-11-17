import { useSuggestionStore as useContextSuggestionStore } from "../page-store/contexts";
import { bindDesignStoreHook } from "../page-store/legacy";

/**
 * 优化建议 store（旧入口）：仅设计态使用
 */
export const useSuggestionStore = bindDesignStoreHook(
  useContextSuggestionStore,
  (stores) => stores.suggestions,
);
