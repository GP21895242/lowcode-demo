import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { useCardTemplate, useCardTemplatesStore } from "../store";
import type { CardContract, CardTemplate } from "../types";
import ContractEditor from "./contract-editor";

interface CardTemplateEditorProps {
  open: boolean;
  templateId?: string;
  onClose: () => void;
}

function validateUnique(items: { key?: string; name?: string }[], label: string) {
  const keys = items.map((item) => (item.key ?? item.name ?? "").trim());
  if (keys.some((key) => !key)) return `${label}标识不能为空`;
  if (new Set(keys).size !== keys.length) return `${label}标识不能重复`;
  return null;
}

function EditorForm({ template, onClose }: { template: CardTemplate; onClose: () => void }) {
  const updateTemplate = useCardTemplatesStore((state) => state.updateTemplate);
  const [name, setName] = useState(template.name);
  const [desc, setDesc] = useState(template.desc ?? "");
  const [contract, setContract] = useState<CardContract>(() => structuredClone(template.contract));

  function save() {
    if (!name.trim()) {
      toast.add({ title: "模板名称不能为空", type: "error" });
      return;
    }

    const uniqueError =
      validateUnique(contract.inputs, "输入") ??
      validateUnique(contract.events, "事件") ??
      validateUnique(contract.methods ?? [], "方法") ??
      validateUnique(contract.slots ?? [], "插槽");
    if (uniqueError) {
      toast.add({ title: uniqueError, type: "error" });
      return;
    }

    const invalidInput = contract.inputs.find((input) =>
      input.binding.kind === "prop"
        ? !input.binding.targetNodeId || !input.binding.targetProp.trim()
        : !input.binding.variable.trim(),
    );
    if (invalidInput) {
      toast.add({
        title: `输入「${invalidInput.label || invalidInput.key}」的内部绑定不完整`,
        type: "error",
      });
      return;
    }

    updateTemplate(template.id, {
      name: name.trim(),
      desc: desc.trim() || undefined,
      contract: structuredClone(contract),
    });
    toast.add({ title: "卡片模板已保存，引用页面将使用新契约", type: "success" });
    onClose();
  }

  return (
    <>
      <div className="min-h-0 flex-1 overflow-auto px-4">
        <div className="grid grid-cols-2 gap-3 border-b border-border py-4">
          <Label className="flex flex-col items-stretch gap-1.5 text-xs font-normal text-muted-foreground">
            模板名称
            <Input value={name} onChange={(event) => setName(event.target.value)} />
          </Label>
          <Label className="flex flex-col items-stretch gap-1.5 text-xs font-normal text-muted-foreground">
            当前版本
            <Input value={`v${template.version}`} disabled />
          </Label>
          <Label className="col-span-2 flex flex-col items-stretch gap-1.5 text-xs font-normal text-muted-foreground">
            模板描述
            <Textarea rows={2} value={desc} onChange={(event) => setDesc(event.target.value)} />
          </Label>
        </div>
        <ContractEditor template={template} value={contract} onChange={setContract} />
      </div>
      <SheetFooter className="shrink-0 flex-row justify-end border-t border-border">
        <Button variant="outline" onClick={onClose}>
          取消
        </Button>
        <Button onClick={save}>保存模板</Button>
      </SheetFooter>
    </>
  );
}

/** 卡片模板编辑器：维护模板信息与对外契约，修改不进入页面撤销栈 */
export default function CardTemplateEditor({ open, templateId, onClose }: CardTemplateEditorProps) {
  const template = useCardTemplate(open ? templateId : undefined);

  return (
    <Sheet
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <SheetContent side="right" className="w-[760px] gap-0 sm:max-w-[760px]">
        <SheetHeader className="shrink-0 border-b border-border">
          <SheetTitle>编辑卡片模板{template ? `：${template.name}` : ""}</SheetTitle>
          <SheetDescription>
            契约是页面唯一可配置边界；保存契约会生成新模板版本，不会修改页面组件树。
          </SheetDescription>
        </SheetHeader>

        {template ? (
          <EditorForm
            key={`${template.id}@${template.version}`}
            template={template}
            onClose={onClose}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
            卡片模板不存在或已被删除
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
