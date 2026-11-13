import {
  Box,
  ChartColumn,
  Columns3,
  LayoutTemplate,
  type LucideIcon,
  MousePointerClick,
  PanelsTopLeft,
  Rows3,
  Search,
  Table2,
  TextCursorInput,
} from "lucide-react";
import { useEffect } from "react";
import { useDrag } from "react-dnd";
import { useComponentConfigStore } from "../stores/component-config";

interface ComponentItemProps {
  // 组件名称
  name: string;
  // 组件描述
  description: string;
  // 拖拽结束回调
  onDragEnd: any;
  // 拖拽中回调
  onDragging?: () => void;
}

const iconMap: Record<string, LucideIcon> = {
  Box: Box,
  Button: MousePointerClick,
  Chart: ChartColumn,
  Form: LayoutTemplate,
  FormItem: TextCursorInput,
  Modal: PanelsTopLeft,
  SearchForm: Search,
  SearchFormItem: Search,
  Space: Rows3,
  Table: Table2,
  TableColumn: Columns3,
};

const ComponentItem: React.FC<ComponentItemProps> = ({
  name,
  description,
  onDragEnd,
  onDragging,
}) => {
  const { componentConfig } = useComponentConfigStore();

  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: name,
      end: (_, monitor) => {
        const dropResult = monitor.getDropResult();

        if (!dropResult) return;

        let props: any = {};

        const defaultProps = componentConfig?.[name]?.defaultProps;

        if (defaultProps) {
          if (typeof defaultProps === "function") {
            props = defaultProps();
          } else {
            props = defaultProps || {};
          }
        }

        onDragEnd?.({
          name,
          props,
          desc: description,
          ...dropResult,
        });
      },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
        handlerId: monitor.getHandlerId(),
      }),
    }),
    [name, componentConfig],
  );

  useEffect(() => {
    if (onDragging) {
      onDragging();
    }
  }, [onDragging, isDragging]);

  const opacity = isDragging ? 0.4 : 1;
  const Icon = iconMap[name] || Box;

  return (
    <div
      ref={drag as any}
      className="group flex cursor-move flex-col items-center gap-1.5 rounded-md border border-transparent px-2 py-3 text-center transition-colors hover:border-border hover:bg-muted/60"
      style={{
        opacity,
      }}
    >
      <span className="flex size-9 items-center justify-center rounded-md bg-muted text-muted-foreground transition-colors group-hover:bg-background group-hover:text-primary">
        <Icon className="size-4" />
      </span>
      <span className="w-full truncate text-xs text-foreground">{description}</span>
    </div>
  );
};

export default ComponentItem;
