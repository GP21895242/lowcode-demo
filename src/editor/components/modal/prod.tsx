import { forwardRef, useImperativeHandle, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { CommonComponentProps } from "../../interface";

function ModalProd({ children, title, onOk, onCancel }: CommonComponentProps, ref: any) {
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
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onCancel?.();
          setOpen(false);
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {children}
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onCancel?.();
              setOpen(false);
            }}
          >
            取消
          </Button>
          <Button
            disabled={confirmLoading}
            onClick={() => {
              onOk?.();
            }}
          >
            确定
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default forwardRef(ModalProd as any);
