import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";

import { Button } from "../../../components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "../../../components/ui/sheet";
import { cloneDeep } from "../../../lib/utils";
import ContextMenu from "./context-menu";
import { data } from "./data";
import type { Menu, Node } from "./data";
import ActionSettingPanel from "./setting-panel/action";
import ConditionSettingPanel from "./setting-panel/condition";
import { getTreeDepth } from "./utils";

const NODE_WIDTH = 140;
const NODE_HEIGHT = 40;
const H_GAP = 32;
const V_GAP = 56;
const PADDING = 40;
const MIN_CANVAS_WIDTH = 640;

const settingMap: Record<string, React.ElementType> = {
  action: ActionSettingPanel,
  condition: ConditionSettingPanel,
};

interface LayoutNode {
  id: string;
  node: Node;
  /** 节点中心 x */
  x: number;
  /** 节点顶部 y */
  y: number;
  width: number;
  height: number;
}

interface LayoutEdge {
  from: LayoutNode;
  to: LayoutNode;
  label: string;
}

interface LayoutResult {
  nodes: LayoutNode[];
  edges: LayoutEdge[];
  width: number;
  height: number;
}

const NODE_STYLE: Record<string, { fill: string; stroke: string; dashed?: boolean }> = {
  start: { fill: "#E6F7FF", stroke: "#91D5FF" },
  action: { fill: "#F6FFED", stroke: "#B7EB8F" },
  condition: { fill: "#FFF2E8", stroke: "#FFC069", dashed: true },
  event: { fill: "#FFFFFF", stroke: "#D9D9D9" },
};

/** 计算某个节点为根的子树所需宽度 */
function measureSubtree(node: Node): number {
  const children = node.children || [];

  if (!children.length) {
    return NODE_WIDTH;
  }

  const total =
    children.reduce((sum, child) => sum + measureSubtree(child), 0) + H_GAP * (children.length - 1);

  return Math.max(NODE_WIDTH, total);
}

function getEdgeLabel(parent: Node, child: Node): string {
  if (parent.type !== "condition") {
    return "";
  }

  const condition = (parent.config || []).find((item: any) => item.id === child.conditionId);
  return condition?.name || "";
}

/** 递归计算节点坐标 */
function createLayout(root: Node): LayoutResult {
  const nodes: LayoutNode[] = [];
  const edges: LayoutEdge[] = [];
  const width = Math.max(measureSubtree(root) + PADDING * 2, MIN_CANVAS_WIDTH);
  const centerX = width / 2;

  function place(node: Node, x: number, y: number, parent?: LayoutNode) {
    const current: LayoutNode = {
      id: node.id,
      node,
      x,
      y,
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
    };

    nodes.push(current);

    if (parent) {
      edges.push({ from: parent, to: current, label: getEdgeLabel(parent.node, node) });
    }

    const children = node.children || [];
    if (!children.length) return;

    const widths = children.map(measureSubtree);
    const total = widths.reduce((sum, item) => sum + item, 0) + H_GAP * (children.length - 1);
    let cursor = x - total / 2;

    children.forEach((child, index) => {
      const childCenter = cursor + widths[index] / 2;
      place(child, childCenter, y + NODE_HEIGHT + V_GAP, current);
      cursor += widths[index] + H_GAP;
    });
  }

  place(root, centerX, PADDING);

  const depth = getTreeDepth(root);
  const height = PADDING * 2 + depth * NODE_HEIGHT + Math.max(depth - 1, 0) * V_GAP;

  return { nodes, edges, width, height };
}

function findNode(node: Node | undefined, id: string | null): Node | undefined {
  if (!node || !id) return undefined;
  if (node.id === id) return node;

  for (const child of node.children || []) {
    const found = findNode(child, id);
    if (found) return found;
  }

  return undefined;
}

function updateTreeNode(node: Node, id: string, patch: Partial<Node>): Node {
  if (node.id === id) {
    return { ...node, ...patch };
  }

  if (!node.children?.length) {
    return node;
  }

  return {
    ...node,
    children: node.children.map((child) => updateTreeNode(child, id, patch)),
  };
}

