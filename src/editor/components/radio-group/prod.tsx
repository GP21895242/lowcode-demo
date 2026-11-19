import { forwardRef } from "react";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { CommonComponentProps } from "../../interface";
import { normalizeOptions } from "../form-item/options";
import { toBoolean } from "../_shared/control";
import { FormField } from "../_shared/form-field";

const RadioGroupProd = forwardRef<HTMLDivElement, CommonComponentProps>((props, ref) => {
  const { _id, label, options, defaultValue, disabled } = props;
  const items = normalizeOptions(options);
  const initialValue = defaultValue || undefined;

  return (
    <div ref={ref} data-component-id={_id}>
      <FormField label={label}>
        <RadioGroup
          key={String(initialValue)}
          defaultValue={initialValue}
          disabled={toBoolean(disabled)}
          className="gap-2"
        >
          {items.map((item) => (
            <label key={item.value} className="flex items-center gap-2 text-sm">
              <RadioGroupItem value={item.value} />
              {item.label}
            </label>
          ))}
        </RadioGroup>
      </FormField>
    </div>
  );
});

RadioGroupProd.displayName = "RadioGroupProd";

export default RadioGroupProd;
