import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CommonComponentProps } from "../../interface";
import { normalizeOptions } from "../form-item/options";
import { FormField } from "../_shared/form-field";

function SelectDev({ _id, label, placeholder, options, defaultValue }: CommonComponentProps) {
  const items = normalizeOptions(options);

  return (
    <div data-component-id={_id}>
      <FormField label={label}>
        <Select value={defaultValue || undefined} items={items} disabled>
          <SelectTrigger className="w-full pointer-events-none">
            <SelectValue placeholder={placeholder || "请选择"} />
          </SelectTrigger>
          <SelectContent>
            {items.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>
    </div>
  );
}

export default SelectDev;
