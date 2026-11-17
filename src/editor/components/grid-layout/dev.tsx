import { useDrop } from "../../hooks/use-drop";
import type { CommonComponentProps } from "../../interface";
import GridLayoutBase from "./base";

function GridLayoutDev(props: CommonComponentProps) {
  const { _id, _name } = props;
  const { canDrop, drop } = useDrop(_id, _name);

  return (
    <div
      data-component-id={_id}
      // @ts-expect-error ConnectDropTarget type mismatch
      ref={drop}
      className={`flex min-h-0 w-full flex-1 flex-col rounded-md p-1 transition-colors ${
        canDrop ? "bg-muted/50 outline-2 outline-primary" : ""
      }`}
    >
      <GridLayoutBase {...props} editable />
    </div>
  );
}

export default GridLayoutDev;
