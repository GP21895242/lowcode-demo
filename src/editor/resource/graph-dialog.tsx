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
import { useCardTemplatesStore } from "../card-template/store";
import { useDataSourceStore } from "../data-source/store";
import { useInteractionStore } from "../interaction/runtime";
import { useComponetsStore } from "../stores/components";
import { buildPageGraph, type PageGraphEdge, type PageGraphNode } from "./graph";

interface PageGraphDialogProps {
  open: boolean;
  onClose: () => void;
}

const EDGE_STYLE: Record<PageGraphEdge["kind"], { className: string; dash?: string }> = {
  interaction: { className: "stroke-primary" },
  slot: { className: "stroke-muted-foreground", dash: "2 3" },
  relation: { className: "stroke-muted-foreground", dash: "5 3" },
};

const NODE_STROKE: Record<PageGraphNode["kind"], string> = {
  card: "stroke-primary",
  source: "stroke-border",
  variable: "stroke-muted-foreground",
};

function truncate(text: string, max: number) {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

/**
 * 页面连线图：只读展示卡片插槽、数据源关联与卡片联动，不提供编辑能力
 */
export default function PageGraphDialog({ open, onClose }: PageGraphDialogProps) {
  const components = useComponetsStore((state) => state.components);
  const sources = useDataSourceStore((state) => state.sources);
  const relations = useDataSourceStore((state) => state.relations);
  const interactions = useInteractionStore((state) => state.interactions);
  const templates = useCardTemplatesStore((state) => state.templates);

  const graph = useMemo(
    () => buildPageGraph({ components, sources, relations, interactions, templates }),
    [components, interactions, relations, sources, templates],
  );

  const nodeMap = useMemo(() => new Map(graph.nodes.map((node) => [node.id, node])), [graph.nodes]);

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <DialogContent className="sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>页面连线图</DialogTitle>
          <DialogDescription>
            只读视图：卡片插槽映射、数据源关联与卡片联动。虚线表示插槽与关联，实线表示联动。
          </DialogDescription>
        </DialogHeader>

        {!graph.nodes.length ? (
          <p className="py-10 text-center text-xs text-muted-foreground">
            页面暂无卡片或数据源，插入卡片并配置联动后可查看连线。
          </p>
        ) : (
          <div className="max-h-[60vh] overflow-auto rounded-md border border-border bg-muted/20 p-2">
            <svg
              width={graph.width}
              height={graph.height}
              viewBox={`0 0 ${graph.width} ${graph.height}`}
              role="img"
              aria-label="页面连线图"
            >
              {graph.edges.map((edge) => {
                const from = nodeMap.get(edge.from);
                const to = nodeMap.get(edge.to);
                if (!from || !to) return null;

                const x1 = from.x + from.width;
                const y1 = from.y + from.height / 2;
                const x2 = to.x;
                const y2 = to.y + to.height / 2;
                const forward = x2 > x1;
                const mid = (x1 + x2) / 2;
                const path = forward
                  ? `M${x1},${y1} C${mid},${y1} ${mid},${y2} ${x2},${y2}`
                  : `M${x1},${y1} C${x1 + 48},${y1 - 36} ${x2 - 48},${y2 - 36} ${x2},${y2}`;
                const style = EDGE_STYLE[edge.kind];

                return (
                  <g key={edge.id} opacity={edge.enabled ? 1 : 0.35}>
                    <path
                      d={path}
                      fill="none"
                      strokeWidth={1.5}
                      strokeDasharray={style.dash}
                      className={style.className}
                    />
                    <circle cx={x2} cy={y2} r={2.5} className="fill-muted-foreground" />
                    <text
                      x={forward ? mid : (x1 + x2) / 2}
                      y={(y1 + y2) / 2 - 6}
                      textAnchor="middle"
                      className="fill-muted-foreground text-[9px]"
                    >
                      {truncate(edge.label, 22)}
                    </text>
                  </g>
                );
              })}

              {graph.nodes.map((node) => (
                <g key={node.id}>
                  <rect
                    x={node.x}
                    y={node.y}
                    width={node.width}
                    height={node.height}
                    rx={6}
                    strokeWidth={1.2}
                    className={`fill-background ${NODE_STROKE[node.kind]}`}
                  />
                  <text
                    x={node.x + 10}
                    y={node.y + 16}
                    className="fill-foreground text-[11px] font-medium"
                  >
                    {truncate(node.label, node.kind === "variable" ? 16 : 22)}
                  </text>
                  {node.sublabel ? (
                    <text
                      x={node.x + 10}
                      y={node.y + 30}
                      className="fill-muted-foreground font-mono text-[9px]"
                    >
                      {truncate(node.sublabel, node.kind === "variable" ? 18 : 30)}
                    </text>
                  ) : null}
                </g>
              ))}
            </svg>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="inline-block h-0.5 w-5 bg-primary" />
            联动
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-px w-5 border-t border-dashed border-muted-foreground" />
            插槽
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-px w-5 border-t border-dashed border-muted-foreground" />
            数据源关联
          </span>
          <span>主键 / 圆点表示目标端</span>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            关闭
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
