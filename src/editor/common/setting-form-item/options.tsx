import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SortableList from "../sortable-list";

export interface FormOption {
  key: number;
  label: string;
}

interface OptionsValue {
  type?: string;
  value?: FormOption[];
}

interface Props {
  value?: OptionsValue;
  onChange?: (next: { type: "static"; value: FormOption[] }) => void;
}

/** 表单项选项编辑器：用于下拉、单选组、多选组的选项配置 */
function SettingFormItemOptions({ value, onChange }: Props) {
  const items: FormOption[] = Array.isArray(value?.value) ? value.value : [];

  function emit(next: FormOption[]) {
    onChange?.({ type: "static", value: next });
  }

  return (
    <div>
      <SortableList
        items={items}
        onDelete={(_, index: number) => emit(items.filter((__, itemIndex) => itemIndex !== index))}
        itemRender={(item: FormOption, index: number) => (
          <Input
            value={item.label}
            placeholder="选项文案"
            onChange={(event) =>
              emit(
                items.map((option, optionIndex) =>
                  optionIndex === index ? { ...option, label: event.target.value } : option,
                ),
              )
            }
          />
        )}
        onSortEnd={({ oldIndex, newIndex }) => {
          if (oldIndex === newIndex || newIndex < 0) return;

          const next = [...items];
          const [moved] = next.splice(oldIndex, 1);
          next.splice(newIndex, 0, moved);
          emit(next);
        }}
      />
      <Button
        variant="outline"
        className="w-full border-dashed"
        onClick={() => {
          emit([...items, { key: Date.now(), label: `选项${items.length + 1}` }]);
        }}
      >
        添加选项
      </Button>
    </div>
  );
}

export default SettingFormItemOptions;
