import type {
  DataSource,
  DataSourceField,
  DataSourceRelation,
  DataSourceSearchType,
} from "./types";

const EMPTY_FIELDS: DataSourceField[] = [];
export { EMPTY_FIELDS };

function inferType(value: any): DataSourceField["type"] {
  if (typeof value === "number") return "number";
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) return "date";
  return "string";
}

function inferSearchType(type: DataSourceField["type"]): DataSourceSearchType {
  if (type === "number") return "numberRange";
  if (type === "date") return "dateRange";
  if (type === "boolean") return "select";
  return "input";
}

/** 从 Mock 行数据推断字段 Schema */
export function inferFields(rows: any[]): DataSourceField[] {
  const keys: string[] = [];
  rows.slice(0, 50).forEach((row) => {
    if (!row || typeof row !== "object") return;
    Object.keys(row).forEach((key) => {
      if (!keys.includes(key)) keys.push(key);
    });
  });

  return keys
    .map((key): DataSourceField | null => {
      const sample = rows.find((row) => row?.[key] !== undefined && row?.[key] !== null)?.[key];
      if (sample !== null && typeof sample === "object") return null;
      const type = inferType(sample);
      return {
        dataKey: key,
        label: key,
        type,
        visible: true,
        sortable: type !== "boolean",
        searchable: type !== "boolean",
        searchType: inferSearchType(type),
        options:
          type === "boolean"
            ? [
                { label: "是", value: 1 },
                { label: "否", value: 0 },
              ]
            : undefined,
      } satisfies DataSourceField;
    })
    .filter((field): field is DataSourceField => field !== null);
}

export function createField(partial: Partial<DataSourceField> = {}): DataSourceField {
  return {
    dataKey: `field_${Date.now()}`,
    label: "新字段",
    type: "string",
    visible: true,
    sortable: true,
    searchable: true,
    searchType: "input",
    ...partial,
  };
}

export function createEmptyDataSource(): DataSource {
  const stamp = Date.now();
  return {
    id: `ds_${stamp}`,
    name: `dataSource${stamp}`,
    title: "未命名数据源",
    kind: "http",
    primaryKey: "id",
    request: {
      url: "",
      method: "GET",
      resultPath: "data",
      headers: {},
      params: {},
    },
    fields: [createField({ dataKey: "id", label: "ID", sortable: false })],
    mock: {
      enabled: false,
      delay: 200,
      data: [{ id: 1 }],
    },
  };
}

const ORDER_ROWS = [
  { id: "SO-1001", region: "华东", month: "1月", amount: 12800 },
  { id: "SO-1002", region: "华南", month: "1月", amount: 9600 },
  { id: "SO-1003", region: "华北", month: "1月", amount: 7400 },
  { id: "SO-1004", region: "华东", month: "2月", amount: 15200 },
  { id: "SO-1005", region: "华南", month: "2月", amount: 8800 },
  { id: "SO-1006", region: "华北", month: "2月", amount: 6900 },
  { id: "SO-1007", region: "华东", month: "3月", amount: 17600 },
  { id: "SO-1008", region: "华南", month: "3月", amount: 10400 },
  { id: "SO-1009", region: "华北", month: "3月", amount: 8200 },
];

const DETAIL_ROWS = [
  {
    id: "D-2001",
    region: "华东",
    product: "智能手表",
    amount: 1299,
    status: "已完成",
    createdAt: "2026-01-08",
  },
  {
    id: "D-2002",
    region: "华东",
    product: "无线耳机",
    amount: 899,
    status: "已完成",
    createdAt: "2026-01-15",
  },
  {
    id: "D-2003",
    region: "华南",
    product: "智能手表",
    amount: 1299,
    status: "处理中",
    createdAt: "2026-01-19",
  },
  {
    id: "D-2004",
    region: "华北",
    product: "运动手环",
    amount: 399,
    status: "已完成",
    createdAt: "2026-01-26",
  },
  {
    id: "D-2005",
    region: "华东",
    product: "无线耳机",
    amount: 899,
    status: "已取消",
    createdAt: "2026-02-03",
  },
  {
    id: "D-2006",
    region: "华南",
    product: "运动手环",
    amount: 399,
    status: "已完成",
    createdAt: "2026-02-11",
  },
  {
    id: "D-2007",
    region: "华北",
    product: "智能手表",
    amount: 1299,
    status: "处理中",
    createdAt: "2026-02-18",
  },
  {
    id: "D-2008",
    region: "华东",
    product: "运动手环",
    amount: 399,
    status: "已完成",
    createdAt: "2026-02-24",
  },
  {
    id: "D-2009",
    region: "华南",
    product: "无线耳机",
    amount: 899,
    status: "已完成",
    createdAt: "2026-03-02",
  },
  {
    id: "D-2010",
    region: "华北",
    product: "运动手环",
    amount: 399,
    status: "已取消",
    createdAt: "2026-03-09",
  },
  {
    id: "D-2011",
    region: "华东",
    product: "智能手表",
    amount: 1299,
    status: "处理中",
    createdAt: "2026-03-16",
  },
  {
    id: "D-2012",
    region: "华南",
    product: "运动手环",
    amount: 399,
    status: "已完成",
    createdAt: "2026-03-23",
  },
  {
    id: "D-2013",
    region: "华北",
    product: "无线耳机",
    amount: 899,
    status: "已完成",
    createdAt: "2026-03-28",
  },
  {
    id: "D-2014",
    region: "华东",
    product: "运动手环",
    amount: 399,
    status: "已完成",
    createdAt: "2026-03-30",
  },
  {
    id: "D-2015",
    region: "华南",
    product: "智能手表",
    amount: 1299,
    status: "处理中",
    createdAt: "2026-03-31",
  },
];

