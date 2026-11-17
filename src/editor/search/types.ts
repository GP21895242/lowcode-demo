/**
 * 搜索控件类型，与 DataSourceSearchType 保持一致
 */
export type SearchControl = "input" | "select" | "date" | "dateRange" | "numberRange";

/**
 * 搜索目标：页面数据源或卡片实例的可搜索输入
 */
export type SearchTarget =
  | { kind: "source"; sourceId: string; paramKey: string; variable: string }
  | { kind: "card"; componentId: number; inputKey: string; variable: string };

export interface SearchFieldDef {
  /**
   * 绑定的变量名，可带或不带 search. 前缀
   */
  variable: string;
  label: string;
  control: SearchControl;
  options?: { label: string; value: any }[];
  order: number;
}

/**
 * 全局搜索区配置，只存布局与目标，不存搜索值
 */
export interface PageSearchConfig {
  scope: "page" | "group";
  groupId?: string;
  fields: SearchFieldDef[];
  targets: SearchTarget[];
  trigger: "submit" | "change";
  debounce?: number;
}
