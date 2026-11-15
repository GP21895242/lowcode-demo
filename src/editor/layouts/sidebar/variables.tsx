import { Pencil } from "lucide-react";

import { Button } from "../../../components/ui/button";
import { useVariablesStore } from "../../stores/variable";

interface VariablesProps {
  onEdit: () => void;
}

const Variables: React.FC<VariablesProps> = ({ onEdit }) => {
  const { variables } = useVariablesStore();

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-auto p-2">
        {variables.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted-foreground">暂无变量</p>
        ) : (
          variables.map((variable) => (
            <div key={variable.name} className="mb-1.5 rounded-md border border-border p-2">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate font-mono text-xs text-foreground">{variable.name}</span>
                <span className="shrink-0 rounded bg-muted px-1 py-0.5 text-[10px] text-muted-foreground">
                  {variable.type}
                </span>
                {variable.scope === "search" ? (
                  <span className="shrink-0 rounded bg-primary/10 px-1 py-0.5 text-[10px] text-primary">
                    搜索
                  </span>
                ) : null}
                {variable.readonly ? (
                  <span className="shrink-0 rounded bg-muted px-1 py-0.5 text-[10px] text-muted-foreground">
                    只读
                  </span>
                ) : null}
              </div>
              <p className="mt-1 truncate text-xs text-muted-foreground">
                默认值：{variable.defaultValue || "-"}
              </p>
              {variable.remark ? (
                <p className="truncate text-xs text-muted-foreground">备注：{variable.remark}</p>
              ) : null}
            </div>
          ))
        )}
      </div>
      <div className="shrink-0 border-t border-border p-2">
        <Button variant="outline" size="sm" className="w-full" onClick={onEdit}>
          <Pencil />
          编辑变量
        </Button>
      </div>
    </div>
  );
};

export default Variables;
