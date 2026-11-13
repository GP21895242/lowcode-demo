import { Blocks, Braces, ListTree } from "lucide-react";
import { useState } from "react";

import { cn } from "../../../lib/utils";
import Material from "../material";
import DefineVariable from "./define-variable";
import Outline from "./outline";
import Variables from "./variables";

type MenuKey = "material" | "outline" | "variables";

const menus: { key: MenuKey; label: string; icon: typeof Blocks }[] = [
  { key: "material", label: "组件库", icon: Blocks },
  { key: "outline", label: "大纲", icon: ListTree },
  { key: "variables", label: "变量", icon: Braces },
];

const Sidebar: React.FC<{ onDragging?: () => void }> = ({ onDragging }) => {
  const [activeKey, setActiveKey] = useState<MenuKey>("material");
  const [variableVisible, setVariableVisible] = useState(false);

  const activeMenu = menus.find((menu) => menu.key === activeKey);

  return (
    <aside className="flex h-full min-h-0 bg-background">
      <nav className="flex w-14 shrink-0 flex-col items-center gap-1 border-r border-border py-2">
        {menus.map((menu) => {
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
          {activeKey === "material" && <Material onDragging={onDragging} />}
          {activeKey === "outline" && <Outline />}
          {activeKey === "variables" && <Variables onEdit={() => setVariableVisible(true)} />}
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
