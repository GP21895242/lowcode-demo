import { lazy, Suspense, useEffect, useRef, useState } from "react";

import { Spinner } from "../../components/ui/spinner";
import type { ComponentConfig } from "../interface";
import { usePageSearchStore, useVariablesStore } from "../page-store/contexts";
import { useComponentConfigStore } from "../stores/component-config";
import { readSearchValuesFromUrl } from "../search/url-sync";

const EditLayout = lazy(() => import("./edit-layout"));
const PreviewLayout = lazy(() => import("./preview-layout"));

interface LayoutProps {
  pageId?: string;
  pageName?: string;
  view: "edit" | "preview";
  fromEdit?: boolean;
  /** 卡片模板设计模式：画布内容来自模板 impl，保存目标也是模板 */
  cardTemplate?: { id: string; name: string; from?: string };
}

function LoadingScreen() {
  return (
    <div className="flex h-screen items-center justify-center gap-2">
      <Spinner />
      <span className="text-sm text-muted-foreground">加载中...</span>
    </div>
  );
}

/**
 * 布局入口：仅承担组件配置加载与搜索恢复，编辑/预览布局按需加载
 */
const Layout: React.FC<LayoutProps> = ({ pageId, pageName, view, fromEdit, cardTemplate }) => {
  const { setComponentConfig } = useComponentConfigStore();
  const [loading, setLoading] = useState(true);
  const searchStore = usePageSearchStore();
  const variables = useVariablesStore();
  const componentConfigRef = useRef<Record<string, ComponentConfig>>({});

  // 加载组件配置
  useEffect(() => {
    let cancelled = false;

    // 注册组件
    function registerComponent(name: string, componentConfig: ComponentConfig) {
      componentConfigRef.current[name] = componentConfig;
    }

    async function loadComponentConfig() {
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
  }, [setComponentConfig]);

  // 页面就绪或视图切换后，从 URL 恢复持久化搜索值并重新按 targets 分发
  useEffect(() => {
    if (loading || cardTemplate) return;

    const config = searchStore.config;
    if (!config) return;

    const urlValues = readSearchValuesFromUrl(config, variables.variables);
    if (!urlValues) return;

    Object.entries(urlValues).forEach(([variable, value]) => {
      searchStore.setValue(variable, value);
    });
    searchStore.submit(urlValues);
  }, [cardTemplate, loading, searchStore, variables.variables]);

  if (loading) {
    return <LoadingScreen />;
  }

  const isEdit = view === "edit" || Boolean(cardTemplate);

  return (
    <Suspense fallback={<LoadingScreen />}>
      {isEdit ? (
        <EditLayout
          pageId={pageId}
          pageName={pageName}
          view={view}
          fromEdit={fromEdit}
          cardTemplate={cardTemplate}
        />
      ) : (
        <PreviewLayout pageId={pageId} pageName={pageName} fromEdit={fromEdit} />
      )}
    </Suspense>
  );
};

export default Layout;
