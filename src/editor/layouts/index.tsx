import { MousePointer2 } from "lucide-react";

import { useEffect, useRef, useState } from "react";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "../../components/ui/resizable";
import { Spinner } from "../../components/ui/spinner";
import type { ComponentConfig } from "../interface";
import { useComponentConfigStore } from "../stores/component-config";
import { clearComponentRef } from "../stores/component-ref";
import { useComponetsStore } from "../stores/components";
import { usePageDataStore } from "../stores/page-data";
import { useVariablesStore } from "../stores/variable";
import { getVariablesDefaultData } from "../utils/utils";
import SelectionMenu from "./selection-menu";
import Setting from "./setting";
import Sidebar from "./sidebar";
import EditStage from "./stage/edit";
import ProdStage from "./stage/prod";
import Toolbar from "./toolbar";

const Layout: React.FC = () => {
  const { mode, curComponent, curComponentId } = useComponetsStore();
  const { setComponentConfig } = useComponentConfigStore();
  const [loading, setLoading] = useState(true);
  const { mergeData } = usePageDataStore();

  const componentConfigRef = useRef<any>({});
  const editStageRef = useRef<any>(null);

  // 加载组件配置
  useEffect(() => {
    let cancelled = false;

    // 注册组件
    function registerComponent(name: string, componentConfig: ComponentConfig) {
      componentConfigRef.current[name] = componentConfig;
    }

    async function loadComponentConfig() {
      clearComponentRef();

      // 初始化变量到全局数据中
      const { variables } = useVariablesStore.getState();
      mergeData(getVariablesDefaultData(variables));

      // 加载组件配置模块代码
      const modules = import.meta.glob("../components/*/index.ts", { eager: true });

      const tasks = Object.values(modules).map((module: any) => {
        if (module?.default) {
          // 执行组件配置里的方法，把注册组件方法传进去
          return module.default({ registerComponent });
        }
      });

      // 等待所有组件配置加载完成
      await Promise.all(tasks);

      if (cancelled) return;

      // 注册组件到全局
      setComponentConfig(componentConfigRef.current);
      setLoading(false);
    }

    void loadComponentConfig();

    return () => {
      cancelled = true;
    };
  }, [mergeData, setComponentConfig]);

  function onDragging() {
    editStageRef.current?.updateSelectedMaskPosition();
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center gap-2">
        <Spinner />
        <span className="text-sm text-muted-foreground">加载中...</span>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Toolbar />
      {mode === "edit" ? (
        <ResizablePanelGroup orientation="horizontal" className="min-h-0 flex-1">
          <ResizablePanel defaultSize={240} maxSize={400} minSize={200}>
            <Sidebar onDragging={onDragging} />
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel className="min-w-0">
            <div className="relative flex h-full min-h-0 flex-col overflow-hidden">
              <div className="flex h-9 shrink-0 items-center justify-between border-b border-border bg-background px-3 text-xs text-muted-foreground">
                <div className="flex min-w-0 items-center gap-1.5">
                  <MousePointer2 className="size-3.5" />
                  <span>编辑</span>
                  <span className="text-border">/</span>
                  <span className="text-foreground">首页</span>
                  {curComponent && curComponentId !== 1 && (
                    <>
                      <span className="text-border">/</span>
                      <span className="truncate text-foreground">
                        {curComponent.desc || curComponent.name}
                      </span>
                    </>
                  )}
                </div>
                <span className="shrink-0">拖拽左侧组件到画布</span>
              </div>
              <div className="min-h-0 flex-1 overflow-auto bg-muted/40 p-4">
                <div className="min-h-full rounded-lg border border-border bg-background shadow-sm">
                  <EditStage ref={editStageRef} />
                </div>
              </div>
              <SelectionMenu />
            </div>
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize={320} maxSize={520} minSize={280}>
            <Setting />
          </ResizablePanel>
        </ResizablePanelGroup>
      ) : (
        <div className="min-h-0 flex-1 overflow-auto">
          <ProdStage />
        </div>
      )}
    </div>
  );
};

export default Layout;
