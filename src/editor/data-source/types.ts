export type DataSourceKind = "http" | "static";

export type DataSourceFieldType = "string" | "number" | "boolean" | "date" | "enum";

export type DataSourceSearchType = "input" | "select" | "date" | "dateRange" | "numberRange";

export type DataSourceSortOrder = "asc" | "desc";

export interface DataSourceFieldOption {
  label: string;
  value: string | number;
}

export interface DataSourceField {
  /** 字段数据路径，支持 a.b 嵌套 */
  dataKey: string;
  /** 显示名 */
  label: string;
  type: DataSourceFieldType;
  /** 字段描述 */
  description?: string;
  /** 默认是否可见 */
  visible: boolean;
  /** 是否支持排序 */
  sortable: boolean;
  /** 是否支持查询 */
  searchable: boolean;
  /** 搜索区默认控件类型 */
  searchType?: DataSourceSearchType;
  /** enum / select 的选项 */
  options?: DataSourceFieldOption[];
}

export interface DataSourceRequest {
  url: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  headers?: Record<string, string>;
  /** 请求参数模板，值支持 {search.xxx} / {filters.xxx} / {sort.field} / {page.pageNo} / {vars.xxx} */
  params?: Record<string, string>;
  /** POST/PUT 的 JSON 请求体模板 */
  body?: string;
  /** 结果数据路径，默认自动识别 data / rows / list */
  resultPath?: string;
  /** 总数路径 */
  totalPath?: string;
}

export interface DataSourceMock {
  /** 预览时也强制使用 Mock */
  enabled: boolean;
  /** 模拟接口延迟（毫秒） */
  delay: number;
  data: any[];
}

export interface DataSource {
  id: string;
  /** 页面内唯一标识 */
  name: string;
  title: string;
  kind: DataSourceKind;
  primaryKey?: string;
  request?: DataSourceRequest;
  fields: DataSourceField[];
  mock: DataSourceMock;
}

export type DataSourceRelationType = "one-to-one" | "one-to-many" | "many-to-one";

export interface DataSourceRelation {
  id: string;
  /** 触发方数据源 */
  sourceId: string;
  /** 被联动数据源 */
  targetId: string;
  type: DataSourceRelationType;
  sourceField: string;
  targetField: string;
  /** 传给目标数据源的过滤参数名，默认 targetField */
  paramKey?: string;
  enabled: boolean;
}

/** 组件 props 中 type 为 dataSource 时的绑定值 */
export interface DataSourceBinding {
  sourceId: string;
  autoLoad?: boolean;
}

export interface DataSourceSelection {
  field?: string;
  value: any;
  row: any;
}

export interface LoadParams {
  search: Record<string, any>;
  filters: Record<string, any>;
  sort?: { field: string; order: DataSourceSortOrder };
  page?: { pageNo: number; pageSize: number };
}

export interface LoadResult {
  rows: any[];
  total?: number;
}

export interface LoadContext {
  mode: "edit" | "preview";
  signal?: AbortSignal;
  /** 取数上下文变量，由调用方按作用域注入 */
  variables?: Record<string, any>;
}
