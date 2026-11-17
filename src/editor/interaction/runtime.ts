import { getActivePageStores } from "../page-store/active";
import { useInteractionStore as useContextInteractionStore } from "../page-store/contexts";
import { bindPageStoreHook } from "../page-store/legacy";
import type { CardEventEmitter } from "../page-store/stores/interactions";

export { readExpression } from "../page-store/stores/interactions";

/**
 * 页面联动 store（旧入口）
 */
export const useInteractionStore = bindPageStoreHook(
  useContextInteractionStore,
  (stores) => stores.interactions,
);

/**
 * 卡片契约事件上行入口：转发到当前活动页面实例
 */
export const emitCardEvent: CardEventEmitter = (componentId, event, payload) => {
  getActivePageStores().interactions.emitCardEvent(componentId, event, payload);
};
