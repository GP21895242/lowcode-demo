import { useEffect, useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FieldSelect } from "@/editor/data-source/components/field-select";
import { useDataSourceStore } from "@/editor/data-source/store";
import type { DataSourceRelation, DataSourceRelationType } from "@/editor/data-source/types";

interface Props {
  open: boolean;
  onClose: () => void;
}

const RELATION_TYPES: { label: string; value: DataSourceRelationType }[] = [
  { label: "一对一", value: "one-to-one" },
  { label: "一对多", value: "one-to-many" },
  { label: "多对一", value: "many-to-one" },
];

function RelationRow({
  relation,
  sources,
  onChange,
  onDelete,
}: {
  relation: DataSourceRelation;
  sources: { id: string; name: string; title: string }[];
  onChange: (patch: Partial<DataSourceRelation>) => void;
  onDelete: () => void;
}) {
  const sourceItems = sources.map((source) => ({
    label: `${source.title}（${source.name}）`,
    value: source.id,
  }));

  return (
    <div className="rounded-md border border-border p-3">
      <div className="grid grid-cols-[1fr_20px_1fr_auto] items-end gap-2">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-xs text-muted-foreground">触发数据源</span>
          <Select
            value={relation.sourceId}
            items={sourceItems}
            onValueChange={(value) => onChange({ sourceId: String(value), sourceField: "" })}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="选择数据源" />
            </SelectTrigger>
            <SelectContent>
              {sourceItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <span className="pb-2 text-center text-xs text-muted-foreground">→</span>
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-xs text-muted-foreground">联动数据源</span>
          <Select
            value={relation.targetId}
            items={sourceItems}
            onValueChange={(value) => onChange({ targetId: String(value), targetField: "" })}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="选择数据源" />
            </SelectTrigger>
            <SelectContent>
              {sourceItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="mb-0.5 text-muted-foreground hover:text-destructive"
          onClick={onDelete}
          aria-label="删除关联"
        >
          <span className="text-lg leading-none">×</span>
        </Button>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-xs text-muted-foreground">关联类型</span>
          <Select
            value={relation.type}
            items={RELATION_TYPES}
            onValueChange={(value) => onChange({ type: String(value) as DataSourceRelationType })}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RELATION_TYPES.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-xs text-muted-foreground">源字段</span>
          <FieldSelect
            sourceId={relation.sourceId}
            value={relation.sourceField}
            onChange={(value) => onChange({ sourceField: value })}
          />
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-xs text-muted-foreground">目标字段</span>
          <FieldSelect
            sourceId={relation.targetId}
            value={relation.targetField}
            onChange={(value) => onChange({ targetField: value })}
          />
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-xs text-muted-foreground">参数名（默认目标字段）</span>
          <Input
            value={relation.paramKey ?? ""}
            onChange={(event) => onChange({ paramKey: event.target.value })}
            placeholder={relation.targetField || "region"}
          />
        </div>
      </div>

      <label className="mt-2 flex items-center gap-1.5 text-xs">
        <input
          type="checkbox"
          className="size-3.5 accent-primary"
          checked={relation.enabled}
          onChange={(event) => onChange({ enabled: event.target.checked })}
        />
        启用联动
      </label>
    </div>
  );
}

export function RelationEditor({ open, onClose }: Props) {
  const sources = useDataSourceStore((state) => state.sources);
  const setRelations = useDataSourceStore((state) => state.setRelations);
  const [relations, setDraftRelations] = useState<DataSourceRelation[]>([]);

  useEffect(() => {
    if (!open) return;
    setDraftRelations(JSON.parse(JSON.stringify(useDataSourceStore.getState().relations)));
  }, [open]);

  function update(id: string, patch: Partial<DataSourceRelation>) {
    setDraftRelations((prev) =>
      prev.map((relation) => (relation.id === id ? { ...relation, ...patch } : relation)),
    );
  }

  function add() {
    const source = sources[0];
    const target = sources[1] ?? sources[0];
    if (!source || !target) return;

    setDraftRelations((prev) => [
      ...prev,
      {
        id: `relation_${Date.now()}`,
        sourceId: source.id,
        targetId: target.id,
        type: "one-to-many",
        sourceField: source.fields[0]?.dataKey ?? "",
        targetField: target.fields[0]?.dataKey ?? "",
        paramKey: target.fields[0]?.dataKey ?? "",
        enabled: true,
      },
    ]);
  }

  function save() {
    setRelations(
      relations.filter(
        (relation) =>
          relation.sourceId && relation.targetId && relation.sourceField && relation.targetField,
      ),
    );
    onClose();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>数据源关联关系</DialogTitle>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto pr-1">
          {sources.length < 2 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">
              至少需要两个数据源才能配置关联关系。
            </p>
          ) : (
            <div className="flex flex-col gap-2 py-2">
              {relations.map((relation) => (
                <RelationRow
                  key={relation.id}
                  relation={relation}
                  sources={sources}
                  onChange={(patch) => update(relation.id, patch)}
                  onDelete={() =>
                    setDraftRelations((prev) => prev.filter((item) => item.id !== relation.id))
                  }
                />
              ))}
              <Button variant="outline" className="w-full border-dashed" onClick={add}>
                <Plus className="size-4" />
                添加关联
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button onClick={save} disabled={sources.length < 2}>
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
