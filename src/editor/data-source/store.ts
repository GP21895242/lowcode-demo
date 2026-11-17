import { useDataSourcesStore as useContextDataSourcesStore } from "../page-store/contexts";
import { bindPageStoreHook } from "../page-store/legacy";

/**
 * 页面数据源定义 store（旧入口）：React 内读取 Context 实例
 */
export const useDataSourceStore = bindPageStoreHook(
  useContextDataSourcesStore,
  (stores) => stores.dataSources,
);
