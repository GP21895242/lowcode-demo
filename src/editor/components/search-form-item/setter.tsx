import { Field, useFieldValue } from "@/components/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataSourceSelect } from "@/editor/data-source/components/data-source-select";
import { FieldSelect } from "@/editor/data-source/components/field-select";
import { useDataSourceFields } from "@/editor/data-source/hooks";

const CONTROL_TYPES = [
  { label: "跟随字段", value: "auto" },
  { label: "输入框", value: "input" },
  { label: "下拉选择", value: "select" },
  { label: "日期", value: "date" },
];

function staticValue(value: any) {
  return { type: "static" as const, value };
}

function Setter() {
  const sourceId = useFieldValue("sourceId")?.value as string | undefined;
  const dataKey = useFieldValue("dataKey")?.value as string | undefined;
  const fields = useDataSourceFields(sourceId);
  const field = fields.find((item) => item.dataKey === dataKey);

  return (
    <>
      <Field name="sourceId" label="数据源">
        {({ value, onChange }) => (
          <DataSourceSelect
            value={value?.value}
            onChange={(next) => onChange(next ? staticValue(next) : undefined)}
          />
        )}
      </Field>
      <Field name="dataKey" label="查询字段">
        {({ value, onChange }) => (
          <FieldSelect
            sourceId={sourceId}
            value={value?.value}
            filter={(item) => item.searchable}
            onChange={(next) => onChange(staticValue(next))}
          />
        )}
      </Field>
      <Field name="label" label="标题">
        {({ value, onChange }) => (
          <Input
            value={value?.value ?? ""}
            placeholder={field?.label ?? "默认使用字段显示名"}
            onChange={(event) => onChange(staticValue(event.target.value))}
          />
        )}
      </Field>
      <Field name="type" label="控件类型">
        {({ value, onChange }) => (
          <Select
            value={value?.value ?? "auto"}
            onValueChange={(next) => onChange(staticValue(next))}
            items={CONTROL_TYPES}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CONTROL_TYPES.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </Field>
      <p className="px-3 py-2 text-xs text-muted-foreground">
        仅可选择数据源中标记为“支持查询”的字段；搜索时会按数据源分组重新加载数据。
      </p>
    </>
  );
}

export default Setter;
