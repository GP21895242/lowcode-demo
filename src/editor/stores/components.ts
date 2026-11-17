import { useMemo } from "react";
import { useStore } from "zustand";

import { getActiveDesignStores, getActivePageStores } from "../page-store/active";
import { useDesignStores, usePageStores } from "../page-store/contexts";
import type { ContentActions, ContentState } from "../page-store/stores/content";
import type { EditorActions, EditorState } from "../page-store/stores/editor";

export {
  cloneComponentWithNewIds,
  createComponentId,
  ROOT_COMPONENT_ID,
  type Component,
  type HistoryRecorder,
} from "../page-store/stores/content";
export type { HistorySnapshot, MergeTransaction } from "../page-store/stores/editor";

/** 组件树与选中/历史的合并视图，兼容设计态旧调用点 */
export type ComponentsStore = ContentState & ContentActions & EditorState & EditorActions;

function useComponentsStoreState(): ComponentsStore {
  const page = usePageStores();
  const design = useDesignStores();
  const content = useStore(page.content);
  const editor = useStore(design.editor);

  return useMemo(() => ({ ...content, ...editor }), [content, editor]);
}

function useComponentsStore<U = ComponentsStore>(selector?: (state: ComponentsStore) => U): U {
  const state = useComponentsStoreState();
  return selector ? selector(state) : (state as unknown as U);
}

/**
 * 组件 store（旧入口）：运行时只用 content，编辑态额外读取选中与历史
 */
export const useComponetsStore = Object.assign(useComponentsStore, {
  getState: (): ComponentsStore => ({
    ...getActivePageStores().content.getState(),
    ...getActiveDesignStores().editor.getState(),
  }),
});
