import { MousePointer2 } from "lucide-react";
import { useState } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useComponentConfigStore } from "../../stores/component-config";
import { useComponetsStore } from "../../stores/components";
import ComponentAttr from "./attr";
import ComponentEvent from "./event";

const Setting: React.FC = () => {
  const { curComponentId, curComponent } = useComponetsStore();
  const { componentConfig } = useComponentConfigStore();

  const [key, setKey] = useState("attr");

  const title = curComponent
    ? componentConfig[curComponent.name]?.desc || curComponent.desc || curComponent.name
    : "配置面板";

  const tabItems = [
    { value: "attr", label: "属性", children: <ComponentAttr /> },
    { value: "event", label: "事件", children: <ComponentEvent /> },
  ];

  return (
    <div className="flex h-full min-h-0 flex-col border-l border-border bg-background">
      <div className="flex h-9 shrink-0 items-center justify-between border-b border-border px-3">
        <span className="truncate text-xs font-medium">{title}</span>
        {curComponent && (
          <span className="shrink-0 text-[10px] text-muted-foreground">{curComponent.name}</span>
        )}
      </div>

      {!curComponentId || !curComponent ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-muted-foreground">
          <MousePointer2 className="size-5" />
          <p className="text-xs">在画布中选择组件以配置属性</p>
        </div>
      ) : (
        <Tabs value={key} onValueChange={setKey} className="min-h-0 flex-1 gap-0">
          <TabsList
            variant="line"
            className="w-full shrink-0 justify-start gap-4 rounded-none border-b border-border px-3"
          >
            {tabItems.map((item) => (
              <TabsTrigger key={item.value} value={item.value}>
                {item.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="min-h-0 flex-1 overflow-auto px-3 pb-4">
            {tabItems.map((item) => (
              <TabsContent key={item.value} value={item.value} className="pt-2">
                {item.children}
              </TabsContent>
            ))}
          </div>
        </Tabs>
      )}
    </div>
  );
};

export default Setting;
