import { useEffect } from "react";

import { Field, useAppFormContext } from "@/components/form";
import { Textarea } from "@/components/ui/textarea";

const DEFAULT_SCRIPT = `(function (ctx) {
  // TODO

})(ctx)`;

const ExecScriptSetting = () => {
  const form = useAppFormContext();

  useEffect(() => {
    if (!form.getFieldValue("config.script")) {
      form.setFieldValue("config.script", DEFAULT_SCRIPT);
    }
  }, [form]);

  return (
    <Field name="config.script" label="脚本">
      {({ value, onChange }) => (
        <Textarea rows={8} value={value ?? ""} onChange={(event) => onChange(event.target.value)} />
      )}
    </Field>
  );
};

export default ExecScriptSetting;
