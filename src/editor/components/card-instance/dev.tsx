import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { useCardTemplate } from "../../card-template/store";
import type { CommonComponentProps } from "../../interface";
import CardInstanceView from "./view";

/**
 * 卡片实例（编辑态）：整卡作为单个可选中节点，内部只读预览
 */
export default function CardInstanceDev(props: CommonComponentProps) {
  const { _id, templateId, scopeId, inputValues, slotMapping } = props;
  const template = useCardTemplate(templateId);

  return (
    <Card data-component-id={_id} className="w-full border-dashed">
      <CardHeader>
        <CardTitle className="text-sm">{template?.name ?? "未知卡片模板"}</CardTitle>
        <CardDescription>
          卡片实例 · {scopeId ?? "未设置"} · v{template?.version ?? "-"}
        </CardDescription>
      </CardHeader>
      <CardContent className="pointer-events-none">
        <CardInstanceView
          templateId={templateId}
          scopeId={scopeId}
          inputValues={inputValues}
          slotMapping={slotMapping}
          readonly
        />
      </CardContent>
    </Card>
  );
}
