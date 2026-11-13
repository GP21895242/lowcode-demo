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

function CommonSetter({ setters }: { setters: ComponentSetter[] }) {
  return (
    <>
      {(setters || []).map((setter) => (
        <Field key={setter.name} name={setter.name} label={setter.label}>
          {({ value, onChange }) => {
            if (setter.type === "select") {
              return (
                <Select value={value} onValueChange={onChange} items={setter.options}>
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

            return <SettingFormItemInput value={value} onChange={onChange} />;
          }}
        </Field>
      ))}
    </>
  );
}

export default CommonSetter;
