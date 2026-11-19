import { Field, useFieldValue } from "@/components/form";
import { Input } from "@/components/ui/input";
import { DataSourceBindingField } from "@/editor/data-source/components/data-source-binding-field";
import { FieldSelect } from "@/editor/data-source/components/field-select";

function staticValue(value: any) {
  return { type: "static" as const, value };
}

function Setter() {
  const dataSource = useFieldValue("dataSource");
  const sourceId = (dataSource as any)?.value?.sourceId as string | undefined;

  return (
    <>
      <DataSourceBindingField />
      <Field name="keyField" label="行唯一键">
        {({ value, onChange }) => (
          <FieldSelect
            sourceId={sourceId}
            value={value?.value}
            onChange={(next) => onChange(staticValue(next))}
            placeholder="默认使用 id / 行序号"
          />
        )}
      </Field>
      <Field name="scopeName" label="变量前缀">
        {({ value, onChange }) => (
          <Input
            value={value?.value ?? ""}
            placeholder="row"
            onChange={(event) => onChange(staticValue(event.target.value))}
          />
        )}
      </Field>
      <p className="px-3 py-2 text-xs text-muted-foreground">
        循环容器按数据源每行展开一次子组件；子组件属性可绑定「当前行字段」，如
        {" ${row.title}"}。
      </p>
    </>
  );
}

export default Setter;
