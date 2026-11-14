import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from "react";

import { AppForm, DatePicker, Field, useAppForm } from "../../../components/form";
import { Checkbox } from "../../../components/ui/checkbox";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { RadioGroup, RadioGroupItem } from "../../../components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import { Textarea } from "../../../components/ui/textarea";
import { toast } from "../../../components/ui/toast";
import { formatDate } from "../../../lib/utils";
import type { CommonComponentProps } from "../../interface";
import { normalizeOptions } from "../form-item/options";

function EmptyOptions() {
  return <p className="text-sm text-muted-foreground">请先在属性面板配置选项</p>;
}

function renderControl(item: any, api: { id: string; value: any; onChange: (next: any) => void }) {
  const options = normalizeOptions(item.options);

  switch (item.type) {
    case "textarea":
      return (
        <Textarea
          id={api.id}
          value={api.value ?? ""}
          onChange={(event) => api.onChange(event.target.value)}
        />
      );
    case "select":
      return options.length ? (
        <Select value={api.value ?? ""} onValueChange={api.onChange} items={options}>
          <SelectTrigger id={api.id} className="w-full">
            <SelectValue placeholder="请选择" />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <EmptyOptions />
      );
    case "radio-group":
      return options.length ? (
        <RadioGroup
          value={api.value ?? ""}
          onValueChange={api.onChange}
          className="flex flex-wrap gap-4"
        >
          {options.map((option) => (
            <Label key={option.value} className="font-normal">
              <RadioGroupItem value={option.value} />
              {option.label}
            </Label>
          ))}
        </RadioGroup>
      ) : (
        <EmptyOptions />
      );
    case "checkbox-group": {
      const checked: string[] = Array.isArray(api.value) ? api.value : [];

      return options.length ? (
        <div className="flex flex-wrap gap-4">
          {options.map((option) => (
            <Label key={option.value} className="font-normal">
              <Checkbox
                checked={checked.includes(option.value)}
                onCheckedChange={(next) => {
                  const values = new Set(checked);

                  if (next) {
                    values.add(option.value);
                  } else {
                    values.delete(option.value);
                  }

                  api.onChange(Array.from(values));
                }}
              />
              {option.label}
            </Label>
          ))}
        </div>
      ) : (
        <EmptyOptions />
      );
    }
    case "date":
      return <DatePicker id={api.id} value={api.value ?? ""} onChange={api.onChange} />;
    default:
      return (
        <Input
          id={api.id}
          type="text"
          value={api.value ?? ""}
          onChange={(event) => api.onChange(event.target.value)}
        />
      );
  }
}

function FormProd(
  { children, defaultValue, onFinish, labelPosition }: CommonComponentProps,
  ref: any,
) {
  const submitRef = useRef<(values: Record<string, any>) => void>(() => {});

  const form = useAppForm<Record<string, any>>(
    {},
    {
      onSubmit: (values) => {
        submitRef.current(values);
      },
    },
  );

  const formItems = useMemo(() => {
    return (
      React.Children.map(children, (item: any) => ({
        label: item.props?.label,
        name: item.props?.name,
        type: item.props?.type,
        options: item.props?.options,
        id: item.props?.id,
        rules: item.props?.rules,
      })) || []
    );
  }, [children]);

  useImperativeHandle(
    ref,
    () => ({
      submit: () => {
        void form.handleSubmit();
      },
    }),
    [form],
  );

  useEffect(() => {
    if (!defaultValue) return;

    const data: Record<string, any> = {};

    formItems.forEach((item: any) => {
      data[item.name] =
        item.type === "date" ? formatDate(defaultValue[item.name]) : defaultValue[item.name];
    });

    form.reset(data);
  }, [defaultValue, form, children]);

  submitRef.current = (values: Record<string, any>) => {
    const missing = formItems.some((item: any) => {
      const value = values[item.name];
      const empty = value === undefined || value === "" || (Array.isArray(value) && !value.length);

      return item.rules === "required" && empty;
    });

    if (missing) {
      toast.add({ title: "不能为空", type: "error" });
      return;
    }

    onFinish?.(values);
  };

  return (
    <AppForm form={form} className="py-2">
      <div className="flex flex-col gap-4">
        {formItems.map((item: any) => (
          <Field
            key={item.name}
            name={item.name}
            label={item.label}
            labelPosition={labelPosition === "top" ? "top" : "left"}
            required={item.rules === "required"}
          >
            {(api) => renderControl(item, api)}
          </Field>
        ))}
      </div>
    </AppForm>
  );
}

export default forwardRef(FormProd as any);
