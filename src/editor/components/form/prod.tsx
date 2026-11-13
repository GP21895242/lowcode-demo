import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from "react";

import { AppForm, Field, useAppForm } from "../../../components/form";
import { Input } from "../../../components/ui/input";
import { toast } from "../../../components/ui/toast";
import { formatDate } from "../../../lib/utils";
import type { CommonComponentProps } from "../../interface";

function FormProd({ children, defaultValue, onFinish }: CommonComponentProps, ref: any) {
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
    const missing = formItems.some(
      (item: any) =>
        item.rules === "required" && (values[item.name] === undefined || values[item.name] === ""),
    );

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
            required={item.rules === "required"}
          >
            {({ id, value, onChange }) => (
              <Input
                id={id}
                type={item.type === "date" ? "date" : "text"}
                value={value ?? ""}
                onChange={(event) => onChange(event.target.value)}
              />
            )}
          </Field>
        ))}
      </div>
    </AppForm>
  );
}

export default forwardRef(FormProd as any);
