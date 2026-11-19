import React from "react";

import { cn } from "@/lib/utils";
import type { CommonComponentProps } from "../../interface";

const VARIANTS: Record<string, { tag: keyof React.JSX.IntrinsicElements; className: string }> = {
  h1: { tag: "h1", className: "scroll-m-20 text-4xl font-extrabold tracking-tight text-balance" },
  h2: { tag: "h2", className: "scroll-m-20 text-3xl font-semibold tracking-tight text-balance" },
  h3: { tag: "h3", className: "scroll-m-20 text-2xl font-semibold tracking-tight" },
  h4: { tag: "h4", className: "scroll-m-20 text-xl font-semibold tracking-tight" },
  p: { tag: "p", className: "leading-7" },
  lead: { tag: "p", className: "text-xl text-muted-foreground" },
  muted: { tag: "p", className: "text-sm text-muted-foreground" },
  small: { tag: "small", className: "text-sm leading-none font-medium" },
};

const ALIGN_CLASS: Record<string, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

function TextDev({ _id, text, variant, align }: CommonComponentProps) {
  const preset = VARIANTS[variant] ?? VARIANTS.p;

  return (
    <div data-component-id={_id} className="pointer-events-none">
      {React.createElement(
        preset.tag,
        { className: cn(preset.className, ALIGN_CLASS[align] ?? ALIGN_CLASS.left) },
        text || "文本内容",
      )}
    </div>
  );
}

export default TextDev;
