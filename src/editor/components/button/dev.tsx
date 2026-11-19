import { Button } from "@/components/ui/button";
import type { CommonComponentProps } from "../../interface";

const ButtonDev = ({ _id, type, text }: CommonComponentProps) => {
  return (
    <Button data-component-id={_id} variant={type === "default" ? "outline" : "default"}>
      {text}
    </Button>
  );
};

export default ButtonDev;
