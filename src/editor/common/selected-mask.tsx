import { Trash2 } from "lucide-react";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useState } from "react";
import { createPortal } from "react-dom";

import { openConfirm } from "./confirm-dialog";
import { useComponentConfigStore } from "../stores/component-config";
import { useComponetsStore } from "../stores/components";

interface Props {
  // 容器class
  containerClassName: string;
  // 相对容器class
  offsetContainerClassName: string;
}

function SelectedMask({ containerClassName, offsetContainerClassName }: Props, ref: any) {
  const [position, setPosition] = useState({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    toolsTop: 0,
    toolsLeft: 0,
  });

  const { curComponent, curComponentId, setCurComponentId, deleteComponent } = useComponetsStore();

  const { componentConfig } = useComponentConfigStore();

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

    let toolsTop = top - containerTop + container.scrollTop;
    let toolsLeft = left - containerLeft + width;

    if (toolsTop <= 0) {
      toolsTop -= -30;
      toolsLeft -= 10;
    }

    setPosition({
      top: top - containerTop + container.scrollTop,
      left: left - containerLeft + container.scrollLeft,
      width,
      height,
      toolsTop,
      toolsLeft,
    });
  }, [curComponentId, offsetContainerClassName]);

  // 对外暴露更新位置方法
  useImperativeHandle(ref, () => ({
    updatePosition: () => updatePosition(),
  }));

  useEffect(() => {
    updatePosition();
  }, [updatePosition]);

  function deleteHandle() {
    deleteComponent(curComponentId);
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
      <div
        style={{
          position: "absolute",
          left: position.toolsLeft,
          top: position.toolsTop,
          fontSize: "14px",
          color: "#ff4d4f",
          zIndex: 11,
          display: !position.width || position.width < 10 ? "none" : "inline",
          transform: "translate(-100%, -100%)",
          pointerEvents: "auto",
        }}
      >
        <div className="flex items-center gap-2">
          <div
            style={{
              padding: "0 8px",
              backgroundColor: "#1890ff",
              borderRadius: 4,
              color: "#fff",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {componentConfig[curComponent?.name || ""]?.desc}
          </div>
          {+(curComponentId || 0) !== 1 && (
            <div
              style={{ padding: "0 8px", backgroundColor: "#1890ff", borderRadius: 4 }}
              className="flex items-center"
            >
              <Trash2
                style={{ color: "#fff" }}
                className="h-4 w-4 cursor-pointer"
                onClick={openDeleteConfirm}
              />
            </div>
          )}
        </div>
      </div>
    </>,
    document.querySelector(`.${containerClassName}`)!,
  );
}

export default forwardRef(SelectedMask);
