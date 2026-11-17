import { ArrowLeft } from "lucide-react";
import { Button } from "../components/ui/button";
import { useCardTemplatesStore } from "../editor/card-template/store";
import Layout from "../editor/layouts";
import { PageProvider } from "../editor/page-store/provider";
import type { PageDesignInput } from "../editor/page-store/types";

interface CardTemplateDesignPageProps {
  templateId: string;
  from?: string;
}

export default function CardTemplateDesignPage({ templateId, from }: CardTemplateDesignPageProps) {
  const template = useCardTemplatesStore((state) =>
    state.templates.find((item) => item.id === templateId),
  );

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

  const design: PageDesignInput = {
    components: [template.impl.root],
    variables: template.impl.variables,
    sources: template.impl.sources,
    relations: template.impl.relations,
    search: null,
    interactions: [],
    dismissedSuggestions: [],
  };

  return (
    <PageProvider key={templateId} pageId={templateId} view="edit" design={design}>
      <Layout view="edit" cardTemplate={{ id: template.id, name: template.name, from }} />
    </PageProvider>
  );
}
