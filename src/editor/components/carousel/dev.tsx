import { useDrop } from "../../hooks/use-drop";
import type { CommonComponentProps } from "../../interface";
import CarouselBase from "./base";

function CarouselDev(props: CommonComponentProps) {
  const { _id, _name } = props;
  const { canDrop, drop } = useDrop(_id, _name);

  return (
    <div
      data-component-id={_id}
      // @ts-expect-error ConnectDropTarget type mismatch
      ref={drop}
      className={`rounded-md ${canDrop ? "bg-muted/50 outline-2 outline-primary" : ""}`}
    >
      <CarouselBase {...props} editable />
    </div>
  );
}

export default CarouselDev;
