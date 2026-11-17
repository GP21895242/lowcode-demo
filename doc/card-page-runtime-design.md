# 卡片化页面能力设计文档

> 本文档整理「卡片模板复用、卡片独立运行时、页面级数据复用、全局搜索区」四项能力的完整设计，是 `data-source-design.md` 的延伸。
> 适用范围：当前 `src/editor` 低代码框架（React + zustand + localStorage 持久化）。

## 1. 背景与目标

需要基于现有框架扩展四项能力：

1. 允许在设计器中自定义卡片，卡片可在多个页面复用。
2. 同一页面中的卡片之间可以联动。
3. 同一页面中，多个卡片使用相同数据源时可以复用，避免重复请求。
4. 同一页面中可以定义全局搜索区，页面中的卡片响应搜索区变化。

后续补充的关键约束：

- 卡片应封装成**相对独立的 Runtime**，只通过**显式暴露的通信契约**与页面交互；只有契约暴露的属性、事件、方法、插槽、搜索参数允许页面配置与覆盖。
- 数据源与搜索项的合并，**系统只给建议，不自动合并**，最终由设计者决定。
- `searchParams` 与现有 `variable` 体系**整合为同一模型**。

### 设计原则

| 原则       | 说明                                                                  |
| ---------- | --------------------------------------------------------------------- |
| 契约优先   | 页面只能看到卡片 Contract，内部组件树、私有数据源、私有变量一律不可见 |
| 单向数据流 | 事件向上抛，参数向下传；卡片之间不直接互相调用                        |
| 建议不越权 | 运行期缓存去重可自动，设计态定义合并必须由设计者显式确认              |
| 单一状态源 | 页面数据、搜索值、变量统一存放在 `usePageDataStore`，不引入第二份状态 |
| 可回滚     | 合并、模板插入等批量操作必须可预览、可撤销，且失败整体回滚            |

## 2. 现状盘点

### 2.1 现有能力

> 本节记录改造前的基线，仅用于说明起点；当前实现以第 3 节起的架构描述为准。

| 模块         | 位置                                         | 现状                                                                                                                 |
| ------------ | -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| 页面模型     | `src/editor/stores/pages.ts`                 | `PageDesign = { components, variables, sources, relations }`，整页 localStorage 持久化（`lowcode-pages`，version 1） |
| 组件树       | `src/editor/stores/components.ts`            | 组件 `id` 为数字时间戳，支持 `children / parentId`；已有复制重 id、撤销重做                                          |
| 组件注册     | `src/editor/components/*/index.ts`           | 通过 `import.meta.glob` 注册 `dev / prod / setter / events / methods`                                                |
| 渲染         | `src/editor/layouts/stage/{edit,prod}.tsx`   | `formatProps` 解包 `static / variable / dataSource`；编辑态挂遮罩、预览态挂事件流                                    |
| 数据源定义   | `src/editor/data-source/types.ts`            | `DataSource` + 字段 Schema + Request + Mock + Relation                                                               |
| 数据源运行时 | `src/editor/data-source/runtime.ts`          | 以 `sourceId` 为 key 的 zustand store；`load` 有 loading/success 短路；`search` **整体替换** `params.search`         |
| 数据源订阅   | `src/editor/data-source/hooks.ts`            | `useDataSource(sourceId)` 挂载即加载，返回 rows/loading/selection 等                                                 |
| 搜索区       | `src/editor/components/search-form/prod.tsx` | 在组件内按 `sourceId` 分组，直接调用 `runtime.search`                                                                |
| 联动         | `src/editor/data-source/types.ts`            | 仅 `DataSourceRelation`：源数据源选中 → 目标数据源 filters                                                           |
| 变量         | `src/editor/stores/variable.ts`              | 仅 `{ name, defaultValue: string, remark }`，无类型、无运行时 API                                                    |
| 页面数据     | `src/editor/stores/page-data.ts`             | 扁平 `data: Record<string, any>`，`setData / mergeData / resetData`                                                  |
| 事件流       | `src/editor/utils/action.ts`                 | 组件级事件动作：请求、设置变量、脚本、组件方法、消息、确认                                                           |
| 卡片组件     | `src/editor/components/card/*`               | 普通容器组件，无模板与复用概念                                                                                       |

