import { Plus, Trash2 } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { Component } from "../../stores/components";
import type { CardContract, CardInputDef, CardInputType, CardTemplate } from "../types";

const INPUT_TYPE_OPTIONS: { label: string; value: CardInputType }[] = [
  { label: "文本", value: "text" },
  { label: "数字", value: "number" },
  { label: "布尔", value: "boolean" },
  { label: "选项", value: "select" },
  { label: "页面变量", value: "variable" },
  { label: "数据字段", value: "field" },
];

const CONTROL_OPTIONS = [
  { label: "输入框", value: "input" },
  { label: "选择器", value: "select" },
  { label: "日期", value: "date" },
  { label: "日期范围", value: "dateRange" },
  { label: "数字范围", value: "numberRange" },
];

const NONE_VALUE = "__none__";

function flattenNodes(root: Component): Component[] {
  return [root, ...(root.children ?? []).flatMap(flattenNodes)];
}

function formatOptions(options: CardInputDef["options"]) {
  return (options ?? []).map((option) => `${option.label}:${String(option.value)}`).join("\n");
}

function parseOptions(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const separator = line.indexOf(":");
      const label = separator < 0 ? line : line.slice(0, separator).trim();
      const optionValue = separator < 0 ? line : line.slice(separator + 1).trim();
      return { label, value: optionValue };
    });
}

function EditorField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Label className="flex min-w-0 flex-col items-stretch gap-1.5 text-xs font-normal text-muted-foreground">
      <span>{label}</span>
      {children}
    </Label>
  );
}

function ContractList({
  title,
  description,
  addLabel,
  onAdd,
  children,
}: {
  title: string;
  description: string;
  addLabel: string;
  onAdd: () => void;
  children: ReactNode;
}) {
  return (
    <div className="space-y-3 py-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-medium">{title}</div>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        </div>
        <Button variant="outline" size="sm" onClick={onAdd}>
          <Plus />
          {addLabel}
        </Button>
      </div>
      {children}
    </div>
  );
}

function EmptyTip({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-md border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
      {children}
    </div>
  );
}

interface ContractEditorProps {
  template: CardTemplate;
  value: CardContract;
  onChange: (value: CardContract) => void;
}

