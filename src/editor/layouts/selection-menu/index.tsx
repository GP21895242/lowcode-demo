import { Copy, LocateFixed, Trash2 } from "lucide-react";

import { Button } from "../../../components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../../components/ui/tooltip";
import { openConfirm } from "../../common/confirm-dialog";
import { useComponentConfigStore } from "../../stores/component-config";
import { useComponetsStore } from "../../stores/components";

const SelectionMenu = () => {
  const { curComponent, curComponentId, setCurComponentId, addComponent, deleteComponent } =
    useComponetsStore();
  const { componentConfig } = useComponentConfigStore();

  // 页面本身不需要选择工具栏
  if (!curComponentId || !curComponent || curComponentId === 1) return null;

  const component = curComponent;
  const desc = componentConfig[component.name]?.desc || component.desc || component.name;

  function copyComponent() {
    const id = Date.now();

    addComponent(
      {
        id,
        name: component.name,
        desc: component.desc,
        props: structuredClone(component.props || {}),
      },
      component.parentId,
    );

    setCurComponentId(id);
  }

  function locateComponent() {
    document
      .querySelector(`[data-component-id="${curComponentId}"]`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function removeComponent() {
    openConfirm({
      title: "提示",
      content: "确认删除？",
      okText: "确认",
      cancelText: "取消",
      onOk: () => {
        deleteComponent(curComponentId);
        setCurComponentId(null);
      },
    });
  }

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-4 z-20 flex justify-center">
      <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-border bg-background/95 py-1 pl-3 pr-1 shadow-lg backdrop-blur">
        <span className="max-w-[160px] truncate text-xs text-muted-foreground">{desc}</span>
        <span className="mx-1 h-4 w-px bg-border" />
        <Tooltip>
          <TooltipTrigger
            render={
              <Button variant="ghost" size="icon-sm" aria-label="复制" onClick={copyComponent}>
                <Copy />
              </Button>
            }
          />
          <TooltipContent>复制</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button variant="ghost" size="icon-sm" aria-label="定位" onClick={locateComponent}>
                <LocateFixed />
              </Button>
            }
          />
          <TooltipContent>定位</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="删除"
                className="text-muted-foreground hover:text-destructive"
                onClick={removeComponent}
              >
                <Trash2 />
              </Button>
            }
          />
          <TooltipContent>删除</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
};

export default SelectionMenu;