### 2.2 差距

| 需求       | 现有基础                      | 缺口                                                                |
| ---------- | ----------------------------- | ------------------------------------------------------------------- |
| 卡片复用   | `Card` 是普通容器，整页自包含 | 无跨页面模板资产；无实例化与运行时隔离                              |
| 卡片联动   | 数据源级 relation 一种动作    | 无卡片作用域与事件契约                                              |
| 数据源复用 | 同 `sourceId` 天然共享缓存    | 参数在数据源级、搜索整体覆盖；无 in-flight 去重、引用计数、失效策略 |
| 全局搜索   | 搜索区组件内部直接取数        | 无页面搜索上下文，多搜索区互相覆盖                                  |

## 3. 总体架构

```
页面设计态 PageDesign (schemaVersion: 4)
├─ components: Component[]                  ← 含 CardInstance 引用节点
├─ variables: Variable[]                    ← 含 scope: "search" 的搜索变量
├─ sources / relations
├─ interactions?: PageInteraction[]         ← 卡片联动声明
├─ search?: PageSearchConfig                ← 全局搜索区配置（只存布局与目标，不存值）
└─ dismissedSuggestions?: string[]          ← 已忽略的合并建议

卡片模板资产 CardTemplate（独立持久化）
├─ contract: CardContract                   ← 对外契约，唯一兼容边界
└─ impl: { root, sources, variables, relations }  ← 内部实现，页面不可见

页面运行时 PageRuntime
├─ DataSourceLoader      requestKey 缓存 + single-flight + 引用计数 + 失效
├─ SearchBus             page-data 之上的门面
└─ InteractionBus        emit(componentId, event, payload) → actions

卡片运行时 CardRuntime（每个实例一个）
├─ 独立数据域 dataDomain
├─ 内部数据源：实例私有 DataSourceLoader（Context 注入）
├─ 内部事件流（闭环）
└─ 契约桥：inputs 下行 / events 上行 / methods 句柄
```

核心概念：

| 概念               | 职责                                                      |
| ------------------ | --------------------------------------------------------- |
| `CardTemplate`     | 可跨页面复用的卡片资产，包含契约与内部实现                |
| `CardContract`     | 页面可配置的唯一入口                                      |
| `CardInstance`     | 页面中的引用节点，只存契约数据，实例标识即 `Component.id` |
| `CardRuntime`      | 实例级隔离运行时（数据域、数据源作用域、事件桥）          |
| `DataSourceLoader` | 页面级或实例级取数缓存与请求去重                          |
| `SearchBus`        | 搜索值读写与目标分发                                      |
| `InteractionBus`   | 卡片事件到页面动作的编排                                  |
| `MergeSuggestion`  | 只读分析产出的合并建议                                    |

### 3.1 页面级 store 分层与预览隔离

页面 store 不再是模块级单例，而是由 `PageProvider` 按页面实例创建、经 Context 下发：

| 分组               | 包含                                                                                                                 | 创建时机             |
| ------------------ | -------------------------------------------------------------------------------------------------------------------- | -------------------- |
| `PageStores`       | `content` / `pageData` / `variables` / `dataSources` / `sourceLoader` / `search` / `interactions` / `refs` / `cards` | 编辑与预览都创建     |
| `DesignPageStores` | `editor`（选中、历史、剪贴板）/ `suggestions`（合并建议缓存）                                                        | 仅 `view === "edit"` |

约定：

- 预览模式不创建设计态 store，`useDesignStores()` / `getActiveDesignStores()` 会直接抛错，任何误用立即暴露。
- React 组件统一通过 `useContentStore / usePageDataStore / useEditorStore` 等 Context hook 取数；只有事件流、保存、注册表等非 React 入口才读取 `getActivePageStores()`。
- 被编辑态与预览态共用的渲染组件（如 `grid-layout/base.tsx`）**不得依赖任何页面 store**，所需数据由 `dev.tsx` / `prod.tsx` 通过 props 注入（布局变更走 `onLayoutChange` 回调）。
- 页面切换或卸载时调用 `sourceLoader.dispose()` 释放缓存与在途请求，避免页面之间串数据。

