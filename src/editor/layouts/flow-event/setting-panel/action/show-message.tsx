import { Field } from "@/components/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const typeOptions = [
  { label: "成功", value: "success" },
  { label: "失败", value: "error" },
];

const ShowMessageSetting = () => {
  return (
    <>
      <Field name="config.type" label="类型">
        {({ value, onChange }) => (
          <Select value={value} onValueChange={onChange} items={typeOptions}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {typeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </Field>
      <Field name="config.text" label="文本">
        {({ value, onChange }) => (
          <Input value={value ?? ""} onChange={(event) => onChange(event.target.value)} />
        )}
      </Field>
    </>
  );
};

export default ShowMessageSetting;
