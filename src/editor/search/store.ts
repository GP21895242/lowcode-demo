import { usePageSearchStore as useContextPageSearchStore } from "../page-store/contexts";
import { bindPageStoreHook } from "../page-store/legacy";

/**
 * 页面搜索 store（旧入口）：React 内读取 Context 实例
 */
export const usePageSearchStore = bindPageStoreHook(
  useContextPageSearchStore,
  (stores) => stores.search,
);
