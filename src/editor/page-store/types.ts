import type { StoreApi } from "zustand/vanilla";

import type { DataSource, DataSourceRelation } from "../data-source/types";
import type { DataSourceLoader } from "../data-source/runtime";
import type { PageInteraction } from "../interaction/types";
import type { PageSearchConfig } from "../search/types";
import type { CardRegistry } from "./stores/cards";
import type { ContentStore } from "./stores/content";
import type { DataSourcesStore } from "./stores/data-sources";
import type { EditorStore } from "./stores/editor";
import type { CardEventEmitter, InteractionStore } from "./stores/interactions";
import type { PageDataStore } from "./stores/page-data";
import type { RefRegistry } from "./stores/refs";
import type { PageSearchStore } from "./stores/search";
import type { SuggestionStore } from "./stores/suggestions";
import type { VariableInput, VariablesStore } from "./stores/variables";

export type PageViewMode = "edit" | "preview";

/**
 * 运行时与设计态共用的页面 store：预览模式下也只创建这些
 */
export interface PageStores {
  content: StoreApi<ContentStore>;
  pageData: StoreApi<PageDataStore>;
  variables: StoreApi<VariablesStore>;
  dataSources: StoreApi<DataSourcesStore>;
  sourceLoader: DataSourceLoader;
  search: StoreApi<PageSearchStore>;
  interactions: StoreApi<InteractionStore> & { emitCardEvent: CardEventEmitter };
  refs: RefRegistry;
  cards: CardRegistry;
}

/**
 * 设计专属 store：仅编辑模式创建，预览模式下为 null
 */
export interface DesignPageStores {
  editor: StoreApi<EditorStore>;
  suggestions: StoreApi<SuggestionStore>;
}

/** 页面/卡片模板加载时写入 store 的设计数据 */
export interface PageDesignInput {
  components?: ContentStore["components"];
  variables?: VariableInput[];
  sources?: DataSource[];
  relations?: DataSourceRelation[];
  search?: PageSearchConfig | null;
  interactions?: PageInteraction[];
  dismissedSuggestions?: string[];
}
