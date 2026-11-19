import { forwardRef } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import type { CommonComponentProps } from "../../interface";
import { normalizeOptions } from "../form-item/options";
import { toBoolean, toStringList } from "../_shared/control";
import { FormField } from "../_shared/form-field";

const CheckboxGroupProd = forwardRef<HTMLDivElement, CommonComponentProps>((props, ref) => {
  const { _id, label, options, defaultValue, disabled } = props;
  const items = normalizeOptions(options);
  const selected = toStringList(defaultValue);
  const disabledValue = toBoolean(disabled);

  return (
    <div ref={ref} data-component-id={_id}>
      <FormField label={label}>
        <div className="flex flex-col gap-2">
          {items.map((item) => {
            const checked = selected.includes(item.value);

            return (
              <label key={item.value} className="flex items-center gap-2 text-sm">
                <Checkbox
                  key={`${item.value}:${checked}`}
                  defaultChecked={checked}
                  disabled={disabledValue}
                />
                {item.label}
              </label>
            );
          })}
        </div>
      </FormField>
    </div>
  );
});

CheckboxGroupProd.displayName = "CheckboxGroupProd";

export default CheckboxGroupProd;
