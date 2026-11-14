# 数据源功能设计文档

## 1. 目标

为低代码编辑器提供页面级数据源能力：

- 预先定义数据源及其接口，而不是把请求配置散落在各个组件里。
- 通过字段 Schema 描述返回数据，驱动表格列、搜索项、图表维度和联动关系。
- 编辑态使用 Mock 数据，预览态连接真实接口。
- 一个页面可配置多个数据源，并定义数据源之间的关联关系。
- 表格、图表、搜索区等组件统一绑定数据源。
- 搜索项根据可查询字段生成，点击搜索自动重新加载数据。
- 图表等组件的选中行为可触发关联数据源联动刷新。

## 2. 总体架构

数据源拆分为「定义」和「运行时」两层：

```text
数据源定义（持久化）
  DataSource + Field Schema + Request + Mock + Relation
        │
        ▼
统一取数引擎 executeDataSource
        │
        ├── MockAdapter：搜索 / 筛选 / 排序 / 分页
        └── HttpAdapter：真实接口 + 参数模板 + 结果路径
        │
        ▼
数据源运行时（不持久化）
  rows / total / loading / error / params / selection
        │
        ▼
组件订阅 useDataSource(sourceId)
  Table / Chart / SearchForm
```

- 定义层负责描述“数据长什么样、从哪里取”。
- 运行时负责保存“当前取到了什么、查询条件是什么、选中了什么”。
- 组件只通过 `sourceId` 订阅运行时，不直接关心请求细节。

## 3. 数据源定义

核心类型位于 `src/editor/data-source/types.ts`。

### 3.1 DataSource

| 字段          | 说明                                        |
| ------------- | ------------------------------------------- |
| `id`          | 页面内唯一 ID，组件绑定和关联关系均引用该值 |
| `name`        | 页面内唯一标识，如 `orders`                 |
| `label`       | 显示名，如“订单汇总”                        |
| `kind`        | `static`（静态/Mock）或 `http`（真实接口）  |
| `description` | 数据源说明                                  |
| `fields`      | 返回数据的字段 Schema                       |
| `request`     | HTTP 接口配置                               |
| `mock`        | Mock 数据及预览开关                         |
| `primaryKey`  | 主键字段，默认 `id`                         |

### 3.2 字段 Schema

每个字段包含：

| 字段          | 说明                                                      |
| ------------- | --------------------------------------------------------- |
| `dataKey`     | 数据中的字段路径，支持嵌套取值                            |
| `label`       | 显示名，用于表格列标题、搜索项标题等                      |
| `type`        | `string` / `number` / `boolean` / `date` / `enum`         |
| `description` | 字段描述                                                  |
| `visible`     | 是否作为默认表格列展示                                    |
| `sortable`    | 是否支持排序                                              |
| `searchable`  | 是否支持查询，决定是否出现在搜索项候选字段中              |
| `searchType`  | `input` / `select` / `date` / `numberRange` / `dateRange` |
| `options`     | 枚举或下拉查询的选项 `{ label, value }`                   |

字段 Schema 是多个功能的共同依据：

- 表格：按 `visible` 自动生成列，按 `sortable` 显示排序入口。
- 搜索区：按 `searchable` 生成搜索项，按 `searchType/options` 决定控件。
- 图表：选择维度字段和数值字段。
- 关联关系：选择源字段和目标字段。

### 3.3 接口配置

```ts
interface DataSourceRequest {
  url: string;
  method: "GET" | "POST";
  headers?: Record<string, string>;
  params?: Record<string, string>;
  body?: string;
  resultPath?: string;
  totalPath?: string;
}
```

参数值支持模板变量：

- `{search.xxx}`：搜索区条件。
- `{filters.xxx}`：联动筛选条件。
- `{sort.field}` / `{sort.order}`：排序。
- `{page.pageNo}` / `{page.pageSize}`：分页。
- `{vars.xxx}`：页面变量。

响应数据可通过 `resultPath` 指定列表位置；未配置时自动识别 `data`、`rows`、`list` 等常见结构，总数自动识别 `total` / `totalCount`。

## 4. Mock 与真实接口

取数策略集中在 `src/editor/data-source/engine.ts`：

- 编辑态始终使用 Mock，保证画布稳定且不依赖后端。
- `kind = static` 时始终使用 Mock。
- 预览态默认走 HTTP；开启 `mock.previewEnabled` 后仍使用 Mock。

Mock 适配器支持：

- 文本包含查询。
- 枚举精确查询。
- 数组区间查询。
- 联动字段精确筛选。
- 单字段升序/降序。
- 分页。

HTTP 与 Mock 共用同一套 `LoadParams`，因此组件不需要区分数据来源。

## 5. 页面级多数据源与持久化

定义 Store：`src/editor/data-source/store.ts`

- 使用 Zustand + persist 保存到 localStorage，key 为 `data-sources`。
- 保存当前页面的数据源列表和关联关系列表。
- 提供数据源和关联关系的增删改能力。
- 默认提供 `orders`（订单汇总）和 `orderDetails`（订单明细）示例数据。

