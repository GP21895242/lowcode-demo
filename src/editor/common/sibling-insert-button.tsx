import { Plus } from "lucide-react";
import type { CSSProperties } from "react";
import { useMemo, useState } from "react";

import { Popover, PopoverContent, PopoverTrigger } from "../../components/ui/popover";
import type { ComponentConfig } from "../interface";
import { useComponentConfigStore } from "../stores/component-config";
import { createComponentId, useComponetsStore } from "../stores/components";
import { getComponentById } from "../utils/utils";

interface Props {
  // 当前组件的父组件 id
  parentId?: number;
  // 当前组件 id，用于确定插入位置
  referenceId: number;
  // 在当前组件的前面还是后面插入
  position: "before" | "after";
  // 按钮位置
  style?: CSSProperties;
}

/**
 * 选中框上下方的加号按钮，用于在选中组件的前后插入兄弟节点
 */
function SiblingInsertButton({ parentId, referenceId, position, style }: Props) {
  const [open, setOpen] = useState(false);
  const { components, insertComponent, setCurComponentId } = useComponetsStore();
  const { componentConfig } = useComponentConfigStore();

  const parentName = parentId ? getComponentById(parentId, components)?.name : undefined;

  const configs = useMemo(() => {
    if (!parentName) return [];

    return Object.values(componentConfig)
      .filter((config) => !config.hiddenInMaterial && config.allowDrag?.includes(parentName))
      .sort((a, b) => a.order - b.order);
  }, [componentConfig, parentName]);

  if (!configs.length) return null;

  function handleInsert(config: ComponentConfig) {
    const defaultProps = config.defaultProps;
    const props =
      typeof defaultProps === "function" ? defaultProps() : structuredClone(defaultProps ?? {});

    const component = {
      id: createComponentId(),
      name: config.name,
      desc: config.desc,
      props,
    };

    insertComponent(component, referenceId, position);
    setCurComponentId(component.id);
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            type="button"
            aria-label={position === "before" ? "在前方添加组件" : "在后方添加组件"}
            style={style}
            className="pointer-events-auto absolute z-20 flex size-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#1677ff] text-white shadow-md ring-2 ring-white transition-transform hover:scale-110"
          >
            <Plus className="size-3" />
          </button>
        }
      />
      <PopoverContent
        side={position === "before" ? "top" : "bottom"}
        align="center"
        className="w-56 p-2"
      >
        <div className="mb-1 px-1 text-xs text-muted-foreground">
          在{position === "before" ? "前方" : "后方"}添加组件
        </div>
        <div className="grid grid-cols-2 gap-1">
          {configs.map((config) => (
            <button
              key={config.name}
              type="button"
              className="truncate rounded-sm px-2 py-1.5 text-left text-xs text-foreground hover:bg-muted"
              onClick={() => handleInsert(config)}
            >
              {config.desc || config.name}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default SiblingInsertButton;
