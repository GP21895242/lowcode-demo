import { ArrowLeft } from "lucide-react";
import { useEffect, useLayoutEffect, useState } from "react";
import { Button } from "../components/ui/button";
import { Spinner } from "../components/ui/spinner";
import { useCardTemplatesStore } from "../editor/card-template/store";
import { useDataSourceRuntimeStore } from "../editor/data-source/runtime";
import { useDataSourceStore } from "../editor/data-source/store";
import { useInteractionStore } from "../editor/interaction/runtime";
import Layout from "../editor/layouts";
import { useSuggestionStore } from "../editor/resource/suggestion-store";
import { usePageSearchStore } from "../editor/search/store";
import { clearComponentRef } from "../editor/stores/component-ref";
import { useComponetsStore } from "../editor/stores/components";
import { usePageDataStore } from "../editor/stores/page-data";
import { useVariablesStore } from "../editor/stores/variable";
import { getVariablesDefaultData } from "../editor/utils/utils";

interface CardTemplateDesignPageProps {
  templateId: string;
  from?: string;
}

export default function CardTemplateDesignPage({ templateId, from }: CardTemplateDesignPageProps) {
  const template = useCardTemplatesStore((state) =>
    state.templates.find((item) => item.id === templateId),
  );
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const current = useCardTemplatesStore
      .getState()
      .templates.find((item) => item.id === templateId);
    if (!current) return;

    let cancelled = false;
    const impl = structuredClone(current.impl);
    useComponetsStore.setState({
      components: [impl.root],
      curComponentId: null,
      curComponent: null,
      editType: "page",
      clipboard: null,
      past: [],
      future: [],
    });
    useVariablesStore.getState().setVariables(impl.variables);
    useDataSourceStore.setState({
      sources: impl.sources,
      relations: impl.relations,
    });
    usePageSearchStore.getState().setConfig(null);
    useInteractionStore.getState().setInteractions([]);
    useSuggestionStore.getState().setDismissedIds([]);
    clearComponentRef();
    queueMicrotask(() => {
      if (!cancelled) setReady(true);
    });

    return () => {
      cancelled = true;
      useDataSourceRuntimeStore.getState().resetAll();
      usePageDataStore.getState().resetData();
      usePageSearchStore.getState().setConfig(null);
      useInteractionStore.getState().setInteractions([]);
      useSuggestionStore.getState().setDismissedIds([]);
      clearComponentRef();
    };
  }, [templateId]);

  useLayoutEffect(() => {
    const componentStore = useComponetsStore.getState();
    componentStore.setMode("edit");
    componentStore.setCurComponentId(null);

    const pageDataStore = usePageDataStore.getState();
    pageDataStore.resetData();
    pageDataStore.mergeData(getVariablesDefaultData(useVariablesStore.getState().variables));
    useDataSourceRuntimeStore.getState().resetAll();
  }, [templateId]);

  if (!template) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-muted/30 px-6 text-center">
        <div>
          <h1 className="text-lg font-semibold">卡片模板不存在</h1>
          <p className="mt-2 text-sm text-muted-foreground">该模板可能已被删除，请返回页面列表。</p>
        </div>
        <Button onClick={() => (window.location.hash = from || "#/pages")}>
          <ArrowLeft />
          返回
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

  return <Layout view="edit" cardTemplate={{ id: template.id, name: template.name, from }} />;
}
