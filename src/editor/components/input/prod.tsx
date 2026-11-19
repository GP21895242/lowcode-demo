import { forwardRef } from "react";

import { Input } from "@/components/ui/input";
import type { CommonComponentProps } from "../../interface";
import { toBoolean } from "../_shared/control";
import { FormField } from "../_shared/form-field";

const InputProd = forwardRef<HTMLDivElement, CommonComponentProps>((props, ref) => {
  const { _id, label, placeholder, defaultValue, disabled } = props;
  const initialValue = defaultValue ?? "";

  return (
    <div ref={ref} data-component-id={_id}>
      <FormField label={label}>
        <Input
          key={String(initialValue)}
          defaultValue={initialValue}
          placeholder={placeholder}
          disabled={toBoolean(disabled)}
        />
      </FormField>
    </div>
  );
});

InputProd.displayName = "InputProd";

export default InputProd;
