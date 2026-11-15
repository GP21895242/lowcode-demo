import { Plus, Trash2 } from "lucide-react";
import React, { useEffect } from "react";

import { AppForm, Field, FieldArray, useAppForm } from "../../../components/form";
import { Button } from "../../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";
import { Input } from "../../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import { useVariablesStore, type Variable } from "../../stores/variable";

interface Props {
  open: boolean;
  onCancel: () => void;
}

const TYPE_OPTIONS = [
  { label: "字符串", value: "string" },
  { label: "数字", value: "number" },
  { label: "布尔", value: "boolean" },
  { label: "日期", value: "date" },
  { label: "日期时间", value: "datetime" },
  { label: "JSON", value: "json" },
];

const SCOPE_OPTIONS = [
  { label: "页面变量", value: "page" },
  { label: "搜索变量", value: "search" },
];

const PERSIST_OPTIONS = [
  { label: "不持久化", value: "none" },
  { label: "URL", value: "url" },
];

const DefineVariable: React.FC<Props> = ({ open, onCancel }) => {
  const { setVariables, variables } = useVariablesStore();

  const form = useAppForm<{ variables: Variable[] }>({ variables: [] }, { onSubmit: onFinish });

  useEffect(() => {
    if (open) {
      form.reset({ variables });
    }
  }, [open, form, variables]);

  function onFinish(values: { variables: Variable[] }) {
    setVariables(values.variables || []);
    onCancel?.();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onCancel();
      }}
    >
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>定义变量</DialogTitle>
        </DialogHeader>
        <AppForm form={form} className="max-h-[60vh] overflow-y-auto py-2">
          <FieldArray name="variables">
            {({ fields, add, remove }) => (
              <>
                {fields.length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    暂无变量，点击下方按钮添加
                  </p>
                ) : null}
                {fields.map(({ key, index }) => (
                  <div key={key} className="flex items-start gap-2">
                    <Field name={["variables", index, "name"]} className="mb-2 flex-1" required>
                      {({ value, onChange }) => (
                        <Input
                          placeholder="变量名"
                          value={value ?? ""}
                          onChange={(event) => onChange(event.target.value)}
                        />
                      )}
                    </Field>
                    <Field name={["variables", index, "type"]} className="mb-2 w-[120px]">
                      {({ value, onChange }) => (
                        <Select
                          value={value ?? "string"}
                          items={TYPE_OPTIONS}
                          onValueChange={onChange}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="类型" />
                          </SelectTrigger>
                          <SelectContent>
                            {TYPE_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </Field>
                    <Field name={["variables", index, "scope"]} className="mb-2 w-[120px]">
                      {({ value, onChange }) => (
                        <Select
                          value={value ?? "page"}
                          items={SCOPE_OPTIONS}
                          onValueChange={onChange}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="作用域" />
                          </SelectTrigger>
                          <SelectContent>
                            {SCOPE_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </Field>
                    <Field name={["variables", index, "persist"]} className="mb-2 w-[130px]">
                      {({ value, onChange }) => (
                        <Select
                          value={value ?? "none"}
                          items={PERSIST_OPTIONS}
                          onValueChange={onChange}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="持久化" />
                          </SelectTrigger>
                          <SelectContent>
                            {PERSIST_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </Field>
                    <Field name={["variables", index, "defaultValue"]} className="mb-2 flex-1">
                      {({ value, onChange }) => (
                        <Input
                          placeholder="默认值"
                          value={String(value ?? "")}
                          onChange={(event) => onChange(event.target.value)}
                        />
                      )}
                    </Field>
                    <Field name={["variables", index, "remark"]} className="mb-2 flex-1">
                      {({ value, onChange }) => (
                        <Input
                          placeholder="备注"
                          value={value ?? ""}
                          onChange={(event) => onChange(event.target.value)}
                        />
                      )}
                    </Field>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="mt-0.5 text-muted-foreground hover:text-destructive"
                      onClick={() => remove(index)}
                      aria-label="删除变量"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  className="mt-2 w-full border-dashed"
                  onClick={() =>
                    add({ type: "string", scope: "page", defaultValue: "", remark: "" })
                  }
                >
                  <Plus className="h-4 w-4" />
                  添加变量
                </Button>
              </>
            )}
          </FieldArray>
        </AppForm>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            取消
          </Button>
          <Button
            onClick={() => {
              void form.handleSubmit();
            }}
          >
            确定
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DefineVariable;
