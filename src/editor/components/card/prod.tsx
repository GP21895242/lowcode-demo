import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import type { CommonComponentProps } from "../../interface";

function CardProd({ title, description, children }: CommonComponentProps) {
  return (
    <Card className="w-full">
      {(title || description) && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent className="min-h-20">{children}</CardContent>
    </Card>
  );
}

export default CardProd;
