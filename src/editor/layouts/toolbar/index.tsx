import { ArrowLeft, CircleArrowUp, Pencil, Play, Save, Sparkles, Waypoints } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "../../../components/ui/button";
import { toast } from "../../../components/ui/toast";
import AppHeader, { type AppBreadcrumbItem } from "../../../pages/app-header";
import CardTemplateEditor from "../../card-template/editor";
import { useCardTemplatesStore } from "../../card-template/store";
import CardUpgradeDialog from "../../card-template/upgrade-dialog";
import { scanUpgrades } from "../../card-template/upgrade";
import { useDataSourceStore } from "../../data-source/store";
import { useInteractionStore } from "../../interaction/runtime";
import { ItemType } from "../../item-type";
import PageGraphDialog from "../../resource/graph-dialog";
import { getMergeSuggestions } from "../../resource/scan-cache";
import { useSuggestionStore } from "../../resource/suggestion-store";
import { useComponetsStore } from "../../stores/components";
import { saveCurrentPageDesign } from "../../utils/page-save";
import { useVariablesStore } from "../../stores/variable";

interface ToolbarProps {
  pageId?: string;
  pageName?: string;
  view: "edit" | "preview";
  fromEdit?: boolean;
  cardTemplate?: { id: string; name: string; from?: string };
}

const Toolbar: React.FC<ToolbarProps> = ({ pageId, pageName, view, fromEdit, cardTemplate }) => {
  const editHref = pageId ? `#/pages/${encodeURIComponent(pageId)}/edit` : "#/pages";
  const components = useComponetsStore((state) => state.components);
  const sources = useDataSourceStore((state) => state.sources);
  const templates = useCardTemplatesStore((state) => state.templates);
  const interactions = useInteractionStore((state) => state.interactions);
  const dismissedIds = useSuggestionStore((state) => state.dismissedIds);
  const openSuggestions = useSuggestionStore((state) => state.openDialog);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [graphOpen, setGraphOpen] = useState(false);
  const [contractOpen, setContractOpen] = useState(false);
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
  const breadcrumbs: AppBreadcrumbItem[] = cardTemplate
    ? [
        { label: "首页", href: "#/pages" },
        { label: "页面列表", href: "#/pages" },
        { label: `设计卡片模板：${cardTemplate.name}` },
      ]
    : view === "edit"
      ? [{ label: "首页", href: "#/pages" }, { label: `编辑：${pageName}` }]
      : [
          { label: "首页", href: "#/pages" },
          ...(fromEdit ? [{ label: `编辑：${pageName}`, href: editHref }] : []),
          { label: fromEdit ? "预览" : `预览：${pageName}` },
        ];

  function enterPreview() {
    if (!pageId) return;
    window.location.hash = `#/pages/${encodeURIComponent(pageId)}/preview?from=edit`;
  }

  function handleSave() {
    if (!pageId) return;

    saveCurrentPageDesign(pageId);
    toast.add({ title: "页面保存成功", type: "success" });
  }

  /** 卡片模板只保存内部实现，契约变更仍由暴露接口面板维护 */
  function handleSaveTemplate() {
    if (!cardTemplate) return;

    const root = useComponetsStore.getState().components[0];
    if (!root || root.name !== ItemType.Card) {
      toast.add({ title: "卡片模板根节点必须是卡片", type: "error" });
      return;
    }

    const { sources: currentSources, relations } = useDataSourceStore.getState();
    useCardTemplatesStore.getState().updateTemplate(cardTemplate.id, {
      impl: {
        root: structuredClone(root),
        sources: structuredClone(currentSources),
        relations: structuredClone(relations),
        variables: structuredClone(useVariablesStore.getState().variables),
      },
    });
    toast.add({ title: "卡片模板已保存，引用页面将同步内部实现", type: "success" });
  }

  function goBack() {
    window.location.hash = cardTemplate?.from || "#/pages";
  }

  const templateActions = cardTemplate ? (
    <>
      <Button size="sm" variant="ghost" onClick={goBack}>
        <ArrowLeft />
        返回
      </Button>
      <Button size="sm" variant="ghost" onClick={() => setContractOpen(true)}>
        <Pencil />
        暴露接口
      </Button>
      <Button size="sm" onClick={handleSaveTemplate}>
        <Save />
        保存模板
      </Button>
    </>
  ) : null;

  return (
    <>
      <AppHeader
        breadcrumbs={breadcrumbs}
        actions={
          cardTemplate ? (
            templateActions
          ) : view === "edit" ? (
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
      {cardTemplate ? (
        <CardTemplateEditor
          open={contractOpen}
          templateId={cardTemplate.id}
          onClose={() => setContractOpen(false)}
        />
      ) : null}
    </>
  );
};

export default Toolbar;
