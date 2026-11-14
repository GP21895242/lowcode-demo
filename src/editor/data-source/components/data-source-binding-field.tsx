import { Field } from "@/components/form";
import { DataSourceSelect } from "./data-source-select";

interface DataSourceBindingFieldProps {
  name?: string;
  label?: string;
  allowEmpty?: boolean;
}

/**
 * 组件属性面板中的“数据源”绑定字段。
 * 写入 props 的形态为 { type: "dataSource", value: { sourceId } }。
 */
export function DataSourceBindingField({
  name = "dataSource",
  label = "数据源",
  allowEmpty = true,
}: DataSourceBindingFieldProps) {
  return (
    <Field name={name} label={label}>
      {({ value, onChange }) => (
        <DataSourceSelect
          allowEmpty={allowEmpty}
          value={value?.value?.sourceId}
          onChange={(sourceId) =>
            onChange(sourceId ? { type: "dataSource", value: { sourceId } } : undefined)
          }
        />
      )}
    </Field>
  );
}
