/** 组件实例引用注册表：事件流的组件方法通过它拿到最新 ref */
export interface RefRegistry {
  get: (componentId: number) => any;
  set: (componentId: number, ref: any) => void;
  clear: () => void;
}

export function createRefRegistry(): RefRegistry {
  const refs = new Map<number, any>();

  return {
    get: (componentId) => refs.get(componentId),
    set: (componentId, ref) => {
      refs.set(componentId, ref);
    },
    clear: () => refs.clear(),
  };
}
