import { useDrop } from "../../hooks/use-drop";
import type { CommonComponentProps } from "../../interface";

const gapMap: Record<string, string> = {
  small: "gap-2",
  middle: "gap-4",
  large: "gap-6",
};

function SpaceDev({ children, _id, _name, size, direction }: CommonComponentProps) {
  const { canDrop, drop } = useDrop(_id, _name);

  return (
    <div
      data-component-id={_id}
      // @ts-expect-error ConnectDropTarget type mismatch
      ref={drop}
      className={`flex p-[16px] ${direction === "vertical" ? "flex-col" : "flex-row"} ${
        gapMap[size] || gapMap.middle
      }`}
      style={{
        border: canDrop ? "1px solid #ccc" : "none",
        width: direction === "vertical" ? "100%" : undefined,
      }}
    >
      {children?.length ? children : <span className="text-muted-foreground">暂无内容</span>}
    </div>
  );
}

export default SpaceDev;
