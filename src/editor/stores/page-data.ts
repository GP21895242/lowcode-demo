import { usePageDataStore as useContextPageDataStore } from "../page-store/contexts";
import { bindPageStoreHook } from "../page-store/legacy";

/**
 * 页面数据 store（旧入口）：React 内读取 Context 实例，
 * 非 React 入口读取当前活动页面实例
 */
export const usePageDataStore = bindPageStoreHook(
  useContextPageDataStore,
  (stores) => stores.pageData,
);
