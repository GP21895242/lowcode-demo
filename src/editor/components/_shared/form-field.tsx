import React from "react";

/** 表单控件的标签 + 内容布局 */
export function FormField({
  label,
  children,
}: {
  label?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      {label ? <span className="text-sm leading-none font-medium">{label}</span> : null}
      {children}
    </div>
  );
}
