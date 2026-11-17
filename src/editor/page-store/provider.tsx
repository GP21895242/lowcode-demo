import { useEffect, useLayoutEffect, useState, type ReactNode } from "react";

import {
  clearActiveDesignStores,
  clearActivePageStores,
  setActiveDesignStores,
  setActivePageStores,
} from "./active";
import { DesignStoresContext, PageModeContext, PageStoresContext } from "./contexts";
import { createDesignPageStores } from "./design-stores";
import { hydrateDesignPageStores, hydratePageStores } from "./hydrate";
import { createPageStores } from "./runtime-stores";
import type { PageDesignInput, PageViewMode } from "./types";

interface PageProviderProps {
  /** 页面或卡片模板 id，仅用于调试与隔离 */
  pageId?: string;
  view: PageViewMode;
  design: PageDesignInput;
  children: ReactNode;
}

/**
 * 页面级 store Provider：随页面挂载创建整组 store，
 * 预览模式不创建设计专属 store，卸载时释放数据源缓存
 */
export function PageProvider({ view, design, children }: PageProviderProps) {
  const [bundle] = useState(() => {
    const stores = createPageStores(view);
    const designStores = view === "edit" ? createDesignPageStores(stores) : null;

    hydratePageStores(stores, design);
    if (designStores) hydrateDesignPageStores(designStores, design);

    // 非 React 入口（事件流、保存）需要读取当前页面实例
    setActivePageStores(stores);
    setActiveDesignStores(designStores);

    return { stores, designStores };
  });

  // 页面切换时旧 Provider 的清理可能晚于新 Provider 初始化，这里重新确认活动实例
  useLayoutEffect(() => {
    setActivePageStores(bundle.stores);
    setActiveDesignStores(bundle.designStores);
  }, [bundle]);

  useEffect(
    () => () => {
      bundle.stores.sourceLoader.dispose();
    },
    [bundle],
  );

  useEffect(
    () => () => {
      clearActivePageStores(bundle.stores);
      if (bundle.designStores) {
        clearActiveDesignStores(bundle.designStores);
      }
    },
    [bundle],
  );

  return (
    <PageModeContext.Provider value={view}>
      <PageStoresContext.Provider value={bundle.stores}>
        <DesignStoresContext.Provider value={bundle.designStores}>
          {children}
        </DesignStoresContext.Provider>
      </PageStoresContext.Provider>
    </PageModeContext.Provider>
  );
}
