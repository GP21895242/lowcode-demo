import { getActivePageStores } from "../page-store/active";
import type { CardInstanceHandle } from "../page-store/stores/cards";

/** 卡片实例暴露给页面的运行时代理 */
export type { CardInstanceHandle } from "../page-store/stores/cards";

/**
 * 卡片实例注册表（旧入口）：转发到当前活动页面实例
 */
export function registerCardInstance(handle: CardInstanceHandle) {
  getActivePageStores().cards.register(handle);
}

export function unregisterCardInstance(componentId: number) {
  getActivePageStores().cards.unregister(componentId);
}

export function getCardInstance(componentId?: number) {
  return getActivePageStores().cards.get(componentId);
}

export function setCardInput(componentId: number, key: string, value: any) {
  getActivePageStores().cards.setInput(componentId, key, value);
}

export function invokeCardMethod(componentId: number, method: string, args?: any) {
  return getActivePageStores().cards.invoke(componentId, method, args);
}
