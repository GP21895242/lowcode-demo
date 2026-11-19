import { Pencil } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import CardTemplateEditor from "../../card-template/editor";
import { openCardTemplateDesign } from "../../card-template/navigation";
import { useCardTemplate } from "../../card-template/store";
import type { CommonComponentProps } from "../../interface";
import CardInstanceView from "./view";

/**
 * 卡片实例（编辑态）：整卡作为单个可选中节点，内部只读预览
 */
export default function CardInstanceDev(props: CommonComponentProps) {
  const { _id, templateId, inputValues, slotMapping } = props;
  const template = useCardTemplate(templateId);
  const [editorOpen, setEditorOpen] = useState(false);

  return (
    <Card
      data-component-id={_id}
      className="w-full border-dashed"
      onDoubleClick={(event) => {
        event.stopPropagation();
        if (template) setEditorOpen(true);
      }}
    >
      <CardHeader className="relative">
        <CardTitle className="pr-8 text-sm">{template?.name ?? "未知卡片模板"}</CardTitle>
        <CardDescription>
          卡片实例 · #{_id} · v{template?.version ?? "-"} · 双击编辑契约或设计模板
        </CardDescription>
        {template ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label="编辑卡片模板"
            title="编辑卡片模板"
            className="absolute top-4 right-4"
            onClick={(event) => {
              event.stopPropagation();
              setEditorOpen(true);
            }}
          >
            <Pencil />
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="pointer-events-none">
        <CardInstanceView
          templateId={templateId}
          componentId={_id}
          inputValues={inputValues}
          slotMapping={slotMapping}
          readonly
        />
      </CardContent>
      <CardTemplateEditor
        open={editorOpen}
        templateId={templateId}
        onClose={() => setEditorOpen(false)}
        onDesign={
          template
            ? () => {
                setEditorOpen(false);
                openCardTemplateDesign(template.id);
              }
            : undefined
        }
      />
    </Card>
  );
}
