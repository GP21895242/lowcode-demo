import React, { useMemo } from "react";

import { AppForm, Field, useAppForm } from "../../../components/form";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import type { CommonComponentProps } from "../../interface";

function SearchFormProd({ children, onSearch }: CommonComponentProps) {
  const form = useAppForm<Record<string, any>>(
    {},
    {
      onSubmit: (values) => {
        onSearch?.(values);
      },
    },
  );

  const searchItems = useMemo(() => {
    return (
      React.Children.map(children, (item: any) => ({
        label: item.props?.label,
        name: item.props?.name,
        type: item.props?.type,
        id: item.props?.id,
      })) || []
    );
  }, [children]);

  return (
    <div className="w-[100%]">
      <AppForm form={form}>
        <div className="grid grid-cols-4 items-start gap-5">
          {searchItems.map((item: any) => (
            <Field key={item.name} name={item.name} label={item.label}>
              {({ id, value, onChange }) => (
                <Input
                  id={id}
                  data-component-id={item.id}
                  value={value ?? ""}
                  onChange={(event) => onChange(event.target.value)}
                />
              )}
            </Field>
          ))}
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
