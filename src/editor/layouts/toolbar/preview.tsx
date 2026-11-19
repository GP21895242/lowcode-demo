import { Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import AppHeader, { type AppBreadcrumbItem } from "@/pages/app-header";

interface PreviewToolbarProps {
  pageId?: string;
  pageName?: string;
  fromEdit?: boolean;
}

/**
 * 预览态工具栏：只提供返回编辑入口，不引用设计态 store
 */
const PreviewToolbar: React.FC<PreviewToolbarProps> = ({ pageId, pageName, fromEdit }) => {
  const editHref = pageId ? `#/pages/${encodeURIComponent(pageId)}/edit` : "#/pages";
  const breadcrumbs: AppBreadcrumbItem[] = [
    { label: "首页", href: "#/pages" },
    ...(fromEdit ? [{ label: `编辑：${pageName}`, href: editHref }] : []),
    { label: fromEdit ? "预览" : `预览：${pageName}` },
  ];

  return (
    <AppHeader
      breadcrumbs={breadcrumbs}
      actions={
        <Button size="sm" variant="outline" onClick={() => (window.location.hash = editHref)}>
          <Pencil />
          编辑页面
        </Button>
      }
    />
  );
};

export default PreviewToolbar;
