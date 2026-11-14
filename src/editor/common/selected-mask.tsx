import { ClipboardPaste, Copy, GripVertical, Layers, LocateFixed, Trash2 } from "lucide-react";
import type { CSSProperties } from "react";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { createPortal } from "react-dom";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import { useComponentConfigStore } from "../stores/component-config";
import type { Component } from "../stores/components";
import { ROOT_COMPONENT_ID, useComponetsStore } from "../stores/components";
import { getComponentById, getComponentPath } from "../utils/utils";
import { openConfirm } from "./confirm-dialog";
import SiblingInsertButton from "./sibling-insert-button";

interface Props {
  // 容器class
  containerClassName: string;
  // 相对容器class
  offsetContainerClassName: string;
}

type DropPosition = "before" | "after";

interface DropTarget {
  targetId: number;
  position: DropPosition;
}

const toolButtonClass =
  "flex size-5 items-center justify-center rounded-sm text-white transition-colors hover:bg-white/25 disabled:pointer-events-none disabled:opacity-40";

/**
 * 获取最近的滚动容器的可视区域位置
 */
function getScrollViewport(node: Element) {
  let current = node.parentElement;

  while (current) {
    const { overflowX, overflowY } = getComputedStyle(current);

    if (["auto", "scroll"].includes(overflowX) || ["auto", "scroll"].includes(overflowY)) {
      const { top, left } = current.getBoundingClientRect();

      return { top, left };
    }

    current = current.parentElement;
  }

  return { top: 0, left: 0 };
}

