import { createStore, type StoreApi } from "zustand/vanilla";

export interface PageDataState {
  data: any;
}

export interface PageDataActions {
  /**
   * 设置变量值
   */
  setData: (key: string, value: any) => void;
  /**
   * 重置数据
   */
  resetData: () => void;
  /**
   * 合并数据
   */
  mergeData: (data: any) => void;
}

export type PageDataStore = PageDataState & PageDataActions;

/**
 * 页面数据 store：运行时可变数据，事件流与搜索值都写入这里
 */
export function createPageDataStore(initialData: any = {}): StoreApi<PageDataStore> {
  return createStore<PageDataStore>()((set) => ({
    data: initialData,
    setData: (key, value) => set((state) => ({ data: { ...state.data, [key]: value } })),
    mergeData: (data) => set((state) => ({ data: { ...state.data, ...data } })),
    resetData: () => set({ data: {} }),
  }));
}
