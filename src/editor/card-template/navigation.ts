import { saveCurrentPageDesign } from "../utils/page-save";

/** 从当前 hash 中读取正在编辑的页面 id */
export function readEditingPageId() {
  const match = window.location.hash.match(/^#\/pages\/([^/]+)\/edit/);
  return match ? decodeURIComponent(match[1]) : undefined;
}

/**
 * 进入卡片模板可视化设计器
 * 页面编辑器中的未保存状态会先落盘，返回后可直接继续编辑页面
 */
export function openCardTemplateDesign(templateId: string) {
  const pageId = readEditingPageId();
  if (pageId) saveCurrentPageDesign(pageId);

  const currentHash = window.location.hash;
  const from =
    currentHash.startsWith("#/pages/") && !currentHash.startsWith("#/card-templates/")
      ? currentHash
      : "";
  const query = from ? `?from=${encodeURIComponent(from)}` : "";

  window.location.hash = `#/card-templates/${encodeURIComponent(templateId)}/design${query}`;
}
