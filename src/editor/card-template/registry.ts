/** 卡片实例暴露给页面的运行时代理 */
export interface CardInstanceHandle {
  scopeId: string;
  templateId: string;
  templateName: string;
  /** 写入实例输入，等价于联动 set-input */
  setInput: (key: string, value: any) => void;
  getInputs: () => Record<string, any>;
  /** 重新加载卡片私有数据源 */
  reload: () => void;
  /** 调用契约方法 */
  invoke: (method: string, args?: any) => any;
}

const instances = new Map<string, CardInstanceHandle>();

export function registerCardInstance(handle: CardInstanceHandle) {
  instances.set(handle.scopeId, handle);
}

export function unregisterCardInstance(scopeId: string) {
  instances.delete(scopeId);
}

export function getCardInstance(scopeId?: string) {
  return scopeId ? instances.get(scopeId) : undefined;
}

export function setCardInput(scopeId: string, key: string, value: any) {
  instances.get(scopeId)?.setInput(key, value);
}

export function invokeCardMethod(scopeId: string, method: string, args?: any) {
  return instances.get(scopeId)?.invoke(method, args);
}