## 4. 卡片模板与独立 Runtime

### 4.1 模板模型

```ts
interface CardTemplate {
  id: string;
  name: string;
  desc?: string;
  version: number;
  contract: CardContract; // 对外契约
  impl: {
    root: Component; // 卡片根（Card）子树，id 仅在模板内有效
    sources: DataSource[]; // 卡片私有数据源
    variables: Variable[]; // 卡片内部变量
    relations: DataSourceRelation[];
  };
  createdAt: string;
  updatedAt: string;
}
```

模板持久化在独立 store（`lowcode-card-templates`），不进入 `PageRecord`，避免页面保存时整树拷贝与跨页面耦合。

### 4.2 对外契约

```ts
interface CardContract {
  inputs: CardInputDef[];
  events: CardEventDef[];
  methods?: CardMethodDef[];
  slots?: CardSlotDef[];
}

interface CardInputDef {
  key: string;
  label: string;
  type: "text" | "number" | "boolean" | "select" | "variable" | "field";
  options?: { label: string; value: any }[];
  defaultValue?: any;
  required?: boolean;
  /** type = variable 时绑定的页面变量，如 search.region */
  variable?: string;
  /** 是否可作为全局搜索区目标 */
  searchable?: boolean;
  /** 搜索区控件元数据，供建议生成字段 */
  control?: "input" | "select" | "date" | "dateRange" | "numberRange";
  /** 输入如何进入内部实现，由模板作者定义，页面不可见 */
  binding:
    | { kind: "prop"; targetNodeId: string; targetProp: string }
    | { kind: "var"; variable: string };
}

interface CardEventDef {
  name: string; // onRowClick / onSelectionChange
  label: string;
  payload?: { path: string; type: string; label: string }[];
}

interface CardMethodDef {
  name: string;
  label: string;
  params?: { name: string; type: string }[];
}

interface CardSlotDef {
  key: string; // 如 orders
  label: string;
  required: boolean;
  /** 插入时复制的数据源模板 */
  defaultSource?: DataSource;
  /** 是否允许进入合并建议候选池，仅影响建议，不代表会自动合并 */
  shareable?: boolean;
}
```

> `contract.searchParams` 不再保留，统一为 `inputs` 中 `type: "variable" | "field"` 且 `searchable: true` 的项。

### 4.3 页面中的实例节点

```ts
interface CardInstanceProps {
  templateId: string;
  templateVersion: number; // 创建时版本，用于提示升级
  inputValues: Record<string, any>; // 仅允许 contract.inputs 的 key
  slotMapping: Record<string, string>; // 仅允许 contract.slots 的 key → 页面 sourceId
  // 事件绑定沿用现有 props[eventName] = { children: Node[] } 机制
}
```

实例**不包含**任何指向内部组件节点的引用（没有 `overrides`），页面无法触及内部实现。
实例的稳定标识即页面组件树节点的 `Component.id`（number），联动、事件、方法、搜索目标均引用它，不再单独生成 `scopeId / instanceId` 字段。

> schema v4 起删除 `props.instanceId`；v3 及更早数据在迁移时把旧 `instanceId/scopeId` 映射到所在节点的 `Component.id` 后移除，映射不到的联动/搜索目标直接丢弃。

### 4.4 渲染结构与隔离

```tsx
<CardErrorBoundary>
  <CardRuntimeProvider
    componentId={node.id}
    contract={template.contract}
    inputs={props.inputValues}
    slotMapping={props.slotMapping}
    onEmit={(event, payload) => pageBus.emit(node.id, event, payload)}
  >
    <CardInternalRenderer impl={template.impl} />
  </CardRuntimeProvider>
</CardErrorBoundary>
```

隔离维度：

| 资源        | 隔离方式                                                                                                               |
| ----------- | ---------------------------------------------------------------------------------------------------------------------- |
| 内部变量    | `CardRuntime` 内的 `dataDomain`（React state），与页面 `pageData` 分离；`$props.xxx` 由 inputs 注入                    |
| 内部数据源  | 实例私有 `DataSourceLoader` 经 Context 下发，挂载时注册、卸载时 `dispose`；不同实例互不影响                            |
| 内部组件 id | 运行时 `idMap` 分配，仅在卡片内有效；页面事件流组件选择器不可见                                                        |
| 内部事件    | 默认在卡片内闭环；命中 `contract.events` 才 `emit` 到页面总线                                                          |
| 组件 ref    | 页面只拿到一个句柄：`{ componentId, ...contract.methods, setInput, getInputs, reload, invoke }`，注册到 `CardRegistry` |
| 异常        | `CardErrorBoundary` 只影响卡片占位区域，不拖垮整页                                                                     |

