import { CircleArrowUp, Pencil, Play, Save, Sparkles, Waypoints } from "lucide-react";
import { useMemo, useState } from "react";

import AppHeader, { type AppBreadcrumbItem } from "../../../pages/app-header";
import { Button } from "../../../components/ui/button";
import { toast } from "../../../components/ui/toast";
import { useCardTemplatesStore } from "../../card-template/store";
import CardUpgradeDialog from "../../card-template/upgrade-dialog";
import { scanUpgrades } from "../../card-template/upgrade";
import { useDataSourceStore } from "../../data-source/store";
import { useInteractionStore } from "../../interaction/runtime";
import PageGraphDialog from "../../resource/graph-dialog";
import { getMergeSuggestions } from "../../resource/scan-cache";
import { useSuggestionStore } from "../../resource/suggestion-store";
import { usePageSearchStore } from "../../search/store";
import { useComponetsStore } from "../../stores/components";
import { PAGE_SCHEMA_VERSION, usePagesStore } from "../../stores/pages";
import { useVariablesStore } from "../../stores/variable";

interface ToolbarProps {
  pageId: string;
  pageName: string;
  view: "edit" | "preview";
  fromEdit?: boolean;
}

const Toolbar: React.FC<ToolbarProps> = ({ pageId, pageName, view, fromEdit }) => {
  const editHref = `#/pages/${encodeURIComponent(pageId)}/edit`;
  const components = useComponetsStore((state) => state.components);
  const sources = useDataSourceStore((state) => state.sources);
  const templates = useCardTemplatesStore((state) => state.templates);
  const interactions = useInteractionStore((state) => state.interactions);
  const dismissedIds = useSuggestionStore((state) => state.dismissedIds);
  const openSuggestions = useSuggestionStore((state) => state.openDialog);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [graphOpen, setGraphOpen] = useState(false);
  const suggestionCount = useMemo(
    () =>
      getMergeSuggestions({ components, sources, templates }).filter(
        (suggestion) => !dismissedIds.includes(suggestion.id),
      ).length,
    [components, dismissedIds, sources, templates],
  );
  const upgradeCount = useMemo(
    () => scanUpgrades({ components, templates, interactions }).length,
    [components, interactions, templates],
  );
  const breadcrumbs: AppBreadcrumbItem[] =
    view === "edit"
      ? [{ label: "首页", href: "#/pages" }, { label: `编辑：${pageName}` }]
      : [
          { label: "首页", href: "#/pages" },
          ...(fromEdit ? [{ label: `编辑：${pageName}`, href: editHref }] : []),
          { label: fromEdit ? "预览" : `预览：${pageName}` },
        ];

  function enterPreview() {
    window.location.hash = `#/pages/${encodeURIComponent(pageId)}/preview?from=edit`;
  }

  function handleSave() {
    const { components } = useComponetsStore.getState();
    const { sources, relations } = useDataSourceStore.getState();
    const currentPage = usePagesStore.getState().pages.find((item) => item.id === pageId);

    usePagesStore.getState().savePage(pageId, {
      schemaVersion: PAGE_SCHEMA_VERSION,
      components,
      variables: useVariablesStore.getState().variables,
      sources,
      relations,
      interactions: useInteractionStore.getState().interactions,
      search: usePageSearchStore.getState().config ?? currentPage?.search,
      dismissedSuggestions: useSuggestionStore.getState().dismissedIds,
    });
    toast.add({ title: "页面保存成功", type: "success" });
  }

  return (
    <>
      <AppHeader
        breadcrumbs={breadcrumbs}
        actions={
          view === "edit" ? (
            <>
              {upgradeCount > 0 ? (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setUpgradeOpen(true)}
                  title="模板升级"
                >
                  <CircleArrowUp />
                  升级 {upgradeCount}
                </Button>
              ) : null}
              {suggestionCount > 0 ? (
                <Button size="sm" variant="ghost" onClick={openSuggestions} title="优化建议">
                  <Sparkles />
                  建议 {suggestionCount}
                </Button>
              ) : null}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setGraphOpen(true)}
                title="页面连线图"
                aria-label="页面连线图"
              >
                <Waypoints />
                连线
              </Button>
              <Button size="sm" variant="outline" onClick={handleSave}>
                <Save />
                保存
              </Button>
              <Button size="sm" onClick={enterPreview}>
                <Play />
                预览
              </Button>
            </>
          ) : (
            <Button size="sm" variant="outline" onClick={() => (window.location.hash = editHref)}>
              <Pencil />
              编辑页面
            </Button>
          )
        }
      />
      <CardUpgradeDialog open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
      <PageGraphDialog open={graphOpen} onClose={() => setGraphOpen(false)} />
    </>
  );
};

export default Toolbar;
