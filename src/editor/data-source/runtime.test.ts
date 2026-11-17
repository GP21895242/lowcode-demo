import { beforeEach, describe, expect, it, vi } from "vite-plus/test";

import type { DataSource, DataSourceRelation } from "./types";
import { createDataSourceLoader } from "./runtime";

const { executeMock } = vi.hoisted(() => ({ executeMock: vi.fn() }));

vi.mock("./engine", () => ({ executeDataSource: executeMock }));

const source = (id: string, data: any[] = []): DataSource => ({
  id,
  name: id,
  title: id,
  kind: "static",
  fields: [],
  mock: { enabled: true, delay: 0, data },
});

beforeEach(() => {
  executeMock.mockReset();
  executeMock.mockResolvedValue({ rows: [] });
});

describe("数据源运行时缓存", () => {
  it("命中未过期缓存，force 时重新请求", async () => {
    const loader = createDataSourceLoader({ getSource: () => source("s") });
    const state = () => loader.store.getState();

    await state().load("s");
    const loadedAt = state().sources.s.loadedAt;
    await state().load("s");

    expect(executeMock).toHaveBeenCalledTimes(1);
    expect(state().sources.s.loadedAt).toBe(loadedAt);

    await state().load("s", { force: true });
    expect(executeMock).toHaveBeenCalledTimes(2);
  });

  it("请求参数不同会产生新的缓存条目", async () => {
    const loader = createDataSourceLoader({ getSource: () => source("s") });

    await loader.store.getState().search("s", { region: "华东" });
    await loader.store.getState().search("s", { region: "华南" });
    await loader.store.getState().search("s", { region: "华东" });

    expect(executeMock).toHaveBeenCalledTimes(2);
    expect(executeMock.mock.calls.map((call) => call[1].search.region)).toEqual(["华东", "华南"]);
  });

  it("相同参数并发请求只执行一次", async () => {
    let resolveRequest: (value: any) => void = () => {};
    executeMock.mockImplementation(() => new Promise((resolve) => (resolveRequest = resolve)));

    const loader = createDataSourceLoader({ getSource: () => source("s") });
    const first = loader.store.getState().search("s", { q: "1" });
    const second = loader.store.getState().search("s", { q: "1" });

    expect(executeMock).toHaveBeenCalledTimes(1);

    resolveRequest({ rows: [{ id: 1 }] });
    await Promise.all([first, second]);

    expect(loader.store.getState().sources.s).toMatchObject({
      rows: [{ id: 1 }],
      status: "success",
      loading: false,
    });
  });

  it("新请求会中止旧请求，只保留最后一次结果", async () => {
    executeMock.mockImplementation(
      (_source: DataSource, params: any, ctx: any) =>
        new Promise((resolve, reject) => {
          const timer = setTimeout(() => resolve({ rows: [{ q: params.search.q }] }), 5);
          ctx.signal.addEventListener("abort", () => {
            clearTimeout(timer);
            reject(new Error("aborted"));
          });
        }),
    );

    const loader = createDataSourceLoader({ getSource: () => source("s") });
    const first = loader.store.getState().search("s", { q: "first" });
    const second = loader.store.getState().search("s", { q: "second" });

    await Promise.all([first, second]);

    expect(executeMock).toHaveBeenCalledTimes(2);
    expect(loader.store.getState().sources.s).toMatchObject({
      rows: [{ q: "second" }],
      status: "success",
    });
  });
});

describe("数据源运行时参数与错误", () => {
  it("search 合并参数，null 表示清除", async () => {
    const loader = createDataSourceLoader({ getSource: () => source("s") });

    await loader.store.getState().search("s", { region: "华东", keyword: "a" });
    await loader.store.getState().search("s", { keyword: null });

    expect(executeMock.mock.lastCall?.[1].search).toEqual({ region: "华东" });
  });

  it("setSort 与 setFilters 写入请求参数", async () => {
    const loader = createDataSourceLoader({ getSource: () => source("s") });

    await loader.store.getState().setFilters("s", { region: "华东" });
    await loader.store.getState().setSort("s", { field: "amount", order: "desc" });

    expect(executeMock.mock.lastCall?.[1]).toMatchObject({
      filters: { region: "华东" },
      sort: { field: "amount", order: "desc" },
    });
  });

  it("加载失败写入错误状态", async () => {
    executeMock.mockRejectedValue(new Error("boom"));
    const loader = createDataSourceLoader({ getSource: () => source("s") });

    await loader.store.getState().load("s");

    expect(loader.store.getState().sources.s).toMatchObject({
      loading: false,
      status: "error",
      error: "boom",
    });
  });

  it("数据源不存在时写入错误状态", async () => {
    const loader = createDataSourceLoader();

    await loader.store.getState().load("missing");

    expect(loader.store.getState().sources.missing).toMatchObject({
      status: "error",
      error: "数据源不存在",
    });
    expect(executeMock).not.toHaveBeenCalled();
  });
});

