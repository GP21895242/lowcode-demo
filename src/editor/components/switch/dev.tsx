import { Switch } from "../../../components/ui/switch";
import type { CommonComponentProps } from "../../interface";
import { toBoolean } from "../_shared/control";
import { FormField } from "../_shared/form-field";

function SwitchDev({ _id, label, defaultChecked }: CommonComponentProps) {
  return (
    <div data-component-id={_id}>
      <FormField label={label}>
        <Switch
          defaultChecked={toBoolean(defaultChecked)}
          disabled
          className="pointer-events-none"
        />
      </FormField>
    </div>
  );
}

export default SwitchDev;
