/** 卡片实例暴露给页面的运行时代理 */
export interface CardInstanceHandle {
  componentId: number;
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

/** 页面内卡片实例注册表：联动与实例方法都经此路由 */
export interface CardRegistry {
  register: (handle: CardInstanceHandle) => void;
  unregister: (componentId: number) => void;
  get: (componentId?: number) => CardInstanceHandle | undefined;
  setInput: (componentId: number, key: string, value: any) => void;
  invoke: (componentId: number, method: string, args?: any) => any;
}

export function createCardRegistry(): CardRegistry {
  const instances = new Map<number, CardInstanceHandle>();

  return {
    register: (handle) => {
      instances.set(handle.componentId, handle);
    },
    unregister: (componentId) => {
      instances.delete(componentId);
    },
    get: (componentId) => (componentId ? instances.get(componentId) : undefined),
    setInput: (componentId, key, value) => {
      instances.get(componentId)?.setInput(key, value);
    },
    invoke: (componentId, method, args) => instances.get(componentId)?.invoke(method, args),
  };
}
