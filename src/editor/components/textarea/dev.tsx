import { Textarea } from "../../../components/ui/textarea";
import type { CommonComponentProps } from "../../interface";
import { toNumber } from "../_shared/control";
import { FormField } from "../_shared/form-field";

function TextareaDev({ _id, label, placeholder, defaultValue, rows }: CommonComponentProps) {
  return (
    <div data-component-id={_id}>
      <FormField label={label}>
        <Textarea
          value={defaultValue ?? ""}
          placeholder={placeholder}
          rows={toNumber(rows, 3)}
          readOnly
          tabIndex={-1}
          className="pointer-events-none"
        />
      </FormField>
    </div>
  );
}

export default TextareaDev;
