import { Redo2, Undo2 } from "lucide-react";

import { useEffect, useRef, useState } from "react";

import { Button } from "../../components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "../../components/ui/resizable";
import { Spinner } from "../../components/ui/spinner";
import type { ComponentConfig } from "../interface";
import MergeDialog from "../resource/merge-dialog";
import { useComponentConfigStore } from "../stores/component-config";
import { clearComponentRef } from "../stores/component-ref";
import { useComponetsStore } from "../stores/components";
import { usePageDataStore } from "../stores/page-data";
import { useVariablesStore } from "../stores/variable";
import { usePageSearchStore } from "../search/store";
import { readSearchValuesFromUrl } from "../search/url-sync";
import { getVariablesDefaultData } from "../utils/utils";
import Setting from "./setting";
import Sidebar from "./sidebar";
import EditStage from "./stage/edit";
import ProdStage from "./stage/prod";
import Toolbar from "./toolbar";

interface LayoutProps {
  pageId?: string;
  pageName?: string;
  view: "edit" | "preview";
  fromEdit?: boolean;
  /** 卡片模板设计模式：画布内容来自模板 impl，保存目标也是模板 */
  cardTemplate?: { id: string; name: string; from?: string };
}

const Layout: React.FC<LayoutProps> = ({ pageId, pageName, view, fromEdit, cardTemplate }) => {
  const { past, future, undo, redo } = useComponetsStore();
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

  // 页面就绪或视图切换后，从 URL 恢复持久化搜索值并重新按 targets 分发
  useEffect(() => {
    if (loading || cardTemplate) return;

    const searchStore = usePageSearchStore.getState();
    if (!searchStore.config) return;

    const urlValues = readSearchValuesFromUrl(
      searchStore.config,
      useVariablesStore.getState().variables,
    );
    if (!urlValues) return;

    Object.entries(urlValues).forEach(([variable, value]) => {
      searchStore.setValue(variable, value);
    });
    searchStore.submit(urlValues);
  }, [cardTemplate, loading, view]);

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
      <Toolbar
        pageId={pageId}
        pageName={pageName ?? cardTemplate?.name}
        view={view}
        fromEdit={fromEdit}
        cardTemplate={cardTemplate}
      />
      {cardTemplate ? null : <MergeDialog />}
      {view === "edit" ? (
        <ResizablePanelGroup orientation="horizontal" className="min-h-0 flex-1">
          <ResizablePanel defaultSize={240} maxSize={400} minSize={200}>
            <Sidebar onDragging={onDragging} materialMode={cardTemplate ? "card" : "page"} />
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel className="min-w-0">
            <div className="relative flex h-full min-h-0 flex-col overflow-hidden">
              <div className="flex h-9 shrink-0 items-center gap-1 border-b border-border bg-background px-2">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="撤销"
                  title="撤销"
                  disabled={past.length === 0}
                  onClick={undo}
                >
                  <Undo2 />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="重做"
                  title="重做"
                  disabled={future.length === 0}
                  onClick={redo}
                >
                  <Redo2 />
                </Button>
              </div>
              <div className="min-h-0 flex-1 overflow-auto bg-muted/40 p-4">
                <div className="flex min-h-full flex-col rounded-lg border border-border bg-background shadow-sm">
                  <EditStage ref={editStageRef} />
                </div>
              </div>
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