必要的底层改造：

- `DataSourceLoader` 支持 `setVariableResolver`，取数变量由调用方按作用域注入，`http` 适配器不再直接读页面 store。
- `execEventFlow` 接受 `EventDomain`，卡片内部事件流读写卡片数据域，页面事件流仍写页面数据域。

### 4.5 展开器与 id 映射

`useExpandedTemplate(template)` 负责把模板树转为可渲染树：

1. 为模板内每个节点生成稳定运行时 `idMap: templateNodeId → number`，按 `(templateId, version)` 缓存于运行时，保证跨渲染稳定。
2. 重写内部事件流中 `ComponentMethod` 的 `componentId`。
3. 重写内部数据源引用为 `$slot.<key>` 占位，运行时由 `slotMapping` 解析为页面 `sourceId`。
4. 内部变量保持卡片数据域命名。

> 展开只依赖 `template + version`；`inputs / slotMapping` 通过 Context 注入，不参与树展开，避免属性变更触发整树重建。

### 4.6 编辑态与选中

- 编辑态中 `CardInstance` 作为**整体选中节点**：外层 `data-component-id = instance.id`。
- 内部用 **prod 组件**只读渲染（不渲染 dev 组件），因此不产生内部遮罩与拖拽落点。
- 双击进入模板编辑器（独立抽屉/路由），模板编辑不进入页面撤销栈。
- 插入模板、修改 `inputValues / slotMapping` 走现有 `createHistoryPatch`，可撤销。

### 4.7 版本与升级

- Contract 是唯一兼容承诺：内部实现任意重构，Contract 不变则页面无感知。
- 页面加载时对比 `templateVersion`，过期实例打“可升级”标记，工具栏提示数量。
- 升级时只 diff Contract：新增可选 input/event 安全；删除或改类型已使用的 input/event/method 标记 breaking，列出受影响配置，确认后清理。
- 删除模板前检查引用，被引用时阻止删除并列出引用页面。
- 实例运行时找不到模板时渲染错误占位，不白屏。

## 5. 卡片与页面的通信契约

| 方向        | 机制                                  | 页面可见性                      |
| ----------- | ------------------------------------- | ------------------------------- |
| 页面 → 卡片 | `inputValues`（含变量绑定、搜索变量） | 仅 `contract.inputs` 声明的 key |
| 页面 → 卡片 | `slotMapping` → 页面数据源            | 仅 `contract.slots` 声明的 key  |
| 页面 → 卡片 | `invoke(componentId, method, args)`   | 仅 `contract.methods`           |
| 卡片 → 页面 | `emit(componentId, event, payload)`   | 仅 `contract.events`            |

禁止事项（由类型与运行时双重约束）：

- 页面配置面板不得读取内部组件 id。
- 联动动作不得直接写卡片内部数据源参数。
- 页面搜索值不得绕过 `inputs` 注入卡片内部。
- 模板内部变量不得直接读取页面变量（除契约声明的绑定）。

### 5.1 页面设计器中的动态配置

实例选中后，属性/事件面板由 Contract 生成，替代静态 `setter`：

- 属性面板：遍历 `contract.inputs`，映射到现有 setter 控件，写入 `inputValues[key]`。
- 事件面板：只列 `contract.events`，事件流参数可按 `payload` 声明选字段。
- 方法动作：事件流“组件方法”选中实例时，方法下拉来自 `contract.methods`。
- 插槽：实例设置里列出 `contract.slots`，映射页面数据源。
- 搜索：全局搜索目标选择器只能选到“实例 + 可搜索 input”，不能选内部数据源字段。

## 6. 卡片联动

