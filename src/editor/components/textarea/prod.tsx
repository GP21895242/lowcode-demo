import { forwardRef } from "react";

import { Textarea } from "../../../components/ui/textarea";
import type { CommonComponentProps } from "../../interface";
import { toBoolean, toNumber } from "../_shared/control";
import { FormField } from "../_shared/form-field";

const TextareaProd = forwardRef<HTMLDivElement, CommonComponentProps>((props, ref) => {
  const { _id, label, placeholder, defaultValue, rows, disabled } = props;
  const initialValue = defaultValue ?? "";

  return (
    <div ref={ref} data-component-id={_id}>
      <FormField label={label}>
        <Textarea
          key={String(initialValue)}
          defaultValue={initialValue}
          placeholder={placeholder}
          rows={toNumber(rows, 3)}
          disabled={toBoolean(disabled)}
        />
      </FormField>
    </div>
  );
});

TextareaProd.displayName = "TextareaProd";

export default TextareaProd;
