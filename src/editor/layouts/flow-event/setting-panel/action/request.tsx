import { MinusCircle, Plus } from "lucide-react";

import { Field, FieldArray, useFieldValue } from "../../../../../components/form";
import { Button } from "../../../../../components/ui/button";
import { Input } from "../../../../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../../components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../../../components/ui/tabs";
import { Textarea } from "../../../../../components/ui/textarea";

const methodOptions = [
  { label: "GET", value: "GET" },
  { label: "POST", value: "POST" },
  { label: "PUT", value: "PUT" },
  { label: "DELETE", value: "DELETE" },
];

const bodyTypeOptions = [
  { label: "json", value: "json" },
  { label: "脚本", value: "script" },
];

const RequestSetting = () => {
  const bodyType = useFieldValue("config.body.type");

  const tabItems = [
    {
      value: "params",
      label: "params",
      children: (
        <FieldArray name="config.params">
          {({ fields, add, remove }) => (
            <>
              {fields.map(({ key, index }) => (
                <div key={key} className="mb-2 flex items-start gap-2">
                  <Field name={["config", "params", index, "key"]} className="mb-0 flex-1">
                    {({ value, onChange }) => (
                      <Input
                        value={value ?? ""}
                        placeholder="key"
                        onChange={(event) => onChange(event.target.value)}
                      />
                    )}
                  </Field>
                  <Field name={["config", "params", index, "value"]} className="mb-0 flex-1">
                    {({ value, onChange }) => (
                      <Input
                        value={value ?? ""}
                        placeholder="value"
                        onChange={(event) => onChange(event.target.value)}
                      />
                    )}
                  </Field>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => remove(index)}
                    aria-label="删除字段"
                  >
                    <MinusCircle className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                className="w-full border-dashed"
                onClick={() => add({ key: "", value: "" })}
              >
                <Plus className="h-4 w-4" />
                添加字段
              </Button>
            </>
          )}
        </FieldArray>
      ),
    },
    {
      value: "body",
      label: "body",
      children: (
        <>
          <Field name="config.body.type" label="类型">
            {({ value, onChange }) => (
              <Select value={value} onValueChange={onChange} items={bodyTypeOptions}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {bodyTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </Field>

          {bodyType === "script" ? (
            <Field name="config.body.script" label="脚本">
              {({ value, onChange }) => (
                <Textarea
                  rows={8}
                  value={value ?? ""}
                  onChange={(event) => onChange(event.target.value)}
                />
              )}
            </Field>
          ) : null}

          {bodyType === "json" ? (
            <Field name="config.body.json" label="json">
              {({ value, onChange }) => (
                <Textarea
                  rows={8}
                  value={value ?? ""}
                  onChange={(event) => onChange(event.target.value)}
                />
              )}
            </Field>
          ) : null}
        </>
      ),
    },
  ];

  return (
    <>
      <Field name="config.url" label="url">
        {({ value, onChange }) => (
          <Input value={value ?? ""} onChange={(event) => onChange(event.target.value)} />
        )}
      </Field>

      <Field name="config.method" label="请求方式">
        {({ value, onChange }) => (
          <Select value={value} onValueChange={onChange} items={methodOptions}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {methodOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </Field>

      <Tabs className="mt-2">
        <TabsList>
          {tabItems.map((item) => (
            <TabsTrigger key={item.value} value={item.value}>
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {tabItems.map((item) => (
          <TabsContent key={item.value} value={item.value}>
            {item.children}
          </TabsContent>
        ))}
      </Tabs>
    </>
  );
};

export default RequestSetting;
