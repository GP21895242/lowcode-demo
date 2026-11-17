import { Settings, X } from "lucide-react";
import { useMemo, useState } from "react";

import { Field } from "@/components/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import CardTemplateEditor from "../../card-template/editor";
import { openCardTemplateDesign } from "../../card-template/navigation";
import { useCardTemplate, useCardTemplatesStore } from "../../card-template/store";
import type { CardInputDef } from "../../card-template/types";
import SelectVariableModal from "../../common/select-variable-modal";
import { DataSourceSelect } from "../../data-source/components/data-source-select";
import { useDataSourceStore } from "../../data-source/store";
import { getMergeSuggestions } from "../../resource/scan-cache";
import { useSuggestionStore } from "../../resource/suggestion-store";
import { useComponetsStore } from "../../stores/components";

interface InputBindingValue {
  type: "static" | "variable";
  value: any;
}

function CardInputControl({
  definition,
  value,
  onChange,
}: {
  definition: CardInputDef;
  value?: InputBindingValue;
  onChange: (value: InputBindingValue) => void;
}) {
  const [variableOpen, setVariableOpen] = useState(false);
  const isVariable = value?.type === "variable";
  const staticValue = value?.type === "static" ? value.value : undefined;

  function setStatic(next: any) {
    onChange({ type: "static", value: next });
  }

  function renderStaticControl() {
    if (definition.type === "boolean") {
      return (
        <Switch checked={staticValue ?? !!definition.defaultValue} onCheckedChange={setStatic} />
      );
    }

    if (definition.type === "select") {
      const options = definition.options ?? [];
      return (
        <Select value={staticValue} onValueChange={setStatic} items={options}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="请选择" />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={String(option.value)} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    return (
      <Input
        type={definition.type === "number" ? "number" : "text"}
        value={staticValue ?? ""}
        placeholder={
          definition.defaultValue === undefined
            ? "请输入"
            : `默认：${String(definition.defaultValue)}`
        }
        onChange={(event) => {
          const next = event.target.value;
          setStatic(definition.type === "number" && next !== "" ? Number(next) : next);
        }}
      />
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <div className="min-w-0 flex-1">
        {isVariable ? (
          <Input value={`{{ ${String(value.value)} }}`} disabled />
        ) : (
          renderStaticControl()
        )}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        title="绑定页面变量"
        aria-label="绑定页面变量"
        className={isVariable ? "text-primary" : "text-muted-foreground"}
        onClick={() => setVariableOpen(true)}
      >
        <Settings />
      </Button>
      {isVariable ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          title="清除变量绑定"
          aria-label="清除变量绑定"
          className="text-muted-foreground"
          onClick={() => setStatic(undefined)}
        >
          <X />
        </Button>
      ) : null}
      <SelectVariableModal
        open={variableOpen}
        onCancel={() => setVariableOpen(false)}
        onSelect={(variable) => {
          const name =
            variable.scope === "search" && !String(variable.name).startsWith("search.")
              ? `search.${variable.name}`
              : variable.name;
          onChange({ type: "variable", value: name });
        }}
      />
    </div>
  );
}

/** 卡片实例设置器完全由模板 Contract 生成，页面无法读取或覆盖内部组件属性 */
export default function CardInstanceSetter() {
  const curComponent = useComponetsStore((state) => state.curComponent);
  const components = useComponetsStore((state) => state.components);
  const sources = useDataSourceStore((state) => state.sources);
  const templates = useCardTemplatesStore((state) => state.templates);
  const dismissedIds = useSuggestionStore((state) => state.dismissedIds);
  const template = useCardTemplate(curComponent?.props?.templateId);
  const [editorOpen, setEditorOpen] = useState(false);

  const pendingSuggestions = useMemo(() => {
    if (!curComponent) return 0;

    return getMergeSuggestions({ components, sources, templates }).filter(
      (suggestion) =>
        !dismissedIds.includes(suggestion.id) &&
        suggestion.candidates.some((candidate) => candidate.componentId === curComponent.id),
    ).length;
  }, [components, curComponent, dismissedIds, sources, templates]);

  if (!curComponent || !template) {
    return <p className="py-3 text-xs text-muted-foreground">卡片模板不存在，无法生成配置面板</p>;
  }

  return (
    <div className="border-t border-border pt-3">
      <div className="mb-4 flex items-center justify-between gap-2 rounded-md bg-muted/50 p-2">
        <div className="min-w-0">
          <div className="truncate text-xs font-medium">{template.name}</div>
          <div className="mt-0.5 text-[11px] text-muted-foreground">
            模板 v{template.version} · 实例 v{curComponent.props.templateVersion}
          </div>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => setEditorOpen(true)}>
          编辑契约
        </Button>
      </div>

      {pendingSuggestions > 0 ? (
        <p className="mb-3 rounded-md bg-muted/60 p-2 text-[11px] text-muted-foreground">
          当前实例存在 {pendingSuggestions} 条优化建议，可在数据源面板查看，系统不会自动合并。
        </p>
      ) : null}

      {template.contract.inputs.map((input) => (
        <Field
          key={input.key}
          name={["inputValues", input.key]}
          label={input.label}
          required={input.required}
        >
          {({ value, onChange }) => (
            <CardInputControl definition={input} value={value} onChange={onChange} />
          )}
        </Field>
      ))}

      {(template.contract.slots ?? []).length ? (
        <div className="mt-4 border-t border-border pt-3">
          <div className="mb-2 text-xs font-medium">数据源插槽</div>
          <p className="mb-3 text-[11px] text-muted-foreground">
            仅手动映射页面数据源，系统不会自动合并。
          </p>
          {(template.contract.slots ?? []).map((slot) => (
            <Field
              key={slot.key}
              name={["slotMapping", slot.key]}
              label={slot.label}
              required={slot.required}
            >
              {({ value, onChange }) => (
                <DataSourceSelect value={value} onChange={onChange} placeholder="选择页面数据源" />
              )}
            </Field>
          ))}
        </div>
      ) : null}

      <CardTemplateEditor
        open={editorOpen}
        templateId={template.id}
        onClose={() => setEditorOpen(false)}
        onDesign={() => {
          setEditorOpen(false);
          openCardTemplateDesign(template.id);
        }}
      />
    </div>
  );
}
