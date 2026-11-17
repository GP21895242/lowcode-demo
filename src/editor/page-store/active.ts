import type { DesignPageStores, PageStores } from "./types";

/**
 * 当前活动页面的 store 引用，仅供非 React 入口（事件流、保存、注册表）使用。
 * React 组件一律通过 Context 获取实例。
 */
let activePageStores: PageStores | null = null;
let activeDesignStores: DesignPageStores | null = null;

export function setActivePageStores(stores: PageStores | null) {
  activePageStores = stores;
}

export function setActiveDesignStores(stores: DesignPageStores | null) {
  activeDesignStores = stores;
}

/** 仅当活动实例仍是当前 bundle 时清理，避免页面切换时新实例被旧卸载逻辑覆盖 */
export function clearActivePageStores(stores: PageStores) {
  if (activePageStores === stores) {
    activePageStores = null;
  }
}

export function clearActiveDesignStores(stores: DesignPageStores) {
  if (activeDesignStores === stores) {
    activeDesignStores = null;
  }
}

export function getActivePageStores(): PageStores {
  if (!activePageStores) {
    throw new Error("页面 store 尚未挂载");
  }
  return activePageStores;
}

export function getActiveDesignStores(): DesignPageStores {
  if (!activeDesignStores) {
    throw new Error("设计态 store 尚未挂载，预览模式下不可用");
  }
  return activeDesignStores;
}
