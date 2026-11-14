import { Field } from "@/components/form";
import { Input } from "@/components/ui/input";
import { DataSourceBindingField } from "@/editor/data-source/components/data-source-binding-field";

function Setter() {
  return (
    <>
      <DataSourceBindingField />
      <Field name="url" label="URL（旧版兼容）">
        {({ value, onChange }) => (
          <Input
            value={value ?? ""}
            onChange={(event) => onChange(event.target.value)}
            placeholder="绑定数据源后可留空"
          />
        )}
      </Field>
      <p className="px-3 py-2 text-xs text-muted-foreground">
        绑定数据源后，表格使用数据源返回的行数据；URL 仅用于兼容旧配置。
      </p>
    </>
  );
}

export default Setter;
