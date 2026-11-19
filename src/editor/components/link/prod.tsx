import { forwardRef } from "react";

import { cn } from "../../../lib/utils";
import type { CommonComponentProps } from "../../interface";

const UNDERLINE_CLASS: Record<string, string> = {
  always: "underline underline-offset-4",
  hover: "hover:underline hover:underline-offset-4",
  none: "no-underline",
};

const LinkProd = forwardRef<HTMLDivElement, CommonComponentProps>((props, ref) => {
  const { _id, text, href, target, underline } = props;

  return (
    <div ref={ref} data-component-id={_id}>
      <a
        href={href || "#"}
        target={target || "_self"}
        rel={target === "_blank" ? "noopener noreferrer" : undefined}
        className={cn(
          "text-primary transition-colors hover:text-primary/80",
          UNDERLINE_CLASS[underline] ?? UNDERLINE_CLASS.hover,
        )}
      >
        {text || "链接文字"}
      </a>
    </div>
  );
});

LinkProd.displayName = "LinkProd";

export default LinkProd;
