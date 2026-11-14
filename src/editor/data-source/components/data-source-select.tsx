import { useDataSourceStore } from "../store";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const NONE_VALUE = "__none__";

interface DataSourceSelectProps {
  value?: string;
  onChange: (value?: string) => void;
  allowEmpty?: boolean;
  className?: string;
  placeholder?: string;
}

export function DataSourceSelect({
  value,
  onChange,
  allowEmpty = true,
  className,
  placeholder = "请选择数据源",
}: DataSourceSelectProps) {
  const sources = useDataSourceStore((state) => state.sources);

  const items = [
    ...(allowEmpty ? [{ label: "不绑定", value: NONE_VALUE }] : []),
    ...sources.map((source) => ({ label: `${source.title}（${source.name}）`, value: source.id })),
  ];

  return (
    <Select
      value={value ?? (allowEmpty ? NONE_VALUE : undefined)}
      onValueChange={(next) => onChange(next === NONE_VALUE ? undefined : String(next))}
      items={items}
    >
      <SelectTrigger className={className ?? "w-full"}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
