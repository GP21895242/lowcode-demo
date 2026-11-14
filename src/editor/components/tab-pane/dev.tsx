import { useDrop } from "../../hooks/use-drop";
import type { CommonComponentProps } from "../../interface";

function TabPaneDev({ _id, _name, children }: CommonComponentProps) {
  const { canDrop, drop } = useDrop(_id, _name);

  return (
    <div
      data-component-id={_id}
      // @ts-expect-error ConnectDropTarget type mismatch
      ref={drop}
      className={`min-h-20 rounded-md p-3 ${canDrop ? "bg-muted/50 outline-2 outline-primary" : ""}`}
    >
      {children?.length ? children : <span className="text-muted-foreground">暂无内容</span>}
    </div>
  );
}

export default TabPaneDev;