function SelectedMask({ containerClassName, offsetContainerClassName }: Props, ref: any) {
  const [position, setPosition] = useState({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
  });

  // 拖拽排序时的插入位置指示线
  const [indicator, setIndicator] = useState<{
    left: number;
    top: number;
    width: number;
  } | null>(null);

  // 工具栏是否显示在选中框下方（上方空间不足时）
  const [toolbarBelow, setToolbarBelow] = useState(false);
  // 工具栏是否左对齐（右侧空间不足时）
  const [toolbarLeftAlign, setToolbarLeftAlign] = useState(false);

  const toolbarRef = useRef<HTMLDivElement>(null);

  const {
    components,
    clipboard,
    curComponent,
    curComponentId,
    deleteComponent,
    setCurComponentId,
    copyComponent,
    pasteComponent,
  } = useComponetsStore();

  const { componentConfig } = useComponentConfigStore();

  const dropTargetRef = useRef<DropTarget | null>(null);
  const cleanupDragRef = useRef<() => void>(() => {});

  const currentId = curComponentId ? Number(curComponentId) : null;
  const componentPath = getComponentPath(currentId, components);
  const parent = componentPath.length >= 2 ? componentPath[componentPath.length - 2] : null;
  const parentList = componentPath.slice(0, -1).reverse();

  const componentDesc = useCallback(
    (component: Component) =>
      componentConfig[component.name]?.desc || component.desc || component.name,
    [componentConfig],
  );

  const updatePosition = useCallback(() => {
    if (!curComponentId) return;

    const container = document.querySelector(`.${offsetContainerClassName}`);
    if (!container) return;

    const node = document.querySelector(`[data-component-id="${curComponentId}"]`);

    if (!node) return;

    // 获取节点位置
    const { top, left, width, height } = node.getBoundingClientRect();
    // 获取容器位置
    const { top: containerTop, left: containerLeft } = container.getBoundingClientRect();

    setPosition({
      top: top - containerTop + container.scrollTop,
      left: left - containerLeft + container.scrollLeft,
      width,
      height,
    });

    // 上方空间不足时，工具栏显示在组件下方
    const viewport = getScrollViewport(container);
    setToolbarBelow(top - viewport.top < 36);

    // 右对齐时左侧越界则改为左对齐
    const toolbarWidth = toolbarRef.current?.offsetWidth ?? 0;
    setToolbarLeftAlign(toolbarWidth > 0 && left + width - toolbarWidth < viewport.left + 2);
  }, [curComponentId, offsetContainerClassName]);

  // 对外暴露更新位置方法
  useImperativeHandle(ref, () => ({
    updatePosition: () => updatePosition(),
  }));

  useEffect(() => {
    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);

    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [updatePosition]);

  // 组件卸载时清理拖拽监听
  useEffect(() => () => cleanupDragRef.current(), []);

  function deleteHandle() {
    deleteComponent(currentId);
    setCurComponentId(null);
  }

  function openDeleteConfirm() {
    openConfirm({
      title: "提示",
      content: "确认删除？",
      okText: "确认",
      cancelText: "取消",
      onOk: deleteHandle,
    });
  }

  function copyHandle() {
    if (!currentId) return;

    copyComponent(currentId);
  }

  function pasteHandle() {
    if (!currentId) return;

    const component = pasteComponent(currentId);

    if (component) {
      setCurComponentId(component.id);
    }
  }

  function locateHandle() {
    document
      .querySelector(`[data-component-id="${currentId}"]`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function handleDragStart(event: React.DragEvent<HTMLDivElement>) {
    if (!currentId) return;

    const draggedId = currentId;

    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(draggedId));

    const container = document.querySelector(`.${offsetContainerClassName}`);
    if (!container) return;

    const clearIndicator = () => {
      dropTargetRef.current = null;
      setIndicator(null);
    };

    function onDragOver(e: DragEvent) {
      e.preventDefault();

      const node = (document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null)?.closest(
        "[data-component-id]",
      ) as HTMLElement | null;

      if (!node) {
        clearIndicator();
        return;
      }

      const targetId = Number(node.getAttribute("data-component-id"));

      if (!targetId || targetId === draggedId) {
        clearIndicator();
        return;
      }

      const { components: currentComponents } = useComponetsStore.getState();
      const dragged = getComponentById(draggedId, currentComponents);
      const target = getComponentById(targetId, currentComponents);

      if (!dragged || !target) {
        clearIndicator();
        return;
      }

      // 不能移动到自身的子组件里
      let ancestorId = target.parentId;
      while (ancestorId) {
        if (ancestorId === draggedId) {
          clearIndicator();
          return;
        }
        ancestorId = getComponentById(ancestorId, currentComponents)?.parentId;
      }

      // 校验目标父组件是否允许拖入该组件
      const targetParent = target.parentId
        ? getComponentById(target.parentId, currentComponents)
        : target;
      const config = useComponentConfigStore.getState().componentConfig[dragged.name];

      if (!targetParent || !config?.allowDrag?.includes(targetParent.name)) {
        clearIndicator();
        return;
      }

      const { top, bottom, left, width } = node.getBoundingClientRect();
      const dropPosition: DropPosition = e.clientY < top + (bottom - top) / 2 ? "before" : "after";

      dropTargetRef.current = { targetId, position: dropPosition };

      const containerRect = container!.getBoundingClientRect();

      setIndicator({
        left: left - containerRect.left + container!.scrollLeft,
        top:
          (dropPosition === "before" ? top : bottom) - containerRect.top + container!.scrollTop - 1,
        width,
      });
    }

    function cleanupDrag() {
      window.removeEventListener("dragover", onDragOver);
      window.removeEventListener("drop", onDrop);
      window.removeEventListener("dragend", cleanupDrag);
      dropTargetRef.current = null;
      setIndicator(null);
    }

    function onDrop() {
      const dropTarget = dropTargetRef.current;

      if (dropTarget) {
        useComponetsStore
          .getState()
          .moveComponent(draggedId, dropTarget.targetId, dropTarget.position);
        useComponetsStore.getState().setCurComponentId(draggedId);
      }

      cleanupDrag();
    }

    cleanupDragRef.current = cleanupDrag;
    window.addEventListener("dragover", onDragOver);
    window.addEventListener("drop", onDrop);
    window.addEventListener("dragend", cleanupDrag);
  }

  const rootId = Number(curComponentId);
  const showTools = !!curComponent && rootId !== ROOT_COMPONENT_ID && position.width >= 10;
  const canPaste =
    !!clipboard && !!parent && !!componentConfig[clipboard.name]?.allowDrag?.includes(parent.name);

  const toolbarStyle: CSSProperties = {
    position: "absolute",
    // 默认显示在组件右上方；上方越界显示在右下方；左侧越界改为左对齐
    left: toolbarLeftAlign ? position.left : position.left + position.width,
    top: toolbarBelow ? position.top + position.height + 4 : position.top - 4,
    transform:
      [toolbarLeftAlign ? "" : "translateX(-100%)", toolbarBelow ? "" : "translateY(-100%)"]
        .filter(Boolean)
        .join(" ") || undefined,
    zIndex: 20,
  };

  return createPortal(
    <>
      <div
        style={{
          position: "absolute",
          left: position.left,
          top: position.top,
          backgroundColor: "rgba(66, 133, 244, 0.2)",
          border: "1px solid rgb(66, 133, 244)",
          pointerEvents: "none",
          width: position.width,
          height: position.height,
          zIndex: 10,
          borderRadius: 4,
          boxSizing: "border-box",
        }}
      />
      {indicator ? (
        <div
          style={{
            position: "absolute",
            left: indicator.left,
            top: indicator.top,
            width: indicator.width,
            height: 2,
            borderRadius: 1,
            backgroundColor: "#1677ff",
            pointerEvents: "none",
            zIndex: 19,
          }}
        />
      ) : null}
      {showTools ? (
        <div
          ref={toolbarRef}
          className="pointer-events-auto flex select-none items-center gap-0.5 rounded-md bg-[#1677ff] px-1 py-0.5 text-white shadow-md"
          style={toolbarStyle}
          onClick={(event) => event.stopPropagation()}
        >
          <div
            draggable
            title="拖拽调整位置"
            onDragStart={handleDragStart}
            className="flex size-5 cursor-grab items-center justify-center rounded-sm hover:bg-white/25 active:cursor-grabbing"
          >
            <GripVertical className="size-3.5" />
          </div>
          <span className="max-w-[140px] truncate px-1 text-xs">
            {componentDesc(curComponent!)}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger className={toolButtonClass} title="选择父组件">
              <Layers className="size-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent side="bottom" align="start" className="w-48">
              <DropdownMenuGroup>
                <DropdownMenuLabel>父组件</DropdownMenuLabel>
                {parentList.map((item) => (
                  <DropdownMenuItem key={item.id} onClick={() => setCurComponentId(item.id)}>
                    <span className="truncate">{componentDesc(item)}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <button type="button" className={toolButtonClass} title="定位" onClick={locateHandle}>
            <LocateFixed className="size-3.5" />
          </button>
          <button type="button" className={toolButtonClass} title="复制" onClick={copyHandle}>
            <Copy className="size-3.5" />
          </button>
          <button
            type="button"
            className={toolButtonClass}
            title="粘贴"
            disabled={!canPaste}
            onClick={pasteHandle}
          >
            <ClipboardPaste className="size-3.5" />
          </button>
          <button
            type="button"
            className={toolButtonClass}
            title="删除"
            onClick={openDeleteConfirm}
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      ) : null}
      {showTools && parent ? (
        <>
          <SiblingInsertButton
            parentId={parent.id}
            referenceId={currentId!}
            position="before"
            style={{
              left: position.left + position.width / 2,
              top: position.top,
            }}
          />
          <SiblingInsertButton
            parentId={parent.id}
            referenceId={currentId!}
            position="after"
            style={{
              left: position.left + position.width / 2,
              top: position.top + position.height,
            }}
          />
        </>
      ) : null}
    </>,
    document.querySelector(`.${containerClassName}`)!,
  );
}

export default forwardRef(SelectedMask);