describe("数据源运行时隔离与生命周期", () => {
  it("isolated 模式按消费者拆分条目", async () => {
    const loader = createDataSourceLoader({ getSource: () => source("s") });

    expect(loader.resolveEntryKey("s")).toBe("s");
    expect(loader.resolveEntryKey("s", { mode: "isolated", consumerId: "card_1" })).toBe(
      "s#c=card_1",
    );

    await loader.store.getState().search("s", { q: 1 }, { mode: "isolated", consumerId: "card_1" });
    await loader.store.getState().search("s", { q: 2 }, { mode: "isolated", consumerId: "card_2" });

    expect(Object.keys(loader.store.getState().sources).sort()).toEqual([
      "s#c=card_1",
      "s#c=card_2",
    ]);
    expect(loader.store.getState().sources.s).toBeUndefined();
  });

  it("retain / release 不改变已加载的数据", async () => {
    executeMock.mockResolvedValue({ rows: [{ id: 1 }] });
    const loader = createDataSourceLoader({ getSource: () => source("s") });

    await loader.store.getState().load("s");
    loader.store.getState().retain("s");
    loader.store.getState().release("s");
    loader.store.getState().release("s");

    expect(loader.store.getState().sources.s.rows).toEqual([{ id: 1 }]);
    expect(() => loader.store.getState().retain("missing")).not.toThrow();
  });

  it("invalidate 清空缓存与运行时状态", async () => {
    executeMock.mockResolvedValue({ rows: [{ id: 1 }] });
    const loader = createDataSourceLoader({ getSource: () => source("s") });

    await loader.store.getState().load("s");
    loader.store.getState().invalidate("s");
    expect(loader.store.getState().sources.s).toMatchObject({ rows: [], status: "idle" });

    await loader.store.getState().load("s");
    expect(executeMock).toHaveBeenCalledTimes(2);
  });

  it("select 按关系给目标数据源写入过滤参数", async () => {
    const relations: DataSourceRelation[] = [
      {
        id: "r1",
        sourceId: "orders",
        targetId: "details",
        type: "one-to-many",
        sourceField: "region",
        targetField: "region",
        paramKey: "region",
        enabled: true,
      },
      {
        id: "r2",
        sourceId: "orders",
        targetId: "detail_disabled",
        type: "one-to-many",
        sourceField: "region",
        targetField: "region",
        enabled: false,
      },
    ];
    const loader = createDataSourceLoader({
      getSource: (id) => source(id),
      getRelations: () => relations,
    });

    await loader.store.getState().select("orders", { value: "华东", row: { region: "华东" } });

    expect(loader.store.getState().sources.details.params.filters).toEqual({ region: "华东" });
    expect(loader.store.getState().sources.detail_disabled).toBeUndefined();

    await loader.store.getState().setFilters("details", { region: null });
    expect(loader.store.getState().sources.details.params.filters).toEqual({});
  });

  it("dispose 中止请求并清空全部运行时状态", async () => {
    executeMock.mockResolvedValue({ rows: [{ id: 1 }] });
    const loader = createDataSourceLoader({ getSource: () => source("s") });

    await loader.store.getState().load("s");
    loader.dispose();

    expect(loader.store.getState().sources).toEqual({});
  });

  it("未提供外部来源时使用作用域注册的数据源", async () => {
    const loader = createDataSourceLoader();
    loader.setDefinitions([source("private")]);

    await loader.store.getState().load("private");

    expect(loader.store.getState().sources.private.status).toBe("success");

    const listener = vi.fn();
    const unsubscribe = loader.subscribeDefinitions(listener);
    loader.setDefinitions([source("next")]);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(loader.findSource("next")?.id).toBe("next");
    expect(loader.getDefinitionsVersion()).toBe(2);

    unsubscribe();
    loader.setDefinitions([]);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("可以替换取数变量来源", async () => {
    const loader = createDataSourceLoader({ getSource: () => source("s") });
    loader.setVariableResolver(() => ({ token: "abc" }));

    await loader.store.getState().load("s");

    expect(executeMock.mock.lastCall?.[2].variables).toEqual({ token: "abc" });
  });
});
