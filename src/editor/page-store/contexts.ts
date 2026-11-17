import { createContext, useContext } from "react";
import { useStore } from "zustand";

import type { DataSourceLoader } from "../data-source/runtime";
import type { CardRegistry } from "./stores/cards";
import type { ContentStore } from "./stores/content";
import type { DataSourcesStore } from "./stores/data-sources";
import type { EditorStore } from "./stores/editor";
import type { CardEventEmitter, InteractionStore } from "./stores/interactions";
import type { PageDataStore } from "./stores/page-data";
import type { RefRegistry } from "./stores/refs";
import type { PageSearchStore } from "./stores/search";
import type { SuggestionStore } from "./stores/suggestions";
import type { VariablesStore } from "./stores/variables";
import type { DesignPageStores, PageStores, PageViewMode } from "./types";

export const PageStoresContext = createContext<PageStores | null>(null);
export const DesignStoresContext = createContext<DesignPageStores | null>(null);
export const PageModeContext = createContext<PageViewMode>("preview");

function identity<U>(state: U): U {
  return state;
}

export function usePageStores(): PageStores {
  const stores = useContext(PageStoresContext);
  if (!stores) {
    throw new Error("usePageStores 必须在 PageProvider 内使用");
  }
  return stores;
}

export function useDesignStores(): DesignPageStores {
  const stores = useContext(DesignStoresContext);
  if (!stores) {
    throw new Error("设计态 store 仅在编辑模式下可用");
  }
  return stores;
}

export function usePageMode(): PageViewMode {
  return useContext(PageModeContext);
}

export function useContentStore<U = ContentStore>(selector?: (state: ContentStore) => U): U {
  const stores = usePageStores();
  return useStore(stores.content, selector ?? (identity as (state: ContentStore) => U));
}

export function usePageDataStore<U = PageDataStore>(selector?: (state: PageDataStore) => U): U {
  const stores = usePageStores();
  return useStore(stores.pageData, selector ?? (identity as (state: PageDataStore) => U));
}

export function useVariablesStore<U = VariablesStore>(selector?: (state: VariablesStore) => U): U {
  const stores = usePageStores();
  return useStore(stores.variables, selector ?? (identity as (state: VariablesStore) => U));
}

export function useDataSourcesStore<U = DataSourcesStore>(
  selector?: (state: DataSourcesStore) => U,
): U {
  const stores = usePageStores();
  return useStore(stores.dataSources, selector ?? (identity as (state: DataSourcesStore) => U));
}

export function usePageSearchStore<U = PageSearchStore>(
  selector?: (state: PageSearchStore) => U,
): U {
  const stores = usePageStores();
  return useStore(stores.search, selector ?? (identity as (state: PageSearchStore) => U));
}

export function useInteractionStore<U = InteractionStore>(
  selector?: (state: InteractionStore) => U,
): U {
  const stores = usePageStores();
  return useStore(stores.interactions, selector ?? (identity as (state: InteractionStore) => U));
}

export function useSuggestionStore<U = SuggestionStore>(
  selector?: (state: SuggestionStore) => U,
): U {
  const stores = useDesignStores();
  return useStore(stores.suggestions, selector ?? (identity as (state: SuggestionStore) => U));
}

export function useEditorStore<U = EditorStore>(selector?: (state: EditorStore) => U): U {
  const stores = useDesignStores();
  return useStore(stores.editor, selector ?? (identity as (state: EditorStore) => U));
}

export function useSourceLoader(): DataSourceLoader {
  return usePageStores().sourceLoader;
}

export function useRefRegistry(): RefRegistry {
  return usePageStores().refs;
}

export function useCardRegistry(): CardRegistry {
  return usePageStores().cards;
}

export function useCardEventEmitter(): CardEventEmitter {
  return usePageStores().interactions.emitCardEvent;
}
