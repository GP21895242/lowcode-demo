import { Field, useFieldValue } from "../../../components/form";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import SettingFormItemInput from "../../common/setting-form-item/input";
import SortableList from "../../common/sortable-list";
import type { FormOption } from "./options";

const TYPE_OPTIONS = [
  { label: "输入框", value: "input" },
  { label: "文本域", value: "textarea" },
  { label: "下拉选择", value: "select" },
  { label: "单选组", value: "radio-group" },
  { label: "多选组", value: "checkbox-group" },
  { label: "日期", value: "date" },
];

const OPTION_TYPES = ["select", "radio-group", "checkbox-group"];

interface OptionsValue {
  type?: string;
  value?: FormOption[];
}

function staticValue(value: any) {
  return { type: "static" as const, value };
}

function OptionsEditor({
  value,
  onChange,
}: {
  value?: OptionsValue;
  onChange?: (next: OptionsValue) => void;
}) {
  const items: FormOption[] = Array.isArray(value?.value) ? value.value : [];

  function emit(next: FormOption[]) {
    onChange?.(staticValue(next));
  }

  return (
    <div>
      <SortableList
        items={items}
        onDelete={(_, index: number) => emit(items.filter((__, itemIndex) => itemIndex !== index))}
        itemRender={(item: FormOption, index: number) => (
          <Input
            value={item.label}
            placeholder="选项文案"
            onChange={(event) =>
              emit(
                items.map((option, optionIndex) =>
                  optionIndex === index ? { ...option, label: event.target.value } : option,
                ),
              )
            }
          />
        )}
        onSortEnd={({ oldIndex, newIndex }) => {
          if (oldIndex === newIndex || newIndex < 0) return;

          const next = [...items];
          const [moved] = next.splice(oldIndex, 1);
          next.splice(newIndex, 0, moved);
          emit(next);
        }}
      />
      <Button
        variant="outline"
        className="w-full border-dashed"
        onClick={() => {
          emit([...items, { key: new Date().getTime(), label: `选项${items.length + 1}` }]);
        }}
      >
        添加选项
      </Button>
    </div>
  );
}

function Setter() {
  const type = useFieldValue("type");
  const showOptions = typeof type === "string" && OPTION_TYPES.includes(type);

  return (
    <>
      <Field name="type" label="类型">
        {({ value, onChange }) => (
          <Select value={value ?? "input"} onValueChange={onChange} items={TYPE_OPTIONS}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </Field>
      <Field name="label" label="标题">
        {({ value, onChange }) => <SettingFormItemInput value={value} onChange={onChange} />}
      </Field>
      <Field name="name" label="字段">
        {({ value, onChange }) => <SettingFormItemInput value={value} onChange={onChange} />}
      </Field>
      <Field name="rules" label="校验">
        {({ value, onChange }) => (
          <Select
            value={value ?? ""}
            onValueChange={onChange}
            items={[{ label: "必输", value: "required" }]}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="无" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="required">必输</SelectItem>
            </SelectContent>
          </Select>
        )}
      </Field>
      {showOptions ? (
        <Field name="options" label="选项">
          {({ value, onChange }) => <OptionsEditor value={value} onChange={onChange} />}
        </Field>
      ) : null}
    </>
  );
}

export default Setter;
