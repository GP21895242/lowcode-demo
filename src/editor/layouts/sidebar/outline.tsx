import { ChevronRight } from "lucide-react";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { useComponetsStore } from "../../stores/components";

interface TreeNodeData {
  id: number;
  name?: string;
  desc?: string;
  children?: TreeNodeData[];
}

function TreeNode({ node }: { node: TreeNodeData }) {
  const { curComponentId, setCurComponentId } = useComponetsStore();
  const label = node.desc || node.name || "";
  const active = curComponentId === node.id;

  const labelNode = (
    <button
      type="button"
      className={cn(
        "min-w-0 flex-1 truncate rounded-md px-2 py-1 text-left text-xs",
        active ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted",
      )}
      onClick={() => setCurComponentId(node.id)}
    >
      {label}
    </button>
  );

  if (!node.children?.length) {
    return <div className="flex items-center">{labelNode}</div>;
  }

  return (
    <Collapsible defaultOpen>
      <div className="flex items-center gap-0.5">
        <CollapsibleTrigger className="group flex size-5 shrink-0 items-center justify-center rounded-sm text-muted-foreground hover:bg-muted">
          <ChevronRight className="size-3.5 transition-transform group-data-[panel-open]:rotate-90" />
        </CollapsibleTrigger>
        {labelNode}
      </div>
      <CollapsibleContent>
        <div className="ml-2.5 border-l border-border pl-1">
          {node.children.map((child) => (
            <TreeNode key={child.id} node={child} />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

const Outline = () => {
  const { components } = useComponetsStore();

  return (
    <div className="p-2">
      {components.map((component) => (
        <TreeNode key={component.id} node={component as TreeNodeData} />
      ))}
    </div>
  );
};

export default Outline;
