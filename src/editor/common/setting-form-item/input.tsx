import { Settings } from "lucide-react";
import { useState } from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import SelectVariableModal from "../select-variable-modal";

interface Value {
  type: "static" | "variable";
  value: any;
}

interface Props {
  value?: Value;
  onChange?: (value: Value) => void;
}

const SettingFormItemInput: React.FC<Props> = ({ value, onChange }) => {
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
      <Input
        disabled={value?.type === "variable"}
        value={value?.type === "static" || !value ? (value?.value ?? "") : ""}
        onChange={(event) =>
          onChange?.({
            type: "static",
            value: event.target.value,
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

export default SettingFormItemInput;
