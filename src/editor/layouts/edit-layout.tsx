import { Redo2, Undo2 } from "lucide-react";
import { useRef } from "react";

import { Button } from "../../components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "../../components/ui/resizable";
import MergeDialog from "../resource/merge-dialog";
import { useComponetsStore } from "../stores/components";
import Setting from "./setting";
import Sidebar from "./sidebar";
import EditStage from "./stage/edit";
import Toolbar from "./toolbar";

interface EditLayoutProps {
  pageId?: string;
  pageName?: string;
  view: "edit" | "preview";
  fromEdit?: boolean;
  cardTemplate?: { id: string; name: string; from?: string };
}

/**
 * 编辑态布局：只在编辑模式加载，选中、历史与建议等设计 store 不会进入预览包
 */
const EditLayout: React.FC<EditLayoutProps> = ({
  pageId,
  pageName,
  view,
  fromEdit,
  cardTemplate,
}) => {
  const { past, future, undo, redo } = useComponetsStore();
  const editStageRef = useRef<any>(null);

  function onDragging() {
    editStageRef.current?.updateSelectedMaskPosition();
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Toolbar
        pageId={pageId}
        pageName={pageName ?? cardTemplate?.name}
        view={view}
        fromEdit={fromEdit}
        cardTemplate={cardTemplate}
      />
      {cardTemplate ? null : <MergeDialog />}
      <ResizablePanelGroup orientation="horizontal" className="min-h-0 flex-1">
        <ResizablePanel defaultSize={320} minSize={280} maxSize={520}>
          <Sidebar onDragging={onDragging} materialMode={cardTemplate ? "card" : "page"} />
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel className="min-w-0">
          <div className="relative flex h-full min-h-0 flex-col overflow-hidden">
            <div className="flex h-9 shrink-0 items-center gap-1 border-b border-border bg-background px-2">
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="撤销"
                title="撤销"
                disabled={past.length === 0}
                onClick={undo}
              >
                <Undo2 />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="重做"
                title="重做"
                disabled={future.length === 0}
                onClick={redo}
              >
                <Redo2 />
              </Button>
            </div>
            <div className="min-h-0 flex-1 overflow-auto bg-muted/40 p-4">
              <div className="flex min-h-full flex-col rounded-lg border border-border bg-background shadow-sm">
                <EditStage ref={editStageRef} />
              </div>
            </div>
          </div>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={320} maxSize={520} minSize={280}>
          <Setting />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default EditLayout;
