import { Field } from "../../components/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import type { ComponentSetter } from "../interface";
import SettingFormItemInput from "./setting-form-item/input";
import SettingFormItemOptions from "./setting-form-item/options";

/** 解包 { type, value } 形式的属性值 */
function unwrap(value: any) {
  return value && typeof value === "object" && "value" in value ? value.value : value;
}

function CommonSetter({ setters }: { setters: ComponentSetter[] }) {
  return (
    <>
      {(setters || []).map((setter) => (
        <Field key={setter.name} name={setter.name} label={setter.label}>
          {({ value, onChange }) => {
            if (setter.type === "select") {
              return (
                <Select
                  value={unwrap(value)}
                  onValueChange={(next) => onChange({ type: "static", value: next })}
                  items={setter.options}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {setter.options.map((option: { label: string; value: string }) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              );
            }

            if (setter.type === "options") {
              return <SettingFormItemOptions value={value} onChange={onChange} />;
            }

            return <SettingFormItemInput value={value} onChange={onChange} />;
          }}
        </Field>
      ))}
    </>
  );
}

export default CommonSetter;
