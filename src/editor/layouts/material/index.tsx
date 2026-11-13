import { useMemo } from "react";

import ComponentItem from "../../common/component-item";
import type { ComponentConfig } from "../../interface";
import { useComponentConfigStore } from "../../stores/component-config";
import { useComponetsStore } from "../../stores/components";

const Material = ({ onDragging }: { onDragging?: () => void }) => {
  const { addComponent } = useComponetsStore();
  const { componentConfig } = useComponentConfigStore();

  /**
   * 拖拽结束，添加组件到画布
   * @param dropResult
   */
  const onDragEnd = (dropResult: { name: string; id?: number; desc: string; props: any }) => {
    addComponent(
      {
        id: new Date().getTime(),
        name: dropResult.name,
        props: dropResult.props,
        desc: dropResult.desc,
      },
      dropResult.id,
    );
  };

  const components = useMemo(() => {
    // 加载所有组件
    const coms = Object.values(componentConfig)
      .filter((o) => !o.hiddenInMaterial)
      .map((config: ComponentConfig) => {
        return {
          name: config.name,
          description: config.desc,
          order: config.order,
        };
      });

    // 排序
    coms.sort((x, y) => x.order - y.order);
    return coms;
  }, [componentConfig]);

  return (
    <div className="p-2">
      <div className="px-1 pb-1 text-[11px] font-medium text-muted-foreground">基础</div>
      <div className="grid grid-cols-2 gap-1">
        {components.map((item) => (
          <ComponentItem onDragging={onDragging} key={item.name} onDragEnd={onDragEnd} {...item} />
        ))}
      </div>
    </div>
  );
};

export default Material;
