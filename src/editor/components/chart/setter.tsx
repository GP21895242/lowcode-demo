import { Field, useFieldValue } from "@/components/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataSourceBindingField } from "@/editor/data-source/components/data-source-binding-field";
import { FieldSelect } from "@/editor/data-source/components/field-select";

const CHART_TYPES = [
  { label: "柱状图", value: "bar" },
  { label: "折线图", value: "line" },
];

function staticValue(value: any) {
  return { type: "static" as const, value };
}

function Setter() {
  const dataSource = useFieldValue("dataSource");
  const sourceId = (dataSource as any)?.value?.sourceId as string | undefined;

  return (
    <>
      <Field name="title" label="标题">
        {({ value, onChange }) => (
          <Input
            value={value?.value ?? ""}
            onChange={(event) => onChange(staticValue(event.target.value))}
          />
        )}
      </Field>
      <Field name="chartType" label="图表类型">
        {({ value, onChange }) => (
          <Select
            value={value?.value ?? "bar"}
            onValueChange={(next) => onChange(staticValue(next))}
            items={CHART_TYPES}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CHART_TYPES.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </Field>

      <DataSourceBindingField />

      <Field name="xField" label="维度字段">
        {({ value, onChange }) => (
          <FieldSelect
            sourceId={sourceId}
            value={value?.value}
            onChange={(next) => onChange(staticValue(next))}
            placeholder="默认 label"
          />
        )}
      </Field>
      <Field name="yField" label="数值字段">
        {({ value, onChange }) => (
          <FieldSelect
            sourceId={sourceId}
            value={value?.value}
            onChange={(next) => onChange(staticValue(next))}
            placeholder="默认 value"
          />
        )}
      </Field>

      <Field name="data" label="静态数据（未绑定数据源时生效）">
        {({ value, onChange }) => (
          <Input
            value={value?.value ?? ""}
            onChange={(event) => onChange(staticValue(event.target.value))}
          />
        )}
      </Field>

      <p className="px-3 py-2 text-xs text-muted-foreground">
        绑定数据源后，图表点击会自动触发关联数据源联动。
      </p>
    </>
  );
}

export default Setter;
