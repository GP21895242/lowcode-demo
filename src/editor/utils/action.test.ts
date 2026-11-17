import { beforeEach, describe, expect, it, vi } from "vite-plus/test";

import { createPageDataStore } from "../page-store/stores/page-data";
import { createRefRegistry } from "../page-store/stores/refs";
import type { Node } from "../layouts/flow-event/data";
import { createPageEventDomain, execEventFlow } from "./action";

const { axiosMock, toastAdd, openConfirmMock } = vi.hoisted(() => ({
  axiosMock: vi.fn(),
  toastAdd: vi.fn(),
  openConfirmMock: vi.fn(),
}));

vi.mock("axios", () => ({ default: axiosMock }));
vi.mock("../../components/ui/toast", () => ({ toast: { add: toastAdd } }));
vi.mock("../common/confirm-dialog", () => ({ openConfirm: openConfirmMock }));

let nodeSeed = 0;

function node(partial: Partial<Node> & { type: string; config?: any }): Node {
  nodeSeed += 1;
  return { id: `n${nodeSeed}`, label: "", menus: [], ...partial };
}

const action = (type: string, config: any, children?: Node[], eventKey?: string) =>
  node({
    type: "action",
    config: { type, config },
    children: children?.map((child) => ({ ...child, eventKey })),
  });

function createDomain() {
  const pageData = createPageDataStore();
  const refs = createRefRegistry();
  return { pageData, refs, domain: createPageEventDomain(pageData, refs) };
}

beforeEach(() => {
  axiosMock.mockReset();
  toastAdd.mockReset();
  openConfirmMock.mockReset();
});

describe("execEventFlow 基础行为", () => {
  it("节点或数据域为空时直接返回", () => {
    expect(() => execEventFlow([], {}, {}, undefined)).not.toThrow();

    const { pageData } = createDomain();
    execEventFlow([], {}, {}, createPageEventDomain(pageData, createRefRegistry()));
    expect(pageData.getState().data).toEqual({});
  });

  it("SetVariable 支持字面量与事件数据表达式", async () => {
    const { pageData, domain } = createDomain();

    execEventFlow(
      [
        action("SetVariable", { variable: "literal", value: "固定值" }),
        action("SetVariable", { variable: "region", value: "{eventData.region}" }),
      ],
      { region: "华东" },
      undefined,
      domain,
    );

    await vi.waitFor(() => {
      expect(pageData.getState().data).toMatchObject({ literal: "固定值", region: "华东" });
    });
  });

  it("SetVariable 没有变量名或值时跳过", async () => {
    const { pageData, domain } = createDomain();

    execEventFlow([action("SetVariable", { variable: "onlyName" })], {}, undefined, domain);

    await vi.waitFor(() => expect(pageData.getState().data).toEqual({}));
  });

  it("ExecScript 在上下文中读写页面数据", async () => {
    const { pageData, domain } = createDomain();
    pageData.getState().setData("amount", 10);

    execEventFlow(
      [action("ExecScript", { script: "ctx.setData('total', ctx.getData('amount') * 2)" })],
      {},
      undefined,
      domain,
    );

    await vi.waitFor(() => expect(pageData.getState().data.total).toBe(20));
  });

  it("ComponentMethod 调用组件 ref 方法并传递事件数据", async () => {
    const { refs, domain } = createDomain();
    const focus = vi.fn();
    refs.set(2, { focus });

    execEventFlow(
      [action("ComponentMethod", { componentId: 2, method: "focus" })],
      { id: 7 },
      undefined,
      domain,
    );

    await vi.waitFor(() => expect(focus).toHaveBeenCalledWith({ id: 7 }));
  });

  it("ShowMessage 根据类型弹出提示并继续成功分支", async () => {
    const { pageData, domain } = createDomain();

    execEventFlow(
      [
        action(
          "ShowMessage",
          { type: "success", text: "保存成功" },
          [action("SetVariable", { variable: "shown", value: "yes" })],
          "success",
        ),
      ],
      {},
      undefined,
      domain,
    );

    await vi.waitFor(() => {
      expect(toastAdd).toHaveBeenCalledWith({ title: "保存成功", type: "success" });
      expect(pageData.getState().data.shown).toBe("yes");
    });
  });
});

