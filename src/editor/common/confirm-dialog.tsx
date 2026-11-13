import * as React from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../components/ui/alert-dialog";

export interface ConfirmOptions {
  title?: React.ReactNode;
  content?: React.ReactNode;
  okText?: React.ReactNode;
  cancelText?: React.ReactNode;
  onOk?: () => void | Promise<void>;
  onCancel?: () => void;
  zIndex?: number;
}

interface ConfirmState extends ConfirmOptions {
  id: number;
}

let currentState: ConfirmState | null = null;
const listeners = new Set<(state: ConfirmState | null) => void>();

function publish() {
  listeners.forEach((listener) => listener(currentState));
}

/**
 * 打开一个全局确认框（基于 shadcn AlertDialog）。
 */
export function openConfirm(options: ConfirmOptions) {
  currentState = { ...options, id: Date.now() };
  publish();
}

export function ConfirmDialogHost() {
  const [state, setState] = React.useState<ConfirmState | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    listeners.add(setState);
    return () => {
      listeners.delete(setState);
    };
  }, []);

  React.useEffect(() => {
    setLoading(false);
  }, [state?.id]);

  function close() {
    currentState = null;
    publish();
  }

  function handleCancel() {
    state?.onCancel?.();
    close();
  }

  async function handleOk() {
    try {
      setLoading(true);
      await state?.onOk?.();
    } finally {
      close();
    }
  }

  return (
    <AlertDialog
      open={!!state}
      onOpenChange={(open) => {
        if (!open) handleCancel();
      }}
    >
      <AlertDialogContent style={{ zIndex: state?.zIndex ?? 100000 }}>
        <AlertDialogHeader>
          <AlertDialogTitle>{state?.title ?? "提示"}</AlertDialogTitle>
          {state?.content ? <AlertDialogDescription>{state.content}</AlertDialogDescription> : null}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>
            {state?.cancelText ?? "取消"}
          </AlertDialogCancel>
          <AlertDialogAction disabled={loading} onClick={() => void handleOk()}>
            {state?.okText ?? "确定"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