/** 模板契约编辑器：只允许维护对外声明，不向页面暴露内部实现配置 */
export default function ContractEditor({ template, value, onChange }: ContractEditorProps) {
  const nodes = flattenNodes(template.impl.root);
  const nodeOptions = nodes.map((node) => ({
    label: `${node.desc || node.name}（${node.id}）`,
    value: String(node.id),
  }));
  const inputs = value.inputs ?? [];
  const events = value.events ?? [];
  const methods = value.methods ?? [];
  const slots = value.slots ?? [];

  function patch(next: Partial<CardContract>) {
    onChange({ ...value, ...next });
  }

  function updateInput(index: number, next: Partial<CardInputDef>) {
    patch({
      inputs: inputs.map((item, itemIndex) => (itemIndex === index ? { ...item, ...next } : item)),
    });
  }

  function addInput() {
    const index = inputs.length + 1;
    patch({
      inputs: [
        ...inputs,
        {
          key: `input${index}`,
          label: `输入 ${index}`,
          type: "text",
          defaultValue: "",
          binding: { kind: "prop", targetNodeId: template.impl.root.id, targetProp: "title" },
        },
      ],
    });
  }

  return (
    <Tabs defaultValue="inputs" className="min-h-0 flex-1 gap-0">
      <TabsList
        variant="line"
        className="w-full shrink-0 justify-start rounded-none border-b border-border"
      >
        <TabsTrigger value="inputs">输入 {inputs.length}</TabsTrigger>
        <TabsTrigger value="events">事件 {events.length}</TabsTrigger>
        <TabsTrigger value="methods">方法 {methods.length}</TabsTrigger>
        <TabsTrigger value="slots">插槽 {slots.length}</TabsTrigger>
      </TabsList>

      <TabsContent value="inputs">
        <ContractList
          title="暴露输入"
          description="页面只能配置这里声明的输入，并沿指定绑定注入卡片内部。"
          addLabel="添加输入"
          onAdd={addInput}
        >
          {inputs.length === 0 ? <EmptyTip>暂无输入，页面属性面板将不显示配置项</EmptyTip> : null}
          {inputs.map((input, index) => (
            <div key={index} className="space-y-3 rounded-md border border-border p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">输入 {index + 1}</span>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label="删除输入"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() =>
                    patch({ inputs: inputs.filter((_, itemIndex) => itemIndex !== index) })
                  }
                >
                  <Trash2 />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <EditorField label="输入标识">
                  <Input
                    value={input.key}
                    onChange={(event) => updateInput(index, { key: event.target.value })}
                  />
                </EditorField>
                <EditorField label="显示名称">
                  <Input
                    value={input.label}
                    onChange={(event) => updateInput(index, { label: event.target.value })}
                  />
                </EditorField>
                <EditorField label="输入类型">
                  <Select
                    value={input.type}
                    items={INPUT_TYPE_OPTIONS}
                    onValueChange={(next) => updateInput(index, { type: next as CardInputType })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {INPUT_TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </EditorField>
                <EditorField label="默认值">
                  {input.type === "boolean" ? (
                    <Switch
                      checked={!!input.defaultValue}
                      onCheckedChange={(checked) => updateInput(index, { defaultValue: checked })}
                    />
                  ) : (
                    <Input
                      type={input.type === "number" ? "number" : "text"}
                      value={String(input.defaultValue ?? "")}
                      onChange={(event) =>
                        updateInput(index, {
                          defaultValue:
                            input.type === "number"
                              ? Number(event.target.value)
                              : event.target.value,
                        })
                      }
                    />
                  )}
                </EditorField>
              </div>

              {input.type === "select" ? (
                <EditorField label="选项（每行一个，格式：标签:值）">
                  <Textarea
                    rows={3}
                    value={formatOptions(input.options)}
                    onChange={(event) =>
                      updateInput(index, { options: parseOptions(event.target.value) })
                    }
                  />
                </EditorField>
              ) : null}

              <div className="flex flex-wrap items-center gap-5 text-xs text-muted-foreground">
                <Label className="flex items-center gap-2 font-normal">
                  <Switch
                    checked={!!input.required}
                    onCheckedChange={(checked) => updateInput(index, { required: checked })}
                  />
                  必填
                </Label>
                {input.type === "variable" || input.type === "field" ? (
                  <Label className="flex items-center gap-2 font-normal">
                    <Switch
                      checked={!!input.searchable}
                      onCheckedChange={(checked) => updateInput(index, { searchable: checked })}
                    />
                    可作为搜索目标
                  </Label>
                ) : null}
              </div>

              {input.type === "variable" || input.type === "field" ? (
                <div className="grid grid-cols-2 gap-3">
                  <EditorField label="默认绑定页面变量">
                    <Input
                      placeholder="如 search.region"
                      value={input.variable ?? ""}
                      onChange={(event) =>
                        updateInput(index, { variable: event.target.value || undefined })
                      }
                    />
                  </EditorField>
                  {input.searchable ? (
                    <EditorField label="搜索控件">
                      <Select
                        value={input.control ?? "input"}
                        items={CONTROL_OPTIONS}
                        onValueChange={(next) =>
                          updateInput(index, { control: next as CardInputDef["control"] })
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CONTROL_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </EditorField>
                  ) : null}
                </div>
              ) : null}

              <div className="rounded-md bg-muted/50 p-3">
                <div className="mb-3 text-xs font-medium">内部绑定</div>
                <div className="grid grid-cols-2 gap-3">
                  <EditorField label="绑定方式">
                    <Select
                      value={input.binding.kind}
                      items={[
                        { label: "组件属性", value: "prop" },
                        { label: "内部变量", value: "var" },
                      ]}
                      onValueChange={(next) =>
                        updateInput(index, {
                          binding:
                            next === "var"
                              ? { kind: "var", variable: template.impl.variables[0]?.name ?? "" }
                              : {
                                  kind: "prop",
                                  targetNodeId: template.impl.root.id,
                                  targetProp: "title",
                                },
                        })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="prop">组件属性</SelectItem>
                        <SelectItem value="var">内部变量</SelectItem>
                      </SelectContent>
                    </Select>
                  </EditorField>
                  {input.binding.kind === "prop" ? (
                    <>
                      <EditorField label="目标组件">
                        <Select
                          value={String(input.binding.targetNodeId)}
                          items={nodeOptions}
                          onValueChange={(next) =>
                            updateInput(index, {
                              binding: {
                                kind: "prop",
                                targetNodeId: Number(next),
                                targetProp:
                                  input.binding.kind === "prop" ? input.binding.targetProp : "",
                              },
                            })
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {nodeOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </EditorField>
                      <EditorField label="目标属性">
                        <Input
                          value={input.binding.targetProp}
                          onChange={(event) =>
                            updateInput(index, {
                              binding: {
                                kind: "prop",
                                targetNodeId:
                                  input.binding.kind === "prop"
                                    ? input.binding.targetNodeId
                                    : template.impl.root.id,
                                targetProp: event.target.value,
                              },
                            })
                          }
                        />
                      </EditorField>
                    </>
                  ) : (
                    <EditorField label="内部变量名">
                      <Input
                        value={input.binding.variable}
                        onChange={(event) =>
                          updateInput(index, {
                            binding: { kind: "var", variable: event.target.value },
                          })
                        }
                      />
                    </EditorField>
                  )}
                </div>
              </div>
            </div>
          ))}
        </ContractList>
      </TabsContent>

      <TabsContent value="events">
        <ContractList
          title="暴露事件"
          description="只有这里声明的卡片内部事件可以向上发送到页面。"
          addLabel="添加事件"
          onAdd={() =>
            patch({
              events: [
                ...events,
                { name: `onEvent${events.length + 1}`, label: `事件 ${events.length + 1}` },
              ],
            })
          }
        >
          {events.length === 0 ? <EmptyTip>暂无事件，页面事件面板将不显示配置项</EmptyTip> : null}
          {events.map((event, index) => (
            <div key={index} className="flex items-end gap-2 rounded-md border border-border p-3">
              <EditorField label="事件名">
                <Input
                  value={event.name}
                  onChange={(change) =>
                    patch({
                      events: events.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, name: change.target.value } : item,
                      ),
                    })
                  }
                />
              </EditorField>
              <EditorField label="显示名称">
                <Input
                  value={event.label}
                  onChange={(change) =>
                    patch({
                      events: events.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, label: change.target.value } : item,
                      ),
                    })
                  }
                />
              </EditorField>
              <Button
                variant="ghost"
                size="icon"
                aria-label="删除事件"
                onClick={() =>
                  patch({ events: events.filter((_, itemIndex) => itemIndex !== index) })
                }
              >
                <Trash2 />
              </Button>
            </div>
          ))}
        </ContractList>
      </TabsContent>

      <TabsContent value="methods">
        <ContractList
          title="暴露方法"
          description="页面事件流只能调用这里声明的方法，运行时会匹配卡片内部同名组件方法。"
          addLabel="添加方法"
          onAdd={() =>
            patch({
              methods: [
                ...methods,
                { name: `method${methods.length + 1}`, label: `方法 ${methods.length + 1}` },
              ],
            })
          }
        >
          {methods.length === 0 ? (
            <EmptyTip>暂无方法，页面不能直接调用卡片内部组件</EmptyTip>
          ) : null}
          {methods.map((method, index) => (
            <div key={index} className="flex items-end gap-2 rounded-md border border-border p-3">
              <EditorField label="方法名">
                <Input
                  value={method.name}
                  onChange={(change) =>
                    patch({
                      methods: methods.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, name: change.target.value } : item,
                      ),
                    })
                  }
                />
              </EditorField>
              <EditorField label="显示名称">
                <Input
                  value={method.label}
                  onChange={(change) =>
                    patch({
                      methods: methods.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, label: change.target.value } : item,
                      ),
                    })
                  }
                />
              </EditorField>
              <Button
                variant="ghost"
                size="icon"
                aria-label="删除方法"
                onClick={() =>
                  patch({ methods: methods.filter((_, itemIndex) => itemIndex !== index) })
                }
              >
                <Trash2 />
              </Button>
            </div>
          ))}
        </ContractList>
      </TabsContent>

      <TabsContent value="slots">
        <ContractList
          title="数据插槽"
          description="插槽只声明页面数据源映射位置，不会自动选择或合并数据源。"
          addLabel="添加插槽"
          onAdd={() =>
            patch({
              slots: [
                ...slots,
                {
                  key: `source${slots.length + 1}`,
                  label: `数据插槽 ${slots.length + 1}`,
                  required: false,
                  shareable: false,
                },
              ],
            })
          }
        >
          {slots.length === 0 ? <EmptyTip>暂无插槽，卡片仅使用私有数据源</EmptyTip> : null}
          {slots.map((slot, index) => (
            <div key={index} className="space-y-3 rounded-md border border-border p-3">
              <div className="grid grid-cols-2 gap-3">
                <EditorField label="插槽标识">
                  <Input
                    value={slot.key}
                    onChange={(event) =>
                      patch({
                        slots: slots.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, key: event.target.value } : item,
                        ),
                      })
                    }
                  />
                </EditorField>
                <EditorField label="显示名称">
                  <Input
                    value={slot.label}
                    onChange={(event) =>
                      patch({
                        slots: slots.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, label: event.target.value } : item,
                        ),
                      })
                    }
                  />
                </EditorField>
              </div>
              <EditorField label="内部数据源模板">
                <Select
                  value={slot.defaultSource?.id ?? NONE_VALUE}
                  items={[
                    { label: "不指定", value: NONE_VALUE },
                    ...template.impl.sources.map((source) => ({
                      label: source.title,
                      value: source.id,
                    })),
                  ]}
                  onValueChange={(next) =>
                    patch({
                      slots: slots.map((item, itemIndex) =>
                        itemIndex === index
                          ? {
                              ...item,
                              defaultSource:
                                next === NONE_VALUE
                                  ? undefined
                                  : template.impl.sources.find((source) => source.id === next),
                            }
                          : item,
                      ),
                    })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE_VALUE}>不指定</SelectItem>
                    {template.impl.sources.map((source) => (
                      <SelectItem key={source.id} value={source.id}>
                        {source.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </EditorField>
              <div className="flex items-center gap-5 text-xs text-muted-foreground">
                <Label className="flex items-center gap-2 font-normal">
                  <Switch
                    checked={slot.required}
                    onCheckedChange={(checked) =>
                      patch({
                        slots: slots.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, required: checked } : item,
                        ),
                      })
                    }
                  />
                  必须映射
                </Label>
                <Label className="flex items-center gap-2 font-normal">
                  <Switch
                    checked={!!slot.shareable}
                    onCheckedChange={(checked) =>
                      patch({
                        slots: slots.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, shareable: checked } : item,
                        ),
                      })
                    }
                  />
                  允许合并建议
                </Label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto text-muted-foreground hover:text-destructive"
                  onClick={() =>
                    patch({ slots: slots.filter((_, itemIndex) => itemIndex !== index) })
                  }
                >
                  <Trash2 />
                  删除插槽
                </Button>
              </div>
            </div>
          ))}
        </ContractList>
      </TabsContent>
    </Tabs>
  );
}
