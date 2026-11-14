import { ArrowLeft } from "lucide-react";
import { useEffect, useLayoutEffect, useState } from "react";
import { Button } from "../components/ui/button";
import { Spinner } from "../components/ui/spinner";
import { useDataSourceRuntimeStore } from "../editor/data-source/runtime";
import { useDataSourceStore } from "../editor/data-source/store";
import Layout from "../editor/layouts";
import { clearComponentRef } from "../editor/stores/component-ref";
import { useComponetsStore } from "../editor/stores/components";
import { usePageDataStore } from "../editor/stores/page-data";
import { usePagesStore } from "../editor/stores/pages";
import { useVariablesStore } from "../editor/stores/variable";
import { getVariablesDefaultData } from "../editor/utils/utils";

interface EditorPageProps {
  pageId: string;
  view: "edit" | "preview";
  fromEdit?: boolean;
}

export default function EditorPage({ pageId, view, fromEdit }: EditorPageProps) {
  const page = usePagesStore((state) => state.pages.find((item) => item.id === pageId));
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const currentPage = usePagesStore.getState().pages.find((item) => item.id === pageId);
    if (!currentPage) return;

    let cancelled = false;
    const design = structuredClone(currentPage);
    useComponetsStore.setState({
      components: design.components,
      curComponentId: null,
      curComponent: null,
      editType: "page",
      clipboard: null,
      past: [],
      future: [],
    });
    useVariablesStore.getState().setVariables(design.variables);
    useDataSourceStore.setState({ sources: design.sources, relations: design.relations });
    clearComponentRef();
    queueMicrotask(() => {
      if (!cancelled) setReady(true);
    });

    return () => {
      cancelled = true;
      useDataSourceRuntimeStore.getState().resetAll();
      usePageDataStore.getState().resetData();
      clearComponentRef();
    };
  }, [pageId]);

  useLayoutEffect(() => {
    const componentStore = useComponetsStore.getState();
    componentStore.setMode(view);
    if (view === "preview") componentStore.setCurComponentId(null);

    const pageDataStore = usePageDataStore.getState();
    pageDataStore.resetData();
    pageDataStore.mergeData(getVariablesDefaultData(useVariablesStore.getState().variables));
    useDataSourceRuntimeStore.getState().resetAll();
  }, [view]);

  if (!page) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-muted/30 px-6 text-center">
        <div>
          <h1 className="text-lg font-semibold">页面不存在</h1>
          <p className="mt-2 text-sm text-muted-foreground">该页面可能已被删除，请返回页面列表。</p>
        </div>
        <Button onClick={() => (window.location.hash = "#/pages")}>
          <ArrowLeft />
          返回列表
        </Button>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center gap-2">
        <Spinner />
        <span className="text-sm text-muted-foreground">加载中...</span>
      </div>
    );
  }

  return <Layout pageId={pageId} pageName={page.name} view={view} fromEdit={fromEdit} />;
}
