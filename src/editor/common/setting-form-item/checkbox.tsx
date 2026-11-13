import { Settings } from "lucide-react";
import { useState } from "react";

import { Checkbox } from "../../../components/ui/checkbox";
import { cn } from "../../../lib/utils";
import SelectVariableModal from "../select-variable-modal";

interface Value {
  type: "static" | "variable";
  value: any;
}

interface Props {
  value?: Value;
  onChange?: (value: Value) => void;
}

const SettingFormItemCheckbox: React.FC<Props> = ({ value, onChange }) => {
  const [visible, setVisible] = useState(false);

  function select(record: any) {
    onChange?.({
      type: "variable",
      value: record.name,
    });

    setVisible(false);
  }

  return (
    <div className="flex items-center gap-2">
      <Checkbox
        disabled={value?.type === "variable"}
        checked={value?.type === "static" || !value ? !!value?.value : false}
        onCheckedChange={(checked) =>
          onChange?.({
            type: "static",
            value: checked,
          })
        }
      />
      <Settings
        onClick={() => {
          setVisible(true);
        }}
        className={cn(
          "h-4 w-4 shrink-0 cursor-pointer",
          value?.type === "variable" ? "text-primary" : "text-muted-foreground",
        )}
      />
      <SelectVariableModal
        open={visible}
        onCancel={() => {
          setVisible(false);
        }}
        onSelect={select}
      />
    </div>
  );
};

export default SettingFormItemCheckbox;
