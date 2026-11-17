import { ArrowLeft } from "lucide-react";
import { Button } from "../components/ui/button";
import Layout from "../editor/layouts";
import { PageProvider } from "../editor/page-store/provider";
import { usePagesStore } from "../editor/stores/pages";

interface EditorPageProps {
  pageId: string;
  view: "edit" | "preview";
  fromEdit?: boolean;
}

export default function EditorPage({ pageId, view, fromEdit }: EditorPageProps) {
  const page = usePagesStore((state) => state.pages.find((item) => item.id === pageId));

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

  return (
    <PageProvider key={`${pageId}:${view}`} pageId={pageId} view={view} design={page}>
      <Layout pageId={pageId} pageName={page.name} view={view} fromEdit={fromEdit} />
    </PageProvider>
  );
}
