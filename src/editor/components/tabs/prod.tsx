import React, { useMemo, useState } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { CommonComponentProps } from "../../interface";

interface TabItem {
  id: number;
  label: string;
  node: React.ReactNode;
}

function TabsProd({ variant = "default", children }: CommonComponentProps) {
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

  if (!tabItems.length) return null;

  return (
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
  );
}

export default TabsProd;
