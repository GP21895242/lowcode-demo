import React, { useMemo } from "react";

import { AppForm, Field, useAppForm } from "../../../components/form";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import { useDataSourceStore } from "../../data-source/store";
import { useDataSourceRuntimeStore } from "../../data-source/runtime";
import type { DataSourceField } from "../../data-source/types";
import type { CommonComponentProps } from "../../interface";

interface SearchItemInfo {
  id: number;
  name: string;
  label?: string;
  sourceId?: string;
  dataKey?: string;
  type?: string;
}

// 编辑态 props 为 { type, value } 包装，预览态已被 formatProps 解包
function unwrap(value: any) {
  return value && typeof value === "object" && "value" in value ? value.value : value;
}

function SearchFormProd({ children, onSearch }: CommonComponentProps) {
  const sources = useDataSourceStore((state) => state.sources);

  const items = useMemo<SearchItemInfo[]>(() => {
    return (
      React.Children.map(children, (item: any, index: number) => {
        const props = item.props ?? {};
        const sourceId = unwrap(props.sourceId) as string | undefined;
        const dataKey = unwrap(props.dataKey) as string | undefined;

        return {
          id: props._id,
          name: String(unwrap(props.name) ?? `${sourceId ?? "search"}_${dataKey ?? index}`),
          label: unwrap(props.label),
          sourceId,
          dataKey,
          type: unwrap(props.type),
        };
      }) ?? []
    );
  }, [children]);

  const form = useAppForm<Record<string, any>>(
    {},
    {
      onSubmit: (values) => {
        const groups: Record<string, Record<string, any>> = {};

        items.forEach((item) => {
          if (!item.sourceId) return;
          groups[item.sourceId] ??= {};
          groups[item.sourceId][item.dataKey ?? item.name] = values[item.name];
        });

        Object.entries(groups).forEach(([sourceId, searchValues]) => {
          void useDataSourceRuntimeStore.getState().search(sourceId, searchValues);
        });

        onSearch?.(values);
      },
    },
  );

  function getField(item: SearchItemInfo): DataSourceField | undefined {
    return sources
      .find((source) => source.id === item.sourceId)
      ?.fields.find((field) => field.dataKey === item.dataKey);
  }

  function renderControl(item: SearchItemInfo, field: DataSourceField | undefined, api: any) {
    const type = item.type && item.type !== "auto" ? item.type : undefined;
    const controlType =
      type ?? (field?.searchType === "select" || field?.type === "enum" ? "select" : field?.type);

    if (controlType === "select" && field?.options?.length) {
      const options = field.options.map((option) => ({
        label: option.label,
        value: String(option.value),
      }));

      return (
        <Select value={api.value ?? ""} onValueChange={api.onChange} items={options}>
          <SelectTrigger className="w-full" data-component-id={item.id}>
            <SelectValue placeholder="全部" />
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

    if (controlType === "date") {
      return (
        <Input
          id={api.id}
          type="date"
          data-component-id={item.id}
          value={api.value ?? ""}
          onChange={(event) => api.onChange(event.target.value)}
        />
      );
    }

    if (controlType === "number") {
      return (
        <Input
          id={api.id}
          type="number"
          data-component-id={item.id}
          value={api.value ?? ""}
          onChange={(event) => api.onChange(event.target.value)}
        />
      );
    }

    return (
      <Input
        id={api.id}
        data-component-id={item.id}
        value={api.value ?? ""}
        onChange={(event) => api.onChange(event.target.value)}
      />
    );
  }

  return (
    <div className="w-[100%]">
      <AppForm form={form}>
        <div className="grid grid-cols-4 items-start gap-5">
          {items.map((item) => {
            const field = getField(item);
            return (
              <Field
                key={item.name}
                name={item.name}
                label={item.label || field?.label || item.dataKey || "搜索项"}
              >
                {(api) => renderControl(item, field, api)}
              </Field>
            );
          })}
          <div className="flex items-start gap-2">
            <Button
              onClick={() => {
                void form.handleSubmit();
              }}
            >
              搜索
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                form.reset();
                void form.handleSubmit();
              }}
            >
              重置
            </Button>
          </div>
        </div>
      </AppForm>
    </div>
  );
}

export default SearchFormProd;
