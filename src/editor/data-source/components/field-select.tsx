import { useMemo } from "react";
import { useDataSourceFields } from "../hooks";
import type { DataSourceField } from "../types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FieldSelectProps {
  sourceId?: string;
  value?: string;
  onChange: (value: string) => void;
  filter?: (field: DataSourceField) => boolean;
  className?: string;
  placeholder?: string;
}

export function FieldSelect({
  sourceId,
  value,
  onChange,
  filter,
  className,
  placeholder = "请选择字段",
}: FieldSelectProps) {
  const fields = useDataSourceFields(sourceId);

  const options = useMemo(() => {
    const visibleFields = filter ? fields.filter(filter) : fields;
    return visibleFields.map((field) => ({
      label: `${field.label}（${field.dataKey}）`,
      value: field.dataKey,
    }));
  }, [fields, filter]);

  return (
    <Select
      value={value}
      onValueChange={(next) => onChange(String(next))}
      items={options}
      disabled={!sourceId || options.length === 0}
    >
      <SelectTrigger className={className ?? "w-full"}>
        <SelectValue placeholder={sourceId ? placeholder : "请先选择数据源"} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
