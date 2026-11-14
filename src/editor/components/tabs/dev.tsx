import React, { useMemo, useState } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs";
import { useDrop } from "../../hooks/use-drop";
import type { CommonComponentProps } from "../../interface";

interface TabItem {
  id: number;
  label: string;
  node: React.ReactNode;
}

function TabsDev({ _id, _name, variant = "default", children }: CommonComponentProps) {
  const { canDrop, drop } = useDrop(_id, _name);
  const [activeId, setActiveId] = useState<number>();

  const tabItems = useMemo<TabItem[]>(() => {
    return React.Children.toArray(children).reduce<TabItem[]>((prev, item: any) => {
      const props = item?.props ?? {};

      if (props._id !== undefined) {
        prev.push({
          id: props._id,
          label: props.label || "标签页",
          node: item,
        });
      }

      return prev;
    }, []);
  }, [children]);

  // 当前激活的标签页被删除时，自动回退到第一个标签页
  const value = tabItems.some((item) => item.id === activeId) ? activeId : tabItems[0]?.id;

  return (
    <div
      data-component-id={_id}
      // @ts-expect-error ConnectDropTarget type mismatch
      ref={drop}
      className={`w-full rounded-md p-2 ${canDrop ? "bg-muted/50 outline-2 outline-primary" : ""}`}
    >
      {tabItems.length ? (
        <Tabs value={value} onValueChange={(next) => setActiveId(next as number)}>
          <TabsList variant={variant}>
            {tabItems.map((item) => (
              <TabsTrigger key={item.id} value={item.id}>
                {item.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {tabItems.map((item) => (
            <TabsContent key={item.id} value={item.id}>
              {item.node}
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        <div className="flex min-h-16 items-center justify-center text-sm text-muted-foreground">
          暂无内容
        </div>
      )}
    </div>
  );
}

export default TabsDev;
