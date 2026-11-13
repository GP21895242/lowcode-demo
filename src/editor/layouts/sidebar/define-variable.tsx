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
import { useVariablesStore } from "../../stores/variable";

interface Props {
  open: boolean;
  onCancel: () => void;
}

interface Variable {
  // 变量名
  name: string;
  // 变量类型
  type?: string;
  // 默认值
  defaultValue: string;
  // 备注
  remark: string;
}

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
                    <Field name={["variables", index, "type"]} className="mb-2 w-[130px]">
                      {({ value, onChange }) => (
                        <Select
                          disabled
                          value={value}
                          items={[{ label: "字符串", value: "string" }]}
                          onValueChange={onChange}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="类型" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="string">字符串</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </Field>
                    <Field name={["variables", index, "defaultValue"]} className="mb-2 flex-1">
                      {({ value, onChange }) => (
                        <Input
                          placeholder="默认值"
                          value={value ?? ""}
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
                  onClick={() => add({ type: "string" })}
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
