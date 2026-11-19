import { RadioGroup, RadioGroupItem } from "../../../components/ui/radio-group";
import type { CommonComponentProps } from "../../interface";
import { normalizeOptions } from "../form-item/options";
import { FormField } from "../_shared/form-field";

function RadioGroupDev({ _id, label, options, defaultValue }: CommonComponentProps) {
  const items = normalizeOptions(options);

  return (
    <div data-component-id={_id}>
      <FormField label={label}>
        <RadioGroup value={defaultValue || undefined} disabled className="gap-2">
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
}

export default RadioGroupDev;
