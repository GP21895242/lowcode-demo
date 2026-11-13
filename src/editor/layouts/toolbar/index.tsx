import { AppWindow, Eye, GitBranch, Layers, Play } from "lucide-react";

import { Button } from "../../../components/ui/button";
import { useComponetsStore } from "../../stores/components";
import { usePageDataStore } from "../../stores/page-data";
import { useVariablesStore } from "../../stores/variable";
import { getVariablesDefaultData } from "../../utils/utils";

const Toolbar: React.FC = () => {
  const { mode, setMode, setCurComponentId } = useComponetsStore();
  const { resetData, mergeData } = usePageDataStore();
  const { variables } = useVariablesStore();

  function enterPreview() {
    setMode("preview");
    setCurComponentId(null);
    // 预览前重置运行时数据，并重新注入变量默认值，避免变量绑定的内容丢失
    resetData();
    mergeData(getVariablesDefaultData(variables));
  }

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border bg-background px-4">
      <div className="flex items-center gap-2">
        <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Layers className="size-4" />
        </div>
        <span className="text-sm font-semibold">lowcode</span>
      </div>
      <div className="mx-1 h-5 w-px bg-border" />
      <span className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground">
        <GitBranch className="size-3.5" />
        main
      </span>
      <span className="flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-xs">
        <AppWindow className="size-3.5 text-muted-foreground" />
        首页
      </span>

      <div className="flex-1" />

      {mode === "edit" ? (
        <Button size="sm" onClick={enterPreview}>
          <Play />
          预览
        </Button>
      ) : (
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setMode("edit");
          }}
        >
          <Eye />
          退出预览
        </Button>
      )}
    </header>
  );
};

export default Toolbar;
