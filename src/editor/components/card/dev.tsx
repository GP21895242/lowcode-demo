import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useDrop } from "../../hooks/use-drop";
import type { CommonComponentProps } from "../../interface";

function CardDev({ _id, _name, title, description, children }: CommonComponentProps) {
  const { canDrop, drop } = useDrop(_id, _name);

  return (
    <Card data-component-id={_id} className="w-full">
      {(title || description) && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent
        ref={drop as any}
        className={`min-h-20 ${canDrop ? "bg-muted/50 outline-2 outline-primary" : ""}`}
      >
        {children?.length ? children : <span className="text-muted-foreground">暂无内容</span>}
      </CardContent>
    </Card>
  );
}

export default CardDev;
