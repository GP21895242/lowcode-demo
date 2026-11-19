import { Blocks, Braces, Database, ListTree, Workflow } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";
import InteractionSettingPanel from "../../interaction/setting-panel";
import Material from "../material";
import DataSources from "./data-sources";
import DefineVariable from "./define-variable";
import Outline from "./outline";
import Variables from "./variables";

type MenuKey = "material" | "outline" | "variables" | "dataSources" | "interactions";

const menus: { key: MenuKey; label: string; icon: typeof Blocks }[] = [
  { key: "material", label: "组件库", icon: Blocks },
  { key: "outline", label: "大纲", icon: ListTree },
  { key: "variables", label: "变量", icon: Braces },
  { key: "dataSources", label: "数据源", icon: Database },
  { key: "interactions", label: "联动", icon: Workflow },
];

const Sidebar: React.FC<{ onDragging?: () => void; materialMode?: "page" | "card" }> = ({
  onDragging,
  materialMode = "page",
}) => {
  const [activeKey, setActiveKey] = useState<MenuKey>("material");
  const [variableVisible, setVariableVisible] = useState(false);

  const visibleMenus =
    materialMode === "card" ? menus.filter((menu) => menu.key !== "interactions") : menus;
  const activeMenu = visibleMenus.find((menu) => menu.key === activeKey) ?? visibleMenus[0];

  return (
    <aside className="flex h-full min-h-0 bg-background">
      <nav className="flex w-14 shrink-0 flex-col items-center gap-1 border-r border-border py-2">
        {visibleMenus.map((menu) => {
          const Icon = menu.icon;
          const active = menu.key === activeKey;

          return (
            <button
              key={menu.key}
              type="button"
              className={cn(
                "flex w-11 flex-col items-center gap-1 rounded-md py-2 text-[11px] transition-colors",
                active
                  ? "bg-muted font-medium text-foreground"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
              )}
              onClick={() => setActiveKey(menu.key)}
            >
              <Icon className="size-4" />
              {menu.label}
            </button>
          );
        })}
      </nav>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-9 shrink-0 items-center border-b border-border px-3">
          <span className="text-xs font-medium">{activeMenu?.label}</span>
        </div>
        <div className="min-h-0 flex-1 overflow-auto">
          {activeKey === "material" && <Material onDragging={onDragging} mode={materialMode} />}
          {activeKey === "outline" && <Outline />}
          {activeKey === "variables" && <Variables onEdit={() => setVariableVisible(true)} />}
          {activeKey === "dataSources" && <DataSources />}
          {activeKey === "interactions" && <InteractionSettingPanel />}
        </div>
      </div>

      <DefineVariable
        open={variableVisible}
        onCancel={() => {
          setVariableVisible(false);
        }}
      />
    </aside>
  );
};

export default Sidebar;
