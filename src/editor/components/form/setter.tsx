import { Field } from "@/components/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import SettingFormItemInput from "../../common/setting-form-item/input";

const LABEL_POSITION_OPTIONS = [
  { label: "左侧", value: "left" },
  { label: "顶部", value: "top" },
];

function unwrap(value: any) {
  return value && typeof value === "object" && "value" in value ? value.value : value;
}

function Setter() {
  return (
    <>
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
      <Field name="defaultValue" label="默认值">
        {({ value, onChange }) => <SettingFormItemInput value={value} onChange={onChange} />}
      </Field>
    </>
  );
}

export default Setter;
