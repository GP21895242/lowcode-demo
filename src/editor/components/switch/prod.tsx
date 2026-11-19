import { forwardRef } from "react";

import { Switch } from "../../../components/ui/switch";
import type { CommonComponentProps } from "../../interface";
import { toBoolean } from "../_shared/control";
import { FormField } from "../_shared/form-field";

const SwitchProd = forwardRef<HTMLDivElement, CommonComponentProps>((props, ref) => {
  const { _id, label, defaultChecked, disabled } = props;
  const initialChecked = toBoolean(defaultChecked);

  return (
    <div ref={ref} data-component-id={_id}>
      <FormField label={label}>
        <Switch
          key={String(initialChecked)}
          defaultChecked={initialChecked}
          disabled={toBoolean(disabled)}
        />
      </FormField>
    </div>
  );
});

SwitchProd.displayName = "SwitchProd";

export default SwitchProd;