```ts
interface PageInteraction {
  id: string;
  enabled: boolean;
  trigger: {
    type: "card-event";
    componentId: number; // 卡片实例所在页面的 Component.id
    event: string; // 必须是 contract.events 中的事件
    field?: string; // 取 payload 中的字段
  };
  actions: InteractionAction[];
}

type InteractionAction =
  | { type: "set-input"; targetComponentId: number; key: string; valueFrom: string }
  | { type: "invoke"; targetComponentId: number; method: string; argsFrom?: any }
  | { type: "set-variable"; name: string; valueFrom: string };
```

- 触发源只能是契约事件；卡片内部联动（图表 → 表格）属于模板私有实现，不进页面 `interactions`。
- 运行时：`InteractionBus.emit` 计算 `valueFrom`，按 action 分发；`set-input` 写入目标实例 `inputValues`。
- 防环：每次 emit 携带 `visited: Set<edgeId>` 与深度上限；同一微任务内的多个 action 合并执行。
- 兼容：现有 `DataSourceRelation` 迁移为 `interaction` 的一种（`data-selection → filter`），关系编辑器入口保留一个版本。

## 7. 数据源复用

### 7.1 两层模型

```
DataSourceLoader（页面级；每个卡片实例再各持一个）
  requestKey = sourceId + hash(params)
  cache:    Map<requestKey, { rows, total, loadedAt }>
  inFlight: Map<requestKey, Promise<LoadResult>>   // single-flight
  refCount: Map<requestKey, number>                // 归零可回收
  definitions: 页面数据源 / 模板私有数据源，由创建方注入

Binding（消费者级）
  { consumerId, sourceId, mode: "shared" | "isolated" }
```

```ts
requestKey =
  mode === "shared"
    ? `${sourceId}#s=${hash(sharedParams)}#l=${hash(localParams)}`
    : `${sourceId}#c=${consumerId}#s=${hash(sharedParams)}#l=${hash(localParams)}`;
```

### 7.2 参数分层

| 参数               | 默认归属   | 说明                                                       |
| ------------------ | ---------- | ---------------------------------------------------------- |
| 搜索值 / `filters` | 共享       | 同源多卡片命中同一 requestKey，只发一次请求                |
| `sort` / `page`    | 消费者私有 | 排序翻页不应影响其他卡片；静态/Mock 可在缓存基础上本地处理 |
| 联动产生的临时过滤 | 共享       | 参与 requestKey，保证联动后正确刷新                        |

### 7.3 Loader 行为

- `load`：命中 in-flight 直接复用 Promise；命中未过期缓存直接返回；否则发请求。
- `search / setFilters`：**merge 语义**（`{ ...prev, ...next }`），并提供显式 `clear`。
- `invalidate(sourceId)`：清空该源所有 key 并通知订阅者；页面退出沿用 `resetAll`。
- 订阅粒度：hook 只订阅自身 `requestKey` 的 entry，避免一源刷新导致全页重渲染。
- 缓存设 `staleTime` 与 LRU 上限。

> 卡片私有数据源只在各自实例的 Loader 内复用，跨实例不共享。需要跨卡片复用时，必须通过模板 slot 提升为页面级数据源，这是封装语义的代价，也是正确性要求。

## 8. 全局搜索与变量整合

### 8.1 变量模型升级

```ts
interface Variable {
  name: string; // 搜索项建议 search.<key>
  type: "string" | "number" | "boolean" | "date" | "datetime" | "json";
  defaultValue: any;
  remark: string;
  scope: "page" | "search"; // search = 由搜索区驱动
  control?: "input" | "select" | "date" | "dateRange" | "numberRange";
  options?: { label: string; value: any }[];
  persist?: "none" | "url" | "storage";
  readonly?: boolean; // 仅限制面板编辑，不限制事件流写入
}
```

整合理由：

- 渲染器属性绑定是 `data[variableName]` 扁平取值，事件流 `getData(key)` 同为扁平 key。搜索值存入 `search.region` 后，`${search.region}` 可直接使用，表达式层零改动。
- `usePageDataStore` 继续作为唯一状态源，搜索不引入第二份状态。

### 8.2 SearchBus 是 page-data 的门面

```
SearchBus.setValue(key, value) → pageData.setData(`search.${key}`, value)
SearchBus.submit()             → 按 targets 组装参数 → Loader.load(...)
SearchBus.reset()              → 用 defaultValue 回填
```

`PageSearchConfig` 只保留布局、触发方式、字段顺序与 `targets`，**不存值**。

### 8.3 搜索目标与优先级

```ts
type SearchTarget =
  | { kind: "source"; sourceId: string; paramKey: string; variable: string }
  | { kind: "card"; componentId: number; inputKey: string; variable: string };

