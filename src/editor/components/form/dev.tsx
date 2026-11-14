import React, { useMemo } from "react";

import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { useDrop } from "../../hooks/use-drop";
import type { CommonComponentProps } from "../../interface";

function FormDev({ _id, _name, children }: CommonComponentProps) {
  const { canDrop, drop } = useDrop(_id, _name);

  const formItems = useMemo(() => {
    return (
      React.Children.map(children, (item: any) => ({
        label: item.props?.label,
        name: item.props?.name,
        type: item.props?.type,
        id: item.props?._id,
      })) || []
    );
  }, [children]);

  if (!children?.length) {
    return (
      <div
        data-component-id={_id}
        // @ts-expect-error ConnectDropTarget type mismatch
        ref={drop}
        className="flex justify-center p-[16px]"
        style={{ border: canDrop ? "1px solid #ccc" : "none" }}
      >
        暂无内容
      </div>
    );
  }

  return (
    <div
      className="w-[100%] py-[20px]"
      // @ts-expect-error ConnectDropTarget type mismatch
      ref={drop}
      data-component-id={_id}
      style={{ border: canDrop ? "1px solid #ccc" : "none" }}
    >
      <div className="flex flex-col gap-4">
        {formItems.map((item: any) => (
          <div
            key={item.id ?? item.name}
            className="flex items-center gap-3"
            data-component-id={item.id}
          >
            <Label className="w-[92px] shrink-0 text-right text-sm font-normal text-muted-foreground">
              {item.label}
            </Label>
            <Input className="pointer-events-none flex-1" disabled />
          </div>
        ))}
      </div>
    </div>
  );
}

export default FormDev;
