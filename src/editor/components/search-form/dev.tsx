import React, { useMemo } from "react";

import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { useDrop } from "../../hooks/use-drop";
import type { CommonComponentProps } from "../../interface";

function SearchFormDev({ _id, _name, children }: CommonComponentProps) {
  const { canDrop, drop } = useDrop(_id, _name);

  const searchItems = useMemo(() => {
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
      className="w-[100%]"
      // @ts-expect-error ConnectDropTarget type mismatch
      ref={drop}
      data-component-id={_id}
      style={{ border: canDrop ? "1px solid #ccc" : "none" }}
    >
      <div className="grid grid-cols-4 items-center gap-5">
        {searchItems.map((item: any) => (
          <div key={item.name} className="flex items-center gap-2">
            <Label className="shrink-0 text-sm font-normal text-muted-foreground">
              {item.label}
            </Label>
            <Input disabled data-component-id={item.id} />
          </div>
        ))}
        <div className="flex items-center gap-2">
          <Button>搜索</Button>
          <Button variant="outline">重置</Button>
        </div>
      </div>
    </div>
  );
}

export default SearchFormDev;
