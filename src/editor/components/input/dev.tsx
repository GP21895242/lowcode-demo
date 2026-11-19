import { Input } from "../../../components/ui/input";
import type { CommonComponentProps } from "../../interface";
import { FormField } from "../_shared/form-field";

function InputDev({ _id, label, placeholder, defaultValue }: CommonComponentProps) {
  return (
    <div data-component-id={_id}>
      <FormField label={label}>
        <Input
          value={defaultValue ?? ""}
          placeholder={placeholder}
          readOnly
          tabIndex={-1}
          className="pointer-events-none"
        />
      </FormField>
    </div>
  );
}

export default InputDev;
