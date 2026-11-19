import { Loader2 } from "lucide-react";
import { forwardRef, useImperativeHandle, useState } from "react";

import { Button } from "@/components/ui/button";
import type { CommonComponentProps } from "../../interface";

const OMIT_KEYS = ["_id", "_name", "_desc", "_execEventFlow", "type", "text", "children"];

const ButtonProd = (props: CommonComponentProps, ref: any) => {
  const [loading, setLoading] = useState(false);

  const { _id, type, text, children } = props;

  const rest: Record<string, any> = {};
  Object.entries(props).forEach(([key, value]) => {
    if (!OMIT_KEYS.includes(key)) {
      rest[key] = value;
    }
  });

  // 暴露方法，父组件可以使用ref获取组件里暴露出去的方法
  useImperativeHandle(ref, () => {
    return {
      startLoading: () => {
        setLoading(true);
      },
      endLoading: () => {
        setLoading(false);
      },
    };
  }, []);

  return (
    <Button
      data-component-id={_id}
      disabled={loading}
      variant={type === "default" ? "outline" : "default"}
      {...rest}
    >
      {loading ? <Loader2 className="animate-spin" /> : null}
      {text}
      {children}
    </Button>
  );
};

export default forwardRef(ButtonProd as any);
