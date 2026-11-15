import { Pencil, Play, Save } from "lucide-react";
import AppHeader, { type AppBreadcrumbItem } from "../../../pages/app-header";
import { Button } from "../../../components/ui/button";
import { toast } from "../../../components/ui/toast";
import { useDataSourceStore } from "../../data-source/store";
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
      interactions: currentPage?.interactions ?? [],
      search: usePageSearchStore.getState().config ?? currentPage?.search,
      dismissedSuggestions: currentPage?.dismissedSuggestions ?? [],
    });
    toast.add({ title: "页面保存成功", type: "success" });
  }

  return (
    <AppHeader
      breadcrumbs={breadcrumbs}
      actions={
        view === "edit" ? (
          <>
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
  );
};

export default Toolbar;