运行时 Store：`src/editor/data-source/runtime.ts`

- 不持久化，保存每个数据源的运行状态。
- 通过 `AbortController` 取消过期请求，避免竞态覆盖。
- 进入或退出预览时调用 `resetAll()`，避免编辑态 Mock 数据与预览态真实数据串用。

## 6. 组件绑定

组件属性新增绑定形式：

```ts
{
  type: "dataSource",
  value: { sourceId: "ds_orders", autoLoad: true }
}
```

`EditStage` / `ProdStage` 的 `formatProps` 将其转换为组件实际使用的 `{ sourceId }` 对象。

通用绑定控件：

- `DataSourceSelect`：选择数据源。
- `FieldSelect`：按数据源 Schema 选择字段，支持过滤条件。
- `DataSourceBindingField`：写入标准 `dataSource` 属性。

### 6.1 表格

- 绑定数据源后，按 `visible` 字段自动生成列。
- 表格列也可手动绑定到字段，列字段设置器会列出 Schema 字段。
- 可排序字段点击表头后调用运行时 `setSort` 并重新加载。
- 加载中、加载失败、空数据均有明确状态。
- 保留旧的 `url` 请求方式作为兼容路径。

### 6.2 图表

- 支持绑定数据源，并选择 `xField`（维度）和 `yField`（数值）。
- 未手动指定时，优先选择可见的非数值字段作为维度、数值字段作为指标。
- 相同维度值自动聚合求和，适合明细数据汇总展示。
- 点击柱子或数据点将当前维度值写入运行时 `selection`。
- 再次点击相同值或点击“清除”可取消选中。

### 6.3 搜索区

- 搜索项设置器选择数据源和可查询字段。
- 搜索区设置器支持“根据 Schema 生成搜索项”，批量创建子组件。
- 搜索时按数据源分组，将控件值转换为运行时 `search` 参数并重新加载。
- 重置会清空条件并恢复数据。
- 未绑定数据源的旧搜索区仍保留原有 `onSearch` 事件行为。

## 7. 关联关系与组件联动

关联关系定义：

```ts
interface DataSourceRelation {
  id: string;
  sourceId: string;
  targetId: string;
  type: "oneToOne" | "oneToMany" | "manyToOne";
  sourceField: string;
  targetField: string;
  paramKey?: string;
  enabled: boolean;
}
```

联动流程：

```text
点击图表维度值
  → 设置源数据源 selection
  → 查找 sourceId 匹配的启用关联
  → 将选中值写入目标数据源 filters[paramKey || targetField]
  → 目标数据源重新加载
  → 绑定目标数据源的表格等组件自动更新
```

示例：`orders.region → orderDetails.region`。点击图表“华东”，明细表自动筛选华东订单；清除选中后恢复全部明细。

## 8. 管理界面

左侧新增「数据源」面板：

- 数据源列表：名称、类型、字段数、Mock 行数。
- 新建、编辑、删除数据源。
- 一键生成示例数据。
- 关联关系管理入口。

数据源编辑弹窗包含四个页签：

1. 基本信息：标识、显示名、类型、主键、Mock 策略。
2. 接口配置：URL、Method、Header、参数、Body、结果路径。
3. 字段 Schema：字段属性及枚举选项维护，可从 Mock 推断字段。
4. Mock 数据：JSON 编辑与校验。

## 9. 目录结构

```text
src/editor/data-source/
  types.ts                    类型定义
  adapter.ts                  适配器注册
  engine.ts                   取数策略
  schema.ts                   字段推断与示例数据
  store.ts                    数据源定义 Store
  runtime.ts                  运行时 Store
  hooks.ts                    组件订阅 Hooks
  adapters/
    mock.ts
    http.ts
  components/
    data-source-select.tsx
    field-select.tsx
    data-source-binding-field.tsx

src/editor/layouts/data-source-editor/
  index.tsx                   数据源编辑弹窗
  relation-editor.tsx         关联关系编辑弹窗

src/editor/layouts/sidebar/
  data-sources.tsx            数据源管理面板
```

## 10. 使用步骤

1. 在左侧「数据源」中新建数据源，或生成示例数据。
2. 配置字段 Schema 和 Mock 数据；需要真实接口时配置接口信息。
3. 给表格或图表绑定数据源，并按需选择字段。
4. 给搜索区选择数据源，点击“根据 Schema 生成搜索项”。
5. 在「关联关系」中配置源字段和目标字段。
6. 进入预览，验证搜索、排序、图表选中及表格联动。

## 11. 后续扩展

- 增加更多适配器，如 GraphQL、WebSocket、本地缓存数据源。
- 增加聚合、计算字段、字段格式化能力。
- 将“加载数据源”“设置选中”“清除联动”等能力注册为事件流动作。
- 支持多字段联合筛选、跨数据源主从表编辑。
- 增加接口调试、响应预览和请求异常诊断。
