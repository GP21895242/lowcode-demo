import { useDrop } from "../../hooks/use-drop";
import type { CommonComponentProps } from "../../interface";

function Page({ children, _id, _name }: CommonComponentProps) {
  const { canDrop, drop } = useDrop(_id, _name);

  return (
    <div
      data-component-id={_id}
      className="flex min-h-0 flex-1 flex-col p-[24px]"
      style={{ border: canDrop ? "1px solid blue" : "none" }}
      ref={drop as any}
    >
      {children}
    </div>
  );
}

export default Page;
