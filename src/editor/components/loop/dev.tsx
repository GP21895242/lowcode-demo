import { Repeat } from "lucide-react";
import React from "react";

import { cn } from "../../../lib/utils";
import { useDrop } from "../../hooks/use-drop";
import type { CommonComponentProps } from "../../interface";

function LoopDev(props: CommonComponentProps) {
  const { _id, _name, children } = props;
  const { canDrop, drop } = useDrop(_id, _name);
  const hasChildren = React.Children.count(children) > 0;

  return (
    <div
      data-component-id={_id}
      // @ts-expect-error ConnectDropTarget type mismatch
      ref={drop}
      className={cn(
        "rounded-md border border-dashed border-border p-2",
        canDrop && "border-primary bg-primary/5",
      )}
    >
      <div className="mb-2 flex items-center gap-1 text-xs text-muted-foreground">
        <Repeat className="size-3" />
        <span>循环容器</span>
        <span className="text-muted-foreground/70">按数据源每行展开一次子组件</span>
      </div>
      {hasChildren ? (
        children
      ) : (
        <div className="flex min-h-16 flex-col items-center justify-center gap-1 text-center text-xs text-muted-foreground">
          <span>拖入子组件作为循环模板</span>
          <span>在右侧属性面板绑定数据源后自动复制</span>
        </div>
      )}
    </div>
  );
}

export default LoopDev;
