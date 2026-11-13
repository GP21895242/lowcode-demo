import { Settings } from "lucide-react";
import { useState } from "react";

import { Switch } from "../../../components/ui/switch";
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

const SettingFormItemSwitch: React.FC<Props> = ({ value, onChange }) => {
  const [visible, setVisible] = useState(false);

  function select(record: any) {
    onChange?.({
      type: "variable",
      value: record.name,
    });

    setVisible(false);
  }

  const checked = value?.type === "static" || !value ? !!value?.value : false;

  return (
    <div className="flex items-center gap-2">
      <Switch
        disabled={value?.type === "variable"}
        checked={checked}
        onCheckedChange={(nextChecked) =>
          onChange?.({
            type: "static",
            value: nextChecked,
          })
        }
      />
      <span className="text-sm text-muted-foreground">{checked ? "隐藏" : "显示"}</span>
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

export default SettingFormItemSwitch;
