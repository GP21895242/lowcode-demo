import { createStore, type StoreApi } from "zustand/vanilla";

export interface SuggestionState {
  /** 已忽略的建议 id，随页面保存于 dismissedSuggestions */
  dismissedIds: string[];
  /** 建议面板是否打开，供数据源面板与工具栏共用 */
  dialogOpen: boolean;
}

export interface SuggestionActions {
  setDismissedIds: (ids: string[]) => void;
  dismiss: (id: string) => void;
  openDialog: () => void;
  closeDialog: () => void;
}

export type SuggestionStore = SuggestionState & SuggestionActions;

/**
 * 优化建议 store：仅设计态使用，运行时无需创建
 */
export function createSuggestionStore(): StoreApi<SuggestionStore> {
  return createStore<SuggestionStore>()((set, get) => ({
    dismissedIds: [],
    dialogOpen: false,
    setDismissedIds: (ids) => set({ dismissedIds: [...new Set(ids)] }),
    dismiss: (id) => set({ dismissedIds: [...new Set([...get().dismissedIds, id])] }),
    openDialog: () => set({ dialogOpen: true }),
    closeDialog: () => set({ dialogOpen: false }),
  }));
}
