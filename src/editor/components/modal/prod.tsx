import { Modal as AntdModal } from "antd";
import { forwardRef, useImperativeHandle, useState } from "react";
import type { CommonComponentProps } from "../../interface";

function Modal({ children, title, onOk, onCancel }: CommonComponentProps, ref: any) {
  const [open, setOpen] = useState(false);

  const [confirmLoading, setConfirmLoading] = useState(false);

  useImperativeHandle(ref, () => {
    return {
      open: () => {
        setOpen(true);
      },
      close: () => {
        setOpen(false);
      },
      startConfirmLoading: () => {
        setConfirmLoading(true);
      },
      endConfirmLoading: () => {
        setConfirmLoading(false);
      },
    };
  }, []);

  return (
    <AntdModal
      title={title}
      open={open}
      onCancel={() => {
        onCancel?.();
        setOpen(false);
      }}
      onOk={() => {
        onOk?.();
      }}
      confirmLoading={confirmLoading}
      destroyOnClose
    >
      {children}
    </AntdModal>
  );
}

// @ts-expect-error forwardRef type mismatch
export default forwardRef(Modal);
