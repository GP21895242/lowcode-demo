import { Settings } from "lucide-react";
import { useRef, useState } from "react";

import { Field, useFieldValue } from "@/components/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import CommonSetter from "../../common/common-setter";
import SortableList from "../../common/sortable-list";
import { FieldSelect } from "../../data-source/components/field-select";
import FlowEvent from "../../layouts/flow-event";
import { useComponetsStore } from "../../stores/components";
import { getComponentById } from "../../utils/utils";

const setter = [
  {
    name: "type",
    label: "类型",
    type: "select",
    options: [
      { label: "文本", value: "text" },
      { label: "日期", value: "date" },
      { label: "操作", value: "option" },
    ],
  },
  {
    name: "title",
    label: "标题",
    type: "input",
  },
];

function OptionsFormItem({ value, onChange }: any) {
  const items: any[] = Array.isArray(value) ? value : [];

  const [open, setOpen] = useState(false);
  const [curKey, setCurKey] = useState<any>(null);
  const flowEventRef = useRef<any>(null);

  const curItem = items.find((item) => item.key === curKey);

  function changeHandle(label: string, index: number) {
    onChange(items.map((item, itemIndex) => (itemIndex === index ? { ...item, label } : item)));
  }

  function deleteHandle(index: number) {
    onChange(items.filter((_, itemIndex) => itemIndex !== index));
  }

  function sortEndHandle({ oldIndex, newIndex }: { oldIndex: number; newIndex: number }) {
    if (oldIndex === newIndex) return;

    const next = [...items];
    const [moved] = next.splice(oldIndex, 1);
    next.splice(newIndex, 0, moved);
    onChange(next);
  }

  function save() {
    const flowEvent = flowEventRef.current?.save();

    onChange(items.map((item) => (item.key === curKey ? { ...item, event: flowEvent } : item)));
    setOpen(false);
  }

  return (
    <div>
      <div className="mb-2 rounded-sm bg-muted px-4 py-2 text-sm font-semibold">操作</div>

      <div className="p-2">
        <SortableList
          items={items}
          hiddenEdit
          onDelete={(_: any, index: number) => deleteHandle(index)}
          itemRender={(item: any, index: number) => (
            <div className="flex flex-1 items-center gap-2">
              <Input
                className="w-[140px]"
                value={item.label ?? ""}
                onChange={(event) => changeHandle(event.target.value, index)}
              />
              <Tooltip>
                <TooltipTrigger
                  render={
                    <button
                      type="button"
                      className="inline-flex text-muted-foreground hover:text-primary"
                      onClick={() => {
                        setCurKey(item.key);
                        setOpen(true);
                      }}
                      aria-label="设置点击事件"
                    >
                      <Settings className="h-4 w-4" />
                    </button>
                  }
                />
                <TooltipContent>设置点击事件</TooltipContent>
              </Tooltip>
            </div>
          )}
          onSortEnd={sortEndHandle}
        />
      </div>

      <Button
        variant="outline"
        className="w-full border-dashed"
        onClick={() => {
          onChange([...items, { key: new Date().getTime(), label: "" }]);
        }}
      >
        添加
      </Button>

      <Sheet
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setOpen(false);
        }}
      >
        <SheetContent
          side="right"
          className="gap-0 p-0"
          style={{ width: "100vw", maxWidth: "100vw", zIndex: 1005 }}
        >
          <SheetHeader>
            <SheetTitle>设置事件流</SheetTitle>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-auto">
            <FlowEvent flowData={curItem?.event} ref={flowEventRef} />
          </div>
          <SheetFooter>
            <Button onClick={save}>保存</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Setter() {
  const type = useFieldValue("type");
  const curComponent = useComponetsStore((state) => state.curComponent);
  const components = useComponetsStore((state) => state.components);

  const parent = curComponent?.parentId
    ? getComponentById(curComponent.parentId, components)
    : null;
  const sourceId = (parent?.props as any)?.dataSource?.value?.sourceId as string | undefined;

  return (
    <>
      <CommonSetter setters={setter} />
      <Field name="dataIndex" label="字段">
        {({ value, onChange }) =>
          sourceId ? (
            <FieldSelect
              sourceId={sourceId}
              value={value?.value}
              onChange={(next) => onChange({ type: "static", value: next })}
            />
          ) : (
            <Input
              value={value?.value ?? ""}
              onChange={(event) => onChange({ type: "static", value: event.target.value })}
              placeholder="例如 name，绑定数据源后可直接选择"
            />
          )
        }
      </Field>
      {type === "option" ? (
        <Field name="options">
          {({ value, onChange }) => <OptionsFormItem value={value} onChange={onChange} />}
        </Field>
      ) : null}
    </>
  );
}

export default Setter;
