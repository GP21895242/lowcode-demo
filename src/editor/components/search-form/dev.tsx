import React, { useMemo } from "react";

import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { useDataSourceStore } from "../../data-source/store";
import { useDrop } from "../../hooks/use-drop";
import type { CommonComponentProps } from "../../interface";

function unwrap(value: any) {
  return value && typeof value === "object" && "value" in value ? value.value : value;
}

function SearchFormDev({ _id, _name, children }: CommonComponentProps) {
  const { canDrop, drop } = useDrop(_id, _name);
  const sources = useDataSourceStore((state) => state.sources);

  const searchItems = useMemo(() => {
    return (
      React.Children.map(children, (item: any, index: number) => {
        const props = item.props ?? {};
        const sourceId = unwrap(props.sourceId) as string | undefined;
        const dataKey = unwrap(props.dataKey) as string | undefined;
        const field = sources
          .find((source) => source.id === sourceId)
          ?.fields.find((sourceField) => sourceField.dataKey === dataKey);

        return {
          key: String(props._id ?? index),
          label: unwrap(props.label) || field?.label || dataKey,
          id: props._id,
          sourceId,
        };
      }) ?? []
    );
  }, [children, sources]);

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
          <div key={item.key} className="flex items-center gap-2" data-component-id={item.id}>
            <Label className="shrink-0 text-sm font-normal text-muted-foreground">
              {item.label}
            </Label>
            <Input
              className="pointer-events-none"
              disabled
              placeholder={item.sourceId ? "数据源查询" : ""}
            />
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