const REGION_OPTIONS = [
  { label: "华东", value: "华东" },
  { label: "华南", value: "华南" },
  { label: "华北", value: "华北" },
];

const MONTH_OPTIONS = ["1月", "2月", "3月"].map((month) => ({ label: month, value: month }));

const STATUS_OPTIONS = [
  { label: "已完成", value: "已完成" },
  { label: "处理中", value: "处理中" },
  { label: "已取消", value: "已取消" },
];

/** 创建一组示例数据源及关联关系，便于直接体验绑定与联动 */
export function createSamplePageData(suffix = ""): {
  sources: DataSource[];
  relations: DataSourceRelation[];
} {
  const ordersId = suffix ? `ds_orders_${suffix}` : "ds_orders";
  const detailsId = suffix ? `ds_order_details_${suffix}` : "ds_order_details";

  const orders: DataSource = {
    id: ordersId,
    name: suffix ? `orders_${suffix}` : "orders",
    title: "订单汇总",
    kind: "static",
    primaryKey: "id",
    fields: [
      {
        dataKey: "id",
        label: "订单号",
        type: "string",
        visible: false,
        sortable: false,
        searchable: true,
        searchType: "input",
      },
      {
        dataKey: "region",
        label: "区域",
        type: "enum",
        visible: true,
        sortable: true,
        searchable: true,
        searchType: "select",
        options: REGION_OPTIONS,
      },
      {
        dataKey: "month",
        label: "月份",
        type: "enum",
        visible: true,
        sortable: true,
        searchable: true,
        searchType: "select",
        options: MONTH_OPTIONS,
      },
      {
        dataKey: "amount",
        label: "金额",
        type: "number",
        visible: true,
        sortable: true,
        searchable: true,
        searchType: "numberRange",
      },
    ],
    mock: { enabled: true, delay: 200, data: ORDER_ROWS },
  };

  const details: DataSource = {
    id: detailsId,
    name: suffix ? `orderDetails_${suffix}` : "orderDetails",
    title: "订单明细",
    kind: "static",
    primaryKey: "id",
    fields: [
      {
        dataKey: "id",
        label: "明细号",
        type: "string",
        visible: true,
        sortable: false,
        searchable: true,
        searchType: "input",
      },
      {
        dataKey: "region",
        label: "区域",
        type: "enum",
        visible: true,
        sortable: true,
        searchable: true,
        searchType: "select",
        options: REGION_OPTIONS,
      },
      {
        dataKey: "product",
        label: "商品",
        type: "string",
        visible: true,
        sortable: true,
        searchable: true,
        searchType: "input",
      },
      {
        dataKey: "amount",
        label: "金额",
        type: "number",
        visible: true,
        sortable: true,
        searchable: true,
        searchType: "numberRange",
      },
      {
        dataKey: "status",
        label: "状态",
        type: "enum",
        visible: true,
        sortable: true,
        searchable: true,
        searchType: "select",
        options: STATUS_OPTIONS,
      },
      {
        dataKey: "createdAt",
        label: "创建日期",
        type: "date",
        visible: true,
        sortable: true,
        searchable: true,
        searchType: "dateRange",
      },
    ],
    mock: { enabled: true, delay: 200, data: DETAIL_ROWS },
  };

  const relations: DataSourceRelation[] = [
    {
      id: `${ordersId}_${detailsId}`,
      sourceId: ordersId,
      targetId: detailsId,
      type: "one-to-many",
      sourceField: "region",
      targetField: "region",
      paramKey: "region",
      enabled: true,
    },
  ];

  return { sources: [orders, details], relations };
}
