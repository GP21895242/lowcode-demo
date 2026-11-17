import CardErrorBoundary from "../../card-template/error-boundary";
import CardInternalRenderer from "../../card-template/internal-renderer";
import { CardRuntimeProvider } from "../../card-template/runtime-provider";
import { useCardTemplate } from "../../card-template/store";

interface CardInstanceViewProps {
  templateId?: string;
  componentId?: number;
  inputValues?: Record<string, any>;
  slotMapping?: Record<string, string>;
  onEmit?: (event: string, payload: any) => void;
  readonly?: boolean;
}

/**
 * 卡片实例渲染入口：错误边界 + 独立运行时 + 内部渲染
 */
export default function CardInstanceView({
  templateId,
  componentId,
  inputValues,
  slotMapping,
  onEmit,
  readonly,
}: CardInstanceViewProps) {
  const template = useCardTemplate(templateId);

  if (!template) {
    return (
      <div className="rounded-md border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
        卡片模板不存在，请重新插入或检查模板是否被删除
      </div>
    );
  }

  if (!componentId) {
    return (
      <div className="rounded-md border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
        卡片实例缺少 componentId，无法建立独立运行时
      </div>
    );
  }

  return (
    <CardErrorBoundary key={`${template.id}@${template.version}`} title={template.name}>
      <CardRuntimeProvider
        template={template}
        componentId={componentId}
        inputs={inputValues}
        slotMapping={slotMapping}
        onEmit={onEmit}
      >
        <CardInternalRenderer readonly={readonly} />
      </CardRuntimeProvider>
    </CardErrorBoundary>
  );
}
