import { forwardRef } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import type { CommonComponentProps } from "../../interface";
import { normalizeOptions } from "../form-item/options";
import { toBoolean } from "../_shared/control";
import { FormField } from "../_shared/form-field";

const SelectProd = forwardRef<HTMLDivElement, CommonComponentProps>((props, ref) => {
  const { _id, label, placeholder, options, defaultValue, disabled } = props;
  const items = normalizeOptions(options);
  const initialValue = defaultValue || undefined;

  return (
    <div ref={ref} data-component-id={_id}>
      <FormField label={label}>
        <Select
          key={String(initialValue)}
          defaultValue={initialValue}
          items={items}
          disabled={toBoolean(disabled)}
        >
          <SelectTrigger className="w-full">
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
});

SelectProd.displayName = "SelectProd";

export default SelectProd;