interface PageSearchConfig {
  scope: "page" | "group";
  groupId?: string;
  fields: Array<{
    variable: string;
    label: string;
    control: string;
    options?: any[];
    order: number;
  }>;
  targets: SearchTarget[];
  trigger: "submit" | "change";
  debounce?: number;
}
```

- 页面级：`kind: "source"` 的目标不指定实例，作用于所有绑定该源的卡片；`kind: "card"` 的目标显式指定 `componentId`。
- 卡片级：卡片内搜索区默认 `scope = card(componentId)`，只影响本卡片；勾选“同步到页面”升级为 `page`。
- 分组级：`group:<id>` 用于少量卡片共享，避免影响全页。
- 取值优先级：`page → group → card`，同 key 后者覆盖前者。

## 9. 合并建议（只建议，不自动合并）

### 9.1 原则

系统允许自动做：指纹计算、分组、计数、差异标注、生成建议。

系统不允许自动做：

- 自动复用已有数据源（插入卡片时也不预选）
- 自动改写 `slotMapping / targets / variables`
- 自动删除私有源副本
- 自动生成全局搜索区或隐藏卡片内搜索控件

> 注意区分：运行期“同源同参只发一次请求”是缓存去重，不是合并。Loader 的 single-flight 自动生效；合并只针对设计态定义收敛。

### 9.2 建议模型

```ts
interface MergeSuggestion {
  id: string; // fingerprint + 排序后的引用标识，保证稳定
  kind: "source" | "search-field";
  confidence: "high" | "medium" | "low";
  reasons: string[];
  candidates: SuggestionCandidate[];
  conflicts: MergeConflict[];
  status: "pending" | "dismissed" | "applied";
}

interface MergeConflict {
  key: string;
  kind: "type" | "options" | "mock-data" | "control";
  options: Array<{ label: string; value: any }>;
  resolvedWith?: any;
}
```

- 建议由纯函数 `scan(pageDesign, templates)` 派生，无写入副作用，可单测。
- `id` 稳定，用于忽略记录；引用集合或资源定义变化导致 `id` 变化时建议重新出现。
- 忽略状态存于页面 `dismissedSuggestions` 或独立 key，不污染业务数据。

### 9.3 三个时机的行为

**模板侧声明**：内部源标记 `shareable: true`、输入标记 `searchable: true` 后进入候选池，仅用于建议。

**插入卡片**：默认创建独立的页面数据源副本；插入对话框可提供“手动选择已有数据源”入口，但没有默认选中项，关闭对话框不产生任何副作用。插入后仅弹非阻塞提示。

**页面建议面板**：唯一执行入口。每条建议给“为什么建议 / 改动哪些实例 / 有哪些冲突”，操作只有预览、忽略、应用；“应用”必须显式点击。

### 9.4 合并事务

1. 预览：请求签名、字段并集与差异、Mock 数据来源、受影响实例列表。
2. 冲突决策：类型、选项集合、Mock 来源逐项选择；未决冲突时禁用“应用”。
3. 执行：创建或选定目标源 → 仅改写被勾选实例的 `slotMapping` → 删除被勾选的重复源 → 写为**一条**撤销记录。
4. 留痕：目标源写 `mergedFrom: string[]`，为后续拆分保留依据。
5. 失败整体回滚，不出现半完成状态。

勾选粒度：默认全部不勾选，设计者显式选择参与合并的实例。

### 9.5 搜索项合并

拆成两个独立决定，分别确认：

| 决定               | 说明                                                | 默认   |
| ------------------ | --------------------------------------------------- | ------ |
| 合并字段定义       | 同 key 搜索项收敛为一条全局搜索字段，共用变量与控件 | 不勾选 |
| 移除卡片内同名控件 | 避免重复输入；不移除也能正常工作                    | 不勾选 |

生成的搜索变量由设计者在预览中确认命名，系统不擅自改写已有变量。

### 9.6 数据源指纹

```ts
fingerprint = hash(method + normalize(url) + sortedParamKeys + sortedHeaderKeys + resultPath);
// normalize：把 {vars.x} / {search.x} 等模板占位统一替换为 {}
```

指纹仅作候选依据，字段不参与指纹（字段可合并），同名但参数语义不同的源只提示、不推荐。

### 9.7 UI 落点

- 数据源面板顶部“优化建议（N）”+ 每个数据源的引用计数徽标。
- 工具栏建议入口，不打断主流程。
- 卡片实例设置面板显示只读提示“存在可合并项”。
- 新增 `src/editor/resource/`：`scan.ts`（纯函数）、`suggestion-store.ts`、`merge-dialog.tsx`。

## 10. Schema 变更与迁移

```ts
interface PageDesign {
  schemaVersion: 4;
  components: Component[];
  variables: Variable[]; // v2：带 type / scope
  sources: DataSource[];
  relations: DataSourceRelation[]; // 迁移为 interactions 后仅保留只读兼容
  interactions?: PageInteraction[];
  search?: PageSearchConfig;
  dismissedSuggestions?: string[];
}

