import { Field, useFieldValue } from "../../../../../components/form";
import { Input } from "../../../../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../../components/ui/select";
import { useVariablesStore } from "../../../../stores/variable";

const AsyncTaskSetting = () => {
  const { variables } = useVariablesStore();
  const variable = useFieldValue("config.variable");
  const variableOptions = variables.map((item) => ({ label: item.remark, value: item.name }));

  return (
    <>
      <Field name="config.variable" label="变量">
        {({ value, onChange }) => (
          <Select value={value} onValueChange={onChange} items={variableOptions}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {variableOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </Field>
      {variable ? (
        <Field name="config.value" label="值">
          {({ value, onChange }) => (
            <Input value={value ?? ""} onChange={(event) => onChange(event.target.value)} />
          )}
        </Field>
      ) : null}
    </>
  );
};

export default AsyncTaskSetting;
