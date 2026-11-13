import { Plus, Settings } from "lucide-react";
import { forwardRef, useImperativeHandle, useState } from "react";

import { Button } from "../../../../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../../../components/ui/dialog";
import { Input } from "../../../../../components/ui/input";
import { Textarea } from "../../../../../components/ui/textarea";
import { cn } from "../../../../../lib/utils";
import type { SettingPanelProps } from "../../data";

const DEFAULT_CONDITION = `(function(ctx) { \n\n })(ctx)`;

interface ConditionItem {
  id: string;
  name?: string;
  condition?: string;
}

function ConditionSettingPanel({ node, updateNode, close }: SettingPanelProps, ref: any) {
  const [data, setData] = useState<ConditionItem[]>(node.config || []);
  const [conditionVisible, setConditionVisible] = useState(false);
  const [curIndex, setCurIndex] = useState(0);
  const [conditionValue, setConditionValue] = useState(DEFAULT_CONDITION);

  useImperativeHandle(
    ref,
    () => ({
      save: () => {
        updateNode(node.id, {
          config: data,
          menus: data.map((item) => ({
            key: item.id,
            label: item.name || "",
            nodeType: "action",
            nodeName: "动作",
            conditionId: item.id,
          })),
        });

        close();
      },
    }),
    [close, data, node.id, updateNode],
  );

  function changeItem(index: number, patch: Partial<ConditionItem>) {
    setData((prev) =>
      prev.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)),
    );
  }

  return (
    <div className="py-2">
      <div className="flex flex-col gap-2">
        {data.map((item, index) => (
          <div key={item.id} className="flex items-center gap-2">
            <span className="w-5 shrink-0 text-right text-sm text-muted-foreground">
              {index + 1}.
            </span>
            <Input
              value={item.name ?? ""}
              placeholder="条件名称"
              onChange={(event) => changeItem(index, { name: event.target.value })}
            />
            <Settings
              className={cn(
                "h-4 w-4 shrink-0 cursor-pointer",
                item.condition ? "text-primary" : "text-muted-foreground",
              )}
              onClick={() => {
                setCurIndex(index);
                setConditionValue(item.condition || DEFAULT_CONDITION);
                setConditionVisible(true);
              }}
            />
          </div>
        ))}
      </div>

      <Button
        variant="outline"
        className="mt-4 w-full border-dashed"
        onClick={() => {
          setData((prev) => [...prev, { id: new Date().getTime().toString() }]);
        }}
      >
        <Plus className="h-4 w-4" />
        添加条件
      </Button>

      <Dialog
        open={conditionVisible}
        onOpenChange={(open) => {
          if (!open) setConditionVisible(false);
        }}
      >
        <DialogContent style={{ zIndex: 1200 }}>
          <DialogHeader>
            <DialogTitle>条件设置</DialogTitle>
          </DialogHeader>
          <Textarea
            rows={10}
            value={conditionValue}
            onChange={(event) => setConditionValue(event.target.value)}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setConditionVisible(false);
              }}
            >
              取消
            </Button>
            <Button
              onClick={() => {
                changeItem(curIndex, { condition: conditionValue });
                setConditionVisible(false);
              }}
            >
              确定
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default forwardRef(ConditionSettingPanel);
