import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import { useInteractionStore } from "../interaction/runtime";
import { useComponetsStore } from "../stores/components";
import { useCardTemplatesStore } from "./store";
import { buildUpgradePatches, describeDiffItem, scanUpgrades } from "./upgrade";

interface CardUpgradeDialogProps {
  open: boolean;
  onClose: () => void;
}

/**
 * 模板升级面板：先展示 Contract diff，确认后才同步版本并清理失效配置
 */
export default function CardUpgradeDialog({ open, onClose }: CardUpgradeDialogProps) {
  const components = useComponetsStore((state) => state.components);
  const templates = useCardTemplatesStore((state) => state.templates);
  const interactions = useInteractionStore((state) => state.interactions);

  const candidates = useMemo(
    () => scanUpgrades({ components, templates, interactions }),
    [components, interactions, templates],
  );

  function applyUpgrade() {
    if (!candidates.length) return;

    useComponetsStore.getState().applyComponentPatches(buildUpgradePatches(candidates));
    toast.add({ title: `已升级 ${candidates.length} 个卡片实例，可一次撤销`, type: "success" });
    onClose();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>卡片模板升级</DialogTitle>
          <DialogDescription>
            只对比 Contract：新增可选配置安全，删除或改类型会在升级后清理实例上的失效绑定。
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
          {!candidates.length ? (
            <p className="py-8 text-center text-xs text-muted-foreground">
              当前页面没有待升级的卡片实例。
            </p>
          ) : null}

          {candidates.map((candidate) => (
            <div key={candidate.componentId} className="rounded-md border border-border p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{candidate.template.name}</div>
                  <div className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">
                    {candidate.scopeId}
                  </div>
                </div>
                <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                  v{candidate.fromVersion} → v{candidate.toVersion}
                </span>
              </div>

              {candidate.diff.added.length ? (
                <ul className="mt-2 space-y-0.5 text-[11px] text-muted-foreground">
                  {candidate.diff.added.map((item) => (
                    <li key={`added:${item.kind}:${item.key}`}>· 新增{describeDiffItem(item)}</li>
                  ))}
                </ul>
              ) : null}

              {candidate.diff.breaking.length ? (
                <ul className="mt-2 space-y-1 rounded-md bg-destructive/5 p-2 text-[11px] text-destructive">
                  {candidate.diff.breaking.map((item) => (
                    <li key={`breaking:${item.kind}:${item.key}`}>
                      {describeDiffItem(item)}：{item.breaking}
                    </li>
                  ))}
                </ul>
              ) : null}

              {!candidate.diff.added.length && !candidate.diff.breaking.length ? (
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Contract 无变化，仅同步实现版本。
                </p>
              ) : null}
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button disabled={!candidates.length} onClick={applyUpgrade}>
            确认升级
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
