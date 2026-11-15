import { create } from "zustand";

interface State {
  /** 已忽略的建议 id，随页面保存于 dismissedSuggestions */
  dismissedIds: string[];
  /** 建议面板是否打开，供数据源面板与工具栏共用 */
  dialogOpen: boolean;
}

interface Action {
  setDismissedIds: (ids: string[]) => void;
  dismiss: (id: string) => void;
  openDialog: () => void;
  closeDialog: () => void;
}

export const useSuggestionStore = create<State & Action>()((set, get) => ({
  dismissedIds: [],
  dialogOpen: false,
  setDismissedIds: (ids) => set({ dismissedIds: [...new Set(ids)] }),
  dismiss: (id) => set({ dismissedIds: [...new Set([...get().dismissedIds, id])] }),
  openDialog: () => set({ dialogOpen: true }),
  closeDialog: () => set({ dialogOpen: false }),
}));