interface DataSource {
  // 原有字段
  shareable?: boolean; // 是否进入合并建议候选
  fingerprint?: string;
  mergedFrom?: string[];
}
```

迁移要求：

- `pages` persist 升到 `version: 4` 并实现 `migrate`，按 v1 → v2 → v3 → v4 链路逐级补齐。
- v2 → v3：卡片实例标识 `scopeId` 更名为 `instanceId`（中间版本，不再出现在当前结构中）。
- v3 → v4：删除 `props.instanceId`，实例标识统一使用 `Component.id`；`interactions` 的 `trigger / actions` 与 `search.targets` 中的旧字符串标识按映射改写为 `componentId`，映射不到触发源或目标实例的条目被丢弃。
- 旧 `Variable` 的 `defaultValue: string` 迁移为 `type: "string"`、`scope: "page"`。
- 旧 `DataSourceRelation` 读取时映射为 interaction 的只读视图，保留一个版本后移除。
- 新增模板 store 与建议忽略记录的独立持久化 key。

## 11. 文件落点与改动清单

新增：

- `src/editor/card-template/{types,store,expander}.ts`
- `src/editor/card-template/{runtime-provider,error-boundary,internal-renderer}.tsx`
- `src/editor/card-template/editor/`（模板编辑与“暴露为接口”面板）
- `src/editor/data-source/registry.ts`
- `src/editor/search/{types,store,targets}.ts`
- `src/editor/interaction/{types,runtime,setting-panel}.tsx`
- `src/editor/resource/{scan,suggestion-store,merge-dialog}.ts(x)`
- `src/editor/components/global-search/{index,dev,prod,setter}.tsx`
- `src/editor/components/card-instance/{index,dev,prod,view}.tsx`
- `src/editor/page-store/`：页面级 store 分组（`PageStores` / `DesignPageStores`）、Provider、hydrate 与旧数据兼容
- `src/editor/layouts/{edit-layout,preview-layout}.tsx`：编辑 / 预览布局按需加载

改造：

- `src/editor/stores/pages.ts`：schema v4 + migrate
- `src/editor/stores/variable.ts`：类型化变量与 CRUD
- `src/editor/stores/page-data.ts`：单一状态源约定（保持 API）
- `src/editor/data-source/runtime.ts`：参数 merge、single-flight、引用计数、失效、作用域
- `src/editor/data-source/hooks.ts`：绑定化订阅（shared / isolated）
- `src/editor/data-source/adapters/http.ts`：变量由 `LoadContext` 注入，不再直读全局 store
- `src/editor/utils/action.ts`：事件流支持数据域参数
- `src/editor/components/search-form/prod.tsx`：提交写入 SearchBus
- `src/editor/layouts/index.tsx`：只保留组件配置加载与搜索恢复，编辑/预览布局 `lazy` 拆分
- `src/editor/components/grid-layout/base.tsx`：编辑与预览共用的渲染层零 store 依赖，布局变更通过 `onLayoutChange` 上抛
- `src/editor/layouts/stage/{edit,prod}.tsx`：CardInstance 渲染与 CardScope 注入
- `src/editor/layouts/{material,sidebar,toolbar}/index.tsx`：模板分组、建议入口、新字段持久化
- `src/editor/layouts/setting/attr.tsx`：按 Contract 动态生成属性面板

## 12. 实施顺序

| 阶段 | 内容                                                                          | 覆盖需求   |
| ---- | ----------------------------------------------------------------------------- | ---------- |
| P0   | 变量模型升级 + 单一状态源 + SearchBus + 搜索区改造                            | 4          |
| P1   | DataSourceLoader 重构（merge / single-flight / 引用计数 / 失效 / 实例级隔离） | 3          |
| P2   | CardTemplate + Contract + CardRuntime + 展开器 + CardInstance 渲染            | 1          |
| P3   | 模板编辑器（暴露接口）+ 页面动态配置面板                                      | 1          |
| P4   | PageInteraction + InteractionBus + 防环 + 配置面板                            | 2          |
| P5   | resource/scan + 合并建议面板 + 合并事务                                       | 1/3/4 体验 |
| P6   | 模板升级 diff、建议缓存优化、URL 同步、可视化连线                             | 增强       |

## 13. 验收标准

| 需求       | 验收点                                                                                        |
| ---------- | --------------------------------------------------------------------------------------------- |
| 卡片复用   | 同一模板被两个页面引用，改模板后两页面同步；页面无法通过任何配置触及未暴露的内部节点          |
| 卡片隔离   | 卡片内部报错只影响自身占位；两实例私有数据源互不影响                                          |
| 卡片联动   | A 事件 → B `set-input` → B 内部过滤，全链路可配置；A→B→A 不产生无限请求                       |
| 数据源复用 | 两张卡片映射同一页面数据源时 Network 仅一次请求；排序互不影响；`search` 为 merge 语义         |
| 全局搜索   | 一个搜索输入同时驱动页面数据源与多张卡片；卡片级搜索不影响其他卡片；刷新后搜索值可从 URL 恢复 |
| 合并建议   | 插入相同卡片不发生任何合并；忽略建议后页面数据不变；未解决冲突无法应用；应用后可一次撤销      |
| 变量整合   | 搜索变量在变量面板可见且只读；`${search.xxx}` 可用于属性绑定与事件流                          |

## 14. 风险与取舍

| 风险                 | 说明                                             | 应对                                                 |
| -------------------- | ------------------------------------------------ | ---------------------------------------------------- |
| id 重映射遗漏        | 内部事件流 `componentId`、数据源引用、变量最易漏 | 展开器统一处理，配套快照测试                         |
| 链接模式的编辑复杂度 | 渲染期展开影响选中、ref、撤销                    | 编辑态内部用 prod 只读渲染；展开只依赖模板版本       |
| 合并误判             | URL 相同但语义不同（环境参数、租户）             | 指纹仅作候选，必须人工确认；展示差异                 |
| 合并影响展示         | 字段与 Mock 数据变化                             | Diff 预览 + 单条撤销 + `mergedFrom` 留痕             |
| 建议重算开销         | 大页面频繁扫描                                   | 按版本号缓存，面板打开时按需计算                     |
| 封装与自由度冲突     | 页面能力变少                                     | 用 Contract 显式暴露，而非放开内部覆盖               |
| 变量被脚本改写       | 搜索变量非严格只读                               | 明确 `readonly` 仅限制面板编辑，运行时允许事件流写入 |

## 15. 术语表

| 术语              | 含义                                                              |
| ----------------- | ----------------------------------------------------------------- |
| Contract          | 卡片对外契约，页面可配置的唯一范围                                |
| Slot              | 卡片声明的数据插槽，由页面映射数据源                              |
| ComponentId       | 卡片实例的标识，即页面组件树的 `Component.id`，联动与事件均引用它 |
| requestKey        | 数据源取数的最小缓存与去重单元                                    |
| shared / isolated | 同一数据源的参数共享模式 / 消费者独立模式                         |
| MergeSuggestion   | 系统产出的只读合并建议，执行权在设计者                            |
