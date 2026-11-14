export interface FormOption {
  key: number;
  label: string;
}

export interface NormalizedOption {
  label: string;
  value: string;
}

/**
 * 表单项选项统一格式。选项值直接使用显示文案，便于在表单中直接提交。
 */
export function normalizeOptions(value: unknown): NormalizedOption[] {
  const items = Array.isArray(value) ? value : [];

  return items
    .map((item: any) => {
      const label = typeof item === "string" ? item : String(item?.label ?? "");
      return { label, value: label };
    })
    .filter((item) => item.label !== "");
}
