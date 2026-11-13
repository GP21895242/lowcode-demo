import { Field } from "../../../../../components/form";
import { Input } from "../../../../../components/ui/input";

const ConfirmSetting = () => {
  return (
    <Field name="config.text" label="内容">
      {({ value, onChange }) => (
        <Input value={value ?? ""} onChange={(event) => onChange(event.target.value)} />
      )}
    </Field>
  );
};

export default ConfirmSetting;
