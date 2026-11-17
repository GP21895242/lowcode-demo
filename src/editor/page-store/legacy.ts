import type { StoreApi } from "zustand/vanilla";

import { getActiveDesignStores, getActivePageStores } from "./active";
import type { DesignPageStores, PageStores } from "./types";

interface StoreStatics<S> {
  getState: () => S;
  setState: (partial: Partial<S> | ((state: S) => Partial<S>)) => void;
  subscribe: (listener: (state: S, prevState: S) => void) => () => void;
}

type StoreHook<S> = <U = S>(selector?: (state: S) => U) => U;

/**
 * 给 Context 版本 hook 补上 getState/setState/subscribe，
 * 供尚未迁移到显式实例的旧调用点使用（读取当前活动页面实例）
 */
export function bindPageStoreHook<S>(
  hook: StoreHook<S>,
  getApi: (stores: PageStores) => StoreApi<S>,
): StoreHook<S> & StoreStatics<S> {
  return Object.assign(hook, {
    getState: () => getApi(getActivePageStores()).getState(),
    setState: (partial: any) => {
      getApi(getActivePageStores()).setState(partial);
    },
    subscribe: (listener: any) => getApi(getActivePageStores()).subscribe(listener),
  });
}

/**
 * 设计专属 store 的绑定：预览模式下访问会抛出明确错误
 */
export function bindDesignStoreHook<S>(
  hook: StoreHook<S>,
  getApi: (stores: DesignPageStores) => StoreApi<S>,
): StoreHook<S> & StoreStatics<S> {
  return Object.assign(hook, {
    getState: () => getApi(getActiveDesignStores()).getState(),
    setState: (partial: any) => {
      getApi(getActiveDesignStores()).setState(partial);
    },
    subscribe: (listener: any) => getApi(getActiveDesignStores()).subscribe(listener),
  });
}
