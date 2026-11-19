import { Checkbox } from "../../../components/ui/checkbox";
import type { CommonComponentProps } from "../../interface";
import { normalizeOptions } from "../form-item/options";
import { toStringList } from "../_shared/control";
import { FormField } from "../_shared/form-field";

function CheckboxGroupDev({ _id, label, options, defaultValue }: CommonComponentProps) {
  const items = normalizeOptions(options);
  const selected = toStringList(defaultValue);

  return (
    <div data-component-id={_id}>
      <FormField label={label}>
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <label key={item.value} className="flex items-center gap-2 text-sm">
              <Checkbox defaultChecked={selected.includes(item.value)} disabled />
              {item.label}
            </label>
          ))}
        </div>
      </FormField>
    </div>
  );
}

export default CheckboxGroupDev;