describe("execEventFlow 条件节点", () => {
  it("只执行条件命中的子节点", async () => {
    const { pageData, domain } = createDomain();

    execEventFlow(
      [
        node({
          type: "condition",
          config: [
            { id: "c1", condition: "ctx.eventData.amount > 10" },
            { id: "c2", condition: "ctx.eventData.amount > 100" },
          ],
          children: [
            { ...action("SetVariable", { variable: "hit", value: "yes" }), conditionId: "c1" },
            { ...action("SetVariable", { variable: "miss", value: "yes" }), conditionId: "c2" },
          ],
        }),
      ],
      { amount: 20 },
      undefined,
      domain,
    );

    await vi.waitFor(() => expect(pageData.getState().data.hit).toBe("yes"));
    expect(pageData.getState().data.miss).toBeUndefined();
  });
});

describe("execEventFlow 请求节点", () => {
  it("请求成功执行 success 与 finally 分支", async () => {
    const { pageData, domain } = createDomain();
    axiosMock.mockResolvedValue({ data: { ok: true } });

    execEventFlow(
      [
        node({
          type: "action",
          config: {
            type: "Request",
            config: {
              url: "/api/orders",
              method: "get",
              params: [{ key: "region", value: "{eventData.region}" }],
              body: { type: "json", json: '{"page":1}' },
            },
          },
          children: [
            {
              ...action("SetVariable", { variable: "ok", value: "{eventData.ok}" }),
              eventKey: "success",
            },
            { ...action("SetVariable", { variable: "failed", value: "yes" }), eventKey: "error" },
            {
              ...action("SetVariable", { variable: "settled", value: "yes" }),
              eventKey: "finally",
            },
          ],
        }),
      ],
      { region: "华东" },
      undefined,
      domain,
    );

    await vi.waitFor(() => {
      expect(pageData.getState().data.ok).toBe(true);
      expect(pageData.getState().data.settled).toBe("yes");
    });
    expect(pageData.getState().data.failed).toBeUndefined();
    expect(axiosMock).toHaveBeenCalledWith({
      url: "/api/orders",
      method: "get",
      params: { region: "华东" },
      data: { page: 1 },
    });
  });

  it("请求失败执行 error 与 finally 分支", async () => {
    const { pageData, domain } = createDomain();
    axiosMock.mockRejectedValue(new Error("network"));

    const errorChild = {
      ...action("SetVariable", { variable: "failed", value: "yes" }),
      eventKey: "error",
    };
    const finallyChild = {
      ...action("SetVariable", { variable: "settled", value: "yes" }),
      eventKey: "finally",
    };
    const successChild = {
      ...action("SetVariable", { variable: "ok", value: "yes" }),
      eventKey: "success",
    };

    execEventFlow(
      [
        node({
          type: "action",
          config: { type: "Request", config: { url: "/api/orders", method: "get" } },
          children: [successChild, errorChild, finallyChild],
        }),
      ],
      {},
      undefined,
      domain,
    );

    await vi.waitFor(() => {
      expect(pageData.getState().data.failed).toBe("yes");
      expect(pageData.getState().data.settled).toBe("yes");
    });
    expect(pageData.getState().data.ok).toBeUndefined();
    expect(axiosMock).toHaveBeenCalledWith(
      expect.objectContaining({ url: "/api/orders", method: "get" }),
    );
  });
});

describe("execEventFlow 确认节点", () => {
  it("确认后执行 confirm 分支", async () => {
    const { pageData, domain } = createDomain();
    openConfirmMock.mockImplementation((options: any) => options.onOk());

    execEventFlow(
      [
        node({
          type: "action",
          config: { type: "Confirm", config: { text: "确定删除？" } },
          children: [
            {
              ...action("SetVariable", { variable: "confirmed", value: "yes" }),
              eventKey: "confirm",
            },
            {
              ...action("SetVariable", { variable: "canceled", value: "yes" }),
              eventKey: "cancel",
            },
          ],
        }),
      ],
      {},
      undefined,
      domain,
    );

    await vi.waitFor(() => expect(pageData.getState().data.confirmed).toBe("yes"));
    expect(pageData.getState().data.canceled).toBeUndefined();
  });
});
