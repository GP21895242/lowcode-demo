import { useForm, useStore } from "@tanstack/react-form";
import * as React from "react";

import { cn, getByPath } from "../../lib/utils";
import { Field as UiField, FieldContent, FieldError, FieldLabel } from "../ui/field";

export { DatePicker, type DatePickerProps } from "./date-picker";

export type FieldPath = string | number | (string | number)[];

export function normalizePath(path: FieldPath): string {
  return Array.isArray(path) ? path.map(String).join(".") : String(path ?? "");
}

// TanStack Form 的类型参数较多，这里统一收敛为可复用的实例类型。
export type AppFormInstance = any;

const FormContext = React.createContext<AppFormInstance>(null);

export function useAppForm<T extends object>(
  defaultValues: T,
  options?: { onSubmit?: (values: T) => void | Promise<void> },
) {
  const submitRef = React.useRef(options?.onSubmit);
  submitRef.current = options?.onSubmit;

  return useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      await submitRef.current?.(value as T);
    },
  });
}

export function useAppFormContext(): AppFormInstance {
  const form = React.useContext(FormContext);

  if (!form) {
    throw new Error("表单字段必须放在 <AppForm /> 内部使用");
  }

  return form;
}

/**
 * 订阅表单中某个路径的值。
 */
export function useWatchValue(form: AppFormInstance, name: FieldPath) {
  const path = normalizePath(name);
  return useStore(form.store, (state: any) => getByPath(state.values, path)) as any;
}

/**
 * 在当前 AppForm 上下文中订阅某个路径的值。
 */
export function useFieldValue(name: FieldPath) {
  const form = useAppFormContext();
  return useWatchValue(form, name);
}

export interface AppFormProps {
  form: AppFormInstance;
  children: React.ReactNode;
  className?: string;
  onValuesChange?: (values: any) => void;
}

/**
 * 基于 TanStack Form 的轻量表单容器，替代 antd Form。
 */
export function AppForm({ form, children, className, onValuesChange }: AppFormProps) {
  const callbackRef = React.useRef(onValuesChange);
  callbackRef.current = onValuesChange;

  React.useEffect(() => {
    let previous = JSON.stringify(form.store.state.values);

    const subscription = form.store.subscribe(() => {
      const values = form.store.state.values;
      const next = JSON.stringify(values);

      if (next !== previous) {
        previous = next;
        callbackRef.current?.(values);
      }
    });

    return () => subscription.unsubscribe();
  }, [form]);

  return (
    <FormContext.Provider value={form}>
      <form
        className={className}
        onSubmit={(event) => {
          event.preventDefault();
          void form.handleSubmit();
        }}
      >
        {children}
      </form>
    </FormContext.Provider>
  );
}

export interface FieldControlApi {
  id: string;
  value: any;
  onChange: (value: any) => void;
}

export interface FieldProps {
  name: FieldPath;
  label?: React.ReactNode;
  children: (api: FieldControlApi) => React.ReactNode;
  required?: boolean;
  className?: string;
  labelWidth?: number | string;
  labelPosition?: "left" | "top";
  error?: React.ReactNode;
}

export function Field({
  name,
  label,
  children,
  required,
  className,
  labelWidth,
  labelPosition = "left",
  error,
}: FieldProps) {
  const form = useAppFormContext();
  const value = useWatchValue(form, name);
  const id = React.useId();
  const path = normalizePath(name);

  const onChange = React.useCallback(
    (next: any) => {
      form.setFieldValue(path, next);
    },
    [form, path],
  );

  return (
    <UiField
      orientation={labelPosition === "top" ? "vertical" : "horizontal"}
      data-invalid={error ? true : undefined}
      className={cn("mb-3", className)}
    >
      {label !== undefined ? (
        <FieldLabel
          htmlFor={id}
          className={cn(
            "text-sm leading-none font-normal text-muted-foreground",
            labelPosition === "top" ? "text-left" : "flex-none! pt-2 text-right",
          )}
          style={labelPosition === "top" ? undefined : { width: labelWidth ?? 92 }}
        >
          {required ? <span className="mr-0.5 text-destructive">*</span> : null}
          {label}
        </FieldLabel>
      ) : null}
      <FieldContent className="min-w-0 gap-0">
        {children({ id, value, onChange })}
        {error ? <FieldError className="mt-1 text-xs">{error}</FieldError> : null}
      </FieldContent>
    </UiField>
  );
}

export interface FieldArrayApi {
  value: any[];
  fields: { key: number; index: number }[];
  add: (item?: any) => void;
  remove: (index: number) => void;
  move: (from: number, to: number) => void;
}

export interface FieldArrayProps {
  name: FieldPath;
  children: (api: FieldArrayApi) => React.ReactNode;
}

export function FieldArray({ name, children }: FieldArrayProps) {
  const form = useAppFormContext();
  const path = normalizePath(name);
  const value = useWatchValue(form, path);
  const list: any[] = Array.isArray(value) ? value : [];

  return (
    <>
      {children({
        value: list,
        fields: list.map((_, index) => ({ key: index, index })),
        add: (item = {}) => form.setFieldValue(path, [...list, item]),
        remove: (index) => {
          form.setFieldValue(
            path,
            list.filter((_, itemIndex) => itemIndex !== index),
          );
        },
        move: (from, to) => {
          if (from === to) return;
          const next = [...list];
          const [moved] = next.splice(from, 1);
          next.splice(to, 0, moved);
          form.setFieldValue(path, next);
        },
      })}
    </>
  );
}
