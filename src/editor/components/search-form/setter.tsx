import { useState } from "react";

import { Field } from "../../../components/form";
import { Button } from "../../../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import { DataSourceSelect } from "../../data-source/components/data-source-select";
import { useDataSourceFields } from "../../data-source/hooks";
import { ItemType } from "../../item-type";
import { useComponetsStore } from "../../stores/components";

const LABEL_POSITION_OPTIONS = [
  { label: "左侧", value: "left" },
  { label: "顶部", value: "top" },
];

function unwrap(value: any) {
  return value && typeof value === "object" && "value" in value ? value.value : value;
}

function Setter() {
  const curComponent = useComponetsStore((state) => state.curComponent);
  const addComponent = useComponetsStore((state) => state.addComponent);
  const [sourceId, setSourceId] = useState<string | undefined>();

  const fields = useDataSourceFields(sourceId);
  const searchableFields = fields.filter((field) => field.searchable);

  function generate() {
    if (!curComponent || !sourceId) return;

    const existing = new Set(
      (curComponent.children ?? [])
        .filter((item) => item.name === ItemType.SearchFormItem)
        .map((item) => item.props?.dataKey?.value),
    );

    const base = Date.now();
    searchableFields.forEach((field, index) => {
      if (existing.has(field.dataKey)) return;

      addComponent(
        {
          id: base + index,
          name: ItemType.SearchFormItem,
          desc: field.label,
          props: {
            name: { type: "static", value: `${sourceId}_${field.dataKey}` },
            label: { type: "static", value: field.label },
            sourceId: { type: "static", value: sourceId },
            dataKey: { type: "static", value: field.dataKey },
            type: { type: "static", value: "auto" },
          },
        },
        curComponent.id,
      );
    });
  }

  return (
    <div className="py-2">
      <Field name="labelPosition" label="标签位置">
        {({ value, onChange }) => (
          <Select
            value={unwrap(value) ?? "left"}
            onValueChange={(next) => onChange({ type: "static", value: next })}
            items={LABEL_POSITION_OPTIONS}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LABEL_POSITION_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </Field>

      <div className="mb-3 flex items-start gap-3">
        <span className="w-[92px] shrink-0 pt-2 text-right text-sm text-muted-foreground">
          数据源
        </span>
        <div className="min-w-0 flex-1">
          <DataSourceSelect
            value={sourceId}
            onChange={setSourceId}
            placeholder="选择要生成搜索项的数据源"
          />
        </div>
      </div>

      <div className="mb-2 flex flex-wrap gap-1 px-3">
        {searchableFields.length ? (
          searchableFields.map((field) => (
            <span
              key={field.dataKey}
              className="rounded-sm bg-muted px-2 py-0.5 text-xs text-muted-foreground"
            >
              {field.label}
            </span>
          ))
        ) : (
          <span className="text-xs text-muted-foreground">
            {sourceId ? "该数据源暂无可查询字段" : "选择数据源后可查看可查询字段"}
          </span>
        )}
      </div>

      <div className="px-3">
        <Button
          variant="outline"
          className="w-full border-dashed"
          disabled={!sourceId || !searchableFields.length}
          onClick={generate}
        >
          根据 Schema 生成搜索项
        </Button>
      </div>
    </div>
  );
}

export default Setter;