function removeTreeNode(node: Node, id: string): Node {
  if (!node.children?.length) {
    return node;
  }

  return {
    ...node,
    children: node.children
      .filter((child) => child.id !== id)
      .map((child) => removeTreeNode(child, id)),
  };
}

/** 事件节点下可继续添加的菜单 */
function createEventMenus(eventKey?: string): Menu[] {
  return [
    {
      key: "action",
      label: "动作",
      nodeType: "action",
      nodeName: "动作",
      eventKey,
    },
    {
      key: "condition",
      label: "条件",
      nodeType: "condition",
      nodeName: "条件",
      eventKey,
    },
  ];
}

const EventFlowDesign = ({ flowData }: any, ref: any) => {
  const [tree, setTree] = useState<Node>(() => cloneDeep(flowData || data));
  const treeRef = useRef(tree);
  treeRef.current = tree;

  const [menuNodeId, setMenuNodeId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number }>();
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [settingOpen, setSettingOpen] = useState(false);

  const settingRef = useRef<any>(null);

  useEffect(() => {
    setTree(cloneDeep(flowData || data));
  }, [flowData]);

  const layout = useMemo(() => createLayout(tree), [tree]);

  const menuNode = useMemo(() => findNode(tree, menuNodeId), [tree, menuNodeId]);
  const activeNode = useMemo(() => findNode(tree, activeNodeId), [tree, activeNodeId]);

  const updateNode = useCallback((id: string, patch: Partial<Node>) => {
    setTree((prev) => updateTreeNode(prev, id, patch));
  }, []);

  useImperativeHandle(ref, () => ({
    save: () => cloneDeep(treeRef.current),
  }));

  function closeMenu() {
    setMenuNodeId(null);
  }

  function openMenu(node: Node, event: React.MouseEvent) {
    const rect = (event.currentTarget as SVGGElement).getBoundingClientRect();

    setActiveNodeId(null);
    setMenuNodeId(node.id);
    setMenuPosition({ top: rect.bottom + 4, left: rect.left - 10 });
  }

  function deleteNode(node: Node) {
    if (node.id === "root") return;

    setTree((prev) => removeTreeNode(prev, node.id));
    setMenuNodeId(null);

    if (activeNodeId === node.id) {
      setActiveNodeId(null);
      setSettingOpen(false);
    }
  }

  function handleMenuSelect(key: string) {
    const parent = menuNode;
    const menu = parent?.menus?.find((item) => item.key === key);

    if (!parent || !menu) return;

    const type = menu.nodeType || "action";

    const node: Node = {
      id: `n-${Date.now()}-${Math.round(Math.random() * 1000)}`,
      label: menu.nodeName || menu.label,
      type,
      menus: type === "event" ? createEventMenus(menu.eventKey) : [],
      conditionId: menu.conditionId,
      eventKey: menu.eventKey,
    };

    updateNode(parent.id, { children: [...(parent.children || []), node] });
    setMenuNodeId(null);
  }

  function openSetting(node: Node) {
    if (!["action", "condition"].includes(node.type)) return;

    setActiveNodeId(node.id);
    setSettingOpen(true);
    setMenuNodeId(null);
  }

  function saveSetting() {
    settingRef.current?.save?.();
  }

  const SettingComponent = activeNode ? settingMap[activeNode.type] : null;

  return (
    <div>
      <div
        className="h-[calc(100vh-65px)] w-full overflow-auto bg-[#F2F7FA]"
        onClick={() => setMenuNodeId(null)}
      >
        <svg
          width={layout.width}
          height={layout.height}
          className="block select-none"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setMenuNodeId(null);
            }
          }}
        >
          {layout.edges.map((edge, index) => {
            const startX = edge.from.x;
            const startY = edge.from.y + NODE_HEIGHT;
            const endX = edge.to.x;
            const endY = edge.to.y;
            const midY = (startY + endY) / 2;
            const path = `M ${startX} ${startY} L ${startX} ${midY} L ${endX} ${midY} L ${endX} ${endY}`;

            return (
              <g key={`${edge.from.id}-${edge.to.id}-${index}`}>
                <path d={path} fill="none" stroke="#91D5FF" strokeWidth={1} />
                {edge.label ? (
                  <text
                    x={(startX + endX) / 2}
                    y={midY - 4}
                    textAnchor="middle"
                    className="fill-muted-foreground text-[12px]"
                  >
                    {edge.label}
                  </text>
                ) : null}
              </g>
            );
          })}

          {layout.nodes.map((item) => {
            const style = NODE_STYLE[item.node.type] || NODE_STYLE.event;
            const left = item.x - NODE_WIDTH / 2;
            const plusY = item.y + NODE_HEIGHT + 12;
            const removeX = item.x + NODE_WIDTH / 2 - 2;
            const removeY = item.y + 2;

            return (
              <g key={item.id}>
                <rect
                  x={left}
                  y={item.y}
                  width={NODE_WIDTH}
                  height={NODE_HEIGHT}
                  rx={6}
                  fill={style.fill}
                  stroke={style.stroke}
                  strokeWidth={1}
                  strokeDasharray={style.dashed ? "4 4" : undefined}
                  className={
                    ["action", "condition"].includes(item.node.type) ? "cursor-pointer" : undefined
                  }
                  onClick={(event) => {
                    event.stopPropagation();
                    openSetting(item.node);
                  }}
                />
                <text
                  x={item.x}
                  y={item.y + NODE_HEIGHT / 2}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="pointer-events-none fill-foreground text-[13px]"
                >
                  {item.node.label}
                </text>

                {item.node.menus?.length ? (
                  <g
                    className="cursor-pointer"
                    onClick={(event) => {
                      event.stopPropagation();
                      openMenu(item.node, event);
                    }}
                  >
                    <circle
                      cx={item.x}
                      cy={plusY}
                      r={9}
                      fill="#FFFFFF"
                      stroke="#73D13D"
                      strokeWidth={1}
                    />
                    <path
                      d={`M ${item.x - 4} ${plusY} L ${item.x + 4} ${plusY} M ${item.x} ${
                        plusY - 4
                      } L ${item.x} ${plusY + 4}`}
                      stroke="#73D13D"
                      strokeWidth={1.5}
                      strokeLinecap="round"
                    />
                  </g>
                ) : null}

                {item.node.id !== "root" ? (
                  <g
                    className="cursor-pointer"
                    onClick={(event) => {
                      event.stopPropagation();
                      deleteNode(item.node);
                    }}
                  >
                    <circle
                      cx={removeX}
                      cy={removeY}
                      r={8}
                      fill="#FFFFFF"
                      stroke="#FF4D4F"
                      strokeWidth={1}
                    />
                    <path
                      d={`M ${removeX - 3} ${removeY - 3} L ${removeX + 3} ${removeY + 3} M ${
                        removeX + 3
                      } ${removeY - 3} L ${removeX - 3} ${removeY + 3}`}
                      stroke="#FF4D4F"
                      strokeWidth={1.5}
                      strokeLinecap="round"
                    />
                  </g>
                ) : null}
              </g>
            );
          })}
        </svg>
      </div>

      <ContextMenu
        position={menuPosition}
        items={(menuNode?.menus || []).map((item) => ({ key: item.key, label: item.label }))}
        open={!!menuNode}
        onSelect={handleMenuSelect}
        onClose={closeMenu}
      />

      <Sheet
        open={settingOpen}
        onOpenChange={(open) => {
          if (!open) setSettingOpen(false);
        }}
      >
        <SheetContent side="right" style={{ width: "500px", maxWidth: "500px" }}>
          <SheetHeader>
            <SheetTitle>设置</SheetTitle>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-auto">
            {SettingComponent && activeNode
              ? React.createElement(SettingComponent, {
                  node: activeNode,
                  updateNode,
                  close: () => setSettingOpen(false),
                  ref: settingRef,
                })
              : null}
          </div>
          <SheetFooter>
            <Button onClick={saveSetting}>确定</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default forwardRef(EventFlowDesign);
